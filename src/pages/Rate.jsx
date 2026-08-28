import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, CheckCircle2, Loader2 } from "lucide-react";

// Public page reached via /rate?order=<orderId> from the rating-prompt email.
export default function Rate() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("order");
    setOrderId(id || "");
    if (!id) {
      setError("Missing order reference.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await base44.functions.invoke("serviceFeedback", { action: "get", order_id: id });
        const data = res?.data || res;
        if (data?.error) throw new Error(data.error);
        setOrder(data);
      } catch (e) {
        setError("We couldn't find this order.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("serviceFeedback", {
        action: "submit",
        order_id: orderId,
        rating,
        comment,
      });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      setDone(true);
    } catch (e) {
      setError("Could not submit your rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 grid place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-8 h-8 rounded-lg bg-emerald-400 grid place-items-center text-zinc-950 font-bold">P</span>
          <span className="font-semibold tracking-tight">PENHAUS Digital</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          {loading && (
            <div className="py-10 flex flex-col items-center gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-sm">Loading your order…</span>
            </div>
          )}

          {!loading && error && !done && (
            <div className="py-10 text-center">
              <p className="text-sm text-zinc-400">{error}</p>
            </div>
          )}

          {!loading && !error && done && (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-400/10 grid place-items-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
              <p className="text-sm text-zinc-400">Your feedback means a lot. We'll put it to work right away.</p>
            </div>
          )}

          {!loading && !error && !done && order && (
            <>
              <div className="text-center mb-6">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400/80 mb-2">Service complete</div>
                <h1 className="text-2xl font-semibold tracking-tight">{order.service_name}</h1>
                <p className="text-sm text-zinc-400 mt-1">How did we do? Rate your delivery.</p>
              </div>

              <form onSubmit={submit}>
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          n <= (hover || rating) ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Tell us more (optional)…"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400/50 outline-none resize-none mb-4"
                />

                <button
                  type="submit"
                  disabled={!rating || submitting}
                  className="w-full py-2.5 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit Rating"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">PENHAUS Digital · Original systems</p>
      </div>
    </div>
  );
}