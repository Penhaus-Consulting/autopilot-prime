import React from "react";
import { TrendingUp, DollarSign, Target, Flame } from "lucide-react";

export default function CreativeGallery({ creatives, onCycle }) {
  // Top performers: by revenue desc
  const sorted = [...creatives].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 text-sm">
        No creatives logged yet. Add your first piece of content.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {sorted.map((c, i) => (
        <CreativeCard key={c.id} c={c} rank={i} onCycle={onCycle} />
      ))}
    </div>
  );
}

function CreativeCard({ c, rank, onCycle }) {
  const roas = c.roas || 0;
  const isTop = rank === 0 && (c.revenue || 0) > 0;

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-zinc-700 transition-colors flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {c.platform}
          </span>
          <button onClick={() => onCycle(c)} className="transition-colors">
            <StatusBadge status={c.status} />
          </button>
        </div>
        {isTop && (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400">
            <Flame className="w-3 h-3" /> #1
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold tracking-tight text-zinc-100">{c.title}</h3>

        {c.hook && (
          <div className="mt-2">
            <div className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-0.5">Hook</div>
            <p className="text-sm font-medium text-emerald-300 line-clamp-2">"{c.hook}"</p>
          </div>
        )}

        {c.script && (
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Script</div>
            <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">{c.script}</p>
          </div>
        )}

        {c.angle && (
          <div className="mt-2 text-[11px] text-zinc-600 italic line-clamp-1">{c.angle}</div>
        )}
      </div>

      {/* Metrics footer */}
      <div className="grid grid-cols-3 gap-1 px-4 py-3 border-t border-zinc-800 bg-zinc-950/40">
        <Metric
          icon={Target}
          label="Spend"
          value={`$${(c.spend || 0).toLocaleString()}`}
        />
        <Metric
          icon={DollarSign}
          label="Revenue"
          value={`$${(c.revenue || 0).toLocaleString()}`}
          accent="text-emerald-400"
        />
        <Metric
          icon={TrendingUp}
          label="ROAS"
          value={`${roas.toFixed(1)}x`}
          accent={roas >= 2 ? "text-emerald-400" : "text-zinc-300"}
        />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className={`w-3.5 h-3.5 mb-1 ${accent || "text-zinc-500"}`} />
      <div className={`text-sm font-semibold ${accent || "text-zinc-200"}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-zinc-600">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Testing: "bg-zinc-800 text-zinc-400",
    Winner: "bg-emerald-400/10 text-emerald-400",
    Scaling: "bg-amber-400/10 text-amber-400",
    Killed: "bg-red-400/10 text-red-400",
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${map[status]}`}>{status}</span>;
}