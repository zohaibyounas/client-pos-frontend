'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Stores', href: '/dashboard/stores', icon: Store, adminOnly: true },
    { name: 'Warehouses', href: '/dashboard/warehouses', icon: Warehouse, adminOnly: true },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Expenses', href: '/dashboard/expenses', icon: DollarSign },
    { name: 'Sales (POS)', href: '/dashboard/sales', icon: ShoppingCart },
    { name: 'Purchases', href: '/dashboard/purchases', icon: CreditCard },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Users', href: '/dashboard/users', icon: UserCircle, adminOnly: true },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [store, setStore] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const storedStore = localStorage.getItem('selectedStore');
        if (storedStore) {
            setStore(JSON.parse(storedStore));
        } else {
            const excludedPaths = ['/dashboard/select-store', '/dashboard/stores', '/login'];
            if (!excludedPaths.includes(pathname)) {
                if (storedUser) {
                    const u = JSON.parse(storedUser);
                    if (u.role === 'admin') {
                        router.push('/dashboard/select-store');
                    }
                }
            }
        }
    }, [pathname, router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedStore');
        router.push('/login');
    };

    const isSelectStorePage = pathname === '/dashboard/select-store';
    const isAdmin = user?.role === 'admin';

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sidebar */}
            {!isSelectStorePage && (store || isAdmin) && (
                <aside className="w-64 bg-white dark:bg-slate-900 border-r hidden md:flex flex-col animate-in slide-in-from-left duration-300">
                    <div className="p-6 border-b space-y-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-blue-600 flex items-center">
                                <ShoppingCart className="mr-2" /> SANITARY POS
                            </h2>
                        </div>
                        {store && (
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center justify-between">
                                <span className="truncate mr-2 uppercase">{store.name}</span>
                                <Link href="/dashboard/select-store" className="text-[10px] text-blue-500 hover:underline">Switch</Link>
                            </div>
                        )}
                    </div>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {!isSelectStorePage && (store || isAdmin) && (
                    <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
                        <div className="flex items-center gap-4">
                            <h1 className="text-sm font-semibold text-slate-500 uppercase tracking-wider hidden md:block">
                                {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold dark:text-white capitalize">{user?.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500">{user?.email}</span>
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
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
