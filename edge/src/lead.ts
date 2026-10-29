export type ChatMessage = { role: "user" | "assistant"; content: string };

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const HOT =
  /\b(annual|yearly|ops|boardroom|buy|purchase|checkout|invoice|start (today|now)|ready)\b/i;

export function findEmail(text: string): string | null {
  return text.match(EMAIL)?.[0]?.toLowerCase() ?? null;
}

export function scoreIntent(messages: ChatMessage[]): "hot" | "warm" {
  return messages.some((m) => m.role === "user" && HOT.test(m.content)) ? "hot" : "warm";
}

// Fire-and-forget hand-off to the Base44 captureLead function, which owns storage and Slack.
export async function sendLead(
  env: Env,
  lead: { email: string; source: string; intent: string; transcript: ChatMessage[] },
): Promise<void> {
  if (!env.LEAD_ENDPOINT) return;
  const res = await fetch(env.LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-edge-secret": env.EDGE_SHARED_SECRET },
    body: JSON.stringify(lead),
  });
  if (!res.ok) console.error("captureLead failed", res.status, await res.text());
}
