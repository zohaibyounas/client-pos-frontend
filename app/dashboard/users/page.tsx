'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                        <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        Staff Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage user roles and store assignments.</p>
                </div>
                <Button
                    onClick={() => setShowAdd(!showAdd)}
                    className="shrink-0 gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" /> Onboard Staff
                </Button>
            </div>

            {showAdd && (
                <Card className="animate-in fade-in zoom-in border-slate-200 duration-200 dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                        <div>
                            <CardTitle className="text-slate-900 dark:text-white">{editingId ? 'Update Credentials' : 'New Staff Registration'}</CardTitle>
                            <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">Name, email, role and assigned store. Password required for new users.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleCancel}><X className="h-5 w-5" /></Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 md:items-end">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</Label>
                                <Input id="name" value={formData.name} onChange={handleInputChange} required className="dark:bg-slate-800/50 dark:border-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required className="dark:bg-slate-800/50 dark:border-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{editingId ? 'New Password (Optional)' : 'Security Password'}</Label>
                                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required={!editingId} className="dark:bg-slate-800/50 dark:border-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Access Level</Label>
                                <select
                                    id="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-700 dark:bg-slate-800/50"
                                >
                                    <option value="salesman">Salesman</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="store" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned Store</Label>
                                <select
                                    id="store"
                                    value={formData.store}
                                    onChange={handleInputChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-700 dark:bg-slate-800/50"
                                >
                                    <option value="">Select Store...</option>
                                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 lg:col-span-5">
                                <Button type="button" variant="outline" onClick={handleCancel} className="border-slate-200 dark:border-slate-700">Cancel</Button>
                                <Button type="submit" disabled={loading} className="bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                                    {loading ? 'Processing...' : (editingId ? 'Update Staff Member' : 'Finalize Onboarding')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Staff Accounts</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Identity, role and assigned store</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                <tr>
                                    <th className="rounded-l-lg px-4 py-3">Identity</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Assigned Store</th>
                                    <th className="rounded-r-lg px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.length === 0 ? (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center italic text-slate-400">No staff accounts found.</td></tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                                        {u.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                                                        <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Mail className="h-3 w-3" /> {u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                                    u.role === 'admin' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                )}>
                                                    <Shield className="h-3 w-3" /> {u.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <Store className="h-4 w-4" /> {u.store?.name || 'Central Command'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400" onClick={() => handleEdit(u)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400" onClick={() => handleDelete(u._id)}><Trash2 className="h-4 w-4" /></Button>
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
        </div>
    );
}
