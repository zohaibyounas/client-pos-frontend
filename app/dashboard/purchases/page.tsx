'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
            <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-transparent min-h-screen">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setViewingPurchase(null)}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Purchase Details</h1>
                    <Button onClick={() => handlePrintPurchase(viewingPurchase)} className="ml-auto gap-2">
                        <Printer className="h-4 w-4" /> PRINT INVOICE
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle: Info and Items */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-none shadow-sm dark:bg-slate-900">
                            <CardHeader className="border-b dark:border-slate-800">
                                <CardTitle className="text-xl font-bold flex items-center justify-between">
                                    <span>Vendor: {viewingPurchase.vendorName}</span>
                                    <span className="text-xs text-slate-400 font-mono">ID: {viewingPurchase._id}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-[10px] font-black tracking-widest text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4">Quantity</th>
                                            <th className="px-6 py-4">Cost Price</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {viewingPurchase.items?.map((item: any, idx: number) => {
                                            const prod = products.find(p => p._id === item.product);
                                            return (
                                                <tr key={idx}>
                                                    <td className="px-6 py-4 font-bold">{prod?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4">{item.quantity}</td>
                                                    <td className="px-6 py-4">Rs. {item.costPrice}</td>
                                                    <td className="px-6 py-4 text-right font-black">Rs. {item.total}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Payment History</CardTitle>
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

                    {/* Right Side: Stats, Action, and Image */}
                    <div className="space-y-8">
                        <Card className="border-none shadow-lg bg-blue-600 text-white">
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
                            <Card className="border-none shadow-sm dark:bg-slate-900">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Add Payment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAddPayment} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="payAmount">Amount to Pay (Rs.)</Label>
                                            <Input
                                                id="payAmount"
                                                type="number"
                                                max={viewingPurchase.balance}
                                                value={paymentAmount}
                                                onChange={e => setPaymentAmount(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Button type="submit" className="w-full">Update Balance</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {viewingPurchase.billImage && (
                            <Card className="border-none shadow-sm dark:bg-slate-900 overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
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
        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight flex items-center">
                        <CreditCard className="mr-3 h-8 w-8 text-blue-600" /> Purchase Ledger
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Track vendor shipments and historical payments.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border shadow-sm" onSubmit={(e) => { e.preventDefault(); fetchPurchases(); }}>
                        <div className="flex items-center gap-2 px-2 border-r dark:border-slate-800">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <Input type="date" className="border-none shadow-none focus-visible:ring-0 w-32 h-8 text-xs font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 px-2">
                            <Input type="date" className="border-none shadow-none focus-visible:ring-0 w-32 h-8 text-xs font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <Button size="sm" type="submit" className="h-8">Filter</Button>
                    </form>
                    <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 font-bold shadow-lg shadow-blue-500/20">
                        <Plus className="h-5 w-5" /> RECORD PURCHASE
                    </Button>
                </div>
            </div>

            {showAdd && (
                <Card className="bg-white dark:bg-slate-900 border-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center pr-2">
                            <span>{editingId ? 'Updating Shipment Record' : 'New Shipment Registration'}</span>
                            <Button variant="ghost" size="icon" onClick={handleCancel}><X className="h-5 w-5" /></Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="vendorName" className="text-xs font-black uppercase text-slate-400">Vendor / Supplier</Label>
                                    <Input id="vendorName" value={formData.vendorName} onChange={handleInputChange} required className="h-11 rounded-xl" placeholder="e.g. Master Sanitary Ltd." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paidAmount" className="text-xs font-black uppercase text-slate-400">Initial Paid Amount (Rs.)</Label>
                                    <Input id="paidAmount" type="number" value={formData.paidAmount} onChange={handleInputChange} required className="h-11 rounded-xl font-black text-green-600" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400">Total Valuation</Label>
                                    <div className="h-11 flex items-center px-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black text-xl italic tracking-tighter">
                                        Rs. {Number(formData.totalAmount).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center gap-4">
                                    <h3 className="font-black uppercase tracking-widest text-xs text-blue-600">Product Line Items</h3>
                                    <div className="flex-1 max-w-md">
                                        <select
                                            className="w-full h-10 px-3 rounded-xl border bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
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
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm group">
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
                                                    <Label className="text-[9px] font-black uppercase text-slate-400">Qty</Label>
                                                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required className="h-8 font-bold" />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-[9px] font-black uppercase text-slate-400">Cost (Rs.)</Label>
                                                    <Input type="number" value={item.costPrice} onChange={(e) => updateItem(idx, 'costPrice', e.target.value)} required className="h-8 font-black text-blue-600" />
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
                                        <div className="text-center py-12 border-2 border-dashed rounded-3xl border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3 text-slate-300">
                                            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                                <Search className="h-8 w-8" />
                                            </div>
                                            <p className="font-black uppercase tracking-widest text-xs">Search and select products to record shipment</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex-1 w-full space-y-2">
                                    <Label htmlFor="billImage" className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" /> Evidence / Bill Image
                                    </Label>
                                    <Input id="billImage" type="file" onChange={handleFileChange} accept="image/*" className="h-11 rounded-xl file:bg-blue-50 file:text-blue-600 file:border-none file:font-black file:uppercase file:text-[10px]" />
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <Button variant="outline" type="button" onClick={handleCancel} className="h-12 px-8 font-bold border-2 rounded-xl">Cancel</Button>
                                    <Button type="submit" disabled={loading || purchaseItems.length === 0} className="h-12 px-12 font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-500/20">
                                        {loading ? 'Processing...' : (editingId ? 'Update shipment' : 'Record Shipment')}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Date/Time</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Vendor</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Total Valuation</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Settled (Paid)</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Balance (Credit)</th>
                            <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right pr-10">Analysis</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {purchases.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-25">No procurement data found</td></tr>
                        ) : (
                            purchases.map((p) => (
                                <tr key={p._id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors group">
                                    <td className="px-6 py-5 text-xs text-slate-500 font-bold">
                                        {new Date(p.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-sm font-black uppercase">{p.vendorName}</td>
                                    <td className="px-6 py-5 text-sm font-bold tracking-tight">Rs. {p.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-5 text-sm text-green-600 font-black">Rs. {p.paidAmount.toLocaleString()}</td>
                                    <td className={`px-6 py-5 text-sm font-black ${p.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        <div className="flex items-center gap-2">
                                            Rs. {p.balance.toLocaleString()}
                                            {p.balance > 0 && <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black italic">OUTSTANDING</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right flex justify-end gap-2 pr-10">
                                        <Button variant="secondary" size="sm" className="gap-2 h-9 font-bold rounded-lg shadow-sm" onClick={() => setViewingPurchase(p)}>
                                            <Eye className="h-4 w-4" /> VIEW RECORD
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(p._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
