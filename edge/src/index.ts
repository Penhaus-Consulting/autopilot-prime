import { handleChat } from "./chat";
import { landingPage, WIDGET_JS } from "./widget";

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const self = new URL(request.url).origin;
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  if (origin !== self && !allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/chat") {
      const cors = corsHeaders(request, env);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      if (request.headers.get("origin") && !cors["Access-Control-Allow-Origin"]) {
        return new Response("Origin not allowed", { status: 403 });
      }
      const res = await handleChat(request, env, ctx);
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    }

    if (pathname === "/widget.js") {
      return new Response(WIDGET_JS, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    if (pathname === "/") {
      return new Response(landingPage(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
