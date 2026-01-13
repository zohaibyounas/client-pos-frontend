'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DollarSign, Plus, Trash2, Edit, Calendar, Filter, X } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ExpensePage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        description: '',
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchExpenses = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/expenses?${params.toString()}`);
            setExpenses(res.data);
        } catch (error) {
            console.error('Failed to fetch expenses', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ title: '', amount: '', category: '', description: '' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            fetchExpenses();
        } catch (error) {
            console.error('Failed to delete expense', error);
        }
    };

    const handleEdit = (exp: any) => {
        setEditingId(exp._id);
        setFormData({
            title: exp.title,
            amount: exp.amount.toString(),
            category: exp.category || '',
            description: exp.description || '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/expenses/${editingId}`, formData);
            } else {
                await api.post('/expenses', formData);
            }
            handleCancel();
            fetchExpenses();
        } catch (error) {
            console.error('Failed to save expense', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight flex items-center">
                        <DollarSign className="mr-3 h-8 w-8 text-red-600" /> Expense Registry
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Monitor business overheads and miscellaneous costs.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border shadow-sm" onSubmit={(e) => { e.preventDefault(); fetchExpenses(); }}>
                        <div className="flex items-center gap-2 px-2 border-r dark:border-slate-800">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <Input type="date" className="border-none shadow-none focus-visible:ring-0 w-32 h-8 text-xs font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 px-2">
                            <Input type="date" className="border-none shadow-none focus-visible:ring-0 w-32 h-8 text-xs font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <Button size="sm" type="submit" className="h-8">Filter</Button>
                        {(startDate || endDate) && <Button size="icon" variant="ghost" onClick={() => { setStartDate(''); setEndDate(''); fetchExpenses(); }}><X className="h-4 w-4" /></Button>}
                    </form>
                </div>
            </div>

            <Card className="dark:bg-slate-900 border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                <CardHeader>
                    <CardTitle className="text-xl font-bold">{editingId ? 'Edit Entry' : 'New Expense Entry'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-5 items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="text-xs font-black uppercase text-slate-400">Reason / Title</Label>
                            <Input id="title" value={formData.title} onChange={handleInputChange} required className="h-11 rounded-xl" placeholder="e.g. Electricity Bill" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount" className="text-xs font-black uppercase text-slate-400">Amount (Rs.)</Label>
                            <Input id="amount" type="number" value={formData.amount} onChange={handleInputChange} required className="h-11 rounded-xl font-black text-red-600" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category" className="text-xs font-black uppercase text-slate-400">Category</Label>
                            <Input id="category" value={formData.category} onChange={handleInputChange} placeholder="Utility, Rent, etc." className="h-11 rounded-xl" />
                        </div>
                        <div className="grid gap-2 lg:col-span-1">
                            <Label htmlFor="description" className="text-xs font-black uppercase text-slate-400">Notes (Optional)</Label>
                            <Input id="description" value={formData.description} onChange={handleInputChange} className="h-11 rounded-xl" />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" variant="destructive" disabled={loading} className="flex-1 h-11 font-bold uppercase tracking-widest shadow-lg shadow-red-500/20">
                                {loading ? '...' : (editingId ? 'Update' : 'Record')}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={handleCancel} className="h-11 border-2 font-bold uppercase tracking-widest px-4">
                                    <X className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Date/Time</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Title / Reason</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Allocation</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Net Amount</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right pr-10">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {expenses.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-25">No expenditure data recovered</td></tr>
                        ) : (
                            expenses.map((exp) => (
                                <tr key={exp._id} className="hover:bg-red-50/50 dark:hover:bg-slate-800 transition-colors group">
                                    <td className="px-6 py-5 text-xs text-slate-500 font-bold">
                                        {exp.createdAt ? new Date(exp.createdAt).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-5 text-sm font-black uppercase">{exp.title}</td>
                                    <td className="px-6 py-5 text-sm">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">{exp.category || 'GENERAL'}</span>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-black text-red-600 dark:text-red-400 tracking-tight">
                                        Rs. {(exp.amount ?? 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-sm text-right pr-10">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => handleEdit(exp)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(exp._id)}>
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
