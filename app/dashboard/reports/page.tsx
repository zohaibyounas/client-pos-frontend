'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    BarChart3,
    TrendingUp,
    Package,
    Printer,
    ShoppingCart,
    History,
    PieChart,
    Search
} from 'lucide-react';
import api from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('sales');
    const [salesReport, setSalesReport] = useState<any[]>([]);
    const [topSelling, setTopSelling] = useState<any[]>([]);
    const [stockReport, setStockReport] = useState<any[]>([]);
    const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
    const [pnlData, setPnlData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchReportData();
    }, [activeTab]);

    const fetchReportData = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const query = params.toString() ? `?${params.toString()}` : '';

        try {
            if (activeTab === 'sales') {
                const res = await api.get(`/analytics/sales-report${query}`);
                setSalesReport(res.data);
            } else if (activeTab === 'top') {
                const res = await api.get('/analytics/top-selling');
                setTopSelling(res.data);
            } else if (activeTab === 'stock') {
                const res = await api.get('/analytics/stock-report');
                setStockReport(res.data);
            } else if (activeTab === 'purchases') {
                const res = await api.get(`/analytics/inventory-invoices${query}`);
                setPurchaseHistory(res.data);
            } else if (activeTab === 'pnl') {
                const res = await api.get(`/analytics/pnl-report${query}`);
                setPnlData(res.data);
            }
        } catch (error) {
            console.error(`Failed to fetch ${activeTab} report`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReportData();
    };

    return (
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
            {/* Header — same spacing as Dashboard */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                        <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        Business Intelligence Reports
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Comprehensive insights into your store&apos;s performance.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 print:hidden">
                    <Button
                        onClick={() => window.print()}
                        variant="outline"
                        className="gap-2 border-slate-200 dark:border-slate-700"
                    >
                        <Printer className="h-4 w-4" /> Print Report
                    </Button>
                </div>
            </div>

            {/* Filters — same card and spacing as Dashboard (no line) */}
            <Card className="w-full border-slate-200 dark:border-slate-800 dark:bg-slate-900 print:hidden md:w-auto">
                <CardContent className="pt-4">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                        <div className="space-y-2">
                            <Label
                                htmlFor="reports-startDate"
                                className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                            >
                                Start Date
                            </Label>
                            <Input
                                id="reports-startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 w-40 dark:bg-slate-800/50 dark:border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="reports-endDate"
                                className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                            >
                                End Date
                            </Label>
                            <Input
                                id="reports-endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 w-40 dark:bg-slate-800/50 dark:border-slate-700"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={loading}
                            className="h-9 gap-2 bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            <Search className="h-4 w-4" /> {loading ? '...' : 'Apply Filters'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                        >
                            Reset
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Tabs defaultValue="sales" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="h-9 border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 print:hidden">
                    <TabsTrigger value="sales" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"><ShoppingCart className="h-4 w-4" /> Sales</TabsTrigger>
                    <TabsTrigger value="top" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"><TrendingUp className="h-4 w-4" /> Top Selling</TabsTrigger>
                    <TabsTrigger value="stock" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"><Package className="h-4 w-4" /> Stock Status</TabsTrigger>
                    <TabsTrigger value="purchases" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"><History className="h-4 w-4" /> Purchases</TabsTrigger>
                    <TabsTrigger value="pnl" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"><PieChart className="h-4 w-4" /> Profit & Loss</TabsTrigger>
                </TabsList>

                {/* Sales Tab */}
                <TabsContent value="sales" className="mt-0">
                    <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Historical Sales Data</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date, invoice and revenue</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="rounded-l-lg px-4 py-3">Date & Time</th>
                                            <th className="px-4 py-3">Invoice ID</th>
                                            <th className="px-4 py-3">Salesman</th>
                                            <th className="rounded-r-lg px-4 py-3 text-right">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {salesReport.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No sales found in this period.</td></tr>
                                        ) : (
                                            salesReport.map(sale => (
                                                <tr key={sale._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{new Date(sale.createdAt).toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 uppercase">{sale.invoiceId}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{sale.salesman?.name || 'System'}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">Rs. {sale.totalAmount.toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Top Selling Tab */}
                <TabsContent value="top" className="mt-0">
                    <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Top Performing Products (All Time)</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Unit volume and revenue</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="rounded-l-lg px-4 py-3">Product Details</th>
                                            <th className="px-4 py-3 text-center">Unit Volume</th>
                                            <th className="rounded-r-lg px-4 py-3 text-right">Total Revenue Generated</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {topSelling.length === 0 ? (
                                            <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No performance data available.</td></tr>
                                        ) : (
                                            topSelling.map(item => (
                                                <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold uppercase text-slate-900 dark:text-white">{item.productInfo?.name}</div>
                                                        <div className="text-xs font-mono italic text-slate-500">{item.productInfo?.barcode}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">{item.totalQty} Units</td>
                                                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">Rs. {item.totalRevenue.toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Stock Status Tab */}
                <TabsContent value="stock" className="mt-0">
                    <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Inventory Valuation & Stock Levels</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Stock and asset value</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="rounded-l-lg px-4 py-3">Product Name</th>
                                            <th className="px-4 py-3 text-right">Available Stock</th>
                                            <th className="px-4 py-3 text-right">Unit Cost</th>
                                            <th className="rounded-r-lg px-4 py-3 text-right">Asset Value (Ex. Profit)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {stockReport.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No inventory products found.</td></tr>
                                        ) : (
                                            stockReport.map(product => (
                                                <tr key={product._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold uppercase text-slate-900 dark:text-white">{product.name}</div>
                                                        <div className="text-xs uppercase tracking-wider text-slate-400">{product.category || 'General'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                                                        <span className={product.totalStock <= 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>
                                                            {product.totalStock}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right italic text-slate-500">Rs. {product.costPrice.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">Rs. {(product.totalStock * product.costPrice).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Purchase History Tab */}
                <TabsContent value="purchases" className="mt-0">
                    <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Inventory Acquisition Log</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vendor and payment status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="rounded-l-lg px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Vendor Details</th>
                                            <th className="px-4 py-3 text-right">Bill Amount</th>
                                            <th className="rounded-r-lg px-4 py-3 text-right">Payment Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {purchaseHistory.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No purchase records found.</td></tr>
                                        ) : (
                                            purchaseHistory.map(purchase => (
                                                <tr key={purchase._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3 text-slate-500">{new Date(purchase.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-bold uppercase text-slate-900 dark:text-white">{purchase.vendorName}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">Rs. {purchase.totalAmount.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        <span className={purchase.balance > 0 ? 'text-red-500' : 'text-emerald-500 dark:text-emerald-400'}>
                                                            {purchase.balance > 0 ? `Unpaid: Rs. ${purchase.balance.toLocaleString()}` : 'Fully Paid'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Profit & Loss Tab */}
                <TabsContent value="pnl" className="mt-0">
                    {pnlData && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gross Sales Revenue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Rs. {pnlData.revenue.toLocaleString()}</div>
                                    <p className="mt-1 text-xs text-slate-400">Total income from all invoices</p>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cost of Goods Sold (COGS)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-rose-500 dark:text-rose-400">Rs. {pnlData.costOfGoodsSold.toLocaleString()}</div>
                                    <p className="mt-1 text-xs text-slate-400">Acquisition cost of products sold</p>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200 bg-emerald-50/50 dark:border-slate-800 dark:bg-emerald-950/20">
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Gross Trading Profit</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold italic text-emerald-600 dark:text-emerald-400">Rs. {pnlData.grossProfit.toLocaleString()}</div>
                                    <p className="mt-1 text-xs text-emerald-700/60 dark:text-emerald-400/80">Revenue minus COGS</p>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Operational Expenses</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-slate-700 dark:text-slate-300">Rs. {pnlData.expenses.toLocaleString()}</div>
                                    <p className="mt-1 text-xs text-slate-400">General business costs & overheads</p>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-200 bg-blue-600 dark:border-blue-700 dark:bg-blue-600">
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-100">Bottom-Line Net Profit</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold italic text-white">Rs. {pnlData.netProfit.toLocaleString()}</div>
                                    <p className="mt-1 text-xs text-blue-200">Final profit after all deductions</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
