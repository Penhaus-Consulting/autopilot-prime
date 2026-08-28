import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

export default function DailyEarningsChart({ orders }) {
  const { data, total, bestDay, avg, delta } = useMemo(() => {
    const completed = orders.filter((o) => ["paid", "fulfilled"].includes(o.status));
    const days = 14;
    const now = new Date();

    const buildRange = (offsetDays) => {
      const map = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i - offsetDays);
        const key = d.toISOString().slice(0, 10);
        map[key] = { date: key, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), earnings: 0 };
      }
      return map;
    };

    const current = buildRange(0);
    const previous = buildRange(days);

    completed.forEach((o) => {
      const key = (o.created_date || "").slice(0, 10);
      if (current[key]) current[key].earnings += o.amount || 0;
      if (previous[key]) previous[key].earnings += o.amount || 0;
    });

    const data = Object.values(current);
    const total = data.reduce((s, d) => s + d.earnings, 0);
    const prevTotal = Object.values(previous).reduce((s, d) => s + d.earnings, 0);
    const bestDay = data.reduce((b, d) => (d.earnings > b.earnings ? d : b), { earnings: 0, label: "—" });
    const avg = total / days;
    const delta = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : total > 0 ? 100 : 0;
    return { data, total, bestDay, avg, delta };
  }, [orders]);

  const TrendIcon = delta > 1 ? TrendingUp : delta < -1 ? TrendingDown : Minus;
  const trendColor = delta > 1 ? "text-emerald-400" : delta < -1 ? "text-red-400" : "text-zinc-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Daily Earnings
          </h2>
          <p className="text-xs text-zinc-500">Last 14 days · completed orders</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div className="text-2xl font-semibold text-emerald-400">{fmt(total)}</div>
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {delta > 0 ? "+" : ""}{delta.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Mini summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MiniStat label="Daily Avg" value={fmt(avg)} />
        <MiniStat label="Best Day" value={fmt(bestDay.earnings)} sub={bestDay.label} />
        <MiniStat label="Period Total" value={fmt(total)} />
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip
              cursor={{ stroke: "#34d399", strokeWidth: 1, strokeDasharray: "3 3" }}
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12, padding: "8px 10px" }}
              labelStyle={{ color: "#a1a1aa", marginBottom: 2 }}
              formatter={(v) => [fmt(v), "Earnings"]}
            />
            <Area type="monotone" dataKey="earnings" stroke="#34d399" strokeWidth={2} fill="url(#earningsGrad)" dot={false} activeDot={{ r: 4, fill: "#34d399", stroke: "#0a0a0a", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
      <div className="text-base font-semibold tracking-tight text-zinc-100">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}{sub ? ` · ${sub}` : ""}
      </div>
    </div>
  );
}