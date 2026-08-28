import React, { useMemo } from "react";
import { Bot, Trophy, Crown, Medal, Award } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

const rankIcons = [Crown, Medal, Award];

export default function AgentPerformanceRanking({ agents = [], tasks = [] }) {
  const ranking = useMemo(() => {
    // Aggregate revenue impact by agent name (from tasks)
    const byAgent = {};
    tasks.forEach((t) => {
      const name = t.agent || "Unassigned";
      if (!byAgent[name]) byAgent[name] = { name, revenue: 0, taskCount: 0, done: 0 };
      byAgent[name].revenue += t.revenue_impact || 0;
      byAgent[name].taskCount += 1;
      if (t.status === "done") byAgent[name].done += 1;
    });

    // Merge with agent records for role/accent
    const rows = agents
      .map((a) => {
        const agg = byAgent[a.name] || { name: a.name, revenue: 0, taskCount: 0, done: 0 };
        return {
          id: a.id,
          name: a.name,
          role: a.role,
          status: a.status,
          accent: a.accent || "emerald",
          revenue: agg.revenue,
          taskCount: agg.taskCount,
          done: agg.done,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const max = rows.length ? Math.max(...rows.map((r) => r.revenue), 1) : 1;
    return { rows, max };
  }, [agents, tasks]);

  const { rows, max } = ranking;

  const totalImpact = rows.reduce((s, r) => s + r.revenue, 0);
  const topAgent = rows[0];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden mb-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-wrap gap-2">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Agent Revenue Ranking
          </h2>
          <p className="text-xs text-zinc-500">Ranked by revenue impact from Autopilot tasks</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold text-emerald-400">{fmt(totalImpact)}</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">total impact</div>
        </div>
      </div>

      <div className="divide-y divide-zinc-800">
        {rows.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            No agents deployed yet. Deploy agents and queue tasks to see rankings.
          </div>
        )}
        {rows.map((r, i) => {
          const RankIcon = rankIcons[i] || Bot;
          const isTop = i === 0 && r.revenue > 0;
          const widthPct = max > 0 ? Math.max((r.revenue / max) * 100, 2) : 0;
          return (
            <div key={r.id} className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${isTop ? "bg-amber-400/10 text-amber-400" : "bg-zinc-800 text-zinc-500"}`}>
                  <RankIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-zinc-100 truncate font-medium">{r.name}</div>
                    <div className="text-sm font-semibold text-emerald-400 shrink-0">{fmt(r.revenue)}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="text-[11px] text-zinc-500 truncate">
                      #{i + 1} · {r.role || "Agent"} · {r.done}/{r.taskCount} tasks done
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600">{r.status}</div>
                  </div>
                  {/* Proportional bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isTop ? "bg-amber-400" : "bg-emerald-400/70"}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {topAgent && topAgent.revenue > 0 && (
        <div className="px-5 py-3 bg-amber-400/5 border-t border-zinc-800 flex items-center gap-2 text-xs text-amber-300">
          <Crown className="w-3.5 h-3.5" />
          Top performer: {topAgent.name} with {fmt(topAgent.revenue)} in revenue impact.
        </div>
      )}
    </div>
  );
}