'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, ShoppingCart, Trash2, Printer, CheckCircle, History, Filter, X, Package } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function POSPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [discount, setDiscount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [activeMode, setActiveMode] = useState<'sale' | 'history'>('sale');
    const [sales, setSales] = useState<any[]>([]);
    const [lastInvoice, setLastInvoice] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const barcodeRef = useRef<HTMLInputElement>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchProducts();
        fetchSales();
        barcodeRef.current?.focus();
    }, []);

    const fetchSales = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/sales?${params.toString()}`);
            setSales(res.data);
        } catch (error) {
            console.error('Failed to fetch sales', error);
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

    const addToCart = (product: any) => {
        const existing = cart.find(item => item._id === product._id);
        if (existing) {
            setCart(cart.map(item =>
                item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setSearchTerm('');
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item._id !== id));
    };

    const updateQuantity = (id: string, q: number) => {
        if (q < 1) return;
        setCart(cart.map(item => item._id === id ? { ...item, quantity: q } : item));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
    const total = subtotal - discount;

    const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        const product = products.find(p => p.barcode === val);
        if (product) {
            addToCart(product);
            setSearchTerm('');
        }
    };

    const handleVoid = async (id: string) => {
        if (!confirm('Are you sure you want to void this sale? Stock will be reverted.')) return;
        try {
            await api.delete(`/sales/${id}`);
            fetchSales();
            fetchProducts();
        } catch (error) {
            console.error('Void failed', error);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        const userStored = localStorage.getItem('user');
        const user = userStored ? JSON.parse(userStored) : {};
        const storeStored = localStorage.getItem('selectedStore');
        const storeObj = storeStored ? JSON.parse(storeStored) : null;

        const saleData = {
            store: storeObj?._id || user.store,
            salesman: user._id,
            items: cart.map(item => ({
                product: item._id,
                quantity: item.quantity,
                price: item.salePrice,
                total: item.salePrice * item.quantity
            })),
            subtotal,
            invoiceDiscount: discount,
            totalAmount: total,
            paidAmount: paidAmount || total
        };

        try {
            const res = await api.post('/sales', saleData);
            setLastInvoice(res.data);
            setCart([]);
            setDiscount(0);
            setPaidAmount(0);
            fetchSales();
            fetchProducts();
        } catch (error) {
            console.error('Checkout failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (sale: any) => {
        const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
        if (!WindowPrt) return;

        const itemsHtml = sale.items?.map((item: any) => `
            <div class="item-row">
                <div class="bold">${item.product?.name || 'Item'}</div>
                <div class="flex">
                    <span>${item.quantity} x Rs.${item.price}</span>
                    <span>Rs.${(item.quantity * item.price).toFixed(0)}</span>
                </div>
            </div>
        `).join('');

        const html = `
            <html>
                <head>
                    <title>Receipt - ${sale.invoiceId}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; color: #000; }
                        .center { text-align: center; }
                        .bold { font-weight: bold; }
                        .divider { border-top: 1px dashed #000; margin: 5px 0; }
                        .flex { display: flex; justify-content: space-between; }
                        .item-row { margin-bottom: 3px; }
                        .header { margin-bottom: 10px; }
                        .footer { margin-top: 10px; font-size: 10px; }
                        @media print {
                            body { width: 80mm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="center header">
                        <h2 class="bold" style="margin: 0;">STORE RECEIPT</h2>
                        <p style="margin: 0;">${sale.store?.name || 'My Store'}</p>
                        <p style="margin: 0;">Date: ${new Date(sale.createdAt).toLocaleString()}</p>
                        <p style="margin: 0;">Invoice: ${sale.invoiceId}</p>
                    </div>
                    <div class="divider"></div>
                    <div class="bold flex" style="margin-bottom: 5px;">
                        <span>Item</span>
                        <span>Qty x Price</span>
                        <span>Total</span>
                    </div>
                    <div class="divider"></div>
                    ${itemsHtml}
                    <div class="divider"></div>
                    <div class="flex">
                        <span>Subtotal:</span>
                        <span>Rs.${(sale.subtotal || 0).toFixed(0)}</span>
                    </div>
                    <div class="flex">
                        <span>Discount:</span>
                        <span>Rs.${(sale.invoiceDiscount || 0).toFixed(0)}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="flex bold" style="font-size: 14px;">
                        <span>GRAND TOTAL:</span>
                        <span>Rs.${(sale.totalAmount || 0).toFixed(0)}</span>
                    </div>
                    <div class="flex">
                        <span>Paid Amount:</span>
                        <span>Rs.${(sale.paidAmount || 0).toFixed(0)}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="center footer">
                        <p>Thank you for shopping with us!</p>
                        <p>Powered by POS System</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            // window.close(); // Optional: remove if causing issues
                        };
                    </script>
                </body>
            </html>
        `;

        WindowPrt.document.write(html);
        WindowPrt.document.close();
        WindowPrt.focus();
    };

    if (lastInvoice) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
                <Card className="w-full max-w-sm text-center p-8 shadow-2xl border-none">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Sale Completed!</h2>
                    <p className="text-slate-500 mb-6 font-mono">#{lastInvoice.invoiceId}</p>

                    <div className="flex flex-col gap-3">
                        <Button onClick={() => handlePrint(lastInvoice)} className="w-full h-12 gap-2 text-lg">
                            <Printer className="h-5 w-5" /> Print Thermal Receipt
                        </Button>
                        <Button onClick={() => setLastInvoice(null)} variant="outline" className="w-full h-12">
                            Return to POS
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50/30 dark:bg-slate-950">
            {/* Top Navigation for POS */}
            <div className="bg-white dark:bg-slate-900 border-b px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center", activeMode === 'sale' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 border border-slate-200 dark:border-slate-600" : "text-slate-500 hover:text-slate-700")}
                        onClick={() => setActiveMode('sale')}
                    >
                        <ShoppingCart className="mr-2 h-4 w-4" /> NEW SALE
                    </button>
                    <button
                        className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center", activeMode === 'history' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 border border-slate-200 dark:border-slate-600" : "text-slate-500 hover:text-slate-700")}
                        onClick={() => setActiveMode('history')}
                    >
                        <History className="mr-2 h-4 w-4" /> SALES HISTORY
                    </button>
                </div>

                {activeMode === 'history' && (
                    <div className="flex items-center gap-2">
                        <Input type="date" className="h-9 w-36" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <Input type="date" className="h-9 w-36" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        <Button size="sm" onClick={fetchSales} className="h-9 px-4">Filter</Button>
                        {(startDate || endDate) && <Button size="icon" variant="ghost" onClick={() => { setStartDate(''); setEndDate(''); fetchSales(); }}><X className="h-4 w-4" /></Button>}
                    </div>
                )}
            </div>

            {activeMode === 'sale' ? (
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Left side: Product Selection */}
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                        <div className="relative group">
                            <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                ref={barcodeRef}
                                placeholder="Search products or scan barcode (Product Code)..."
                                className="pl-12 h-14 text-lg rounded-2xl border-2 focus:border-blue-500/50 shadow-sm bg-white dark:bg-slate-900"
                                value={searchTerm}
                                onChange={handleBarcodeChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {products.filter(p =>
                                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(p => (
                                <Card
                                    key={p._id}
                                    className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all dark:bg-slate-900 overflow-hidden relative group"
                                    onClick={() => addToCart(p)}
                                >
                                    <CardContent className="p-4 flex flex-col items-center">
                                        <div className="w-full h-24 mb-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                                            {p.image ? (
                                                <img src={`http://localhost:5000${p.image}`} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Search className="h-8 w-8 text-slate-300" />
                                            )}
                                        </div>
                                        <p className="font-bold text-sm text-center mb-1 truncate w-full dark:text-white uppercase">{p.name}</p>
                                        <div className="flex flex-col items-center">
                                            <span className="text-blue-600 dark:text-blue-400 font-extrabold text-lg">Rs. {p.salePrice}</span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-500 uppercase tracking-tighter">Code: {p.barcode}</span>
                                        </div>
                                        <div className={cn(
                                            "mt-2 text-[10px] font-bold px-2 py-0.5 rounded",
                                            p.totalStock > 10 ? "text-green-600" : "text-red-500"
                                        )}>
                                            STOCK: {p.totalStock}
                                        </div>
                                    </CardContent>
                                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Right side: Cart & Checkout */}
                    <div className="w-full md:w-[450px] bg-white dark:bg-slate-900 border-l dark:border-slate-800 flex flex-col shadow-2xl z-20">
                        <div className="p-6 border-b flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
                            <h2 className="text-xl font-black flex items-center tracking-tight">
                                <ShoppingCart className="mr-3 h-6 w-6 text-blue-600" /> ACTIVE CART
                            </h2>
                            <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                                {cart.length} ITEMS
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-50 space-y-4">
                                    <ShoppingCart className="h-20 w-20" />
                                    <p className="font-bold uppercase tracking-widest text-xs">Waiting for items...</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item._id} className="flex gap-4 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 group relative shadow-sm hover:shadow-md transition-all">
                                        <div className="h-16 w-16 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 border dark:border-slate-700">
                                            {item.image ? (
                                                <img src={`http://localhost:5000${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="h-6 w-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0">
                                                    <p className="font-black text-[13px] uppercase truncate pr-2 leading-tight">{item.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Rs. {item.salePrice} / unit</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                    onClick={() => removeFromCart(item._id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg p-0.5 border shadow-inner">
                                                    <Button size="icon" variant="ghost" className="h-5 w-5 rounded-md" onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</Button>
                                                    <span className="text-[11px] font-black w-4 text-center">{item.quantity}</span>
                                                    <Button size="icon" variant="ghost" className="h-5 w-5 rounded-md" onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</Button>
                                                </div>
                                                <p className="font-black text-[15px] text-blue-600 dark:text-blue-400 tracking-tight italic">Rs. {(item.salePrice * item.quantity).toFixed(0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-8 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 space-y-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>SUBTOTAL:</span>
                                    <span>Rs. {subtotal.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <Label htmlFor="discount" className="text-[10px] font-black text-slate-400 uppercase ml-2">Discount (Rs.)</Label>
                                    <Input
                                        id="discount"
                                        type="number"
                                        className="w-24 h-8 text-right font-black border-none focus-visible:ring-0"
                                        value={discount}
                                        onChange={e => setDiscount(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-end pt-2">
                                <span className="text-xs font-black text-slate-400 uppercase">Grand Total:</span>
                                <span className="text-4xl font-black text-blue-600 dark:text-white tracking-tighter italic">Rs. {total.toFixed(0)}</span>
                            </div>

                            <div className="pt-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="paid" className="text-[10px] font-black text-slate-400 uppercase">Amount Received (PKR)</Label>
                                    <Input
                                        id="paid"
                                        type="number"
                                        className="w-full h-14 text-center text-3xl font-black rounded-2xl border-2 border-blue-500/20 bg-white dark:bg-slate-900"
                                        placeholder={total.toString()}
                                        value={paidAmount || ''}
                                        onChange={e => setPaidAmount(Number(e.target.value))}
                                    />
                                </div>
                                <Button
                                    className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-xl rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    disabled={cart.length === 0 || loading}
                                    onClick={handleCheckout}
                                >
                                    {loading ? 'Processing...' : 'Complete Sale & Print'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <h2 className="text-2xl font-black flex items-center pr-4">
                            <History className="mr-3 h-8 w-8 text-blue-600" /> HISTORICAL DATA
                        </h2>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border dark:border-slate-800 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Invoice ID</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Date/Time</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Salesman</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Total Amount</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-800">
                                    {sales.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-25">No transaction history recorded</td></tr>
                                    ) : (
                                        sales.map((sale) => (
                                            <tr key={sale._id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors group">
                                                <td className="px-6 py-5 font-mono text-sm font-black text-blue-600">{sale.invoiceId}</td>
                                                <td className="px-6 py-5 text-xs text-slate-500 font-medium">{new Date(sale.createdAt).toLocaleString()}</td>
                                                <td className="px-6 py-5 text-sm font-bold">{sale.salesman?.name}</td>
                                                <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white">Rs. {sale.totalAmount.toLocaleString()}</td>
                                                <td className="px-6 py-5">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                                                        sale.paymentStatus === 'paid' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                    )}>
                                                        {sale.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => handlePrint(sale)}>
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleVoid(sale._id)}>
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
                </div>
            )}
        </div>
    );
}
