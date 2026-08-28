import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Zap, Pencil, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// Compact quick-launch strip rendered on the Autopilot page.
// onCustomize(template) opens the New Task modal pre-filled from the template.
export default function TemplateLauncher({ onCustomize }) {
  const qc = useQueryClient();
  const { data: templates = [] } = useQuery({
    queryKey: ["task-templates"],
    queryFn: () => base44.entities.TaskTemplate.list("-created_date", 20),
  });

  const launchNow = async (t) => {
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
  };

  if (!templates.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-zinc-600" />
          <div>
            <div className="text-sm text-zinc-300">No templates yet</div>
            <div className="text-xs text-zinc-500">Save recurring workflows as templates to launch in one click.</div>
          </div>
        </div>
        <Link to="/templates" className="flex items-center gap-1 text-xs text-emerald-400 hover:underline">
          Create a template <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-medium text-zinc-200">Launch from Template</h2>
        </div>
        <Link to="/templates" className="flex items-center gap-1 text-xs text-emerald-400 hover:underline">
          Manage <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {templates.map((t) => (
          <div key={t.id} className="snap-start shrink-0 w-64 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2">{t.name}</h3>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wider mb-3">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{t.category}</span>
              <span className={`px-1.5 py-0.5 rounded ${
                t.priority === "high" ? "bg-red-400/10 text-red-400"
                : t.priority === "medium" ? "bg-amber-400/10 text-amber-400"
                : "bg-zinc-800 text-zinc-500"
              }`}>{t.priority}</span>
            </div>
            <div className="mt-auto flex items-center gap-2">
              <button
                onClick={() => launchNow(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-400 text-zinc-950 text-xs font-medium hover:bg-emerald-300 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" /> Launch
              </button>
              <button
                onClick={() => onCustomize(t)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                title="Edit before launch"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}