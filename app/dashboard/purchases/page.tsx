'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Plus,
    CreditCard,
    Image as ImageIcon,
    Trash2,
    Edit,
    Search,
    Filter,
    X,
    Eye,
    Calendar,
    ArrowLeft,
    ChevronRight,
    CheckCircle2,
    Printer,
    Package
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function PurchasePage() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [viewingPurchase, setViewingPurchase] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        vendorName: '',
        totalAmount: '',
        paidAmount: '',
        balance: '0',
    });
    const [purchaseItems, setPurchaseItems] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Payment Form
    const [paymentAmount, setPaymentAmount] = useState('');

    const fetchPurchases = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/purchases?${params.toString()}`);
            setPurchases(res.data);
        } catch (error) {
            console.error('Failed to fetch purchases', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
    };

    useEffect(() => {
        fetchPurchases();
        fetchProducts();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const newData = { ...formData, [id]: value };
        if (id === 'totalAmount' || id === 'paidAmount') {
            const total = Number(newData.totalAmount) || 0;
            const paid = Number(newData.paidAmount) || 0;
            newData.balance = (total - paid).toString();
        }
        setFormData(newData);
    };

    const addItem = () => {
        setPurchaseItems([...purchaseItems, { product: '', quantity: 1, costPrice: 0, total: 0 }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const updated = [...purchaseItems];
        updated[index][field] = value;
        if (field === 'quantity' || field === 'costPrice') {
            updated[index].total = Number(updated[index].quantity) * Number(updated[index].costPrice);
        }
        setPurchaseItems(updated);

        // Update total amount based on items
        const newTotal = updated.reduce((sum, item) => sum + item.total, 0);
        setFormData(prev => {
            const balance = newTotal - Number(prev.paidAmount);
            return { ...prev, totalAmount: newTotal.toString(), balance: balance.toString() };
        });
    };

    const removeItem = (index: number) => {
        const updated = purchaseItems.filter((_, i) => i !== index);
        setPurchaseItems(updated);
        const newTotal = updated.reduce((sum, item) => sum + item.total, 0);
        setFormData(prev => ({ ...prev, totalAmount: newTotal.toString(), balance: (newTotal - Number(prev.paidAmount)).toString() }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleCancel = () => {
        setShowAdd(false);
        setEditingId(null);
        setFormData({ vendorName: '', totalAmount: '', paidAmount: '', balance: '0' });
        setPurchaseItems([]);
        setFile(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this purchase?')) return;
        try {
            await api.delete(`/purchases/${id}`);
            fetchPurchases();
        } catch (error) {
            console.error('Failed to delete purchase', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('vendorName', formData.vendorName);
        data.append('totalAmount', formData.totalAmount);
        data.append('paidAmount', formData.paidAmount);
        data.append('balance', formData.balance);
        data.append('items', JSON.stringify(purchaseItems));
        if (file) data.append('billImage', file);

        try {
            if (editingId) {
                await api.put(`/purchases/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/purchases', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            handleCancel();
            fetchPurchases();
        } catch (error) {
            console.error('Failed to save purchase', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentAmount) return;
        try {
            const res = await api.post(`/purchases/${viewingPurchase._id}/payments`, { amount: paymentAmount });
            setViewingPurchase(res.data);
            setPaymentAmount('');
            fetchPurchases();
        } catch (error) {
            console.error('Payment failed', error);
        }
    };

    const handlePrintPurchase = (purchase: any) => {
        const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
        if (!WindowPrt) return;

        const itemsHtml = purchase.items?.map((item: any) => {
            const prod = products.find(p => p._id === item.product);
            return `
                <div class="item-row">
                    <div class="bold">${prod?.name || 'Item'}</div>
                    <div class="flex">
                        <span>${item.quantity} x Rs.${item.costPrice}</span>
                        <span>Rs.${item.total.toFixed(0)}</span>
                    </div>
                </div>
            `;
        }).join('');

        const html = `
            <html>
                <head>
                    <title>Purchase Invoice - ${purchase._id}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; color: #000; }
                        .center { text-align: center; }
                        .bold { font-weight: bold; }
                        .divider { border-top: 1px dashed #000; margin: 5px 0; }
                        .flex { display: flex; justify-content: space-between; }
                        .item-row { margin-bottom: 3px; }
                        .header { margin-bottom: 10px; }
                        .footer { margin-top: 10px; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="center header">
                        <h2 class="bold" style="margin: 0;">PURCHASE INVOICE</h2>
                        <p style="margin: 0;">Vendor: ${purchase.vendorName}</p>
                        <p style="margin: 0;">Date: ${new Date(purchase.createdAt).toLocaleString()}</p>
                        <p style="margin: 0;">Ref: ${purchase._id}</p>
                    </div>
                    <div class="divider"></div>
                    <div class="bold flex" style="margin-bottom: 5px;">
                        <span>Item</span>
                        <span>Qty x Cost</span>
                        <span>Total</span>
                    </div>
                    <div class="divider"></div>
                    ${itemsHtml}
                    <div class="divider"></div>
                    <div class="flex bold">
                        <span>VALUATION:</span>
                        <span>Rs.${purchase.totalAmount.toLocaleString()}</span>
                    </div>
                    <div class="flex">
                        <span>Paid Amount:</span>
                        <span>Rs.${purchase.paidAmount.toLocaleString()}</span>
                    </div>
                    <div class="flex">
                        <span>Balance:</span>
                        <span>Rs.${purchase.balance.toLocaleString()}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="center footer">
                        <p>Inventory Shipment Recorded Successfully</p>
                        <p>Powered by POS System</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `;

        WindowPrt.document.write(html);
        WindowPrt.document.close();
        WindowPrt.focus();
    };

    const addProductToPurchase = (prod: any) => {
        const exists = purchaseItems.find(item => item.product === prod._id);
        if (exists) return;

        const newItem = { product: prod._id, quantity: 1, costPrice: prod.costPrice || 0, total: prod.costPrice || 0 };
        const updated = [...purchaseItems, newItem];
        setPurchaseItems(updated);

        // Update total
        const newTotal = updated.reduce((sum, item) => sum + Number(item.total), 0);
        setFormData(prev => ({
            ...prev,
            totalAmount: newTotal.toString(),
            balance: (newTotal - Number(prev.paidAmount)).toString()
        }));
    };

    // Modal view for details
    if (viewingPurchase) {
        return (
            <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="border-slate-200 dark:border-slate-700" onClick={() => setViewingPurchase(null)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Details</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Vendor: {viewingPurchase.vendorName}</p>
                        </div>
                    </div>
                    <Button onClick={() => handlePrintPurchase(viewingPurchase)} className="gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 shrink-0">
                        <Printer className="h-4 w-4" /> Print Invoice
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">Items</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Product, quantity and totals</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3">Quantity</th>
                                            <th className="px-4 py-3">Cost Price</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {viewingPurchase.items?.map((item: any, idx: number) => {
                                            const prod = products.find(p => p._id === item.product);
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{prod?.name || 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Rs. {item.costPrice}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">Rs. {item.total}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">Payment History</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Installments and status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium">Initial Payment</span>
                                        </div>
                                        <span className="font-bold text-green-700">Rs. {viewingPurchase.totalAmount - viewingPurchase.balance - (viewingPurchase.paymentHistory?.reduce((s: any, p: any) => s + p.amount, 0) || 0)}</span>
                                    </div>
                                    {viewingPurchase.paymentHistory?.map((p: any, idx: number) => (
                                        <div key={idx} className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium">{new Date(p.date).toLocaleString()}</span>
                                            </div>
                                            <span className="font-bold text-blue-700">Rs. {p.amount}</span>
                                        </div>
                                    ))}
                                    {(!viewingPurchase.paymentHistory || viewingPurchase.paymentHistory.length === 0) && (
                                        <p className="text-center text-slate-400 text-sm italic">No installment payments recorded.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-slate-200 bg-blue-600 dark:border-blue-700 dark:bg-blue-600">
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Total Amount</p>
                                    <p className="text-3xl font-black italic tracking-tighter">Rs. {viewingPurchase.totalAmount.toLocaleString()}</p>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-blue-100 text-[10px] font-bold uppercase">Paid</p>
                                        <p className="text-xl font-bold">Rs. {viewingPurchase.paidAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-blue-100 text-[10px] font-bold uppercase">Balance</p>
                                        <p className={`text-xl font-bold ${viewingPurchase.balance > 0 ? 'text-red-200' : 'text-green-200'}`}>
                                            Rs. {viewingPurchase.balance.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {viewingPurchase.balance > 0 && (
                            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                                <CardHeader>
                                    <CardTitle className="text-slate-900 dark:text-white">Add Payment</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Record installment</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAddPayment} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="payAmount" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount to Pay (Rs.)</Label>
                                            <Input id="payAmount" type="number" max={viewingPurchase.balance} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="dark:bg-slate-800/50 dark:border-slate-700" required />
                                        </div>
                                        <Button type="submit" className="w-full bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">Update Balance</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {viewingPurchase.billImage && (
                            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                                        <ImageIcon className="h-5 w-5" /> Bill Invoice
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <img src={`http://localhost:5000${viewingPurchase.billImage}`} alt="Bill" className="w-full h-auto rounded-lg border dark:border-slate-800" />
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full gap-2" asChild>
                                        <a href={`http://localhost:5000${viewingPurchase.billImage}`} target="_blank">View Full Size</a>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                        <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" /> Purchase Ledger
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Track vendor shipments and historical payments.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Card className="w-full border-slate-200 dark:border-slate-800 dark:bg-slate-900 md:w-auto">
                        <CardContent className="pt-4">
                            <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); fetchPurchases(); }}>
                                <div className="space-y-2">
                                    <Label htmlFor="purch-startDate" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Date</Label>
                                    <Input id="purch-startDate" type="date" className="h-9 w-40 dark:bg-slate-800/50 dark:border-slate-700" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="purch-endDate" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Date</Label>
                                    <Input id="purch-endDate" type="date" className="h-9 w-40 dark:bg-slate-800/50 dark:border-slate-700" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                </div>
                                <Button size="sm" type="submit" className="h-9 gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">Filter</Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Button onClick={() => setShowAdd(!showAdd)} className="shrink-0 gap-2 bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Record Purchase
                    </Button>
                </div>
            </div>

            {showAdd && (
                <Card className="animate-in fade-in zoom-in border-slate-200 duration-200 dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                        <div>
                            <CardTitle className="text-slate-900 dark:text-white">{editingId ? 'Updating Shipment Record' : 'New Shipment Registration'}</CardTitle>
                            <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">Add vendor, items and payment details.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleCancel}><X className="h-5 w-5" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="vendorName" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vendor / Supplier</Label>
                                    <Input id="vendorName" value={formData.vendorName} onChange={handleInputChange} required className="dark:bg-slate-800/50 dark:border-slate-700" placeholder="e.g. Master Sanitary Ltd." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paidAmount" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Initial Paid Amount (Rs.)</Label>
                                    <Input id="paidAmount" type="number" value={formData.paidAmount} onChange={handleInputChange} required className="dark:bg-slate-800/50 dark:border-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Valuation</Label>
                                    <div className="flex h-10 items-center rounded-md border border-input bg-slate-50 px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-800/50">
                                        Rs. {Number(formData.totalAmount).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center gap-4">
                                    <h3 className="font-black uppercase tracking-widest text-xs text-blue-600">Product Line Items</h3>
                                    <div className="max-w-md flex-1">
                                        <select
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-700 dark:bg-slate-800/50"
                                            onChange={(e) => {
                                                const p = products.find(prod => prod._id === e.target.value);
                                                if (p) addProductToPurchase(p);
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">Quick Add Product...</option>
                                            {products.map(p => (
                                                <option key={p._id} value={p._id}>
                                                    {p.name} (${p.barcode})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {purchaseItems.map((item, idx) => {
                                        const prod = products.find(p => p._id === item.product);
                                        return (
                                            <div key={idx} className="group grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-800/30 md:grid-cols-12">
                                                <div className="md:col-span-5 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border shrink-0">
                                                        <Package className="h-5 w-5 text-slate-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-xs uppercase truncate leading-tight">{prod?.name || 'Unknown'}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Code: {prod?.barcode}</p>
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Qty</Label>
                                                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required className="h-9 dark:bg-slate-800/50 dark:border-slate-700" />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cost (Rs.)</Label>
                                                    <Input type="number" value={item.costPrice} onChange={(e) => updateItem(idx, 'costPrice', e.target.value)} required className="h-9 dark:bg-slate-800/50 dark:border-slate-700" />
                                                </div>
                                                <div className="md:col-span-2 text-right">
                                                    <p className="text-[9px] font-black uppercase text-slate-400">Total Value</p>
                                                    <p className="font-black italic text-sm">Rs. {Number(item.total).toLocaleString()}</p>
                                                </div>
                                                <div className="md:col-span-1 text-right">
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => removeItem(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {purchaseItems.length === 0 && (
                                        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                <Package className="h-7 w-7 text-slate-400" />
                                            </div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Add products from the dropdown above</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                <div className="w-full flex-1 space-y-2 md:max-w-sm">
                                    <Label htmlFor="billImage" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <ImageIcon className="h-4 w-4" /> Evidence / Bill Image
                                    </Label>
                                    <Input id="billImage" type="file" onChange={handleFileChange} accept="image/*" className="dark:bg-slate-800/50 dark:border-slate-700" />
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={handleCancel} className="border-slate-200 dark:border-slate-700">Cancel</Button>
                                    <Button type="submit" disabled={loading || purchaseItems.length === 0} className="bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                                        {loading ? 'Processing...' : (editingId ? 'Update shipment' : 'Record Shipment')}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Purchase History</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vendor, amount and balance</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                <tr>
                                    <th className="rounded-l-lg px-4 py-3">Date/Time</th>
                                    <th className="px-4 py-3">Vendor</th>
                                    <th className="px-4 py-3">Total</th>
                                    <th className="px-4 py-3">Paid</th>
                                    <th className="px-4 py-3">Balance</th>
                                    <th className="rounded-r-lg px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {purchases.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center italic text-slate-400">No procurement data found.</td></tr>
                                ) : (
                                    purchases.map((p) => (
                                        <tr key={p._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(p.createdAt).toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.vendorName}</td>
                                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">Rs. {p.totalAmount.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">Rs. {p.paidAmount.toLocaleString()}</td>
                                            <td className={`px-4 py-3 font-bold ${p.balance > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                Rs. {p.balance.toLocaleString()}
                                                {p.balance > 0 && <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">OUTSTANDING</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" className="h-9 gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700" onClick={() => setViewingPurchase(p)}>
                                                        <Eye className="h-4 w-4" /> View
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400" onClick={() => handleDelete(p._id)}>
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
                </CardContent>
            </Card>
        </div>
    );
}
