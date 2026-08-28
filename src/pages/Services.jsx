import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tag, Plus, X, Star, Trash2 } from "lucide-react";
import FormSelect from "@/components/FormSelect";

const categories = ["Content", "Creative", "Funnel", "Growth", "Automation", "Branding"];

export default function Services() {
  const qc = useQueryClient();
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.Service.list("-created_date", 100),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", tagline: "", description: "", category: "Content", price: 0, delivery_days: 3, deliverables: "", popular: false,
  });

  const create = async (e) => {
    e.preventDefault();
    await base44.entities.Service.create({
      ...form,
      price: Number(form.price) || 0,
      delivery_days: Number(form.delivery_days) || 3,
      status: "live",
    });
    qc.invalidateQueries(["services"]);
    setShowForm(false);
    setForm({ name: "", tagline: "", description: "", category: "Content", price: 0, delivery_days: 3, deliverables: "", popular: false });
  };

  const togglePopular = async (s) => {
    await base44.entities.Service.update(s.id, { popular: !s.popular });
    qc.invalidateQueries(["services"]);
  };

  const remove = async (s) => {
    await base44.entities.Service.update(s.id, { status: "retired" });
    qc.invalidateQueries(["services"]);
  };

  const live = services.filter((s) => s.status !== "retired");

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400/80 mb-2">
            <Tag className="w-3.5 h-3.5" /> Monetize Everything
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Services & Pricing</h1>
          <p className="text-zinc-400 mt-1 text-sm">Price it once. Sell it forever. Agents fulfill automatically.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 text-sm font-medium hover:bg-emerald-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </header>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {live.map((s) => (
          <div key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                {s.category}
              </span>
              <button onClick={() => togglePopular(s)} className="text-zinc-600 hover:text-amber-400 transition-colors">
                <Star className={`w-4 h-4 ${s.popular ? "fill-amber-400 text-amber-400" : ""}`} />
              </button>
            </div>
            <h3 className="font-semibold text-lg tracking-tight">{s.name}</h3>
            <p className="text-sm text-zinc-400 mt-1">{s.tagline}</p>
            <p className="text-xs text-zinc-500 mt-3 flex-1 line-clamp-3">{s.description}</p>
            <div className="flex items-end justify-between mt-4 pt-4 border-t border-zinc-800">
              <div>
                <div className="text-2xl font-semibold text-emerald-400">${s.price}</div>
                <div className="text-xs text-zinc-500">{s.delivery_days} day delivery</div>
              </div>
              <button onClick={() => remove(s)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={create} className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">New Service</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <In label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} req />
              <In label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} />
              <Ar label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <Ar label="Deliverables" value={form.deliverables} onChange={(v) => setForm({ ...form, deliverables: v })} />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Category</label>
                  <FormSelect value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ value: c, label: c }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Price ($)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Delivery (days)</label>
                  <input type="number" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full mt-6 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 transition-colors">
              Publish Service
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function In({ label, value, onChange, req }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={req} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none" />
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