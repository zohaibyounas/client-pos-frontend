'use client';

import { useEffect, useState } from 'react';
import {
    Bell,
    AlertTriangle,
    TrendingUp,
    Package,
    ChevronRight,
    Search,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Syncing system alerts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Bell className="h-8 w-8 text-blue-600" />
                        SYSTEM NOTIFICATIONS
                    </h1>
                    <p className="text-slate-500 font-medium">Real-time inventory intelligence and stock status alerts</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search alerts..."
                            className="pl-10 h-11 border-2 focus:border-blue-500 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl border-2 px-4 font-bold flex gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Critical Low Stock Section */}
                <Card className="border-2 border-rose-100 dark:border-rose-900/30 shadow-xl shadow-rose-500/5 overflow-hidden">
                    <CardHeader className="bg-rose-50 dark:bg-rose-950/30 border-b-2 border-rose-100 dark:border-rose-950/50 pb-6">
                        <div className="flex items-center justify-between">
                            <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-600/20">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <Badge className="bg-rose-600 text-white font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                                {lowStockProducts.length} Items Affected
                            </Badge>
                        </div>
                        <div className="pt-4">
                            <CardTitle className="text-2xl font-black text-rose-900 dark:text-rose-100 uppercase italic tracking-tight">Critical Low Stock</CardTitle>
                            <CardDescription className="text-rose-600/80 dark:text-rose-400 font-bold">Action required: These items are nearing exhaustion</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {lowStockProducts.length > 0 ? (
                            <div className="divide-y divide-rose-50 dark:divide-rose-900/20">
                                {lowStockProducts.map((product) => (
                                    <Link
                                        key={product._id}
                                        href={`/dashboard/products?search=${product.barcode}`}
                                        className="flex items-center justify-between p-4 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 border-2 border-rose-100/50">
                                                <Package className="h-6 w-6 text-rose-600 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div>
                                                <p className="font-black text-rose-900 dark:text-rose-100 leading-tight group-hover:text-rose-600 transition-colors">{product.name}</p>
                                                <p className="text-[10px] font-mono text-slate-500 uppercase">Ref: {product.barcode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-rose-600">{product.totalStock}</p>
                                            <p className="text-[10px] font-black uppercase text-rose-400 tracking-tighter">Units Left</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400">
                                <p className="font-bold italic">No critical stock levels detected.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Healthy Product Updates Section */}
                <Card className="border-2 border-emerald-100 dark:border-emerald-900/30 shadow-xl shadow-emerald-500/5 overflow-hidden">
                    <CardHeader className="bg-emerald-50 dark:bg-emerald-950/30 border-b-2 border-emerald-100 dark:border-emerald-950/50 pb-6">
                        <div className="flex items-center justify-between">
                            <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/20">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                            <Badge className="bg-emerald-600 text-white font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                                {healthyStockProducts.length} Items Good
                            </Badge>
                        </div>
                        <div className="pt-4">
                            <CardTitle className="text-2xl font-black text-emerald-900 dark:text-emerald-100 uppercase italic tracking-tight">Operational Update</CardTitle>
                            <CardDescription className="text-emerald-600/80 dark:text-emerald-400 font-bold">Stable supply: High availability products</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {healthyStockProducts.length > 0 ? (
                            <div className="divide-y divide-emerald-50 dark:divide-emerald-900/20">
                                {healthyStockProducts.map((product) => (
                                    <Link
                                        key={product._id}
                                        href={`/dashboard/products?search=${product.barcode}`}
                                        className="flex items-center justify-between p-4 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 border-2 border-emerald-100/50">
                                                <Package className="h-6 w-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div>
                                                <p className="font-black text-emerald-900 dark:text-emerald-100 leading-tight group-hover:text-emerald-600 transition-colors">{product.name}</p>
                                                <p className="text-[10px] font-mono text-slate-500 uppercase">Ref: {product.barcode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-emerald-600">{product.totalStock}</p>
                                            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-tighter">In Stock</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400">
                                <p className="font-bold italic">No high-stock products logged.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
