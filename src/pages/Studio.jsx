import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateScript } from "@/functions/generateScript";
import { Film, Sparkles, Loader2, Copy, Check } from "lucide-react";

const platforms = ["TikTok", "YouTube", "Instagram"];

export default function Studio() {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({
    queryKey: ["content-requests"],
    queryFn: () => base44.entities.ContentRequest.list("-created_date", 50),
  });

  const [form, setForm] = useState({ platform: "TikTok", topic: "", angle: "", duration: 30 });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const generate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await generateScript({
        platform: form.platform,
        topic: form.topic,
        angle: form.angle,
        duration: form.duration,
      });
      const out = res.data || res;
      await base44.entities.ContentRequest.create({
        platform: form.platform,
        topic: form.topic,
        angle: form.angle,
        hook: out.hook,
        script: out.script,
        hashtags: out.hashtags,
        cta: out.cta,
        duration: Number(form.duration) || 30,
        status: "generated",
      });
      qc.invalidateQueries(["content-requests"]);
      setForm({ platform: form.platform, topic: "", angle: "", duration: 30 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400/80 mb-2">
          <Film className="w-3.5 h-3.5" /> AI-Powered Short Form
        </div>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Content Studio</h1>
        <p className="text-zinc-400 mt-1 text-sm">Generate scroll-stopping scripts for TikTok, YouTube & Instagram.</p>
      </header>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Generator */}
        <form onSubmit={generate} className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 h-fit lg:sticky lg:top-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Generate Script
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setForm({ ...form, platform: p })}
                    className={`py-2 rounded-lg text-sm transition-colors ${
                      form.platform === p ? "bg-emerald-400 text-zinc-950 font-medium" : "bg-zinc-950 border border-zinc-800 text-zinc-400"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Topic</label>
              <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required placeholder="e.g. How AI agents run my business 24/7" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Angle (optional)</label>
              <input value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} placeholder="e.g. contrarian, story-driven" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Duration (seconds)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : "Generate Script"}
            </button>
          </div>
        </form>

        {/* Output list */}
        <div className="lg:col-span-3 space-y-4">
          {requests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 text-sm">
              No scripts yet. Generate your first one.
            </div>
          )}
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">{r.platform} · {r.duration}s</span>
                <span className="text-xs text-zinc-500">{r.topic}</span>
              </div>
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1">Hook</div>
                <div className="text-lg font-medium text-emerald-300">"{r.hook}"</div>
              </div>
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Script</div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{r.script}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Hashtags</div>
                  <p className="text-xs text-zinc-400">{r.hashtags}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">CTA</div>
                  <p className="text-xs text-zinc-400">{r.cta}</p>
                </div>
              </div>
              <button onClick={() => copy(`${r.hook}\n\n${r.script}\n\n${r.hashtags}\n\n${r.cta}`, r.id)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors">
                {copied === r.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === r.id ? "Copied" : "Copy script"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}