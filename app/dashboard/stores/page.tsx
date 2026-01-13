'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
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
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Store Management</h1>
                <Link href="/dashboard/select-store" className="flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store Selection
                </Link>
            </div>
            <Card className="dark:bg-slate-900 border-none shadow">
                <CardHeader>
                    <CardTitle>Add New Store</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-4 items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Store Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="contact">Contact Number</Label>
                            <Input id="contact" value={contact} onChange={e => setContact(e.target.value)} />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Store'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                    <Card key={store._id} className="dark:bg-slate-900 border-none shadow transition-shadow hover:shadow-md">
                        <CardHeader>
                            <CardTitle>{store.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p><strong>Location:</strong> {store.location || 'N/A'}</p>
                            <p><strong>Contact:</strong> {store.contactNumber || 'N/A'}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
