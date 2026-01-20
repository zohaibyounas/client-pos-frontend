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
    Users,
    AlertTriangle,
    TrendingUp,
    Bell,
    ArrowDownCircle,
    ArrowUpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import api from '@/lib/api';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Stores', href: '/dashboard/stores', icon: Store, adminOnly: true },
    { name: 'Warehouses', href: '/dashboard/warehouses', icon: Warehouse, adminOnly: true },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Expenses', href: '/dashboard/expenses', icon: DollarSign },
    { name: 'Sales (POS)', href: '/dashboard/sales', icon: ShoppingCart },
    { name: 'Purchases', href: '/dashboard/purchases', icon: CreditCard },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Finance', href: '/dashboard/finance', icon: CreditCard },
    { name: 'Users', href: '/dashboard/users', icon: UserCircle, adminOnly: true },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [store, setStore] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [stockNotifications, setStockNotifications] = useState<{ 
        lowStock: any[], 
        highStock: any[] 
    }>({ lowStock: [], highStock: [] });
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const fetchStockNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            setLoadingNotifications(true);
            const res = await api.get('/products');
            const products = res.data || [];
            
            // Low stock: less than 10 items (but greater than 0)
            const lowStock = products.filter((p: any) => (p.totalStock || 0) > 0 && (p.totalStock || 0) < 10);
            // High stock: more than 100 items
            const highStock = products.filter((p: any) => (p.totalStock || 0) > 100);
            
            setStockNotifications({ lowStock, highStock });
        } catch (error) {
            console.error('Failed to fetch stock notifications', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const storedStore = localStorage.getItem('selectedStore');
        if (storedStore) {
            setStore(JSON.parse(storedStore));
            // Fetch stock notifications when store is available
            fetchStockNotifications();
            // Refresh notifications every 2 minutes
            const interval = setInterval(fetchStockNotifications, 2 * 60 * 1000);
            return () => clearInterval(interval);
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

    // Refresh notifications when pathname changes (e.g., after purchase/sale)
    useEffect(() => {
        if (store || isAdmin) {
            fetchStockNotifications();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

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
                        {/* Stock Notifications Section */}
                        <div className="mb-4">
                            <Link 
                                href="/dashboard/products"
                                className="block p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Bell className={cn(
                                            "h-4 w-4",
                                            (stockNotifications.lowStock.length > 0 || stockNotifications.highStock.length > 0) 
                                                ? "text-red-600 dark:text-red-400 animate-pulse" 
                                                : "text-slate-400 dark:text-slate-500"
                                        )} />
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                            Stock Alerts
                                        </span>
                                    </div>
                                    {(stockNotifications.lowStock.length > 0 || stockNotifications.highStock.length > 0) && (
                                        <Badge 
                                            variant="destructive" 
                                            className="text-[10px] h-5 w-5 p-0 flex items-center justify-center animate-pulse"
                                        >
                                            {stockNotifications.lowStock.length + stockNotifications.highStock.length}
                                        </Badge>
                                    )}
                                </div>
                                
                                {loadingNotifications ? (
                                    <div className="text-xs text-slate-400 dark:text-slate-500">Loading...</div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Low Stock Section */}
                                        <div>
                                            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-t border border-b-0 border-red-200 dark:border-red-800">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                                    <span className="text-xs font-semibold text-red-700 dark:text-red-300">Low Stock</span>
                                                </div>
                                                <Badge variant="destructive" className="text-[10px] h-5 min-w-5 flex items-center justify-center">
                                                    {stockNotifications.lowStock.length}
                                                </Badge>
                                            </div>
                                            {stockNotifications.lowStock.length > 0 ? (
                                                <div className="max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-b border border-red-200 dark:border-red-800">
                                                    {stockNotifications.lowStock.map((product: any) => (
                                                        <div 
                                                            key={product._id} 
                                                            className="px-2 py-1.5 border-b border-red-200 dark:border-red-800 last:border-b-0 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                        >
                                                            <div className="text-[10px] font-medium text-red-800 dark:text-red-200 truncate">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-[9px] text-red-600 dark:text-red-400 font-mono mt-0.5">
                                                                Code: {product.barcode}
                                                            </div>
                                                            <div className="text-[9px] text-red-700 dark:text-red-300 mt-0.5">
                                                                Stock: <span className="font-bold">{product.totalStock}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-b border border-slate-200 dark:border-slate-600 opacity-60">
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">No low stock items</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* High Stock Section */}
                                        <div>
                                            <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-t border border-b-0 border-orange-200 dark:border-orange-800">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                                                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">High Stock</span>
                                                </div>
                                                <Badge className="bg-orange-500 text-white border-orange-600 dark:bg-orange-600 dark:border-orange-700 text-[10px] h-5 min-w-5 flex items-center justify-center">
                                                    {stockNotifications.highStock.length}
                                                </Badge>
                                            </div>
                                            {stockNotifications.highStock.length > 0 ? (
                                                <div className="max-h-32 overflow-y-auto bg-orange-50 dark:bg-orange-900/20 rounded-b border border-orange-200 dark:border-orange-800">
                                                    {stockNotifications.highStock.map((product: any) => (
                                                        <div 
                                                            key={product._id} 
                                                            className="px-2 py-1.5 border-b border-orange-200 dark:border-orange-800 last:border-b-0 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                                        >
                                                            <div className="text-[10px] font-medium text-orange-800 dark:text-orange-200 truncate">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-[9px] text-orange-600 dark:text-orange-400 font-mono mt-0.5">
                                                                Code: {product.barcode}
                                                            </div>
                                                            <div className="text-[9px] text-orange-700 dark:text-orange-300 mt-0.5">
                                                                Stock: <span className="font-bold">{product.totalStock}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-b border border-slate-200 dark:border-slate-600 opacity-60">
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">No high stock items</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Link>
                        </div>
                        
                        {menuItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            // Add notification badge to Products menu item
                            const showNotification = item.href === '/dashboard/products' && 
                                (stockNotifications.lowStock.length > 0 || stockNotifications.highStock.length > 0);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </div>
                                    {showNotification && (
                                        <Badge 
                                            variant="destructive" 
                                            className={cn(
                                                "ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]",
                                                isActive && "bg-white text-red-600"
                                            )}
                                        >
                                            {stockNotifications.lowStock.length + stockNotifications.highStock.length}
                                        </Badge>
                                    )}
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
