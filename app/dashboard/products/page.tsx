'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Barcode, Trash2, Edit, Package } from 'lucide-react';
import api from '@/lib/api';

export default function ProductPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        costPrice: '',
        salePrice: '',
        discount: '0',
        vendor: '',
        category: '',
        totalStock: '0',
        warehouseId: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [prodRes, wareRes] = await Promise.all([
                api.get('/products'),
                api.get('/warehouses')
            ]);
            setProducts(prodRes.data);
            setWarehouses(wareRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete product', error);
        }
    };

    const handleEdit = (p: any) => {
        setEditingId(p._id);
        setFormData({
            name: p.name,
            barcode: p.barcode,
            costPrice: p.costPrice.toString(),
            salePrice: p.salePrice.toString(),
            discount: (p.discount || 0).toString(),
            vendor: p.vendor || '',
            category: p.category || '',
            totalStock: p.totalStock.toString(),
            warehouseId: '',
        });
        setShowAdd(true);
    };

    const handleCancel = () => {
        setShowAdd(false);
        setEditingId(null);
        setFormData({ name: '', barcode: '', costPrice: '', salePrice: '', discount: '0', vendor: '', category: '', totalStock: '0', warehouseId: '' });
        setFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => data.append(key, value));
        if (file) data.append('image', file);

        try {
            if (editingId) {
                await api.put(`/products/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            handleCancel();
            fetchData();
        } catch (error) {
            console.error('Failed to save product', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
            {/* Header — same spacing as Dashboard / Reports */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Product Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Add, edit and manage your inventory products.
                    </p>
                </div>
                <Button
                    onClick={() => setShowAdd(!showAdd)}
                    className="shrink-0 gap-2 bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" /> Add Product
                </Button>
            </div>

            {/* Add/Edit form — same card style as Dashboard (no line) */}
            {showAdd && (
                <Card className="animate-in fade-in zoom-in border-slate-200 duration-200 dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">
                            {editingId ? 'Edit Product' : 'Add New Product'}
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Fill in the details below. All fields with * are required.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product Name</Label>
                                <Input id="name" value={formData.name} onChange={handleInputChange} className="dark:bg-slate-800/50 dark:border-slate-700" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="barcode" className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><Barcode className="mr-2 h-4 w-4" /> Barcode</Label>
                                <Input id="barcode" value={formData.barcode} onChange={handleInputChange} className="dark:bg-slate-800/50 dark:border-slate-700" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category</Label>
                                <Input id="category" value={formData.category} onChange={handleInputChange} className="dark:bg-slate-800/50 dark:border-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="costPrice" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cost Price</Label>
                                <Input id="costPrice" type="number" value={formData.costPrice} onChange={handleInputChange} className="dark:bg-slate-800/50 dark:border-slate-700" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="salePrice" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sale Price</Label>
                                <Input id="salePrice" type="number" value={formData.salePrice} onChange={handleInputChange} className="dark:bg-slate-800/50 dark:border-slate-700" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discount" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Discount (%)</Label>
                                <Input id="discount" type="number" value={formData.discount} onChange={handleInputChange} className="dark:bg-slate-800/50 dark:border-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vendor" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vendor</Label>
                                <Input id="vendor" value={formData.vendor} onChange={handleInputChange} className="dark:bg-slate-800/50 dark:border-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalStock" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{editingId ? 'Update Stock' : 'Initial Stock'}</Label>
                                <Input id="totalStock" type="number" value={formData.totalStock} onChange={handleInputChange} className="dark:bg-slate-800/50 dark:border-slate-700" required />
                            </div>
                            {!editingId && (
                                <div className="space-y-2">
                                    <Label htmlFor="warehouseId" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Warehouse</Label>
                                    <select
                                        id="warehouseId"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/50"
                                        value={formData.warehouseId}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="image" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product Image</Label>
                                <Input id="image" type="file" onChange={handleFileChange} accept="image/*" className="dark:bg-slate-800/50 dark:border-slate-700" />
                            </div>
                            <div className="flex justify-end gap-2 md:col-span-3">
                                <Button type="button" variant="outline" className="border-slate-200 dark:border-slate-700" onClick={handleCancel}>Cancel</Button>
                                <Button type="submit" disabled={loading} className="bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                                    {loading ? 'Saving...' : (editingId ? 'Update Product' : 'Save Product')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Products list — Card wrapper like Dashboard/Reports */}
            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">
                        Products
                    </CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Your inventory products. Edit or delete from each card.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-16 dark:border-slate-700">
                            <Package className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No products yet.</p>
                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Add your first product to get started.</p>
                            <Button
                                className="mt-4 gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                                onClick={() => setShowAdd(true)}
                            >
                                <Plus className="h-4 w-4" /> Add Product
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {products.map((p) => (
                                <div
                                    key={p._id}
                                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                                >
                                    {/* Image area — unified height */}
                                    {p.image ? (
                                        <img
                                            src={`http://localhost:5000${p.image}`}
                                            alt={p.name}
                                            className="h-32 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-32 items-center justify-center border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                            <Package className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                        </div>
                                    )}
                                    <div className="p-3">
                                        {/* Name + stock badge + actions — same on every card */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                                    {p.name}
                                                </h3>
                                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                    {p.category || p.description || '—'}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                    {p.totalStock}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                                    onClick={() => handleEdit(p)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    onClick={() => handleDelete(p._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {/* Price row */}
                                        <div className="mt-2 flex items-baseline justify-between gap-2">
                                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                                Rs. {Number(p.salePrice).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-slate-400 line-through dark:text-slate-500">
                                                Rs. {Number(p.costPrice).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="mt-1.5 truncate text-xs font-mono text-slate-500 dark:text-slate-400">
                                            Barcode: {p.barcode}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
