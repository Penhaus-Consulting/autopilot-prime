import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

export default function DailyEarningsChart({ orders }) {
  const data = useMemo(() => {
    const completed = orders.filter((o) => ["paid", "fulfilled"].includes(o.status));
    const days = 14;
    const map = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = {
        date: key,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        earnings: 0,
      };
    }
    completed.forEach((o) => {
      const key = (o.created_date || "").slice(0, 10);
      if (map[key]) map[key].earnings += o.amount || 0;
    });
    return Object.values(map);
  }, [orders]);

  const total = data.reduce((s, d) => s + d.earnings, 0);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Daily Earnings
          </h2>
          <p className="text-xs text-zinc-500">Last 14 days · completed orders</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-emerald-400">{fmt(total)}</div>
          <div className="text-xs text-zinc-500">period total</div>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(v) => [fmt(v), "Earnings"]}
            />
            <Area type="monotone" dataKey="earnings" stroke="#34d399" strokeWidth={2} fill="url(#earningsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}