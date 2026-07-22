import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Truck,
  LayoutDashboard,
  Smartphone,
  Moon,
  Sun,
  Users,
  Receipt,
  Route as RouteIcon,
  LineChart,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench, // ← Added for Maintenance
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trips", label: "Trips", icon: RouteIcon },
  { to: "/vehicles", label: "Vehicles", icon: Truck },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/customers", label: "Customers", icon: Building2 },
  { to: "/finance", label: "Finance", icon: LineChart },
  { to: "/maintenance", label: "Maintenance", icon: Wrench }, // ← New entry
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/voucher", label: "Voucher", icon: Smartphone },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem("fp-theme");
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("fp-theme", next ? "dark" : "light");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // router.navigate will be called from inside the component via useRouter, but we need to import router
    // we'll use useRouter hook inside the button onClick
  };

  // We'll use a separate component for sign out button to use router
  const SignOutButton = () => {
    const router = useRouter();
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("w-full justify-start gap-3", collapsed && "justify-center")}
        onClick={async () => {
          await supabase.auth.signOut();
          router.navigate({ to: "/auth" });
        }}
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && <span>Sign out</span>}
      </Button>
    );
  };

  // Desktop sidebar content
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-2")}>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Truck className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">Primesphere</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Logistics</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-4">
        {navItems.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => mobile && setMobileOpen(false)}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="border-t p-2">
        <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex-1 justify-start gap-3", collapsed && "justify-center flex-1 w-full")}
            onClick={toggleTheme}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span>{dark ? "Light" : "Dark"}</span>}
          </Button>
          <SignOutButton />
        </div>
        {/* Collapse toggle (desktop only) */}
        {!mobile && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "→" : "←"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Button variant="outline" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-2 top-2">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent mobile />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen sticky top-0 flex-col border-r bg-background transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
