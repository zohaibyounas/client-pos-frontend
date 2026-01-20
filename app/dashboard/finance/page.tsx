'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    if (loading && banks.length === 0) return <div className="p-8 text-center text-slate-500">Loading Finance Module...</div>;

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-blue-600" />
                        Financial Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage bank accounts and monitor cash flow.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowBankForm(true)} variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" /> Add Bank
                    </Button>
                    <Button onClick={() => setShowTransForm(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> New Transaction
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-1">
                    <TabsTrigger value="overview">Banks Overview</TabsTrigger>
                    <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                    <TabsTrigger value="credit-debit">Credit & Debit</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Bank Form Overlay */}
                    {(showBankForm || editingBank) && (
                        <Card className="border-blue-200 dark:border-blue-900 shadow-lg animate-in fade-in zoom-in duration-200">
                            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-4">
                                <CardTitle>{editingBank ? 'Edit Bank Account' : 'Register New Bank Account'}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => { setShowBankForm(false); setEditingBank(null); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleBankSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Bank Name</Label>
                                        <Input
                                            required
                                            placeholder="e.g. HBL, Meezan, Bank Alfalah"
                                            value={bankFormData.name}
                                            onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><UserCircle className="h-3.5 w-3.5" /> Customer Name</Label>
                                        <Input
                                            placeholder="Account holder name"
                                            value={bankFormData.customerName}
                                            onChange={(e) => setBankFormData({ ...bankFormData, customerName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Bank Code / Branch</Label>
                                        <Input
                                            placeholder="e.g. 0123"
                                            value={bankFormData.code}
                                            onChange={(e) => setBankFormData({ ...bankFormData, code: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Account Number</Label>
                                        <Input
                                            required
                                            placeholder="PK00 0000 0000 0000 0000"
                                            value={bankFormData.accountNo}
                                            onChange={(e) => setBankFormData({ ...bankFormData, accountNo: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><PhoneCall className="h-3.5 w-3.5" /> Contact Number</Label>
                                        <Input
                                            placeholder="Bank contact or manager number"
                                            value={bankFormData.contactNo}
                                            onChange={(e) => setBankFormData({ ...bankFormData, contactNo: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="ghost" onClick={() => { setShowBankForm(false); setEditingBank(null); }}>Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">
                                            {editingBank ? 'Update Bank' : 'Save Bank'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Banks Table */}
                    <Card className="border-none shadow-sm dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Registered Bank Accounts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-6 py-4 rounded-l-lg">Bank Information</th>
                                            <th className="px-6 py-4">Account Number</th>
                                            <th className="px-6 py-4">Contact</th>
                                            <th className="px-6 py-4 rounded-r-lg text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {banks.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No bank accounts registered yet.</td>
                                            </tr>
                                        ) : (
                                            banks.map((bank) => (
                                                <tr key={bank._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900 dark:text-white uppercase">{bank.name}</div>
                                                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 capitalize">{bank.customerName || 'No Name Set'}</div>
                                                        <div className="text-xs text-slate-500">Code: {bank.code || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{bank.accountNo}</td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{bank.contactNo || '--'}</td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                                            onClick={() => {
                                                                setEditingBank(bank);
                                                                setBankFormData({
                                                                    name: bank.name,
                                                                    customerName: bank.customerName || '',
                                                                    code: bank.code || '',
                                                                    accountNo: bank.accountNo,
                                                                    contactNo: bank.contactNo || ''
                                                                });
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                                            onClick={() => deleteBank(bank._id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
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

                <TabsContent value="transactions" className="space-y-6">
                    {/* Transaction Form Overlay */}
                    {showTransForm && (
                        <Card className="border-blue-200 dark:border-blue-900 shadow-lg animate-in fade-in zoom-in duration-200">
                            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-4">
                                <CardTitle>Record New Transaction</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setShowTransForm(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleTransSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Transaction Type</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950"
                                            value={transFormData.type}
                                            onChange={(e) => setTransFormData({ ...transFormData, type: e.target.value })}
                                        >
                                            <option value="CashIn">Cash In (Income)</option>
                                            <option value="CashOut">Cash Out (Expense)</option>
                                            <option value="BankTransfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Amount (Rs.)</Label>
                                        <Input
                                            type="number"
                                            required
                                            min={50}
                                            placeholder="0.00"
                                            value={transFormData.amount}
                                            onChange={(e) => setTransFormData({ ...transFormData, amount: e.target.value })}
                                        />
                                        <div className="text-xs text-slate-500">Minimum amount: Rs. 50</div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Related Bank (Optional)</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950"
                                            value={transFormData.bank}
                                            onChange={(e) => setTransFormData({ ...transFormData, bank: e.target.value })}
                                        >
                                            <option value="">None / Cash</option>
                                            {banks.map(bank => (
                                                <option key={bank._id} value={bank._id}>{bank.name} - {bank.accountNo}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            required
                                            value={transFormData.date}
                                            onChange={(e) => setTransFormData({ ...transFormData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Description / Note</Label>
                                        <Input
                                            placeholder="What is this transaction for?"
                                            value={transFormData.description}
                                            onChange={(e) => setTransFormData({ ...transFormData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setShowTransForm(false)}>Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">Record Entry</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-none shadow-sm dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-6 py-4 rounded-l-lg">Date</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Account</th>
                                            <th className="px-6 py-4 rounded-r-lg text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No transactions recorded yet.</td>
                                            </tr>
                                        ) : (
                                            transactions.map((tr) => (
                                                <tr key={tr._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(tr.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${tr.type === 'CashIn' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                                                            tr.type === 'CashOut' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400' :
                                                                'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                                                            }`}>
                                                            {tr.type === 'CashIn' && <ArrowUpCircle className="h-3 w-3" />}
                                                            {tr.type === 'CashOut' && <ArrowDownCircle className="h-3 w-3" />}
                                                            {tr.type === 'BankTransfer' && <ArrowLeftRight className="h-3 w-3" />}
                                                            {tr.type.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{tr.description || '--'}</td>
                                                    <td className="px-6 py-4 text-slate-500">{tr.bank ? tr.bank.name : 'Cash'}</td>
                                                    <td className={`px-6 py-4 text-right font-bold text-lg ${tr.type === 'CashIn' ? 'text-emerald-600' :
                                                        tr.type === 'CashOut' ? 'text-rose-600' :
                                                            'text-blue-600'
                                                        }`}>
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

                <TabsContent value="credit-debit" className="space-y-6">
                    {loading ? (
                        <div className="text-center text-slate-500 py-12">Loading...</div>
                    ) : (
                        <>
                            {/* Bank Ledger Summary (simple) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="border-emerald-200 dark:border-emerald-900">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                                            Total Credit (Cash In)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                            Rs. {transactions.filter((t: any) => t.type === 'CashIn').reduce((sum: number, t: any) => sum + (t.amount || 0), 0).toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-rose-200 dark:border-rose-900">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <ArrowDownCircle className="h-5 w-5 text-rose-600" />
                                            Total Debit (Cash Out)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                                            Rs. {transactions.filter((t: any) => t.type === 'CashOut').reduce((sum: number, t: any) => sum + (t.amount || 0), 0).toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-blue-200 dark:border-blue-900">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                                            Bank Transfer
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                            Rs. {transactions.filter((t: any) => t.type === 'BankTransfer').reduce((sum: number, t: any) => sum + (t.amount || 0), 0).toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Customer Balance (simple) */}
                            <Card className="border-none shadow-sm dark:bg-slate-900">
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <UserCircle className="h-5 w-5 text-slate-600" />
                                        Customer Credit/Debit (Non-zero)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs font-bold">
                                                <tr>
                                                    <th className="px-6 py-4 rounded-l-lg">Customer</th>
                                                    <th className="px-6 py-4">Phone</th>
                                                    <th className="px-6 py-4 rounded-r-lg text-right">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-slate-800">
                                                {customers.filter((c: any) => (c.balance || 0) !== 0).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                                                            No customer credit/debit found (all balances are 0).
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    customers
                                                        .filter((c: any) => (c.balance || 0) !== 0)
                                                        .map((customer: any) => (
                                                            <tr key={customer._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{customer.name}</td>
                                                                <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{customer.phone}</td>
                                                                <td className={`px-6 py-4 text-right font-bold ${
                                                                    (customer.balance || 0) > 0
                                                                        ? 'text-rose-600 dark:text-rose-400'
                                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                                }`}>
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
