import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, Search, Filter, X, Star, CheckCircle2, Loader2 } from "lucide-react";
import FormSelect from "@/components/FormSelect";
import { useToast } from "@/components/ui/use-toast";

const statuses = ["paid", "fulfilled"];

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);

const dateFmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 200),
  });
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: feedback = [] } = useQuery({
    queryKey: ["order-feedback"],
    queryFn: () => base44.entities.Feedback.list("-created_date", 200),
  });

  const [fulfilling, setFulfilling] = useState({});
  const [query, setQuery] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minAmt === "" ? null : Number(minAmt);
    const max = maxAmt === "" ? null : Number(maxAmt);
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (q) {
        const hay = `${o.customer_name || ""} ${o.customer_email || ""} ${o.service_name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const amt = o.amount || 0;
      if (min !== null && amt < min) return false;
      if (max !== null && amt > max) return false;
      return true;
    });
  }, [orders, query, minAmt, maxAmt, status]);

  const totalRevenue = filtered
    .filter((o) => ["paid", "fulfilled"].includes(o.status))
    .reduce((s, o) => s + (o.amount || 0), 0);
  const hasFilters = query || minAmt || maxAmt || status !== "all";

  const clearFilters = () => {
    setQuery("");
    setMinAmt("");
    setMaxAmt("");
    setStatus("all");
  };

  const feedbackByOrder = useMemo(() => {
    const m = {};
    feedback.forEach((f) => { if (f.order_id) m[f.order_id] = f; });
    return m;
  }, [feedback]);

  const markFulfilled = async (o) => {
    setFulfilling((s) => ({ ...s, [o.id]: true }));
    try {
      await base44.entities.Order.update(o.id, { status: "fulfilled" });
      qc.invalidateQueries(["orders"]);
      try {
        await base44.functions.invoke("requestServiceFeedback", { order_id: o.id });
        toast({ title: "Marked fulfilled", description: "Rating request sent to customer." });
      } catch (e) {
        toast({ title: "Marked fulfilled", description: "Rating link ready to share with customer." });
      }
      qc.invalidateQueries(["order-feedback"]);
    } catch (e) {
      toast({ title: "Could not update order", variant: "destructive" });
    } finally {
      setFulfilling((s) => ({ ...s, [o.id]: false }));
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400/80 mb-2">
          <Receipt className="w-3.5 h-3.5" /> Orders Management
        </div>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">All Purchases</h1>
        <p className="text-zinc-400 mt-1 text-sm">Track every order, its status, and filter by customer or amount.</p>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Total Orders" value={filtered.length} />
        <Stat label="Filtered Revenue" value={fmt(totalRevenue)} />
        <Stat label="Fulfilled" value={filtered.filter((o) => o.status === "fulfilled").length} />
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 mb-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
          <Filter className="w-3.5 h-3.5" /> Filters
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer name, email, or service"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Min Amount</label>
            <input
              type="number"
              value={minAmt}
              onChange={(e) => setMinAmt(e.target.value)}
              placeholder="$0"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Max Amount</label>
            <input
              type="number"
              value={maxAmt}
              onChange={(e) => setMaxAmt(e.target.value)}
              placeholder="∞"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-3">
          {[
            { value: "all", label: "All" },
            { value: "paid", label: "Pending" },
            { value: "fulfilled", label: "Completed" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === opt.value
                  ? "bg-emerald-400 text-zinc-950"
                  : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 mt-3">
          <div className="w-40">
            <FormSelect
              value={status}
              onValueChange={setStatus}
              options={[{ value: "all", label: "All statuses" }, ...statuses.map((s) => ({ value: s, label: s }))]}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Orders list */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
          <div className="col-span-3">Customer</div>
          <div className="col-span-3">Service</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2 text-right">Status / Feedback</div>
        </div>
        <div className="divide-y divide-zinc-800">
          {isLoading && (
            <div className="px-5 py-10 text-center text-sm text-zinc-500">Loading orders…</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-zinc-500">
              {hasFilters ? "No orders match your filters." : "No orders yet. The storefront is live and waiting."}
            </div>
          )}
          {filtered.map((o) => (
            <div key={o.id} className="px-5 py-4 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center flex flex-col gap-2">
              <div className="lg:col-span-3">
                <div className="text-sm text-zinc-100 font-medium">{o.customer_name || "—"}</div>
                <div className="text-xs text-zinc-500">{o.customer_email || ""}</div>
              </div>
              <div className="lg:col-span-3 text-sm text-zinc-300">{o.service_name || "—"}</div>
              <div className="lg:col-span-2 text-xs text-zinc-500">{dateFmt(o.created_date)}</div>
              <div className="lg:col-span-2 text-sm font-semibold text-emerald-400">{fmt(o.amount)}</div>
              <div className="lg:col-span-2 lg:text-right flex lg:justify-end items-center gap-2 flex-wrap">
                <StatusBadge status={o.status} />
                {o.status === "paid" && (
                  <button
                    onClick={() => markFulfilled(o)}
                    disabled={!!fulfilling[o.id]}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
                  >
                    {fulfilling[o.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Mark Fulfilled
                  </button>
                )}
                {o.status === "fulfilled" && <FeedbackBadge feedback={feedbackByOrder[o.id]} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    paid: "bg-emerald-400/10 text-emerald-400",
    fulfilled: "bg-sky-400/10 text-sky-400",
    refunded: "bg-red-400/10 text-red-400",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] || "bg-zinc-800 text-zinc-400"}`}>{status || "—"}</span>;
}

function StarsRow({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3 h-3 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`}
        />
      ))}
    </span>
  );
}

function FeedbackBadge({ feedback }) {
  if (!feedback) {
    return <span className="text-[10px] text-zinc-600">Awaiting feedback</span>;
  }
  return (
    <span className="flex items-center gap-1" title={feedback.comment || ""}>
      <StarsRow rating={feedback.rating} />
      <span className="text-xs text-zinc-400">{feedback.rating}.0</span>
    </span>
  );
}