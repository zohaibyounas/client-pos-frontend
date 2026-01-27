'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Users, Search, Plus, Phone, MapPin, X } from 'lucide-react';
import api from '@/lib/api';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchPhone, setSearchPhone] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        kataAccountId: '',
        creditLimit: '',
        notes: ''
    });
    const router = useRouter();

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setLoading(false);
        }
    };

    const searchByPhone = async () => {
        if (!searchPhone) {
            fetchCustomers();
            return;
        }
        try {
            const res = await api.get(`/customers/phone/${searchPhone}`);
            setCustomers([res.data]);
        } catch (error: any) {
            if (error.response?.status === 404) {
                setCustomers([]);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const storeData = localStorage.getItem('selectedStore');
            const store = storeData ? JSON.parse(storeData) : null;
            const storeId = store?._id;

            await api.post('/customers', {
                ...formData,
                creditLimit: Number(formData.creditLimit) || 0,
                store: storeId
            });
            setShowForm(false);
            setFormData({ name: '', phone: '', address: '', kataAccountId: '', creditLimit: '', notes: '' });
            fetchCustomers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create customer');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            fetchCustomers();
        }
    }, [router]);

    if (loading && customers.length === 0) return (
        <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
            <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
    );

    return (
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                        <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        Customer Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage customer accounts and credit.</p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    variant={showForm ? 'outline' : 'default'}
                    className={showForm ? 'shrink-0 border-slate-200 dark:border-slate-700' : 'shrink-0 gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'}
                >
                    {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add Customer</>}
                </Button>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="pt-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[200px] flex-1 space-y-2">
                            <Label htmlFor="customer-search" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Search by phone</Label>
                            <Input
                                id="customer-search"
                                placeholder="Phone number..."
                                value={searchPhone}
                                onChange={(e) => setSearchPhone(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchByPhone())}
                                className="dark:bg-slate-800/50 dark:border-slate-700"
                            />
                        </div>
                        <Button onClick={searchByPhone} className="h-9 gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                            <Search className="h-4 w-4" /> Search
                        </Button>
                        {searchPhone && (
                            <Button type="button" variant="ghost" className="h-9" onClick={() => { setSearchPhone(''); fetchCustomers(); }}>Clear</Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {showForm && (
                <Card className="animate-in fade-in zoom-in border-slate-200 duration-200 dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">Create New Customer</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">Name and phone are required. Add address and credit limit as needed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer Name *</Label>
                                    <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phone Number *</Label>
                                    <Input id="phone" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Address</Label>
                                    <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="kataAccountId" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kata Account ID</Label>
                                    <Input id="kataAccountId" placeholder="Optional" value={formData.kataAccountId} onChange={(e) => setFormData({ ...formData, kataAccountId: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="creditLimit" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Credit Limit (Rs.)</Label>
                                    <Input id="creditLimit" type="number" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</Label>
                                    <Input id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="dark:bg-slate-800/50 dark:border-slate-700" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">Create Customer</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Customers ({customers.length})</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">List and balance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {customers.length === 0 ? (
                            <div className="py-8 text-center text-slate-400">
                                {searchPhone ? 'No customer found with this phone number.' : 'No customers yet.'}
                            </div>
                        ) : (
                            customers.map((customer) => (
                                <div
                                    key={customer._id}
                                    className="rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-1">
                                            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                                                {customer.name}
                                                {customer.isKataCustomer && (
                                                    <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Kata</span>
                                                )}
                                            </h3>
                                            <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                                                {customer.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{customer.address}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Balance</div>
                                                <div className={`font-bold ${customer.balance > 0 ? 'text-red-600 dark:text-red-400' : customer.balance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    Rs. {Math.abs(customer.balance ?? 0).toLocaleString()}
                                                    {customer.balance > 0 && ' (Debit)'}
                                                    {customer.balance < 0 && ' (Credit)'}
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700" onClick={() => router.push(`/dashboard/customers/${customer._id}`)}>
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
