import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Settings as SettingsIcon, User, Trash2, Loader2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      await base44.auth.logout();
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400/80 mb-2">
          <SettingsIcon className="w-3.5 h-3.5" /> Account
        </div>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Settings</h1>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-2 text-sm font-medium mb-4">
            <User className="w-4 h-4 text-zinc-400" /> Account
          </div>
          {me && (
            <div>
              <div className="text-xs text-zinc-500">Email</div>
              <div className="text-sm text-zinc-200">{me.email}</div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="flex items-center gap-2 text-sm font-medium mb-2 text-red-400">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </section>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-zinc-100">Delete account?</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              This permanently removes your account and all your data (orders, tasks, creatives, content). This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting…
                  </>
                ) : (
                  "Delete forever"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}