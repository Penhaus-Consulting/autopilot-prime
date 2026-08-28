import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap, Plus, X } from "lucide-react";
import FormSelect from "@/components/FormSelect";
import TaskKanban from "@/components/TaskKanban";

const categories = ["Sales", "Content", "Creative", "Fulfillment", "Growth", "Ops"];

export default function Autopilot() {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery({
    queryKey: ["autopilot-tasks"],
    queryFn: () => base44.entities.AutopilotTask.list("-created_date", 100),
  });
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => base44.entities.Agent.list("-created_date", 50),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", agent: "", category: "Sales", priority: "medium", revenue_impact: 0 });

  const create = async (e) => {
    e.preventDefault();
    await base44.entities.AutopilotTask.create({
      ...form,
      status: "pending",
      revenue_impact: Number(form.revenue_impact) || 0,
      scheduled_time: new Date().toISOString(),
    });
    qc.invalidateQueries(["autopilot-tasks"]);
    setShowForm(false);
    setForm({ title: "", agent: "", category: "Sales", priority: "medium", revenue_impact: 0 });
  };

  const advance = async (t) => {
    const next = t.status === "pending" ? "running" : t.status === "running" ? "done" : "pending";
    const patch = { status: next };
    if (next === "done") patch.result = "Completed by agent";
    const prev = qc.getQueryData(["autopilot-tasks"]);
    qc.setQueryData(["autopilot-tasks"], (old) => (old ? old.map((x) => (x.id === t.id ? { ...x, ...patch } : x)) : old));
    try {
      await base44.entities.AutopilotTask.update(t.id, patch);
    } catch (err) {
      qc.setQueryData(["autopilot-tasks"], prev);
    } finally {
      qc.invalidateQueries(["autopilot-tasks"]);
    }
  };

  const remove = async (t) => {
    await base44.entities.AutopilotTask.delete(t.id);
    qc.invalidateQueries(["autopilot-tasks"]);
  };

  const move = async (taskId, newStatus) => {
    const prev = qc.getQueryData(["autopilot-tasks"]);
    const patch = { status: newStatus };
    if (newStatus === "done") patch.result = "Completed by agent";
    qc.setQueryData(["autopilot-tasks"], (old) =>
      old ? old.map((x) => (x.id === taskId ? { ...x, ...patch } : x)) : old
    );
    try {
      await base44.entities.AutopilotTask.update(taskId, patch);
    } catch (err) {
      qc.setQueryData(["autopilot-tasks"], prev);
    } finally {
      qc.invalidateQueries(["autopilot-tasks"]);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400/80 mb-2">
            <Zap className="w-3.5 h-3.5" /> Autonomous Execution
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Autopilot Tasks</h1>
          <p className="text-zinc-400 mt-1 text-sm">Queue work for your agents. The system runs it while you sleep.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 text-sm font-medium hover:bg-emerald-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </header>

      <TaskKanban tasks={tasks} onMove={move} onAdvance={advance} onRemove={remove} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={create}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">New Autopilot Task</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Task</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Generate 5 TikTok hooks for offer X"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Assign Agent</label>
                <FormSelect value={form.agent || "none"} onValueChange={(v) => setForm({ ...form, agent: v === "none" ? "" : v })} options={[{ value: "none", label: "Unassigned" }, ...agents.map((a) => ({ value: a.name, label: a.name }))]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Category</label>
                  <FormSelect value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ value: c, label: c }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Priority</label>
                  <FormSelect value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Revenue Impact ($)</label>
                <input
                  type="number"
                  value={form.revenue_impact}
                  onChange={(e) => setForm({ ...form, revenue_impact: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none"
                />
              </div>
            </div>
            <button type="submit" className="w-full mt-6 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 transition-colors">
              Queue Task
            </button>
          </form>
        </div>
      )}
    </div>
  );
}