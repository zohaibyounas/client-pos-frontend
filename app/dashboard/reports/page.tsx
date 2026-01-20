'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BarChart3,
    TrendingUp,
    Package,
    Printer,
    FileText,
    ShoppingCart,
    History,
    PieChart,
    ChevronRight,
    Search
} from 'lucide-react';
import api from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

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
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                        Business Intelligence Reports
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Comprehensive insights into your store's performance.</p>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                    <Button onClick={() => window.print()} variant="outline" className="gap-2">
                        <Printer className="h-4 w-4" /> Print Report
                    </Button>
                </div>
            </div>

            {/* Global Filters */}
            <Card className="border-none shadow-sm dark:bg-slate-900 print:hidden">
                <CardContent className="pt-6">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Start Date</label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[180px]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">End Date</label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[180px]" />
                        </div>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2">
                            <Search className="h-4 w-4" /> Apply Filters
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => { setStartDate(''); setEndDate(''); }}>Reset</Button>
                    </form>
                </CardContent>
            </Card>

            <Tabs defaultValue="sales" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-1 print:hidden">
                    <TabsTrigger value="sales" className="gap-2"><ShoppingCart className="h-4 w-4" /> Sales</TabsTrigger>
                    <TabsTrigger value="top" className="gap-2"><TrendingUp className="h-4 w-4" /> Top Selling</TabsTrigger>
                    <TabsTrigger value="stock" className="gap-2"><Package className="h-4 w-4" /> Stock Status</TabsTrigger>
                    <TabsTrigger value="purchases" className="gap-2"><History className="h-4 w-4" /> Purchases</TabsTrigger>
                    <TabsTrigger value="pnl" className="gap-2"><PieChart className="h-4 w-4" /> Profit & Loss</TabsTrigger>
                </TabsList>

                {/* Sales Tab */}
                <TabsContent value="sales">
                    <Card className="border-none shadow-sm dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Historical Sales Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-6 py-4 rounded-l-lg">Date & Time</th>
                                            <th className="px-6 py-4">Invoice ID</th>
                                            <th className="px-6 py-4">Salesman</th>
                                            <th className="px-6 py-4 rounded-r-lg text-right">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {salesReport.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No sales found in this period.</td></tr>
                                        ) : (
                                            salesReport.map(sale => (
                                                <tr key={sale._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{new Date(sale.createdAt).toLocaleString()}</td>
                                                    <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 uppercase">{sale.invoiceId}</td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{sale.salesman?.name || 'System'}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">Rs. {sale.totalAmount.toLocaleString()}</td>
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
                <TabsContent value="top">
                    <Card className="border-none shadow-sm dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Top Performing Products (All Time)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-6 py-4 rounded-l-lg">Product Details</th>
                                            <th className="px-6 py-4 text-center">Unit Volume</th>
                                            <th className="px-6 py-4 rounded-r-lg text-right">Total Revenue Generated</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {topSelling.length === 0 ? (
                                            <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No performance data available.</td></tr>
                                        ) : (
                                            topSelling.map(item => (
                                                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900 dark:text-white uppercase">{item.productInfo?.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono italic">{item.productInfo?.barcode}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-blue-600">{item.totalQty} Units</td>
                                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">Rs. {item.totalRevenue.toLocaleString()}</td>
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
                <TabsContent value="stock">
                    <Card className="border-none shadow-sm dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Inventory Valuation & Stock Levels</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-6 py-4 rounded-l-lg">Product Name</th>
                                            <th className="px-6 py-4 text-right">Available Stock</th>
                                            <th className="px-6 py-4 text-right">Unit Cost</th>
                                            <th className="px-6 py-4 rounded-r-lg text-right">Asset Value (Ex. Profit)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {stockReport.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No inventory products found.</td></tr>
                                        ) : (
                                            stockReport.map(product => (
                                                <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900 dark:text-white uppercase">{product.name}</div>
                                                        <div className="text-xs text-slate-400 uppercase tracking-wider">{product.category || 'General'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold tabular-nums">
                                                        <span className={product.totalStock <= 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>
                                                            {product.totalStock}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500 italic">Rs. {product.costPrice.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-blue-600">Rs. {(product.totalStock * product.costPrice).toLocaleString()}</td>
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
                <TabsContent value="purchases">
                    <Card className="border-none shadow-sm dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Inventory Acquisition Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-6 py-4 rounded-l-lg">Date</th>
                                            <th className="px-6 py-4">Vendor Details</th>
                                            <th className="px-6 py-4 text-right">Bill Amount</th>
                                            <th className="px-6 py-4 rounded-r-lg text-right">Payment Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {purchaseHistory.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No purchase records found.</td></tr>
                                        ) : (
                                            purchaseHistory.map(purchase => (
                                                <tr key={purchase._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500">{new Date(purchase.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 uppercase">{purchase.vendorName}</td>
                                                    <td className="px-6 py-4 text-right font-bold">Rs. {purchase.totalAmount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-medium">
                                                        <span className={purchase.balance > 0 ? 'text-red-500' : 'text-emerald-500'}>
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
                <TabsContent value="pnl">
                    {pnlData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="border-none shadow-sm dark:bg-slate-900">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold uppercase text-slate-500">Gross Sales Revenue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-blue-600">Rs. {pnlData.revenue.toLocaleString()}</div>
                                    <p className="text-xs text-slate-400 mt-1">Total income from all invoices</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm dark:bg-slate-900">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold uppercase text-slate-500">Cost of Goods Sold (COGS)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-rose-500">Rs. {pnlData.costOfGoodsSold.toLocaleString()}</div>
                                    <p className="text-xs text-slate-400 mt-1">Acquisition cost of products sold</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm dark:bg-slate-900 bg-emerald-50/50 dark:bg-emerald-950/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Gross Trading Profit</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-emerald-600 italic">Rs. {pnlData.grossProfit.toLocaleString()}</div>
                                    <p className="text-xs text-emerald-700/60 mt-1">Revenue minus COGS</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm dark:bg-slate-900 lg:col-span-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold uppercase text-slate-500">Operational Expenses</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">Rs. {pnlData.expenses.toLocaleString()}</div>
                                    <p className="text-xs text-slate-400 mt-1">General business costs & overheads</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-blue-600 text-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold uppercase text-blue-100">Bottom-Line Net Profit</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black italic">Rs. {pnlData.netProfit.toLocaleString()}</div>
                                    <p className="text-xs text-blue-200 mt-1">Final profit after all deductions</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
