'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Users, Trash2, Edit, X, Shield, Store, Mail } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'salesman',
        store: ''
    });

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchStores = async () => {
        try {
            const res = await api.get('/stores');
            setStores(res.data);
        } catch (error) {
            console.error('Failed to fetch stores', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchStores();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleCancel = () => {
        setEditingId(null);
        setShowAdd(false);
        setFormData({ name: '', email: '', password: '', role: 'salesman', store: '' });
    };

    const handleEdit = (u: any) => {
        setEditingId(u._id);
        setFormData({
            name: u.name,
            email: u.email,
            password: '',
            role: u.role,
            store: u.store?._id || ''
        });
        setShowAdd(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/users/${editingId}`, formData);
            } else {
                await api.post('/users', formData);
            }
            handleCancel();
            fetchUsers();
        } catch (error) {
            console.error('Save failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-transparent min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight flex items-center">
                        <Users className="mr-3 h-8 w-8 text-blue-600" /> Staff Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage user roles and store assignments.</p>
                </div>
                <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 font-bold shadow-lg shadow-blue-500/20">
                    <Plus className="h-5 w-5" /> ONBOARD STAFF
                </Button>
            </div>

            {showAdd && (
                <Card className="bg-white dark:bg-slate-900 border-none shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>{editingId ? 'Update Credentials' : 'New Staff Registration'}</span>
                            <Button variant="ghost" size="icon" onClick={handleCancel}><X className="h-5 w-5" /></Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-black uppercase text-slate-400">Full Name</Label>
                                <Input id="name" value={formData.name} onChange={handleInputChange} required className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-black uppercase text-slate-400">Email Address</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-black uppercase text-slate-400">{editingId ? 'New Password (Optional)' : 'Security Password'}</Label>
                                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required={!editingId} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-xs font-black uppercase text-slate-400">Access Level</Label>
                                <select
                                    id="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full h-11 px-3 rounded-xl border bg-white dark:bg-slate-950 font-bold"
                                >
                                    <option value="salesman">Salesman</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="store" className="text-xs font-black uppercase text-slate-400">Assigned Store</Label>
                                <select
                                    id="store"
                                    value={formData.store}
                                    onChange={handleInputChange}
                                    className="w-full h-11 px-3 rounded-xl border bg-white dark:bg-slate-950 font-bold"
                                >
                                    <option value="">Select Store...</option>
                                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="lg:col-span-5 flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                                <Button variant="outline" type="button" onClick={handleCancel} className="h-11 px-8 font-bold border-2 rounded-xl">Cancel</Button>
                                <Button type="submit" disabled={loading} className="h-11 px-12 font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-500/20">
                                    {loading ? 'Processing...' : (editingId ? 'Update Staff Member' : 'Finalize Onboarding')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Identity</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Access Control</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Assigned Unit</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right pr-10">Administrative</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {users.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-25">No staff accounts found</td></tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u._id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 font-black">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black uppercase text-sm">{u.name}</p>
                                                <p className="text-xs text-slate-400 flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase",
                                            u.role === 'admin' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        )}>
                                            <Shield className="h-3 w-3" /> {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                                            <Store className="h-4 w-4" /> {u.store?.name || 'Central Command'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right pr-10">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => handleEdit(u)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(u._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
