import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Zap, Star, Loader2, ArrowLeft } from "lucide-react";
import WallOfLove from "@/components/WallOfLove";

export default function Store() {
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.Service.filter({ status: "live" }, "-created_date", 100),
  });

  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const buy = async () => {
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("create-checkout", { productId: selected.id });
      const redirectUrl = res?.data?.redirectUrl;
      if (!redirectUrl) throw new Error("No checkout URL returned");
      window.location.href = redirectUrl;
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const popular = services.filter((s) => s.popular);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Storefront hero */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 py-16 lg:py-24 text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> AI-Assisted Services · Founder-Reviewed
          </div>
          <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            Buy the output.<br />
            <span className="text-emerald-400">PENHAUS builds the system.</span>
          </h1>
          <p className="text-zinc-400 mt-5 max-w-xl mx-auto text-base lg:text-lg">
            Choose a service and send your request. We confirm scope and payment before work begins.
          </p>
        </div>
      </div>

      <WallOfLove />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {selected ? (
          <div className="max-w-lg mx-auto">
            <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{selected.category}</div>
              <h2 className="text-2xl font-semibold tracking-tight">{selected.name}</h2>
              <p className="text-sm text-zinc-400 mt-1">{selected.tagline}</p>
              <div className="text-3xl font-semibold text-emerald-400 mt-4">${selected.price}</div>
              <div className="text-xs text-zinc-500">{selected.delivery_days} day delivery</div>
              {selected.deliverables && (
                <div className="mt-4 pt-4 border-t border-zinc-800 text-sm text-zinc-400 whitespace-pre-wrap">{selected.deliverables}</div>
              )}
              <p className="text-xs text-zinc-500 mt-6">Secure checkout via Base44 Payments. Enter your details on the next page.</p>
              <button
                onClick={buy}
                disabled={submitting}
                className="w-full mt-3 py-3 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting checkout…</> : `Buy Now · $${selected.price}`}
              </button>
            </div>
          </div>
        ) : (
          <>
            {popular.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Most Popular
                </h2>
                <div className="grid md:grid-cols-3 gap-5">
                  {popular.map((s) => (
                    <ServiceCard key={s.id} s={s} onSelect={setSelected} featured />
                  ))}
                </div>
              </div>
            )}
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">All Services</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {services.map((s) => (
                <ServiceCard key={s.id} s={s} onSelect={setSelected} />
              ))}
            </div>
            {services.length === 0 && (
              <div className="text-center py-20 text-zinc-500">
                <Zap className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
                <p className="text-sm">Services are being deployed. Check back shortly.</p>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        PENHAUS Digital · Original systems · Founder-controlled AI
      </footer>
    </div>
  );
}

function ServiceCard({ s, onSelect, featured }) {
  return (
    <button
      onClick={() => onSelect(s)}
      className={`text-left rounded-2xl border bg-zinc-900/50 p-5 flex flex-col transition-all hover:border-emerald-400/40 hover:bg-zinc-900 ${
        featured ? "border-emerald-400/30" : "border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">{s.category}</span>
        {featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
      </div>
      <h3 className="font-semibold text-lg tracking-tight">{s.name}</h3>
      <p className="text-sm text-zinc-400 mt-1">{s.tagline}</p>
      <p className="text-xs text-zinc-500 mt-3 flex-1 line-clamp-2">{s.description}</p>
      <div className="flex items-end justify-between mt-4 pt-4 border-t border-zinc-800">
        <div className="text-2xl font-semibold text-emerald-400">${s.price}</div>
        <div className="text-xs text-zinc-500">{s.delivery_days}d delivery</div>
      </div>
    </button>
  );
}