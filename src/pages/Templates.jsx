import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus, X, Play, Pencil, Trash2, Zap } from "lucide-react";
import FormSelect from "@/components/FormSelect";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const categories = ["Sales", "Content", "Creative", "Fulfillment", "Growth", "Ops"];
const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const empty = {
  name: "", description: "", instructions: "",
  category: "Ops", priority: "medium", agent: "", revenue_impact: 0,
};

export default function Templates() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: templates = [] } = useQuery({
    queryKey: ["task-templates"],
    queryFn: () => base44.entities.TaskTemplate.list("-created_date", 100),
  });
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => base44.entities.Agent.list("-created_date", 50),
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name || "", description: t.description || "", instructions: t.instructions || "",
      category: t.category || "Ops", priority: t.priority || "medium",
      agent: t.agent || "", revenue_impact: t.revenue_impact || 0,
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, revenue_impact: Number(form.revenue_impact) || 0 };
    if (editing) {
      await base44.entities.TaskTemplate.update(editing.id, payload);
    } else {
      await base44.entities.TaskTemplate.create(payload);
    }
    qc.invalidateQueries(["task-templates"]);
    setShowForm(false);
    setForm(empty);
    setEditing(null);
  };

  const remove = async (t) => {
    await base44.entities.TaskTemplate.delete(t.id);
    qc.invalidateQueries(["task-templates"]);
  };

  const launch = async (t) => {
    await base44.entities.AutopilotTask.create({
      title: t.name,
      instructions: t.instructions || "",
      agent: t.agent || "",
      category: t.category || "Ops",
      priority: t.priority || "medium",
      revenue_impact: Number(t.revenue_impact) || 0,
      status: "pending",
      scheduled_time: new Date().toISOString(),
    });
    qc.invalidateQueries(["autopilot-tasks"]);
    toast({ title: "Task launched", description: t.name });
    navigate("/autopilot");
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400/80 mb-2">
            <Layers className="w-3.5 h-3.5" /> Recurring Workflows
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Task Templates</h1>
          <p className="text-zinc-400 mt-1 text-sm">Pre-fill instructions, priority, and agent — launch in one click.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 text-sm font-medium hover:bg-emerald-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </header>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <Layers className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No templates yet. Create one to launch recurring AI workflows fast.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-zinc-100 leading-snug">{t.name}</h3>
                <PriorityTag p={t.priority} />
              </div>
              {t.description && <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{t.description}</p>}
              {t.instructions && (
                <p className="text-xs text-zinc-400 bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 mb-3 line-clamp-3">
                  {t.instructions}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider mb-4">
                <Chip>{t.category}</Chip>
                {t.agent && <Chip>{t.agent}</Chip>}
                {t.revenue_impact > 0 && <Chip accent>+${t.revenue_impact}</Chip>}
              </div>
              <div className="mt-auto flex items-center gap-2">
                <button
                  onClick={() => launch(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-400 text-zinc-950 text-xs font-medium hover:bg-emerald-300 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" /> Launch
                </button>
                <button
                  onClick={() => openEdit(t)}
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(t)}
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editing ? "Edit Template" : "New Template"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <In label="Template Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} req />
              <In label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <Ar label="Agent Instructions" value={form.instructions} onChange={(v) => setForm({ ...form, instructions: v })} rows={4} />
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Default Agent</label>
                <FormSelect
                  value={form.agent || "none"}
                  onValueChange={(v) => setForm({ ...form, agent: v === "none" ? "" : v })}
                  options={[{ value: "none", label: "Unassigned" }, ...agents.map((a) => ({ value: a.name, label: a.name }))]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Category</label>
                  <FormSelect value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ value: c, label: c }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Priority</label>
                  <FormSelect value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })} options={priorities} />
                </div>
              </div>
              <In label="Revenue Impact ($)" value={form.revenue_impact} onChange={(v) => setForm({ ...form, revenue_impact: v })} num />
            </div>
            <button type="submit" className="w-full mt-6 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 transition-colors">
              {editing ? "Save Template" : "Create Template"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function PriorityTag({ p }) {
  const map = { high: "text-red-400 bg-red-400/10", medium: "text-amber-400 bg-amber-400/10", low: "text-zinc-500 bg-zinc-800" };
  return <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded shrink-0 ${map[p] || map.low}`}>{p}</span>;
}
function Chip({ children, accent }) {
  return <span className={`px-2 py-0.5 rounded ${accent ? "bg-emerald-400/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>{children}</span>;
}
function In({ label, value, onChange, req, num }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      <input type={num ? "number" : "text"} value={value} onChange={(e) => onChange(e.target.value)} required={req} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none" />
    </div>
  );
}
function Ar({ label, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none resize-none" />
    </div>
  );
}