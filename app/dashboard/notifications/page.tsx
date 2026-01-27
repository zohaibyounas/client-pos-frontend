'use client';

import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, TrendingUp, Package, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import Link from 'next/link';
export default function NotificationsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await api.get('/products');
                setProducts(res.data || []);
            } catch (error) {
                console.error('Failed to fetch products', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Low stock: less than 10 items (but greater than 0)
    const lowStockProducts = products.filter(
        (p: any) => (p.totalStock || 0) > 0 && (p.totalStock || 0) < 10
    ).filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // High stock: more than 100 items
    const healthyStockProducts = products.filter(
        (p: any) => (p.totalStock || 0) > 100
    ).filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Bell className="h-8 w-8 animate-pulse text-blue-500 dark:text-blue-400" />
                    <p className="text-slate-500 dark:text-slate-400">Syncing system alerts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                        <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        System Notifications
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Real-time inventory and stock status alerts.</p>
                </div>

                <Card className="w-full border-slate-200 dark:border-slate-800 dark:bg-slate-900 md:w-80">
                    <CardContent className="pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search alerts..."
                                className="pl-10 dark:bg-slate-800/50 dark:border-slate-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-rose-100 p-3 dark:bg-rose-900/30">
                                <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                                <CardTitle className="text-slate-900 dark:text-white">Critical Low Stock</CardTitle>
                                <CardDescription className="text-rose-600 dark:text-rose-400">Action required: items nearing exhaustion</CardDescription>
                            </div>
                        </div>
                        <Badge className="bg-rose-600 text-white">{lowStockProducts.length} items</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {lowStockProducts.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {lowStockProducts.map((product) => (
                                    <Link
                                        key={product._id}
                                        href={`/dashboard/products?search=${product.barcode}`}
                                        className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                <Package className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                                                <p className="text-xs font-mono text-slate-500">Ref: {product.barcode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-rose-600 dark:text-rose-400">{product.totalStock}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Units left</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-400">No critical stock levels detected.</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-900/30">
                                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-slate-900 dark:text-white">Operational Update</CardTitle>
                                <CardDescription className="text-emerald-600 dark:text-emerald-400">Stable supply: high availability products</CardDescription>
                            </div>
                        </div>
                        <Badge className="bg-emerald-600 text-white">{healthyStockProducts.length} items</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {healthyStockProducts.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {healthyStockProducts.map((product) => (
                                    <Link
                                        key={product._id}
                                        href={`/dashboard/products?search=${product.barcode}`}
                                        className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                                                <p className="text-xs font-mono text-slate-500">Ref: {product.barcode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400">{product.totalStock}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In stock</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-400">No high-stock products logged.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
