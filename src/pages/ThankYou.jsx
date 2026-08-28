import React from "react";
import { Link } from "react-router-dom";
import { Check, Zap } from "lucide-react";

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 grid place-items-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-400/10 grid place-items-center mx-auto mb-5">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Payment confirmed</h1>
        <p className="text-zinc-400 mb-8">
          Your order is in. Our AI agents are already queuing fulfillment — you'll receive your deliverable within the stated delivery window.
        </p>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-8 text-left">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> What happens next
          </div>
          <ul className="text-sm text-zinc-300 space-y-1.5">
            <li>· A fulfillment task is auto-assigned to the right agent</li>
            <li>· You'll get your deliverable via email</li>
            <li>· Track everything from the command center</li>
          </ul>
        </div>
        <Link
          to="/store"
          className="inline-block px-5 py-2.5 rounded-lg bg-emerald-400 text-zinc-950 font-medium text-sm hover:bg-emerald-300 transition-colors"
        >
          Back to services
        </Link>
      </div>
    </div>
  );
}