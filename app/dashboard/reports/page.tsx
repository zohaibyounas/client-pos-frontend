'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Package, Printer, FileText } from 'lucide-react';
import api from '@/lib/api';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('sales');
    const [salesReport, setSalesReport] = useState<any[]>([]);
    const [topSelling, setTopSelling] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'sales') fetchSalesReport();
        if (activeTab === 'top') fetchTopSelling();
    }, [activeTab]);

    const fetchSalesReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('/analytics/sales-report');
            setSalesReport(res.data);
        } catch (error) {
            console.error('Failed to fetch sales report', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopSelling = async () => {
        setLoading(true);
        try {
            const res = await api.get('/analytics/top-selling');
            setTopSelling(res.data);
        } catch (error) {
            console.error('Failed to fetch top selling', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center">
                    <BarChart3 className="mr-3 h-8 w-8 text-blue-600" /> Business Reports
                </h1>
                <Button onClick={() => window.print()} variant="outline">
                    <Printer className="mr-2 h-4 w-4" /> Export/Print
                </Button>
            </div>

            <div className="flex gap-4 border-b">
                <button
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'sales' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('sales')}
                >
                    Sales Report
                </button>
                <button
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'top' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('top')}
                >
                    Top Selling Products
                </button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {activeTab === 'sales' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-sm font-semibold">Date</th>
                                        <th className="px-6 py-3 text-sm font-semibold">Invoice ID</th>
                                        <th className="px-6 py-3 text-sm font-semibold">Salesman</th>
                                        <th className="px-6 py-3 text-sm font-semibold text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {salesReport.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">No sales data found.</td></tr>
                                    ) : (
                                        salesReport.map(sale => (
                                            <tr key={sale._id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm">
                                                    {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-blue-600">{sale.invoiceId}</td>
                                                <td className="px-6 py-4 text-sm font-medium">{sale.salesman?.name || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-sm text-right font-bold text-slate-900 dark:text-white">Rs. {(sale.totalAmount ?? 0).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'top' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-sm font-semibold">Product Name</th>
                                        <th className="px-6 py-3 text-sm font-semibold text-center">Qty Sold</th>
                                        <th className="px-6 py-3 text-sm font-semibold text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {topSelling.length === 0 ? (
                                        <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">No data found.</td></tr>
                                    ) : (
                                        topSelling.map(item => (
                                            <tr key={item._id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm font-medium">{item.productInfo?.name}</td>
                                                <td className="px-6 py-4 text-sm text-center">{item.totalQty}</td>
                                                <td className="px-6 py-4 text-sm text-right font-bold text-green-600 dark:text-green-400">Rs. {item.totalRevenue.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
