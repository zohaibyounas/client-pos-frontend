'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Search, Barcode, Trash2, Edit } from 'lucide-react';
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
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Product Management</h1>
                <Button onClick={() => setShowAdd(!showAdd)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            {showAdd && (
                <Card className="bg-slate-50 dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/40 animate-in fade-in zoom-in duration-200">
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit Product' : 'Add New Product'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="barcode" className="flex items-center"><Barcode className="mr-2 h-4 w-4" /> Barcode</Label>
                                <Input id="barcode" value={formData.barcode} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" value={formData.category} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="costPrice">Cost Price</Label>
                                <Input id="costPrice" type="number" value={formData.costPrice} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="salePrice">Sale Price</Label>
                                <Input id="salePrice" type="number" value={formData.salePrice} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discount">Discount (%)</Label>
                                <Input id="discount" type="number" value={formData.discount} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vendor">Vendor</Label>
                                <Input id="vendor" value={formData.vendor} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalStock">{editingId ? 'Update Stock' : 'Initial Stock'}</Label>
                                <Input id="totalStock" type="number" value={formData.totalStock} onChange={handleInputChange} required />
                            </div>
                            {!editingId && (
                                <div className="space-y-2">
                                    <Label htmlFor="warehouseId">Warehouse</Label>
                                    <select
                                        id="warehouseId"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.warehouseId}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="image">Product Image</Label>
                                <Input id="image" type="file" onChange={handleFileChange} accept="image/*" />
                            </div>
                            <div className="md:col-span-3 flex justify-end gap-2">
                                <Button variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
                                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update Product' : 'Save Product')}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {products.map((p) => (
                    <Card key={p._id} className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-slate-900">
                        {p.image && <img src={`http://localhost:5000${p.image}`} alt={p.name} className="w-full h-48 object-cover" />}
                        <CardHeader className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{p.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{p.category}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                                        STOCK: {p.totalStock}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(p)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(p._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">Rs. {p.salePrice}</span>
                                <span className="text-xs text-muted-foreground line-through">Rs. {p.costPrice}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Barcode: {p.barcode}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
