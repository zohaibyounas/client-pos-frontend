'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, User, Mail, Lock, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const u = JSON.parse(storedUser);
            setUser(u);
            setFormData(prev => ({ ...prev, name: u.name, email: u.email }));
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await api.put('/auth/profile', {
                name: formData.name,
                email: formData.email,
                password: formData.password || undefined
            });

            // Update local storage
            const updatedUser = { ...user, name: res.data.name, email: res.data.email };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setSuccess(true);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error) {
            console.error('Update failed', error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-transparent min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight flex items-center">
                        <Settings className="mr-3 h-8 w-8 text-blue-600" /> Account Security
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your credentials and profile information.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: Quick Profile Card */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl bg-blue-600 text-white overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 opacity-10">
                                <User className="h-40 w-40" />
                            </div>
                            <CardContent className="p-8 space-y-6">
                                <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black italic">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Active Profile</p>
                                    <p className="text-2xl font-black uppercase leading-tight">{user.name}</p>
                                    <p className="text-blue-100/60 text-xs font-medium mt-1">{user.email}</p>
                                </div>
                                <div className="pt-4 border-t border-blue-500/30 flex items-center justify-between">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/10 text-[9px] font-black uppercase">
                                        <ShieldCheck className="h-3 w-3" /> {user.role}
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-200">ID: {user._id.slice(-6).toUpperCase()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Security Form */}
                    <div className="md:col-span-2">
                        <Card className="border-none shadow-xl dark:bg-slate-900 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">Profile Settings</CardTitle>
                                <CardDescription>Update your email or change your security password.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs font-black uppercase text-slate-400">Display Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input id="name" value={formData.name} onChange={handleChange} className="h-11 pl-10 rounded-xl" required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs font-black uppercase text-slate-400">Login Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input id="email" type="email" value={formData.email} onChange={handleChange} className="h-11 pl-10 rounded-xl" required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-xs font-black uppercase text-slate-400">New Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input id="password" type="password" value={formData.password} onChange={handleChange} className="h-11 pl-10 rounded-xl" placeholder="••••••••" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-xs font-black uppercase text-slate-400">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="h-11 pl-10 rounded-xl" placeholder="••••••••" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t dark:border-slate-800 flex items-center justify-between">
                                        {success ? (
                                            <div className="flex items-center gap-2 text-green-600 font-bold text-sm animate-in fade-in slide-in-from-left-2">
                                                <CheckCircle2 className="h-5 w-5" /> All changes recorded successfully!
                                            </div>
                                        ) : <div />}
                                        <Button type="submit" disabled={loading} className="h-11 px-8 font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-500/20 gap-2">
                                            <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Update Account'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
