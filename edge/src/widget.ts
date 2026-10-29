// Embeddable chat bubble. Load with:
//   <script src="https://<worker-host>/widget.js" data-source="naetalks" defer></script>
// A ?src= query param on the host page overrides data-source, so each persona link is tracked.
export const WIDGET_JS = `(() => {
  const me = document.currentScript;
  const api = new URL("/chat", me.src).toString();
  const source = new URLSearchParams(location.search).get("src") || me.dataset.source || "site";
  const startOpen = me.dataset.open === "true";
  const history = [];

  const css = document.createElement("style");
  css.textContent = \`
    .ph-btn{position:fixed;right:20px;bottom:20px;z-index:99999;width:56px;height:56px;border-radius:50%;border:0;background:#34d399;color:#0a0a0a;font:600 22px system-ui;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.3)}
    .ph-box{position:fixed;right:20px;bottom:88px;z-index:99999;width:min(380px,calc(100vw - 32px));height:min(540px,calc(100vh - 120px));display:none;flex-direction:column;background:#0a0a0a;color:#fafafa;border:1px solid #27272a;border-radius:16px;font:14px/1.5 system-ui;overflow:hidden}
    .ph-box.open{display:flex}
    .ph-head{padding:14px 16px;border-bottom:1px solid #27272a;font-weight:600}
    .ph-log{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px}
    .ph-msg{max-width:85%;padding:8px 12px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}
    .ph-user{align-self:flex-end;background:#34d399;color:#0a0a0a}
    .ph-bot{align-self:flex-start;background:#18181b}
    .ph-form{display:flex;border-top:1px solid #27272a}
    .ph-form input{flex:1;padding:12px 16px;background:transparent;border:0;color:inherit;font:inherit;outline:none}
    .ph-form button{padding:0 16px;border:0;background:transparent;color:#34d399;font:600 14px system-ui;cursor:pointer}
  \`;
  document.head.appendChild(css);

  const btn = Object.assign(document.createElement("button"), { className: "ph-btn", textContent: "P" });
  btn.setAttribute("aria-label", "Chat with Penhaus");
  const box = document.createElement("div");
  box.className = "ph-box";
  box.innerHTML = '<div class="ph-head">Penhaus</div><div class="ph-log"></div>' +
    '<form class="ph-form"><input placeholder="Ask about OPS, Boardroom..." maxlength="2000" required><button>Send</button></form>';
  document.body.append(btn, box);
  const log = box.querySelector(".ph-log");
  const form = box.querySelector("form");
  const input = form.querySelector("input");

  const add = (role, text) => {
    const el = document.createElement("div");
    el.className = "ph-msg " + (role === "user" ? "ph-user" : "ph-bot");
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };
  const toggle = () => box.classList.toggle("open");
  btn.onclick = toggle;
  add("assistant", "Hi, I'm the Penhaus concierge. What revenue problem are you trying to solve?");
  if (startOpen) toggle();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    add("user", text);
    history.push({ role: "user", content: text });
    const pending = add("assistant", "...");
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-20), source }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || "Something went wrong.";
      pending.textContent = reply;
      if (data.reply) history.push({ role: "assistant", content: reply });
      else history.pop();
    } catch {
      pending.textContent = "Connection problem. Please try again.";
      history.pop();
    }
  };
})();`;

// Standalone page for link-in-bio traffic: https://<worker-host>/?src=<persona>
export function landingPage(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Penhaus Consulting</title>
<style>body{margin:0;min-height:100vh;background:#0a0a0a;color:#fafafa;font:16px/1.5 system-ui;display:grid;place-items:center;text-align:center;padding:16px}h1{font-size:28px;margin:0 0 8px}p{color:#a1a1aa;margin:0}</style>
</head><body><div><h1>Penhaus Consulting</h1><p>AI revenue systems for B2B SaaS. Chat with us below.</p></div>
<script src="/widget.js" data-open="true" defer></script></body></html>`;
}
