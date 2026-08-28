import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  Bot,
  Zap,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import DailyEarningsChart from "@/components/DailyEarningsChart";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

export default function Home() {
  const { data: tasks = [] } = useQuery({
    queryKey: ["autopilot-tasks"],
    queryFn: () => base44.entities.AutopilotTask.list("-created_date", 50),
  });
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => base44.entities.Agent.list("-created_date", 50),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 100),
  });
  const { data: creatives = [] } = useQuery({
    queryKey: ["creatives"],
    queryFn: () => base44.entities.Creative.list("-created_date", 50),
  });

  const revenue = orders.filter((o) => ["paid", "fulfilled"].includes(o.status)).reduce((s, o) => s + (o.amount || 0), 0);
  const winners = creatives.filter((c) => c.status === "Winner").length;
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const todayTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const stats = [
    { label: "Revenue (all-time)", value: fmt(revenue), icon: DollarSign, accent: "text-emerald-400" },
    { label: "Active Agents", value: `${activeAgents}/${agents.length || 0}`, icon: Bot, accent: "text-sky-400" },
    { label: "Autopilot Tasks Today", value: todayTasks.length, icon: Zap, accent: "text-amber-400" },
    { label: "Winning Creatives", value: winners, icon: TrendingUp, accent: "text-fuchsia-400" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400/80 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          System Online · Earning Autonomously
        </div>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Command Center</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Your 24/7 money machine. Agents are running. Revenue is compounding.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${s.accent}`} />
              </div>
              <div className="text-2xl lg:text-3xl font-semibold tracking-tight">{s.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Daily earnings summary dashboard */}
      <DailyEarningsChart orders={orders} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Autopilot */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div>
              <h2 className="font-semibold">Today's Autopilot Tasks</h2>
              <p className="text-xs text-zinc-500">Agents executing on your behalf</p>
            </div>
            <Link to="/autopilot" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-800">
            {tasks.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-zinc-500">
                No tasks queued. The system is idle — add tasks in Autopilot.
              </div>
            )}
            {tasks.slice(0, 6).map((t) => (
              <div key={t.id} className="px-5 py-3.5 flex items-center gap-3">
                <StatusDot status={t.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{t.title}</div>
                  <div className="text-xs text-zinc-500">
                    {t.agent || "Unassigned"} · {t.category}
                  </div>
                </div>
                {t.revenue_impact > 0 && (
                  <span className="text-xs text-emerald-400 font-medium">+{fmt(t.revenue_impact)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Agent squad */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div>
              <h2 className="font-semibold">Agent Squad</h2>
              <p className="text-xs text-zinc-500">{activeAgents} running</p>
            </div>
            <Link to="/agents" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-800">
            {agents.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-zinc-500">No agents deployed yet.</div>
            )}
            {agents.slice(0, 5).map((a) => (
              <div key={a.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg grid place-items-center bg-${a.accent || "emerald"}-400/10 text-${a.accent || "emerald"}-400`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{a.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{a.role}</div>
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
            ))}
          </div>
        </div>
      </div>

      {/* Recent revenue */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="font-semibold">Recent Orders</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {orders.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-zinc-500">No orders yet. The storefront is live and waiting.</div>
          )}
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-200">{o.customer_name}</div>
                <div className="text-xs text-zinc-500">{o.service_name}</div>
              </div>
              <div className="text-sm font-medium text-emerald-400">{fmt(o.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  if (status === "done") return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />;
  if (status === "failed") return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />;
  return <Clock className="w-4 h-4 text-zinc-500 shrink-0" />;
}