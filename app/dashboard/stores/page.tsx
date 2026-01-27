'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function StorePage() {
    const [stores, setStores] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [contact, setContact] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchStores = async () => {
        try {
            const res = await api.get('/stores');
            setStores(res.data);
        } catch (error) {
            console.error('Failed to fetch stores', error);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/stores', { name, location, contactNumber: contact });
            setName('');
            setLocation('');
            setContact('');
            fetchStores();
        } catch (error) {
            console.error('Failed to create store', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                        <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        Store Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Add and manage business locations.</p>
                </div>
                <Link
                    href="/dashboard/select-store"
                    className="flex shrink-0 items-center gap-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Store Selection
                </Link>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Add New Store</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">Name, location and contact. Name is required.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-4 md:items-end">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Store Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="dark:bg-slate-800/50 dark:border-slate-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Location</Label>
                            <Input id="location" value={location} onChange={e => setLocation(e.target.value)} className="dark:bg-slate-800/50 dark:border-slate-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Number</Label>
                            <Input id="contact" value={contact} onChange={e => setContact(e.target.value)} className="dark:bg-slate-800/50 dark:border-slate-700" />
                        </div>
                        <Button type="submit" disabled={loading} className="bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                            {loading ? 'Creating...' : 'Create Store'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                    <Card key={store._id} className="border-slate-200 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">{store.name}</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">Location and contact</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p className="text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-700 dark:text-slate-300">Location:</span> {store.location || 'N/A'}</p>
                            <p className="text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-700 dark:text-slate-300">Contact:</span> {store.contactNumber || 'N/A'}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
