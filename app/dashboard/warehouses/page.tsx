'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Warehouse as WarehouseIcon, Trash2, Edit } from 'lucide-react';
import api from '@/lib/api';

export default function WarehousePage() {
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        contactPerson: '',
        phone: '',
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchWarehouses = async () => {
        try {
            const res = await api.get('/warehouses');
            setWarehouses(res.data);
        } catch (error) {
            console.error('Failed to fetch warehouses', error);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', location: '', contactPerson: '', phone: '' });
    };

    const handleEdit = (w: any) => {
        setEditingId(w._id);
        setFormData({
            name: w.name,
            location: w.location || '',
            contactPerson: w.contactPerson || '',
            phone: w.phone || '',
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this warehouse?')) return;
        try {
            await api.delete(`/warehouses/${id}`);
            fetchWarehouses();
        } catch (error) {
            console.error('Failed to delete warehouse', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/warehouses/${editingId}`, formData);
            } else {
                await api.post('/warehouses', formData);
            }
            handleCancel();
            fetchWarehouses();
        } catch (error) {
            console.error('Failed to save warehouse', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center">
                    <WarehouseIcon className="mr-3 h-8 w-8 text-blue-600" /> Warehouse Management
                </h1>
            </div>

            <Card className="dark:bg-slate-900 border-none shadow">
                <CardHeader>
                    <CardTitle>{editingId ? 'Edit Warehouse' : 'Add New Warehouse'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5 items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Warehouse Name</Label>
                            <Input id="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" value={formData.location} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="contactPerson">Contact Person</Label>
                            <Input id="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={formData.phone} onChange={handleInputChange} />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {warehouses.map((w) => (
                    <Card key={w._id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center dark:text-white">
                                {w.name}
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(w)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(w._id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p><strong>Location:</strong> {w.location || 'N/A'}</p>
                            <p><strong>Contact:</strong> {w.contactPerson || 'N/A'}</p>
                            <p><strong>Phone:</strong> {w.phone || 'N/A'}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
