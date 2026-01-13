'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Users, Search, Plus, Phone, MapPin, CreditCard, X } from 'lucide-react';
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

    if (loading && customers.length === 0) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-6 bg-slate-50/50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        Customer Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage customer accounts and credit</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                    {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showForm ? 'Cancel' : 'Add Customer'}
                </Button>
            </div>

            {/* Search Bar */}
            <Card className="dark:bg-slate-900 border-none shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by phone number..."
                                value={searchPhone}
                                onChange={(e) => setSearchPhone(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchByPhone()}
                                className="h-11"
                            />
                        </div>
                        <Button onClick={searchByPhone} className="gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        {searchPhone && (
                            <Button variant="outline" onClick={() => { setSearchPhone(''); fetchCustomers(); }}>
                                Clear
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Create Customer Form */}
            {showForm && (
                <Card className="dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Create New Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Customer Name *</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="kataAccountId">Kata Account ID</Label>
                                    <Input
                                        id="kataAccountId"
                                        placeholder="Optional"
                                        value={formData.kataAccountId}
                                        onChange={(e) => setFormData({ ...formData, kataAccountId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="creditLimit">Credit Limit (Rs.)</Label>
                                    <Input
                                        id="creditLimit"
                                        type="number"
                                        value={formData.creditLimit}
                                        onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Input
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Create Customer</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Customer List */}
            <Card className="dark:bg-slate-900 border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Customers ({customers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {customers.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                {searchPhone ? 'No customer found with this phone number' : 'No customers yet'}
                            </div>
                        ) : (
                            customers.map((customer) => (
                                <div
                                    key={customer._id}
                                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                                {customer.name}
                                                {customer.isKataCustomer && (
                                                    <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                                                        Kata
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {customer.phone}
                                                </span>
                                                {customer.address && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {customer.address}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500 dark:text-slate-400">Balance</div>
                                                <div className={`text-lg font-bold ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                                                    Rs. {Math.abs(customer.balance).toLocaleString()}
                                                    {customer.balance > 0 && ' (Debit)'}
                                                    {customer.balance < 0 && ' (Credit)'}
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/dashboard/customers/${customer._id}`)}
                                            >
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
