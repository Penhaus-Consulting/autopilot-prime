import React, { useRef, useEffect } from "react";
import { Link, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  LayoutDashboard,
  Bot,
  Tag,
  Film,
  Sparkles,
  Zap,
  ShoppingBag,
  Settings,
  LogOut,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const nav = [
  { to: "/", label: "Command Center", icon: LayoutDashboard },
  { to: "/agents", label: "AI Agents", icon: Bot },
  { to: "/autopilot", label: "Autopilot Tasks", icon: Zap },
  { to: "/services", label: "Services & Pricing", icon: Tag },
  { to: "/creatives", label: "Winning Creatives", icon: Sparkles },
  { to: "/studio", label: "Content Studio", icon: Film },
  { to: "/settings", label: "Settings", icon: Settings },
];

const tabs = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/autopilot", label: "Autopilot", icon: Zap },
  { to: "/store", label: "Store", icon: ShoppingBag },
];

const tabRoots = ["/", "/agents", "/autopilot", "/store"];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // --- Tab stack memory + double-tap-to-root ---
  const lastTapRef = useRef({});
  const lastPathByTab = useRef(Object.fromEntries(tabRoots.map((t) => [t, t])));

  useEffect(() => {
    const tab = tabRoots.find(
      (t) => location.pathname === t || location.pathname.startsWith(t + "/")
    );
    if (tab) lastPathByTab.current[tab] = location.pathname;
  }, [location.pathname]);

  const handleTabTap = (e, to) => {
    const now = Date.now();
    const last = lastTapRef.current[to] || 0;
    lastTapRef.current[to] = now;
    // Double-tap on the active tab → reset to its root
    if (location.pathname === to && now - last < 350) {
      e.preventDefault();
      navigate(to);
      lastPathByTab.current[to] = to;
      return;
    }
    // Switching to a different tab → restore its remembered path
    if (location.pathname !== to) {
      e.preventDefault();
      navigate(lastPathByTab.current[to] || to);
    }
  };

  // --- Pull-to-refresh: invalidate all active react-query caches ---
  const { distance, refreshing } = usePullToRefresh(async () => {
    await queryClientInstance.refetchQueries({ type: "active" });
  });

  const isOnRootTab = tabRoots.includes(location.pathname);

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile top bar — safe-area aware, shows back arrow off root tab paths */}
      <div
        className="lg:hidden sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          {isOnRootTab ? (
            <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="w-7 h-7 rounded-md bg-emerald-400 grid place-items-center text-zinc-950">
                <Zap className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <span className="text-sm">PENHAUS AI</span>
            </Link>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-zinc-100 -ml-1"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}
          <Link to="/settings" className="p-2 -mr-2 text-zinc-400 hover:text-zinc-100">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {(distance > 0 || refreshing) && (
        <div
          className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
          style={{ top: `calc(env(safe-area-inset-top) + 3.5rem + ${distance}px)` }}
        >
          <Loader2
            className={`w-5 h-5 text-emerald-400 ${refreshing || distance > 50 ? "animate-spin" : ""}`}
          />
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 min-h-screen lg:sticky lg:top-0">
          <div className="flex items-center gap-2 px-5 h-16 border-b border-zinc-800">
            <span className="w-8 h-8 rounded-lg bg-emerald-400 grid place-items-center text-zinc-950">
              <Zap className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">PENHAUS AI</div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-400/80">Creative Intelligence</div>
            </div>
          </div>

          <nav className="p-3 space-y-0.5">
            {nav.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    active
                      ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 w-64 p-3 border-t border-zinc-800">
            {me && (
              <div className="px-3 py-2 mb-1">
                <div className="text-xs text-zinc-500">Signed in</div>
                <div className="text-sm text-zinc-200 truncate">{me.email}</div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main — animated route transitions */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom tab bar — safe-area aware, tab stack memory */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur border-t border-zinc-800"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-around h-14">
          {tabs.map((t) => {
            const active =
              location.pathname === t.to || location.pathname.startsWith(t.to + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                onClick={(e) => handleTabTap(e, t.to)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] transition-colors ${
                  active ? "text-emerald-400" : "text-zinc-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}