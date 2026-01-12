'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!token || !storedUser) {
            router.push('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [router]);

    if (!user) return <p>Loading...</p>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Welcome, {user.name}</h1>
            <p className="mb-4">Role: {user.role}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white shadow rounded-lg">
                    <h2 className="text-xl font-bold">Total Sales</h2>
                    <p className="text-2xl mt-2">$0.00</p>
                </div>
                <div className="p-6 bg-white shadow rounded-lg">
                    <h2 className="text-xl font-bold">Inventory Count</h2>
                    <p className="text-2xl mt-2">0</p>
                </div>
                <div className="p-6 bg-white shadow rounded-lg">
                    <h2 className="text-xl font-bold">Low Stock</h2>
                    <p className="text-2xl mt-2">0</p>
                </div>
            </div>
            <Button
                className="mt-6"
                variant="destructive"
                onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/login');
                }}
            >
                Logout
            </Button>
        </div>
    );
}
