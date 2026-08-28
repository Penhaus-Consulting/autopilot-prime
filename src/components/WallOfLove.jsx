import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star, Heart, Quote, Loader2 } from "lucide-react";

// Public "Wall of Love" — highest-rated customer feedback shown on the Store
// to build buyer trust. Self-contained: fetches its own data and handles
// loading / empty states gracefully.
export default function WallOfLove() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-feedback"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getFeaturedFeedback", {});
      const d = res?.data || res;
      return d?.reviews || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const reviews = data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        <span className="text-sm">Loading customer love…</span>
      </div>
    );
  }

  if (reviews.length === 0) return null;

  const avg =
    reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <section className="border-y border-zinc-800 bg-zinc-900/30">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400/80 mb-3">
            <Heart className="w-3.5 h-3.5 fill-emerald-400/30" /> Wall of Love
          </div>
          <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">
            Founders trust the output
          </h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-4 h-4 ${
                    n <= Math.round(avg) ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-zinc-400">
              {avg.toFixed(1)} avg · {reviews.length} verified review{reviews.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 flex flex-col hover:border-emerald-400/30 transition-colors"
            >
              <Quote className="w-5 h-5 text-emerald-400/40 mb-3" />
              <p className="text-sm text-zinc-300 leading-relaxed flex-1">"{r.comment}"</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-400/10 text-emerald-400 grid place-items-center text-xs font-semibold">
                    {r.customer_name?.charAt(0)?.toUpperCase() || "B"}
                  </div>
                  <div>
                    <div className="text-sm text-zinc-200">{r.customer_name}</div>
                    {r.service_name && (
                      <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">{r.service_name}</div>
                    )}
                  </div>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-3.5 h-3.5 ${
                        n <= r.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}