import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Zap, Star, Loader2, Check, ShieldCheck } from "lucide-react";

const CATEGORY_ORDER = ["Content", "Creative", "Funnel", "Growth", "Automation", "Branding"];

export default function Pricing() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.Service.filter({ status: "live" }, "-created_date", 100),
  });

  const [submittingId, setSubmittingId] = useState(null);

  const buy = async (s) => {
    setSubmittingId(s.id);
    try {
      const res = await base44.functions.invoke("create-checkout", { productId: s.id });
      const redirectUrl = res?.data?.redirectUrl;
      if (!redirectUrl) throw new Error("No checkout URL returned");
      window.location.href = redirectUrl;
    } catch (err) {
      console.error(err);
      setSubmittingId(null);
    }
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: services.filter((s) => s.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 py-16 lg:py-20 text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> AI-Assisted · Founder-Reviewed
          </div>
          <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            Transparent pricing.<br />
            <span className="text-emerald-400">Real outcomes.</span>
          </h1>
          <p className="text-zinc-400 mt-5 max-w-xl mx-auto text-base lg:text-lg">
            Pick a service, check out in seconds, and our agents get to work. No retainers, no surprises.
          </p>
          <div className="flex items-center justify-center gap-5 mt-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure checkout</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-emerald-400" /> Instant fulfillment</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading && (
          <div className="text-center py-20 flex items-center justify-center gap-2 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading services…
          </div>
        )}

        {!isLoading && services.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            <Zap className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm">Pricing is being deployed. Check back shortly.</p>
          </div>
        )}

        {grouped.map((group) => (
          <section key={group.category} className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-300">{group.category}</h2>
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600">{group.items.length} {group.items.length === 1 ? "option" : "options"}</span>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {group.items.map((s) => (
                <PricingCard key={s.id} s={s} onBuy={buy} submitting={submittingId === s.id} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        PENHAUS Digital · Original systems · Founder-controlled AI
      </footer>
    </div>
  );
}

function PricingCard({ s, onBuy, submitting }) {
  const deliverables = (s.deliverables || "")
    .split("\n")
    .map((d) => d.replace(/^[-•*\s]+/, "").trim())
    .filter(Boolean);

  return (
    <div
      className={`relative rounded-2xl border bg-zinc-900/50 p-6 flex flex-col transition-all hover:border-emerald-400/40 ${
        s.popular ? "border-emerald-400/40 ring-1 ring-emerald-400/20" : "border-zinc-800"
      }`}
    >
      {s.popular && (
        <span className="absolute -top-2.5 left-6 flex items-center gap-1 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-400 text-zinc-950 font-semibold">
          <Star className="w-3 h-3 fill-zinc-950" /> Popular
        </span>
      )}
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">{s.category}</span>
      </div>
      <h3 className="font-semibold text-xl tracking-tight">{s.name}</h3>
      <p className="text-sm text-zinc-400 mt-1">{s.tagline}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-emerald-400">${s.price}</span>
        <span className="text-xs text-zinc-500">one-time</span>
      </div>
      <div className="text-xs text-zinc-500 mt-0.5">{s.delivery_days} day delivery</div>

      {deliverables.length > 0 && (
        <ul className="mt-5 space-y-2 flex-1">
          {deliverables.slice(0, 6).map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}

      {s.description && deliverables.length === 0 && (
        <p className="text-xs text-zinc-500 mt-5 flex-1 line-clamp-3">{s.description}</p>
      )}

      <button
        onClick={() => onBuy(s)}
        disabled={submitting}
        className="w-full mt-6 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Starting checkout…
          </>
        ) : (
          `Get Started · $${s.price}`
        )}
      </button>
    </div>
  );
}