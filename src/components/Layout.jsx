import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Bot,
  ShoppingBag,
  Tag,
  Film,
  Sparkles,
  Zap,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const nav = [
  { to: "/", label: "Command Center", icon: LayoutDashboard, scope: "owner" },
  { to: "/agents", label: "AI Agents", icon: Bot, scope: "owner" },
  { to: "/autopilot", label: "Autopilot Tasks", icon: Zap, scope: "owner" },
  { to: "/services", label: "Services & Pricing", icon: Tag, scope: "owner" },
  { to: "/creatives", label: "Winning Creatives", icon: Sparkles, scope: "owner" },
  { to: "/studio", label: "Content Studio", icon: Film, scope: "owner" },
  { to: "/store", label: "Customer Storefront", icon: ShoppingBag, scope: "store" },
];

export default function Layout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="w-7 h-7 rounded-md bg-emerald-400 grid place-items-center text-zinc-950">
            <Zap className="w-4 h-4" strokeWidth={2.5} />
          </span>
          <span className="text-sm">AUTONOMOUS OS</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="p-2 -mr-2 text-zinc-400">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            open ? "block" : "hidden"
          } lg:block w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 min-h-[calc(100vh-3.5rem)] lg:min-h-screen lg:sticky lg:top-0`}
        >
          <div className="hidden lg:flex items-center gap-2 px-5 h-16 border-b border-zinc-800">
            <span className="w-8 h-8 rounded-lg bg-emerald-400 grid place-items-center text-zinc-950">
              <Zap className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">AUTONOMOUS OS</div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-400/80">24/7 Money Machine</div>
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
                  onClick={() => setOpen(false)}
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

          <div className="absolute bottom-0 w-64 p-3 border-t border-zinc-800 hidden lg:block">
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

        {/* Main */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}