import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Plus, X } from "lucide-react";
import FormSelect from "@/components/FormSelect";
import CreativeGallery from "@/components/CreativeGallery";
import CreativePerformanceChart from "@/components/CreativePerformanceChart";

const platforms = ["TikTok", "YouTube", "Instagram", "Meta Ads", "Universal"];
const statuses = ["Testing", "Winner", "Scaling", "Killed"];

export default function Creatives() {
  const qc = useQueryClient();
  const { data: creatives = [] } = useQuery({
    queryKey: ["creatives"],
    queryFn: () => base44.entities.Creative.list("-created_date", 100),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", platform: "TikTok", hook: "", script: "", angle: "", spend: 0, revenue: 0, status: "Testing",
  });

  const create = async (e) => {
    e.preventDefault();
    const spend = Number(form.spend) || 0;
    const revenue = Number(form.revenue) || 0;
    await base44.entities.Creative.create({
      ...form,
      spend,
      revenue,
      roas: spend > 0 ? Number((revenue / spend).toFixed(2)) : 0,
    });
    qc.invalidateQueries(["creatives"]);
    setShowForm(false);
    setForm({ title: "", platform: "TikTok", hook: "", script: "", angle: "", spend: 0, revenue: 0, status: "Testing" });
  };

  const cycle = async (c) => {
    const i = statuses.indexOf(c.status);
    const next = statuses[(i + 1) % statuses.length];
    await base44.entities.Creative.update(c.id, { status: next });
    qc.invalidateQueries(["creatives"]);
  };

  const winners = creatives.filter((c) => c.status === "Winner" || c.status === "Scaling");
  const totalRev = creatives.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalSpend = creatives.reduce((s, c) => s + (c.spend || 0), 0);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400/80 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> What's Winning
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Winning Creatives</h1>
          <p className="text-zinc-400 mt-1 text-sm">The database that funds everything. Log, test, scale, kill.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 text-sm font-medium hover:bg-emerald-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Creative
        </button>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Total Revenue" value={`$${totalRev.toLocaleString()}`} />
        <Stat label="Total Ad Spend" value={`$${totalSpend.toLocaleString()}`} />
        <Stat label="Active Winners" value={winners.length} />
      </div>

      <CreativePerformanceChart creatives={creatives} />

      <CreativeGallery creatives={creatives} onCycle={cycle} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={create} className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Log Creative</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <In label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} req />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Platform</label>
                  <FormSelect value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })} options={platforms.map((p) => ({ value: p, label: p }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Status</label>
                  <FormSelect value={form.status} onValueChange={(v) => setForm({ ...form, status: v })} options={statuses.map((s) => ({ value: s, label: s }))} />
                </div>
              </div>
              <In label="Hook" value={form.hook} onChange={(v) => setForm({ ...form, hook: v })} />
              <Ar label="Angle" value={form.angle} onChange={(v) => setForm({ ...form, angle: v })} />
              <Ar label="Script" value={form.script} onChange={(v) => setForm({ ...form, script: v })} />
              <div className="grid grid-cols-2 gap-4">
                <In label="Spend ($)" value={form.spend} onChange={(v) => setForm({ ...form, spend: v })} num />
                <In label="Revenue ($)" value={form.revenue} onChange={(v) => setForm({ ...form, revenue: v })} num />
              </div>
            </div>
            <button type="submit" className="w-full mt-6 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 transition-colors">
              Save Creative
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}
function Metric({ label, value, accent }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-semibold ${accent || "text-zinc-200"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
    </div>
  );
}
function StatusBadge({ status }) {
  const map = {
    Testing: "bg-zinc-800 text-zinc-400",
    Winner: "bg-emerald-400/10 text-emerald-400",
    Scaling: "bg-amber-400/10 text-amber-400",
    Killed: "bg-red-400/10 text-red-400",
  };
  return <span className={`px-2 py-0.5 rounded ${map[status]}`}>{status}</span>;
}
function In({ label, value, onChange, req, num }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      <input type={num ? "number" : "text"} value={value} onChange={(e) => onChange(e.target.value)} required={req} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none" />
    </div>
  );
}
function Ar({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none resize-none" />
    </div>
  );
}