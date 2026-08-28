import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { ShoppingCart, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function OrdersVolumeChart({ orders }) {
  const { data, total, bestDay, avg, delta } = useMemo(() => {
    const days = 30;
    const now = new Date();
    const current = {};
    const previous = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      current[key] = { date: key, label, orders: 0 };
      const pd = new Date(now);
      pd.setDate(now.getDate() - i - days);
      previous[key] = 0;
    }
    orders.forEach((o) => {
      const key = (o.created_date || "").slice(0, 10);
      if (current[key]) current[key].orders += 1;
      if (previous[key] !== undefined) previous[key] += 1;
    });
    const data = Object.values(current);
    const total = data.reduce((s, d) => s + d.orders, 0);
    const prevTotal = Object.values(previous).reduce((s, n) => s + n, 0);
    const bestDay = data.reduce((b, d) => (d.orders > b.orders ? d : b), { orders: 0, label: "—" });
    const avg = total / days;
    const delta = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : total > 0 ? 100 : 0;
    return { data, total, bestDay, avg, delta };
  }, [orders]);

  const TrendIcon = delta > 1 ? TrendingUp : delta < -1 ? TrendingDown : Minus;
  const trendColor = delta > 1 ? "text-emerald-400" : delta < -1 ? "text-red-400" : "text-zinc-400";
  const peak = Math.max(...data.map((d) => d.orders), 1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-400" /> Orders Volume
          </h2>
          <p className="text-xs text-zinc-500">Last 30 days · all received orders</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div className="text-2xl font-semibold text-emerald-400">{total}</div>
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {delta > 0 ? "+" : ""}{delta.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MiniStat label="Daily Avg" value={avg.toFixed(1)} />
        <MiniStat label="Best Day" value={bestDay.orders} sub={bestDay.label} />
        <MiniStat label="Period Total" value={total} />
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
              width={32}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "#34d39920" }}
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12, padding: "8px 10px" }}
              labelStyle={{ color: "#a1a1aa", marginBottom: 2 }}
              formatter={(v) => [v, "Orders"]}
            />
            <Bar dataKey="orders" radius={[3, 3, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.date} fill={d.orders >= peak ? "#34d399" : "#3f3f46"} />
              ))}
            </Bar>
          </BarChart>
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