"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Warehouse,
  Package,
  ShoppingCart,
  DollarSign,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  UserCircle,
  Users,
  AlertTriangle,
  TrendingUp,
  Bell,
  ArrowDownCircle,
  ArrowUpCircle,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import api from "@/lib/api";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Sales (POS)", href: "/dashboard/sales", icon: ShoppingCart },
  { name: "Purchases", href: "/dashboard/purchases", icon: CreditCard },
  { name: "Expenses", href: "/dashboard/expenses", icon: DollarSign },
  { name: "Finance", href: "/dashboard/finance", icon: CreditCard },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Reports", href: "/dashboard/reports", icon: TrendingUp },
  { name: "Stores", href: "/dashboard/stores", icon: Store, adminOnly: true },
  {
    name: "Warehouses",
    href: "/dashboard/warehouses",
    icon: Warehouse,
    adminOnly: true,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: UserCircle,
    adminOnly: true,
  },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stockNotifications, setStockNotifications] = useState<{
    lowStock: any[];
    highStock: any[];
  }>({ lowStock: [], highStock: [] });
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchStockNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedStore = localStorage.getItem("selectedStore");

      // Critical check: Do not fetch if no token OR no store is selected
      if (!token || !storedStore) {
        setStockNotifications({ lowStock: [], highStock: [] });
        return;
      }

      setLoadingNotifications(true);
      const res = await api.get("/products");
      const products = res.data || [];

      // Low stock: less than 10 items (but greater than 0)
      const lowStock = products.filter(
        (p: any) => (p.totalStock || 0) > 0 && (p.totalStock || 0) < 10,
      );
      // High stock: more than 100 items
      const highStock = products.filter((p: any) => (p.totalStock || 0) > 100);

      setStockNotifications({ lowStock, highStock });
    } catch (error) {
      console.error("Failed to fetch stock notifications", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const storedStore = localStorage.getItem("selectedStore");
    if (storedStore) {
      setStore(JSON.parse(storedStore));
      // Only fetch if on a dashboard page that isn't the store selector
      if (pathname !== "/dashboard/select-store") {
        fetchStockNotifications();
      }
      // Refresh notifications every 2 minutes
      const interval = setInterval(() => {
        if (pathname !== "/dashboard/select-store") {
          fetchStockNotifications();
        }
      }, 2 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      const excludedPaths = [
        "/dashboard/select-store",
        "/dashboard/stores",
        "/login",
      ];
      if (!excludedPaths.includes(pathname)) {
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u.role === "admin") {
            router.push("/dashboard/select-store");
          }
        }
      }
    }
  }, [pathname, router]);

  // Refresh notifications when pathname changes (e.g., after purchase/sale)
  useEffect(() => {
    if (mounted && (store || isAdmin)) {
      if (pathname !== "/dashboard/select-store") {
        fetchStockNotifications();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mounted]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedStore");
    router.push("/login");
  };

  const isSelectStorePage = pathname === "/dashboard/select-store";
  const isAdmin = user?.role === "admin";

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Overlay for Mobile */}
      {!isSelectStorePage && (store || isAdmin) && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-all"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {!isSelectStorePage && (store || isAdmin) && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-blue-600 dark:text-blue-500 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 shrink-0" /> SANITARY POS
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {store && (
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase">
                  {store.name}
                </span>
                <Link
                  href="/dashboard/select-store"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  Switch
                </Link>
              </div>
            )}
          </div>
          <nav className="flex-1 p-4 overflow-y-auto flex flex-col">
            {/* Section: Main System */}
            <div className="mb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 mb-2">
                MAIN NAVIGATION
              </p>
              <div className="space-y-0.5">
                {menuItems
                  .slice(0, 10)
                  .filter((item) => !item.adminOnly || isAdmin)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    const totalNotifications =
                      stockNotifications.lowStock.length +
                      stockNotifications.highStock.length;
                    const showBadge =
                      item.href === "/dashboard/notifications" &&
                      totalNotifications > 0;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group",
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive
                                ? "text-white"
                                : "text-blue-600 dark:text-blue-400",
                            )}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {showBadge && (
                          <Badge className="bg-rose-600 text-white h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold rounded-full shrink-0">
                            {totalNotifications}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Section: Administration */}
            {isAdmin && (
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 mb-2">
                  MANAGEMENT CONSOLE
                </p>
                <div className="space-y-0.5">
                  {menuItems
                    .slice(10)
                    .filter((item) => item.adminOnly)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group",
                            isActive
                              ? "bg-blue-600 text-white"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive
                                ? "text-white"
                                : "text-blue-600 dark:text-blue-400",
                            )}
                          />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Section: App Settings */}
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
              {menuItems
                .filter((item) => !item.adminOnly && item.name === "Settings")
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
            </div>
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isSelectStorePage && (store || isAdmin) && (
          <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-sm font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
                {pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold dark:text-white capitalize">
                  {user?.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {user?.email}
                  </span>
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-blue-200 dark:border-blue-800">
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 border-l pl-6 dark:border-slate-800">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
