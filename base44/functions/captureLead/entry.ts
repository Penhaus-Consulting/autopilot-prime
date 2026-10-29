import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Called by the Cloudflare edge Worker (edge/) when a chat visitor shares their email.
// Authenticated with a shared secret instead of a user session: set EDGE_SHARED_SECRET here
// and on the Worker (`npx wrangler secret put EDGE_SHARED_SECRET`) to the same value.

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Read per request so rotating the secret takes effect without a cold start.
    const secret = Deno.env.get("EDGE_SHARED_SECRET") || "";
    if (!secret || !safeEqual(req.headers.get("x-edge-secret") || "", secret)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }
    const source = typeof body.source === "string" ? body.source.slice(0, 40) : "site";
    const intent = body.intent === "hot" ? "hot" : "warm";
    const transcript = Array.isArray(body.transcript)
      ? body.transcript
          .map((m: { role?: string; content?: string }) => `${m.role === "user" ? "Visitor" : "Concierge"}: ${m.content ?? ""}`)
          .join("\n")
          .slice(0, 20000)
      : "";

    const db = createClientFromRequest(req).asServiceRole;

    // One Lead per email: refresh the transcript on repeat visits instead of duplicating.
    const existing = await db.entities.Lead.filter({ email });
    const lead = existing[0]
      ? await db.entities.Lead.update(existing[0].id, {
          source,
          transcript,
          intent: existing[0].intent === "hot" ? "hot" : intent,
        })
      : await db.entities.Lead.create({ email, source, intent, transcript, status: "new" });

    // Ping Slack for hot leads only so the channel stays a buying signal, not noise.
    // Best-effort: a Slack failure must not lose the lead.
    if (intent === "hot") {
      try {
        const { accessToken: slackToken } = await db.connectors.getConnection("slackbot");
        const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: { Authorization: `Bearer ${slackToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "#leads",
            username: "PENHAUS",
            icon_emoji: ":fire:",
            text: `Hot lead from chat: ${email} (source: ${source})`,
          }),
        });
        if (!slackRes.ok) {
          console.error("captureLead: slack post failed", { status: slackRes.status, body: await slackRes.text() });
        }
      } catch (slackErr) {
        console.error("captureLead: slack integration error", slackErr);
      }
    }

    return Response.json({ ok: true, id: lead.id });
  } catch (error) {
    console.error("captureLead error", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
});
