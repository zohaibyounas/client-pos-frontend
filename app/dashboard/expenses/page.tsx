'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DollarSign, Trash2, Edit, Calendar, X } from 'lucide-react';
import api from '@/lib/api';

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
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                        <DollarSign className="h-8 w-8 text-red-600 dark:text-red-400" /> Expense Registry
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Monitor business overheads and miscellaneous costs.</p>
                </div>

                <Card className="w-full border-slate-200 dark:border-slate-800 dark:bg-slate-900 md:w-auto">
                    <CardContent className="pt-4">
                        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); fetchExpenses(); }}>
                            <div className="space-y-2">
                                <Label htmlFor="exp-startDate" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Date</Label>
                                <Input id="exp-startDate" type="date" className="h-9 w-40 dark:bg-slate-800/50 dark:border-slate-700" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="exp-endDate" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Date</Label>
                                <Input id="exp-endDate" type="date" className="h-9 w-40 dark:bg-slate-800/50 dark:border-slate-700" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            <Button size="sm" type="submit" className="h-9 gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">Filter</Button>
                            {(startDate || endDate) && <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setStartDate(''); setEndDate(''); fetchExpenses(); }}><X className="h-4 w-4" /></Button>}
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">{editingId ? 'Edit Entry' : 'New Expense Entry'}</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">Add or update an expense. Required fields: title and amount.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5 md:items-end">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reason / Title</Label>
                            <Input id="title" value={formData.title} onChange={handleInputChange} required className="dark:bg-slate-800/50 dark:border-slate-700" placeholder="e.g. Electricity Bill" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount (Rs.)</Label>
                            <Input id="amount" type="number" value={formData.amount} onChange={handleInputChange} required className="dark:bg-slate-800/50 dark:border-slate-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</Label>
                            <Input id="category" value={formData.category} onChange={handleInputChange} placeholder="Utility, Rent, etc." className="dark:bg-slate-800/50 dark:border-slate-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes (Optional)</Label>
                            <Input id="description" value={formData.description} onChange={handleInputChange} className="dark:bg-slate-800/50 dark:border-slate-700" />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">{loading ? '...' : (editingId ? 'Update' : 'Record')}</Button>
                            {editingId && <Button type="button" variant="outline" onClick={handleCancel} className="border-slate-200 dark:border-slate-700"><X className="h-5 w-5" /></Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Expense History</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date, title and amount</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                <tr>
                                    <th className="rounded-l-lg px-4 py-3">Date/Time</th>
                                    <th className="px-4 py-3">Title / Reason</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="rounded-r-lg px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {expenses.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center italic text-slate-400">No expenditure data found.</td></tr>
                                ) : (
                                    expenses.map((exp) => (
                                        <tr key={exp._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{exp.createdAt ? new Date(exp.createdAt).toLocaleString() : 'N/A'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{exp.title}</td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">{exp.category || 'GENERAL'}</span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">Rs. {(exp.amount ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400" onClick={() => handleEdit(exp)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400" onClick={() => handleDelete(exp._id)}><Trash2 className="h-4 w-4" /></Button>
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
