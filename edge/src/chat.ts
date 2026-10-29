import { type ChatMessage, findEmail, scoreIntent, sendLead } from "./lead";
import { systemPrompt } from "./prompt";

const MAX_TURNS = 20;
const MAX_CHARS = 2000;

function parseMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_TURNS) return null;
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (
      !m ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      m.content.length === 0 ||
      m.content.length > MAX_CHARS
    ) {
      return null;
    }
    out.push({ role: m.role, content: m.content });
  }
  return out.at(-1)?.role === "user" ? out : null;
}

function cleanSource(value: unknown): string {
  return typeof value === "string"
    ? value
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "")
        .slice(0, 40)
    : "";
}

export async function handleChat(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const { success } = await env.CHAT_LIMITER.limit({ key: ip });
  if (!success)
    return Response.json({ error: "Too many messages. Try again in a minute." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as {
    messages?: unknown;
    source?: unknown;
  } | null;
  const messages = parseMessages(body?.messages);
  if (!messages) return Response.json({ error: "Invalid messages" }, { status: 400 });
  const source = cleanSource(body?.source) || "direct";

  const result = (await env.AI.run(env.MODEL as keyof AiModels, {
    messages: [{ role: "system", content: systemPrompt(env.APP_URL) }, ...messages],
    max_tokens: 400,
  })) as { response?: string };
  const reply =
    result.response?.trim() || "Sorry, I lost my train of thought. Could you say that again?";

  const email = findEmail(messages[messages.length - 1].content);
  if (email) {
    const transcript = [...messages, { role: "assistant" as const, content: reply }];
    ctx.waitUntil(sendLead(env, { email, source, intent: scoreIntent(messages), transcript }));
  }

  return Response.json({ reply });
}
