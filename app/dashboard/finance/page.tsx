'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    CreditCard,
    Plus,
    Search,
    Trash2,
    Pencil,
    X,
    Building2,
    Hash,
    PhoneCall,
    UserCircle,
    History,
    ArrowUpCircle,
    ArrowDownCircle,
    ArrowLeftRight
} from 'lucide-react';
import api from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FinancePage() {
    const [banks, setBanks] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBankForm, setShowBankForm] = useState(false);
    const [editingBank, setEditingBank] = useState<any>(null);
    const [bankFormData, setBankFormData] = useState({
        name: '',
        customerName: '',
        code: '',
        accountNo: '',
        contactNo: ''
    });

    const [showTransForm, setShowTransForm] = useState(false);
    const [transFormData, setTransFormData] = useState({
        type: 'CashIn',
        amount: '',
        description: '',
        bank: '',
        date: new Date().toISOString().split('T')[0]
    });

    const router = useRouter();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [banksRes, transRes, customersRes] = await Promise.all([
                api.get('/banks'),
                api.get('/transactions'),
                api.get('/customers')
            ]);
            setBanks(banksRes.data);
            setTransactions(transRes.data);
            setCustomers(customersRes.data || []);
        } catch (error) {
            console.error('Failed to fetch finance data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBankSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBank) {
                await api.put(`/banks/${editingBank._id}`, bankFormData);
            } else {
                await api.post('/banks', bankFormData);
            }
            setShowBankForm(false);
            setEditingBank(null);
            setBankFormData({ name: '', customerName: '', code: '', accountNo: '', contactNo: '' });
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save bank');
        }
    };

    const handleTransSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const amt = Number(transFormData.amount);
            if (!Number.isFinite(amt) || amt < 50) {
                alert('Minimum transaction amount is 50');
                return;
            }
            await api.post('/transactions', {
                ...transFormData,
                amount: amt
            });
            setShowTransForm(false);
            setTransFormData({
                type: 'CashIn',
                amount: '',
                description: '',
                bank: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save transaction');
        }
    };

    const deleteBank = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bank?')) return;
        try {
            await api.delete(`/banks/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete bank');
        }
    };

    if (loading && banks.length === 0) return (
        <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
            <p className="text-slate-500 dark:text-slate-400">Loading Finance Module...</p>
        </div>
    );

    return (
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                        <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        Financial Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage bank accounts and monitor cash flow.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowBankForm(true)} variant="outline" className="gap-2 border-slate-200 dark:border-slate-700">
                        <Plus className="h-4 w-4" /> Add Bank
                    </Button>
                    <Button onClick={() => setShowTransForm(true)} className="gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> New Transaction
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="h-9 border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Banks Overview</TabsTrigger>
                    <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Transaction History</TabsTrigger>
                    <TabsTrigger value="credit-debit" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Credit & Debit</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0 space-y-6">
                    {(showBankForm || editingBank) && (
                        <Card className="animate-in fade-in zoom-in border-slate-200 duration-200 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-slate-900 dark:text-white">{editingBank ? 'Edit Bank Account' : 'Register New Bank Account'}</CardTitle>
                                    <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">Fill in bank and account holder details.</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { setShowBankForm(false); setEditingBank(null); }}><X className="h-4 w-4" /></Button>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleBankSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><Building2 className="h-3.5 w-3.5" /> Bank Name</Label>
                                        <Input required placeholder="e.g. HBL, Meezan" value={bankFormData.name} onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><UserCircle className="h-3.5 w-3.5" /> Customer Name</Label>
                                        <Input placeholder="Account holder" value={bankFormData.customerName} onChange={(e) => setBankFormData({ ...bankFormData, customerName: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><Hash className="h-3.5 w-3.5" /> Bank Code / Branch</Label>
                                        <Input placeholder="e.g. 0123" value={bankFormData.code} onChange={(e) => setBankFormData({ ...bankFormData, code: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><CreditCard className="h-3.5 w-3.5" /> Account Number</Label>
                                        <Input required placeholder="PK00 0000 0000 0000 0000" value={bankFormData.accountNo} onChange={(e) => setBankFormData({ ...bankFormData, accountNo: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><PhoneCall className="h-3.5 w-3.5" /> Contact Number</Label>
                                        <Input placeholder="Bank contact" value={bankFormData.contactNo} onChange={(e) => setBankFormData({ ...bankFormData, contactNo: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                    </div>
                                    <div className="flex justify-end gap-2 md:col-span-2">
                                        <Button type="button" variant="outline" className="border-slate-200 dark:border-slate-700" onClick={() => { setShowBankForm(false); setEditingBank(null); }}>Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">{editingBank ? 'Update Bank' : 'Save Bank'}</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Registered Bank Accounts</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bank info and actions</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="rounded-l-lg px-4 py-3">Bank Information</th>
                                            <th className="px-4 py-3">Account Number</th>
                                            <th className="px-4 py-3">Contact</th>
                                            <th className="rounded-r-lg px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {banks.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center italic text-slate-400">No bank accounts registered yet.</td></tr>
                                        ) : (
                                            banks.map((bank) => (
                                                <tr key={bank._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold uppercase text-slate-900 dark:text-white">{bank.name}</div>
                                                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 capitalize">{bank.customerName || 'No Name Set'}</div>
                                                        <div className="text-xs text-slate-500">Code: {bank.code || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{bank.accountNo}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{bank.contactNo || '--'}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400" onClick={() => { setEditingBank(bank); setBankFormData({ name: bank.name, customerName: bank.customerName || '', code: bank.code || '', accountNo: bank.accountNo, contactNo: bank.contactNo || '' }); }}><Pencil className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400" onClick={() => deleteBank(bank._id)}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
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

                <TabsContent value="transactions" className="mt-0 space-y-6">
                    {showTransForm && (
                        <Card className="animate-in fade-in zoom-in border-slate-200 duration-200 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-slate-900 dark:text-white">Record New Transaction</CardTitle>
                                    <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">Type, amount and optional bank. Minimum Rs. 50.</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowTransForm(false)}><X className="h-4 w-4" /></Button>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleTransSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Transaction Type</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-700 dark:bg-slate-800/50" value={transFormData.type} onChange={(e) => setTransFormData({ ...transFormData, type: e.target.value })}>
                                            <option value="CashIn">Cash In (Income)</option>
                                            <option value="CashOut">Cash Out (Expense)</option>
                                            <option value="BankTransfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount (Rs.)</Label>
                                        <Input type="number" required min={50} placeholder="0.00" value={transFormData.amount} onChange={(e) => setTransFormData({ ...transFormData, amount: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                        <p className="text-xs text-slate-500">Minimum: Rs. 50</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Related Bank (Optional)</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-700 dark:bg-slate-800/50" value={transFormData.bank} onChange={(e) => setTransFormData({ ...transFormData, bank: e.target.value })}>
                                            <option value="">None / Cash</option>
                                            {banks.map(bank => <option key={bank._id} value={bank._id}>{bank.name} - {bank.accountNo}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</Label>
                                        <Input type="date" required value={transFormData.date} onChange={(e) => setTransFormData({ ...transFormData, date: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description / Note</Label>
                                        <Input placeholder="What is this transaction for?" value={transFormData.description} onChange={(e) => setTransFormData({ ...transFormData, description: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                    </div>
                                    <div className="flex justify-end gap-2 md:col-span-2">
                                        <Button type="button" variant="outline" className="border-slate-200 dark:border-slate-700" onClick={() => setShowTransForm(false)}>Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">Record Entry</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Transaction History</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date, type and amount</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="rounded-l-lg px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3">Account</th>
                                            <th className="rounded-r-lg px-4 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {transactions.length === 0 ? (
                                            <tr><td colSpan={5} className="px-4 py-8 text-center italic text-slate-400">No transactions recorded yet.</td></tr>
                                        ) : (
                                            transactions.map((tr) => (
                                                <tr key={tr._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(tr.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${tr.type === 'CashIn' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : tr.type === 'CashOut' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                                                            {tr.type === 'CashIn' && <ArrowUpCircle className="h-3 w-3" />}
                                                            {tr.type === 'CashOut' && <ArrowDownCircle className="h-3 w-3" />}
                                                            {tr.type === 'BankTransfer' && <ArrowLeftRight className="h-3 w-3" />}
                                                            {tr.type.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{tr.description || '--'}</td>
                                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{tr.bank ? tr.bank.name : 'Cash'}</td>
                                                    <td className={`px-4 py-3 text-right font-bold ${tr.type === 'CashIn' ? 'text-emerald-600 dark:text-emerald-400' : tr.type === 'CashOut' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                        {tr.type === 'CashOut' ? '-' : '+'} Rs. {tr.amount.toLocaleString()}
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

                <TabsContent value="credit-debit" className="mt-0 space-y-6">
                    {loading ? (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400">Loading...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                                    <CardHeader className="pb-1">
                                        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            <ArrowUpCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            Total Credit (Cash In)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                            Rs. {transactions.filter((t: any) => t.type === 'CashIn').reduce((sum: number, t: any) => sum + (t.amount || 0), 0).toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                                    <CardHeader className="pb-1">
                                        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            <ArrowDownCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                            Total Debit (Cash Out)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                            Rs. {transactions.filter((t: any) => t.type === 'CashOut').reduce((sum: number, t: any) => sum + (t.amount || 0), 0).toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                                    <CardHeader className="pb-1">
                                        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            Bank Transfer
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            Rs. {transactions.filter((t: any) => t.type === 'BankTransfer').reduce((sum: number, t: any) => sum + (t.amount || 0), 0).toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                                <CardHeader>
                                    <CardTitle className="text-slate-900 dark:text-white">Customer Credit/Debit (Non-zero)</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Balances by customer</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                                <tr>
                                                    <th className="rounded-l-lg px-4 py-3">Customer</th>
                                                    <th className="px-4 py-3">Phone</th>
                                                    <th className="rounded-r-lg px-4 py-3 text-right">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {customers.filter((c: any) => (c.balance || 0) !== 0).length === 0 ? (
                                                    <tr><td colSpan={3} className="px-4 py-8 text-center italic text-slate-400">No customer credit/debit found (all balances are 0).</td></tr>
                                                ) : (
                                                    customers.filter((c: any) => (c.balance || 0) !== 0).map((customer: any) => (
                                                        <tr key={customer._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{customer.name}</td>
                                                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{customer.phone}</td>
                                                            <td className={`px-4 py-3 text-right font-bold ${(customer.balance || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                                Rs. {Math.abs(customer.balance || 0).toLocaleString()} {(customer.balance || 0) > 0 ? '(Customer Pays)' : '(We Pay)'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
