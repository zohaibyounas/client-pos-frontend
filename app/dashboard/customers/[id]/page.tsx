'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Phone, MapPin, CreditCard, Calendar, DollarSign } from 'lucide-react';
import api from '@/lib/api';

export default function CustomerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState({
        amount: '',
        type: 'payment',
        description: ''
    });

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/customers/${params.id}`);
            setCustomer(res.data);
        } catch (error) {
            console.error('Failed to fetch customer', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/customers/${params.id}/balance`, {
                amount: Number(adjustmentData.amount),
                type: adjustmentData.type,
                description: adjustmentData.description
            });
            setShowAdjustment(false);
            setAdjustmentData({ amount: '', type: 'payment', description: '' });
            fetchCustomer();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to adjust balance');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            fetchCustomer();
        }
    }, [params.id]);

    if (loading) return <div className="p-8">Loading customer details...</div>;
    if (!customer) return <div className="p-8">Customer not found</div>;

    return (
        <div className="p-8 space-y-6 bg-slate-50/50 dark:bg-transparent min-h-screen">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {customer.name}
                        {customer.isKataCustomer && (
                            <span className="ml-3 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded">
                                Kata Customer
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Customer Account Details</p>
                </div>
            </div>

            {/* Customer Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm text-slate-500">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                            Rs. {Math.abs(customer.balance).toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                            {customer.balance > 0 && 'Customer Owes (Debit)'}
                            {customer.balance < 0 && 'We Owe Customer (Credit)'}
                            {customer.balance === 0 && 'Settled'}
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm text-slate-500">Credit Limit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            Rs. {customer.creditLimit.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                            Maximum allowed credit
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm text-slate-500">Total Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {customer.transactions?.length || 0}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                            All time
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Info */}
            <Card className="dark:bg-slate-900 border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">{customer.phone}</span>
                    </div>
                    {customer.address && (
                        <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-slate-500" />
                            <span>{customer.address}</span>
                        </div>
                    )}
                    {customer.kataAccountId && (
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            <span>Kata ID: {customer.kataAccountId}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Balance Adjustment */}
            <Card className="dark:bg-slate-900 border-none shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Balance Adjustment</CardTitle>
                        <Button onClick={() => setShowAdjustment(!showAdjustment)} size="sm">
                            {showAdjustment ? 'Cancel' : 'Adjust Balance'}
                        </Button>
                    </div>
                </CardHeader>
                {showAdjustment && (
                    <CardContent>
                        <form onSubmit={handleAdjustment} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <select
                                        id="type"
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                                        value={adjustmentData.type}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                                    >
                                        <option value="payment">Payment (Reduce Balance)</option>
                                        <option value="sale">Sale (Increase Balance)</option>
                                        <option value="adjustment">Manual Adjustment</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount (Rs.)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        required
                                        value={adjustmentData.amount}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={adjustmentData.description}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Submit Adjustment</Button>
                        </form>
                    </CardContent>
                )}
            </Card>

            {/* Transaction History */}
            <Card className="dark:bg-slate-900 border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {customer.transactions && customer.transactions.length > 0 ? (
                            customer.transactions.slice().reverse().map((txn: any, idx: number) => (
                                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${txn.type === 'sale' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                                    txn.type === 'payment' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                }`}>
                                                {txn.type.toUpperCase()}
                                            </span>
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(txn.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {txn.description && (
                                            <div className="text-sm text-slate-600 dark:text-slate-400">{txn.description}</div>
                                        )}
                                    </div>
                                    <div className={`text-lg font-bold ${txn.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                                        {txn.type === 'payment' ? '-' : '+'} Rs. {Math.abs(txn.amount).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400">No transactions yet</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
