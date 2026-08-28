import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);

const sortByOptions = [
  { value: "profit", label: "Profit" },
  { value: "roas", label: "ROAS" },
  { value: "revenue", label: "Revenue" },
];

export default function CreativePerformanceChart({ creatives = [] }) {
  const [sortBy, setSortBy] = useState("profit");

  const rows = useMemo(() => {
    return creatives
      .map((c) => {
        const spend = Number(c.spend) || 0;
        const revenue = Number(c.revenue) || 0;
        const profit = revenue - spend;
        const roas = spend > 0 ? Number((revenue / spend).toFixed(2)) : 0;
        return {
          name: c.title || c.hook || "Untitled",
          spend,
          revenue,
          profit,
          roas,
          status: c.status,
        };
      })
      .filter((r) => r.revenue > 0 || r.spend > 0)
      .sort((a, b) => {
        if (sortBy === "roas") return b.roas - a.roas;
        if (sortBy === "revenue") return b.revenue - a.revenue;
        return b.profit - a.profit;
      })
      .slice(0, 8);
  }, [creatives, sortBy]);

  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = totalRevenue - totalSpend;
  const blendedRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 mb-8">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-semibold">Revenue vs. Ad Spend</h2>
          <p className="text-xs text-zinc-500">Which hooks are actually driving profit</p>
        </div>
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
          {sortByOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === opt.value
                  ? "bg-emerald-400 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <MiniStat label="Revenue" value={fmt(totalRevenue)} accent="text-emerald-400" />
        <MiniStat label="Ad Spend" value={fmt(totalSpend)} accent="text-fuchsia-400" />
        <MiniStat
          label="Blended ROAS"
          value={`${blendedRoas}x`}
          accent={totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}
        />
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500">
          No creatives with spend or revenue yet. Log results to see performance.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={70}
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{
                background: "#09090b",
                border: "1px solid #27272a",
                borderRadius: "0.75rem",
                color: "#e4e4e7",
                fontSize: "12px",
              }}
              formatter={(value, name) => {
                if (name === "Spend") return [fmt(value), name];
                if (name === "Revenue") return [fmt(value), name];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                if (!payload || !payload.length) return label;
                const r = payload[0]?.payload;
                if (!r) return label;
                return `${label} · Profit ${fmt(r.profit)} (${r.roas}x ROAS)`;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              iconType="circle"
            />
            <Bar dataKey="spend" name="Spend" fill="#d946ef" radius={[4, 4, 0, 0]} />
            <Bar dataKey="revenue" name="Revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Profit ranking list */}
      {rows.length > 0 && (
        <div className="mt-5 pt-5 border-t border-zinc-800 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
            Top {rows.length} by {sortByOptions.find((o) => o.value === sortBy)?.label}
          </div>
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {r.profit >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span className="text-zinc-300 truncate">{r.name}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-zinc-500 w-16 text-right">{fmt(r.spend)}</span>
                <span className="text-xs text-zinc-300 w-16 text-right">{fmt(r.revenue)}</span>
                <span
                  className={`text-xs font-medium w-20 text-right ${
                    r.profit >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {r.profit >= 0 ? "+" : ""}
                  {fmt(r.profit)}
                </span>
                <span className="text-xs text-zinc-400 w-12 text-right">{r.roas}x</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-600 pt-2">
            <span></span>
            <span className="flex items-center gap-4 shrink-0">
              <span className="w-16 text-right">Spend</span>
              <span className="w-16 text-right">Revenue</span>
              <span className="w-20 text-right">Profit</span>
              <span className="w-12 text-right">ROAS</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-zinc-950/50 border border-zinc-800 px-4 py-3">
      <div className={`text-lg font-semibold ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-600 mt-0.5">{label}</div>
    </div>
  );
}