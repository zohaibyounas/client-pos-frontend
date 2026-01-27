'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, ShoppingCart, Trash2, Printer, CheckCircle, History, Filter, X, Package, FileText, User, ArrowRightLeft, Settings2, Pencil } from 'lucide-react';
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
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [remarks, setRemarks] = useState('');
    const [referenceNo, setReferenceNo] = useState('');

    // History State

    // Phase 7 States: Print Options & Editing
    const [stores, setStores] = useState<any[]>([]);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [selectedPrintStore, setSelectedPrintStore] = useState<any>(null);
    const [isChallan, setIsChallan] = useState(false);
    const [printingSale, setPrintingSale] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSale, setEditingSale] = useState<any>(null);
    const [editFormData, setEditFormData] = useState<any>({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        referenceNo: '',
        remarks: ''
    });

    const barcodeRef = useRef<HTMLInputElement>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchProducts();
        fetchSales();
        fetchStores();
        barcodeRef.current?.focus();
    }, []);

    const fetchStores = async () => {
        try {
            const res = await api.get('/stores');
            setStores(res.data);
            // Pre-select current store from local storage
            const storeStored = localStorage.getItem('selectedStore');
            if (storeStored) {
                const s = JSON.parse(storeStored);
                setSelectedPrintStore(s);
            }
        } catch (error) {
            console.error('Failed to fetch stores', error);
        }
    };

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
        // Feature removed as per user request to simplify and remove quotations
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
            type: 'invoice',
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

    const handleEditMetadata = (sale: any) => {
        setEditingSale(sale);
        setEditFormData({
            customerName: sale.customerName || '',
            customerPhone: sale.customerPhone || '',
            customerAddress: sale.customerAddress || '',
            referenceNo: sale.referenceNo || '',
            remarks: sale.remarks || ''
        });
        setShowEditModal(true);
    };

    const saveMetadata = async () => {
        try {
            setLoading(true);
            await api.put(`/sales/${editingSale._id}`, editFormData);
            setShowEditModal(false);
            fetchSales();
        } catch (error) {
            console.error('Failed to update sale', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (sale: any) => {
        setPrintingSale(sale);
        setShowPrintModal(true);
    };

    const triggerPrint = (sale: any, options: { isChallan: boolean, customStore?: any }) => {
        const WindowPrt = window.open('', '_blank', 'width=900,height=900');
        if (!WindowPrt) {
            alert('Please allow pop-ups to print the receipt');
            return;
        }

        const { isChallan, customStore } = options;
        const displayStore = customStore || sale.store;

        const title = isChallan ? 'DELIVERY CHALLAN' : 'SALES INVOICE';

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
                ${!isChallan ? `<td style="text-align: right;">${item.price.toLocaleString()}</td>` : ''}
                ${!isChallan ? `<td style="text-align: right;">${(item.quantity * item.price).toLocaleString()}</td>` : ''}
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${title} - ${sale.invoiceId}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@200;300;400;500;600;700;800;900&display=swap');
                        
                        body { 
                            font-family: 'Outfit', sans-serif; margin: 0; padding: 0; color: #1e293b; background: #f1f5f9; -webkit-print-color-adjust: exact;
                        }
                        
                        .container { 
                            width: 210mm; min-height: 297mm; background: #fff; margin: 10mm auto; padding: 15mm; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.1); position: relative; box-sizing: border-box;
                        }

                        .decorative-top { position: absolute; top: 0; left: 0; right: 0; height: 10px; background: linear-gradient(90deg, #0f172a 0%, #3b82f6 100%); }

                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; margin-bottom: 50px; }

                        .brand h1 { font-family: 'Space Grotesk', sans-serif; font-size: 44px; font-weight: 800; letter-spacing: -3px; color: #0f172a; margin: 0; text-transform: uppercase; line-height: 0.9; }
                        
                        .brand p { font-size: 11px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 3px; margin-top: 8px; }

                        .store-info { margin-top: 25px; font-size: 13px; line-height: 1.6; color: #64748b; font-weight: 500; }

                        .invoice-badge { text-align: right; }

                        .badge-text { background: #0f172a; color: white; padding: 12px 30px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; border-radius: 4px; display: inline-block; margin-bottom: 25px; }

                        .meta-list { font-size: 13px; font-weight: 700; display: grid; gap: 10px; color: #94a3b8; }
                        
                        .meta-list span { color: #0f172a; font-weight: 800; margin-left: 15px; }

                        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; border-top: 1px solid #f1f5f9; padding-top: 30px; }

                        .detail-label { font-size: 10px; font-weight: 900; color: #cbd5e1; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; }

                        .detail-main { font-size: 18px; font-weight: 800; color: #0f172a; }
                        .detail-sub { font-size: 13px; color: #64748b; margin-top: 5px; }

                        table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
                        th { padding: 15px; text-align: left; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #0f172a; }
                        td { padding: 20px 15px; font-size: 15px; border-bottom: 1px solid #f1f5f9; }

                        .item-name { font-weight: 800; color: #0f172a; font-size: 16px; }
                        .item-sku { font-size: 11px; color: #94a3b8; font-weight: 700; margin-top: 4px; }

                        .bottom-section { display: flex; justify-content: space-between; gap: 60px; page-break-inside: avoid; }

                        .remarks-box { flex: 1; background: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #f1f5f9; }

                        .totals-box { width: 320px; }
                        .total-row { display: flex; justify-content: space-between; padding: 10px 0; color: #64748b; font-weight: 600; font-size: 14px; }
                        .total-row.grand { border-top: 2px solid #0f172a; margin-top: 15px; padding-top: 25px; font-size: 32px; font-weight: 950; color: #0f172a; font-family: 'Space Grotesk', sans-serif; letter-spacing: -1px; }

                        .footer { margin-top: 100px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 700; border-top: 1px dashed #e2e8f0; padding-top: 40px; }

                        @media print { body { background: #fff; } .container { box-shadow: none; margin: 0; width: 100%; padding: 10mm; border: none; } }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="decorative-top"></div>
                        <div class="header">
                            <div class="brand">
                                <h1>${displayStore?.name || 'STORE NAME'}</h1>
                                <p>Premium Sanitary & Lifestyle Solutions</p>
                                <div class="store-info">
                                    ${displayStore?.location || 'Main Business Hub Address'}<br>
                                    T: ${displayStore?.contactNumber || 'Contact Office'} | E: business@pos.com
                                </div>
                            </div>
                            <div class="invoice-badge">
                                <div class="badge-text">${title}</div>
                                <div class="meta-list">
                                    <div>INVOICE REF # <span>${sale.invoiceId}</span></div>
                                    <div>DATE OF ISSUE <span>${new Date(sale.createdAt).toLocaleDateString()}</span></div>
                                    ${sale.referenceNo ? `<div>EXTERNAL REF <span>${sale.referenceNo}</span></div>` : ''}
                                </div>
                            </div>
                        </div>

                        <div class="details-grid">
                            <div>
                                <div class="detail-label">Billing Entity</div>
                                <div class="detail-main">${sale.customerName || 'Cash / Walk-in Customer'}</div>
                                <div class="detail-sub">${sale.customerPhone || ''}<br>${sale.customerAddress || ''}</div>
                            </div>
                            <div style="text-align: right">
                                <div class="detail-label">Financial Status</div>
                                <div class="detail-main" style="color: #3b82f6">${sale.paidAmount >= sale.totalAmount ? 'Fully Discharged' : 'Pending Settlement'}</div>
                                <div class="detail-sub">Operator: ${sale.salesman?.name || 'Authorized Staff'}</div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40px">#</th>
                                    <th>Article Description</th>
                                    <th style="width: 100px; text-align: center">Quantity</th>
                                    ${!isChallan ? `<th style="width: 130px; text-align: right">Unit Valuation</th>` : ''}
                                    ${!isChallan ? `<th style="width: 150px; text-align: right">Net Amount</th>` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${sale.items?.map((item: any, index: number) => `
                                    <tr>
                                        <td style="color: #cbd5e1; font-weight: 800;">${String(index + 1).padStart(2, '0')}</td>
                                        <td>
                                            <div class="item-name">${item.product?.name}</div>
                                            <div class="item-sku">Serial/Code: ${item.product?.barcode}</div>
                                        </td>
                                        <td style="text-align: center; font-weight: 800; color: #0f172a;">${item.quantity}</td>
                                        ${!isChallan ? `<td style="text-align: right; color: #64748b; font-weight: 600;">Rs. ${item.price.toLocaleString()}</td>` : ''}
                                        ${!isChallan ? `<td style="text-align: right; font-weight: 900; color: #0f172a;">Rs. ${(item.quantity * item.price).toLocaleString()}</td>` : ''}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="bottom-section">
                            <div class="remarks-box">
                                <div class="detail-label">Legal Notes & Instructions</div>
                                <div style="font-size: 13px; color: #475569; line-height: 1.7; font-style: italic;">
                                    ${sale.remarks || 'No specific terms documented for this transaction. Standard warranty and exchange policy applies as per store guidelines.'}
                                </div>
                            </div>
                            
                            ${!isChallan ? `
                            <div class="totals-box">
                                <div class="total-row"><span>Gross Subtotal</span><span style="color:#0f172a">Rs. ${sale.subtotal.toLocaleString()}</span></div>
                                <div class="total-row"><span>Campaign Discount</span><span style="color:#bc1a1a">- Rs. ${sale.invoiceDiscount.toLocaleString()}</span></div>
                                <div class="total-row grand"><span>Total</span><span>Rs. ${sale.totalAmount.toLocaleString()}</span></div>
                                <div class="total-row" style="margin-top: 15px; font-weight: 900; font-size: 16px; color: #059669;">
                                    <span>Received PKR</span><span>Rs. ${sale.paidAmount.toLocaleString()}</span>
                                </div>
                                <div class="total-row" style="font-weight: 900; color: #bc1a1a;">
                                    <span>Outstanding</span><span>Rs. ${(sale.totalAmount - sale.paidAmount).toLocaleString()}</span>
                                </div>
                            </div>
                            ` : ''}
                        </div>

                        <div class="footer">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 70px;">
                                <div style="border-top: 2px solid #0f172a; width: 220px; padding-top: 15px; text-transform: uppercase; letter-spacing: 1px;">Customer Signature</div>
                                <div style="border-top: 2px solid #0f172a; width: 220px; padding-top: 15px; text-transform: uppercase; letter-spacing: 1px;">Authorized Office Control</div>
                            </div>
                            AUTHENTICATED SYSTEM GENERATED DOCUMENT. NO SIGNATURE REQUIRED. <br>
                            BUILD VERSION 2.0.1 | POWERED BY SANITARY POS PRO HUB
                        </div>
                    </div>
                </body>
            </html>
        `;

        WindowPrt.document.write(html);
        WindowPrt.document.close();
        WindowPrt.focus();
    };

    if (lastInvoice) {
        return (
            <>
                <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
                    <Card className="w-full max-w-sm border-slate-200 text-center dark:border-slate-800 dark:bg-slate-900">
                        <CardContent className="pt-8">
                            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-500 dark:text-emerald-400" />
                            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Sale Completed!</h2>
                            <p className="mb-6 font-mono text-slate-500 dark:text-slate-400">#{lastInvoice.invoiceId}</p>
                            <div className="flex flex-col gap-3">
                                <Button onClick={() => handlePrint(lastInvoice)} className="h-12 gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700" size="lg">
                                    <Printer className="h-5 w-5" /> Print Bill / Challan
                                </Button>
                                <Button onClick={() => setLastInvoice(null)} variant="outline" className="h-12 border-slate-200 dark:border-slate-700" size="lg">
                                    Return to POS
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {renderModals()}
            </>
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
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    {/* Left side: Product Selection */}
                    <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                    <div className="w-full lg:w-[450px] bg-white dark:bg-slate-900 border-l dark:border-slate-800 flex flex-col shadow-2xl z-20 shrink-0">
                        <div className="p-6 border-b shrink-0 bg-white dark:bg-slate-900 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black flex items-center tracking-tight">
                                    <ShoppingCart className="mr-3 h-6 w-6 text-blue-600" />
                                    TRANSACTION
                                </h2>
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
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
                    <div className="mx-auto max-w-6xl space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                                    <History className="h-8 w-8 text-blue-600 dark:text-blue-400" /> Sales History
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">View and print past invoices.</p>
                            </div>
                        </div>

                        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-white">Historical Sales Data</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invoice ID, customer and amount</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                                            <tr>
                                                <th className="rounded-l-lg px-4 py-3">ID</th>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Customer</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="rounded-r-lg px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {sales.length === 0 ? (
                                                <tr><td colSpan={6} className="px-4 py-8 text-center italic text-slate-400">No sales found.</td></tr>
                                            ) : (
                                                sales.map((sale) => (
                                                    <tr key={sale._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="px-4 py-3 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                                                            {sale.invoiceId}
                                                            {sale.referenceNo && <span className="block text-[10px] font-normal text-slate-400">Ref: {sale.referenceNo}</span>}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(sale.createdAt).toLocaleString()}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{sale.customerName || sale.customer?.name || 'Walk-in'}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">Rs. {sale.totalAmount.toLocaleString()}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={cn(
                                                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                                                sale.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                                sale.paymentStatus === 'partial' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                            )}>
                                                                {sale.paymentStatus}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button variant="ghost" size="icon" title="Edit Details" className="h-9 w-9 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400" onClick={() => handleEditMetadata(sale)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400" onClick={() => handlePrint(sale)}>
                                                                    <Printer className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400" onClick={() => handleVoid(sale._id)}>
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
                </div>
            )}
            {renderModals()}
        </div>
    );

    function renderModals() {
        return (
            <>
                {/* Print Options Modal */}
                {showPrintModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <Card className="w-full max-w-2xl shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-200">
                            <CardHeader className="bg-slate-900 text-white">
                                <CardTitle className="flex items-center gap-2 text-xl font-black italic tracking-tight">
                                    <Settings2 className="h-6 w-6 text-blue-400" />
                                    ADVANCED PRINT CONTROLLER
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                                            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">1. Store Branding</Label>
                                        </div>
                                        <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase">Load Header Preset</Label>
                                                <select
                                                    className="w-full h-11 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold shadow-sm focus:border-blue-500 outline-none px-3"
                                                    onChange={(e) => {
                                                        const s = stores.find(st => st._id === e.target.value);
                                                        if (s) setSelectedPrintStore({ ...s });
                                                    }}
                                                    value={selectedPrintStore?._id || ''}
                                                >
                                                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Edit Business Identity</Label>
                                                <Input
                                                    value={selectedPrintStore?.name || ''}
                                                    onChange={(e) => setSelectedPrintStore({ ...selectedPrintStore, name: e.target.value })}
                                                    className="h-10 font-black border-slate-200"
                                                    placeholder="Store Name"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <Input
                                                    value={selectedPrintStore?.contactNumber || ''}
                                                    onChange={(e) => setSelectedPrintStore({ ...selectedPrintStore, contactNumber: e.target.value })}
                                                    className="h-10 text-sm font-bold border-slate-200"
                                                    placeholder="Contact Number"
                                                />
                                                <Input
                                                    value={selectedPrintStore?.location || ''}
                                                    onChange={(e) => setSelectedPrintStore({ ...selectedPrintStore, location: e.target.value })}
                                                    className="h-10 text-sm border-slate-200"
                                                    placeholder="Business Location"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                                                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">2. Document Mode</Label>
                                            </div>
                                            <div
                                                className={cn(
                                                    "p-5 rounded-2xl border-2 transition-all cursor-pointer group flex items-center justify-between",
                                                    !isChallan ? "border-blue-600 bg-blue-50/50 shadow-md" : "border-slate-100 hover:border-slate-200"
                                                )}
                                                onClick={() => setIsChallan(false)}
                                            >
                                                <div>
                                                    <span className="font-black text-sm text-slate-800 tracking-tight">SALES INVOICE</span>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-1">Include full pricing & financial totals</p>
                                                </div>
                                                {!isChallan && <CheckCircle className="h-6 w-6 text-blue-600" />}
                                            </div>
                                            <div
                                                className={cn(
                                                    "p-5 rounded-2xl border-2 transition-all cursor-pointer group flex items-center justify-between",
                                                    isChallan ? "border-orange-600 bg-orange-50/50 shadow-md" : "border-slate-100 hover:border-slate-200"
                                                )}
                                                onClick={() => setIsChallan(true)}
                                            >
                                                <div>
                                                    <span className="font-black text-sm text-slate-800 tracking-tight text-orange-700">DELIVERY CHALLAN</span>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-1">Render document without financial data</p>
                                                </div>
                                                {isChallan && <CheckCircle className="h-6 w-6 text-orange-600" />}
                                            </div>
                                        </div>

                                        <div className="p-5 bg-slate-900 text-slate-400 rounded-2xl">
                                            <p className="text-[10px] font-bold leading-relaxed italic">
                                                Note: Header overrides are session-based. For permanent changes to store info, visit the Store Management console.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between gap-4 p-8 bg-slate-50 dark:bg-slate-900/80 border-t">
                                <Button variant="ghost" onClick={() => setShowPrintModal(false)} className="font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                                    Abort
                                </Button>
                                <Button onClick={() => {
                                    triggerPrint(printingSale, { isChallan, customStore: selectedPrintStore });
                                    setShowPrintModal(false);
                                }} className={cn(
                                    "px-12 h-14 text-base font-black uppercase tracking-[0.2em] shadow-2xl transition-all border-b-4 active:border-b-0 active:translate-y-1 rounded-2xl ring-offset-2 focus:ring-2",
                                    isChallan ? "bg-orange-600 hover:bg-orange-700 border-orange-800 ring-orange-500" : "bg-blue-600 hover:bg-blue-700 border-blue-800 ring-blue-500"
                                )}>
                                    <Printer className="mr-3 h-6 w-6" />
                                    {isChallan ? 'Print Challan' : 'Print Invoice'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}

                {/* Edit Details Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <Card className="w-full max-w-lg shadow-2xl border-none overflow-hidden rounded-3xl">
                            <CardHeader className="bg-slate-900 text-white p-6">
                                <CardTitle className="flex items-center gap-2 font-black tracking-tighter uppercase italic">
                                    <Pencil className="h-5 w-5 text-blue-400" />
                                    Synchronize Metadata
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client Identity / Name</Label>
                                        <Input
                                            value={editFormData.customerName}
                                            onChange={e => setEditFormData({ ...editFormData, customerName: e.target.value })}
                                            className="h-12 font-black border-2 focus:border-blue-500 rounded-xl"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Communication (Phone)</Label>
                                            <Input
                                                value={editFormData.customerPhone}
                                                onChange={e => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                                                className="h-12 font-bold border-2 focus:border-blue-500 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Control Reference</Label>
                                            <Input
                                                value={editFormData.referenceNo}
                                                onChange={e => setEditFormData({ ...editFormData, referenceNo: e.target.value })}
                                                className="h-12 font-mono border-2 focus:border-blue-500 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Logistics (Address)</Label>
                                        <Input
                                            value={editFormData.customerAddress}
                                            onChange={e => setEditFormData({ ...editFormData, customerAddress: e.target.value })}
                                            className="h-12 border-2 focus:border-blue-500 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Transaction Remarks</Label>
                                        <Input
                                            value={editFormData.remarks}
                                            onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })}
                                            className="h-12 italic border-2 focus:border-blue-500 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-3 px-8 pb-8">
                                <Button variant="ghost" onClick={() => setShowEditModal(false)} className="font-bold">Discard</Button>
                                <Button onClick={saveMetadata} disabled={loading} className="bg-slate-900 hover:bg-black text-white px-10 h-12 font-black uppercase tracking-widest shadow-xl rounded-xl">
                                    {loading ? 'Updating...' : 'Commit Changes'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </>
        );
    }
}
