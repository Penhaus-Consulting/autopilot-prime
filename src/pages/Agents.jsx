import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, X, Play, Pause, Sparkles } from "lucide-react";
import FormSelect from "@/components/FormSelect";

const accents = ["emerald", "sky", "amber", "fuchsia", "violet", "rose"];

export default function Agents() {
  const qc = useQueryClient();
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => base44.entities.Agent.list("-created_date", 50),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    specialty: "",
    persona: "",
    system_prompt: "",
    accent: "emerald",
    autonomy: "supervised",
  });

  const create = async (e) => {
    e.preventDefault();
    await base44.entities.Agent.create({ ...form, status: "active", runs_today: 0 });
    qc.invalidateQueries(["agents"]);
    setShowForm(false);
    setForm({ name: "", role: "", specialty: "", persona: "", system_prompt: "", accent: "emerald", autonomy: "supervised" });
  };

  const toggle = async (a) => {
    const newStatus = a.status === "active" ? "paused" : "active";
    const prev = qc.getQueryData(["agents"]);
    qc.setQueryData(["agents"], (old) => (old ? old.map((x) => (x.id === a.id ? { ...x, status: newStatus } : x)) : old));
    try {
      await base44.entities.Agent.update(a.id, { status: newStatus });
    } catch (err) {
      qc.setQueryData(["agents"], prev);
    } finally {
      qc.invalidateQueries(["agents"]);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">AI Agents</h1>
          <p className="text-zinc-400 mt-1 text-sm">The engine behind everything. Deploy, tune, and let them run.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 text-sm font-medium hover:bg-emerald-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> Deploy Agent
        </button>
      </header>

      {isLoading ? (
        <div className="text-zinc-500 text-sm">Loading agents…</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {agents.map((a) => (
            <div key={a.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl grid place-items-center bg-${a.accent || "emerald"}-400/10 text-${a.accent || "emerald"}-400`}>
                  <Bot className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${
                    a.status === "active"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {a.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg tracking-tight">{a.name}</h3>
              <div className="text-xs text-zinc-500 mb-2">{a.role}</div>
              <p className="text-sm text-zinc-400 flex-1 line-clamp-3">{a.persona || a.specialty}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500">
                  <span className="text-zinc-300">{a.runs_today || 0}</span> runs today · {a.autonomy}
                </div>
                <button
                  onClick={() => toggle(a)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  {a.status === "active" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {a.status === "active" ? "Pause" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={create}
            className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Deploy New Agent
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Agent Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Apex" required />
              <Field label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} placeholder="e.g. Sales & Mindset Operator" required />
              <Field label="Specialty" value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} placeholder="e.g. Closing, mindset, accountability" />
              <Area label="Persona" value={form.persona} onChange={(v) => setForm({ ...form, persona: v })} placeholder="Who this agent is and how it operates…" />
              <Area label="System Prompt" value={form.system_prompt} onChange={(v) => setForm({ ...form, system_prompt: v })} placeholder="The operating instructions that drive this agent…" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Accent</label>
                  <FormSelect value={form.accent} onValueChange={(v) => setForm({ ...form, accent: v })} options={accents.map((c) => ({ value: c, label: c }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Autonomy</label>
                  <FormSelect value={form.autonomy} onValueChange={(v) => setForm({ ...form, autonomy: v })} options={[{ value: "manual", label: "Manual" }, { value: "supervised", label: "Supervised" }, { value: "full", label: "Full Autonomy" }]} />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full mt-6 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 transition-colors">
              Deploy Agent
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none"
      />
    </div>
  );
}

function Area({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none resize-none"
      />
    </div>
  );
}