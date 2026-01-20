'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, ShoppingCart, Trash2, Printer, CheckCircle, History, Filter, X, Package, FileText, User, ArrowRightLeft } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function POSPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [discount, setDiscount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [activeMode, setActiveMode] = useState<'sale' | 'history'>('sale');
    const [sales, setSales] = useState<any[]>([]);
    const [lastInvoice, setLastInvoice] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // New State for Phase 3
    const [transactionType, setTransactionType] = useState<'invoice' | 'quotation'>('invoice');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [remarks, setRemarks] = useState('');
    const [referenceNo, setReferenceNo] = useState('');

    // History State
    const [activeHistoryTab, setActiveHistoryTab] = useState<'invoice' | 'quotation'>('invoice');

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

    const handleConvert = async (saleId: string) => {
        if (!confirm('Convert this quotation to an invoice? Stock will be deducted.')) return;
        try {
            await api.put(`/sales/${saleId}/convert`);
            fetchSales();
            fetchProducts(); // Update stock
        } catch (error: any) {
            alert(error.response?.data?.message || 'Conversion failed');
        }
    };

    const fetchCustomers = async (search: string = '') => {
        try {
            const query = search ? `/phone/${search}` : '';
            const res = await api.get(`/customers${query}`);
            setCustomers(Array.isArray(res.data) ? res.data : [res.data]);
        } catch (error) {
            console.error('Failed to fetch customers', error);
            setCustomers([]);
        }
    };

    const handleCustomerSelection = (customer: any) => {
        setSelectedCustomer(customer);
        setCustomerSearch('');
        setCustomers([]); // clear search results
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
            paidAmount: paidAmount || total,
            // New Fields
            type: transactionType,
            customer: selectedCustomer?._id,
            customerName: selectedCustomer?.name,
            customerPhone: selectedCustomer?.phone,
            customerAddress: selectedCustomer?.address,
            referenceNo,
            remarks
        };

        try {
            const res = await api.post('/sales', saleData);
            setLastInvoice(res.data);
            setCart([]);
            setDiscount(0);
            setPaidAmount(0);
            // Reset new fields
            setSelectedCustomer(null);
            setRemarks('');
            setReferenceNo('');
            // Don't reset transactionType, user likely wants to continue in same mode
            fetchSales();
            fetchProducts();
        } catch (error) {
            console.error('Checkout failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (sale: any) => {
        const WindowPrt = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
        if (!WindowPrt) return;

        const isQuote = sale.type === 'quotation' || sale.type === 'estimate';
        const title = isQuote ? 'QUOTATION / ESTIMATE' : 'SALES INVOICE';
        const customerHtml = sale.customerName
            ? `<div class="box-content">
                <strong>TO:</strong><br/>
                ${sale.customerName}<br/>
                ${sale.customerPhone || ''}<br/>
                ${sale.customerAddress || ''}
               </div>`
            : `<div class="box-content"><strong>TO:</strong><br/>Cash / Walk-in Customer</div>`;

        const itemsHtml = sale.items?.map((item: any, index: number) => `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.product?.name || 'Item'}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${item.price.toLocaleString()}</td>
                <td style="text-align: right;">${(item.quantity * item.price).toLocaleString()}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${title} - ${sale.invoiceId}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #000; font-size: 12px; }
                        .container { width: 190mm; margin: 0 auto; border: 1px solid #ccc; padding: 20px; min-height: 270mm; position: relative; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                        .store-name { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                        .store-info { font-size: 11px; margin-top: 5px; color: #444; }
                        
                        .invoice-title { text-align: center; font-size: 18px; font-weight: bold; background: #000; color: #fff; padding: 5px; margin: 15px 0; border-radius: 4px; -webkit-print-color-adjust: exact; }
                        
                        .meta-container { display: flex; justify-content: space-between; margin-bottom: 20px; }
                        .meta-box { width: 48%; }
                        .box-content { border: 1px solid #ddd; padding: 10px; border-radius: 4px; height: 100px; }
                        
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; font-size: 11px; }
                        th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; -webkit-print-color-adjust: exact; }
                        
                        .totals-container { display: flex; justify-content: flex-end; }
                        .totals-table { width: 40%; }
                        .totals-table td { border: none; border-bottom: 1px solid #eee; padding: 5px; }
                        .totals-table .final-row td { border-top: 2px solid #000; font-weight: bold; font-size: 14px; }
                        
                        .footer { position: absolute; bottom: 20px; left: 20px; right: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
                        .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
                        .sig-line { border-top: 1px solid #000; width: 150px; text-align: center; font-size: 10px; padding-top: 5px; }
                        
                        .terms { font-size: 9px; color: #666; margin-top: 10px; }
                        
                        @media print {
                            body { padding: 0; background: #fff; }
                            .container { border: none; width: 100%; min-height: auto; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="store-name">${sale.store?.name || 'MY BUSINESS STORE'}</div>
                            <div class="store-info">
                                Shop #123, Main Market, City Name<br>
                                Phone: +92 300 1234567 | Email: info@mystore.com
                            </div>
                        </div>

                        <div class="invoice-title">${title}</div>

                        <div class="meta-container">
                            <div class="meta-box">
                                ${customerHtml}
                            </div>
                            <div class="meta-box">
                                <div class="box-content">
                                    <table style="width: 100%; border: none; margin: 0;">
                                        <tr><td style="border: none; padding: 2px;"><strong>NO:</strong></td><td style="border: none; padding: 2px;">${sale.invoiceId}</td></tr>
                                        <tr><td style="border: none; padding: 2px;"><strong>DATE:</strong></td><td style="border: none; padding: 2px;">${new Date(sale.createdAt).toLocaleDateString()}</td></tr>
                                        ${sale.referenceNo ? `<tr><td style="border: none; padding: 2px;"><strong>REF:</strong></td><td style="border: none; padding: 2px;">${sale.referenceNo}</td></tr>` : ''}
                                        <tr><td style="border: none; padding: 2px;"><strong>SALESMAN:</strong></td><td style="border: none; padding: 2px;">${sale.salesman?.name || 'Staff'}</td></tr>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 5%;">SN</th>
                                    <th>DESCRIPTION</th>
                                    <th style="width: 10%;">QTY</th>
                                    <th style="width: 15%; text-align: right;">RATE</th>
                                    <th style="width: 15%; text-align: right;">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <div class="totals-container">
                            <table class="totals-table">
                                <tr>
                                    <td>Sub Total:</td>
                                    <td style="text-align: right;">${(sale.subtotal || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>Discount:</td>
                                    <td style="text-align: right;">${(sale.invoiceDiscount || 0).toLocaleString()}</td>
                                </tr>
                                <tr class="final-row">
                                    <td>GRAND TOTAL:</td>
                                    <td style="text-align: right;">Rs. ${(sale.totalAmount || 0).toLocaleString()}</td>
                                </tr>
                                ${!isQuote ? `
                                <tr>
                                    <td>Paid Amount:</td>
                                    <td style="text-align: right;">${(sale.paidAmount || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>Balance Due:</td>
                                    <td style="text-align: right;">${((sale.totalAmount - sale.paidAmount) || 0).toLocaleString()}</td>
                                </tr>
                                ` : ''}
                            </table>
                        </div>

                        ${sale.remarks ? `<div style="margin-top: 10px; font-size: 11px;"><strong>Remarks:</strong> ${sale.remarks}</div>` : ''}

                        <div class="footer">
                            <div class="signatures">
                                <div class="sig-line">Receiver's Signature</div>
                                <div class="sig-line">Authorized Signature</div>
                            </div>
                            <div class="terms">
                                <strong>Terms & Conditions:</strong><br/>
                                1. Goods once sold will not be returned or exchanged.<br/>
                                2. Warranty claims as per company policy only.<br/>
                                3. This is a computer-generated invoice.
                            </div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); };
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
                        <div className="p-6 border-b shrink-0 bg-white dark:bg-slate-900 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black flex items-center tracking-tight">
                                    <ShoppingCart className="mr-3 h-6 w-6 text-blue-600" />
                                    {transactionType === 'quotation' ? 'QUOTATION' : 'SALE'}
                                </h2>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <button
                                        onClick={() => setTransactionType('invoice')}
                                        className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", transactionType === 'invoice' ? "bg-blue-600 text-white shadow" : "text-slate-500")}
                                    >
                                        Inv
                                    </button>
                                    <button
                                        onClick={() => setTransactionType('quotation')}
                                        className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", transactionType === 'quotation' ? "bg-orange-600 text-white shadow" : "text-slate-500")}
                                    >
                                        Quote
                                    </button>
                                </div>
                            </div>

                            {/* Customer Link */}
                            <div className="relative">
                                {selectedCustomer ? (
                                    <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">{selectedCustomer.name}</p>
                                                <p className="text-[10px] text-blue-500">{selectedCustomer.phone}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedCustomer(null)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Input
                                            placeholder="Search Customer (Phone)..."
                                            className="h-9 text-sm"
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(e.target.value);
                                                if (e.target.value.length > 2) fetchCustomers(e.target.value);
                                            }}
                                        />
                                        {customers.length > 0 && (
                                            <div className="absolute top-10 left-0 w-full bg-white dark:bg-slate-800 border shadow-lg rounded-lg z-50 max-h-40 overflow-y-auto">
                                                {customers.map(c => (
                                                    <div
                                                        key={c._id}
                                                        className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm"
                                                        onClick={() => handleCustomerSelection(c)}
                                                    >
                                                        <p className="font-bold">{c.name}</p>
                                                        <p className="text-xs text-slate-500">{c.phone}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Extra Fields */}
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Reference No."
                                    className="h-8 text-xs"
                                    value={referenceNo}
                                    onChange={e => setReferenceNo(e.target.value)}
                                />
                                <Input
                                    placeholder="Remarks / Note"
                                    className="h-8 text-xs"
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                />
                            </div>
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
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black flex items-center pr-4">
                                <History className="mr-3 h-8 w-8 text-blue-600" /> HISTORICAL DATA
                            </h2>
                            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveHistoryTab('invoice')}
                                    className={cn("px-4 py-2 text-sm font-bold rounded-md transition-all", activeHistoryTab === 'invoice' ? "bg-white text-blue-600 shadow" : "text-slate-500")}
                                >
                                    Invoices
                                </button>
                                <button
                                    onClick={() => setActiveHistoryTab('quotation')}
                                    className={cn("px-4 py-2 text-sm font-bold rounded-md transition-all", activeHistoryTab === 'quotation' ? "bg-white text-orange-600 shadow" : "text-slate-500")}
                                >
                                    Quotations
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border dark:border-slate-800 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">ID</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Date</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Customer</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Amount</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-800">
                                    {sales.filter(s => (s.type || 'invoice') === activeHistoryTab).length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-25">No {activeHistoryTab}s found</td></tr>
                                    ) : (
                                        sales.filter(s => (s.type || 'invoice') === activeHistoryTab).map((sale) => (
                                            <tr key={sale._id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors group">
                                                <td className="px-6 py-5 font-mono text-sm font-black text-blue-600">
                                                    {sale.invoiceId}
                                                    {sale.referenceNo && <span className="block text-[10px] text-slate-400">Ref: {sale.referenceNo}</span>}
                                                </td>
                                                <td className="px-6 py-5 text-xs text-slate-500 font-medium">{new Date(sale.createdAt).toLocaleString()}</td>
                                                <td className="px-6 py-5 text-sm font-bold">
                                                    {sale.customerName || sale.customer?.name || 'Walk-in'}
                                                </td>
                                                <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white">Rs. {sale.totalAmount.toLocaleString()}</td>
                                                <td className="px-6 py-5">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                                                        sale.paymentStatus === 'paid' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                            sale.paymentStatus === 'partial' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    )}>
                                                        {sale.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right flex justify-end gap-2">
                                                    {activeHistoryTab === 'quotation' && (
                                                        <Button variant="ghost" size="icon" title="Convert to Invoice" className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => handleConvert(sale._id)}>
                                                            <ArrowRightLeft className="h-4 w-4" />
                                                        </Button>
                                                    )}
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
