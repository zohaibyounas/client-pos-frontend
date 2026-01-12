'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
            <Card>
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
                    <Card key={store._id}>
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
