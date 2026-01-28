"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Search,
  ShoppingCart,
  Trash2,
  Printer,
  CheckCircle,
  History,
  Filter,
  X,
  Package,
  FileText,
  User,
  ArrowRightLeft,
  Settings2,
  Pencil,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<"sale" | "history">("sale");
  const [sales, setSales] = useState<any[]>([]);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // New State for Phase 3
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [remarks, setRemarks] = useState("");
  const [referenceNo, setReferenceNo] = useState("");

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
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    referenceNo: "",
    remarks: "",
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
      const res = await api.get("/stores");
      setStores(res.data);
      // Pre-select current store from local storage
      const storeStored = localStorage.getItem("selectedStore");
      if (storeStored) {
        const s = JSON.parse(storeStored);
        setSelectedPrintStore(s);
      }
    } catch (error) {
      console.error("Failed to fetch stores", error);
    }
  };

  const fetchSales = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await api.get(`/sales?${params.toString()}`);
      setSales(res.data);
    } catch (error) {
      console.error("Failed to fetch sales", error);
    }
  };

  const handleConvert = async (saleId: string) => {
    // Feature removed as per user request to simplify and remove quotations
  };

  const fetchCustomers = async (search: string = "") => {
    try {
      const query = search ? `/phone/${search}` : "";
      const res = await api.get(`/customers${query}`);
      setCustomers(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (error) {
      console.error("Failed to fetch customers", error);
      setCustomers([]);
    }
  };

  const handleCustomerSelection = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setCustomers([]); // clear search results
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item._id === product._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setSearchTerm("");
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const updateQuantity = (id: string, q: number) => {
    if (q < 1) return;
    setCart(
      cart.map((item) => (item._id === id ? { ...item, quantity: q } : item)),
    );
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0,
  );
  const total = subtotal - discount;

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    const product = products.find((p) => p.barcode === val);
    if (product) {
      addToCart(product);
      setSearchTerm("");
    }
  };

  const handleVoid = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to void this sale? Stock will be reverted.",
      )
    )
      return;
    try {
      await api.delete(`/sales/${id}`);
      fetchSales();
      fetchProducts();
    } catch (error) {
      console.error("Void failed", error);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    const userStored = localStorage.getItem("user");
    const user = userStored ? JSON.parse(userStored) : {};
    const storeStored = localStorage.getItem("selectedStore");
    const storeObj = storeStored ? JSON.parse(storeStored) : null;

    const saleData = {
      store: storeObj?._id || user.store,
      salesman: user._id,
      items: cart.map((item) => ({
        product: item._id,
        quantity: item.quantity,
        price: item.salePrice,
        total: item.salePrice * item.quantity,
      })),
      subtotal,
      invoiceDiscount: discount,
      totalAmount: total,
      paidAmount: paidAmount || total,
      // New Fields
      type: "invoice",
      customer: selectedCustomer?._id,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      customerAddress: selectedCustomer?.address,
      referenceNo,
      remarks,
    };

    try {
      const res = await api.post("/sales", saleData);
      setLastInvoice(res.data);
      setCart([]);
      setDiscount(0);
      setPaidAmount(0);
      // Reset new fields
      setSelectedCustomer(null);
      setRemarks("");
      setReferenceNo("");
      // Don't reset transactionType, user likely wants to continue in same mode
      fetchSales();
      fetchProducts();
    } catch (error) {
      console.error("Checkout failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMetadata = (sale: any) => {
    setEditingSale(sale);
    setEditFormData({
      customerName: sale.customerName || "",
      customerPhone: sale.customerPhone || "",
      customerAddress: sale.customerAddress || "",
      referenceNo: sale.referenceNo || "",
      remarks: sale.remarks || "",
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
      console.error("Failed to update sale", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (sale: any) => {
    setPrintingSale(sale);
    setShowPrintModal(true);
  };

  const triggerPrint = (
    sale: any,
    options: { isChallan: boolean; customStore?: any },
  ) => {
    const WindowPrt = window.open("", "_blank", "width=900,height=900");
    if (!WindowPrt) {
      alert("Please allow pop-ups to print the receipt");
      return;
    }

    const { isChallan, customStore } = options;
    const displayStore = customStore || sale.store;

    const title = isChallan ? "DELIVERY CHALLAN" : "SALES INVOICE";

    const customerHtml = sale.customerName
      ? `<div class="box-content">
                <strong>TO:</strong><br/>
                ${sale.customerName}<br/>
                ${sale.customerPhone || ""}<br/>
                ${sale.customerAddress || ""}
               </div>`
      : `<div class="box-content"><strong>TO:</strong><br/>Cash / Walk-in Customer</div>`;

    const itemsHtml = sale.items
      ?.map(
        (item: any, index: number) => `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.product?.name || "Item"}</td>
                <td style="text-align: center;">${item.quantity}</td>
                ${
                  !isChallan
                    ? `<td style="text-align: right;">${item.price.toLocaleString()}</td>`
                    : ""
                }
                ${
                  !isChallan
                    ? `<td style="text-align: right;">${(
                        item.quantity * item.price
                      ).toLocaleString()}</td>`
                    : ""
                }
            </tr>
        `,
      )
      .join("");

    const storeName = (displayStore?.name || "STORE NAME").toUpperCase();
    const contactLine = [
      displayStore?.location || "",
      `T: ${displayStore?.contactNumber || "Contact Office"}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <title>${title} - ${sale.invoiceId}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { 
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                            margin: 0; 
                            padding: 20px; 
                            color: #1a1f36; 
                            background: #f8fafc; 
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact; 
                            line-height: 1.6;
                        }
                        .sheet { 
                            width: 210mm; 
                            min-height: 297mm; 
                            margin: 0 auto; 
                            background: #ffffff; 
                            border-radius: 0; 
                            box-shadow: 0 8px 32px rgba(0,0,0,0.12); 
                            overflow: hidden; 
                            position: relative;
                        }
                        .strip { 
                            height: 6px; 
                            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
                            position: relative;
                        }
                        .strip::after {
                            content: '';
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            height: 1px;
                            background: linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent);
                        }
                        .inner { 
                            padding: 32px 36px 40px; 
                            position: relative;
                        }
                        .top { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: flex-start; 
                            gap: 32px; 
                            margin-bottom: 36px; 
                            padding-bottom: 28px; 
                            border-bottom: 2px solid #e5e7eb;
                            position: relative;
                        }
                        .top::after {
                            content: '';
                            position: absolute;
                            bottom: -2px;
                            left: 0;
                            width: 80px;
                            height: 2px;
                            background: linear-gradient(90deg, #3b82f6, transparent);
                        }
                        .store { position: relative; }
                        .store .title { 
                            font-size: 32px; 
                            font-weight: 800; 
                            color: #0f172a; 
                            margin: 0 0 6px 0; 
                            letter-spacing: -0.02em;
                            line-height: 1.2;
                        }
                        .store .tag { 
                            font-size: 11px; 
                            font-weight: 700; 
                            color: #3b82f6; 
                            text-transform: uppercase; 
                            letter-spacing: 0.2em; 
                            margin-top: 8px;
                            display: inline-block;
                            padding: 4px 12px;
                            background: rgba(59,130,246,0.1);
                            border-radius: 4px;
                        }
                        .store .details { 
                            font-size: 13px; 
                            color: #64748b; 
                            margin-top: 14px; 
                            line-height: 1.7;
                            display: flex;
                            flex-wrap: wrap;
                            gap: 8px;
                        }
                        .store .details span {
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                        }
                        .store .details span:not(:last-child)::after {
                            content: '•';
                            margin-left: 8px;
                            color: #cbd5e1;
                        }
                        .badge-block { 
                            text-align: right; 
                            display: flex;
                            flex-direction: column;
                            align-items: flex-end;
                        }
                        .inv-badge { 
                            display: inline-block; 
                            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                            color: #ffffff; 
                            padding: 14px 28px; 
                            font-size: 13px; 
                            font-weight: 800; 
                            border-radius: 8px; 
                            margin-bottom: 18px; 
                            text-transform: uppercase; 
                            letter-spacing: 0.1em;
                            box-shadow: 0 4px 12px rgba(59,130,246,0.3);
                        }
                        .inv-meta { 
                            font-size: 12px; 
                            color: #64748b; 
                            font-weight: 500;
                            text-align: right;
                        }
                        .inv-meta p { 
                            margin: 6px 0 0; 
                            line-height: 1.6;
                        }
                        .inv-meta b { 
                            color: #1e40af; 
                            font-weight: 700; 
                            margin-left: 8px;
                            font-size: 13px;
                        }
                        .blocks { 
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            gap: 32px; 
                            margin-bottom: 32px;
                            padding: 24px;
                            background: linear-gradient(to bottom, #f8fafc, #ffffff);
                            border-radius: 12px;
                            border: 1px solid #e5e7eb;
                        }
                        .block-label { 
                            font-size: 9px; 
                            font-weight: 800; 
                            color: #94a3b8; 
                            text-transform: uppercase; 
                            letter-spacing: 0.15em; 
                            margin-bottom: 8px;
                        }
                        .block-value { 
                            font-size: 16px; 
                            font-weight: 700; 
                            color: #0f172a;
                            line-height: 1.4;
                        }
                        .block-value.highlight { 
                            color: #1e40af;
                            font-size: 17px;
                        }
                        .block-note { 
                            font-size: 12px; 
                            color: #64748b; 
                            margin-top: 6px;
                            line-height: 1.5;
                        }
                        .inv-table { 
                            width: 100%; 
                            border-collapse: separate;
                            border-spacing: 0;
                            margin-bottom: 32px; 
                            border: 1px solid #e5e7eb; 
                            border-radius: 12px; 
                            overflow: hidden;
                            background: #ffffff;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                        }
                        .inv-table thead { 
                            background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
                        }
                        .inv-table th { 
                            padding: 16px 18px; 
                            text-align: left; 
                            font-size: 10px; 
                            font-weight: 800; 
                            text-transform: uppercase; 
                            letter-spacing: 0.12em; 
                            color: #475569;
                            border-bottom: 2px solid #e5e7eb;
                            position: relative;
                        }
                        .inv-table th.num { text-align: right; }
                        .inv-table th.c { text-align: center; }
                        .inv-table td { 
                            padding: 18px; 
                            font-size: 14px; 
                            border-bottom: 1px solid #f1f5f9; 
                            vertical-align: top;
                            background: #ffffff;
                        }
                        .inv-table tbody tr {
                            transition: background-color 0.2s;
                        }
                        .inv-table tbody tr:nth-child(even) td {
                            background: #fafbfc;
                        }
                        .inv-table tbody tr:hover td {
                            background: #f0f9ff;
                        }
                        .inv-table td.num { text-align: right; }
                        .inv-table td.c { text-align: center; }
                        .inv-table tbody tr:last-child td { border-bottom: 0; }
                        .prod-name { 
                            font-weight: 700; 
                            color: #0f172a; 
                            font-size: 15px;
                            margin-bottom: 4px;
                        }
                        .prod-code { 
                            font-size: 11px; 
                            color: #94a3b8; 
                            margin-top: 4px;
                            font-family: 'Courier New', monospace;
                        }
                        .row-wrap { 
                            display: flex; 
                            justify-content: space-between; 
                            gap: 48px; 
                            margin-bottom: 48px; 
                            align-items: flex-start;
                        }
                        .notes-panel { 
                            flex: 1; 
                            max-width: 60%; 
                            background: linear-gradient(to bottom, #f8fafc, #ffffff);
                            border: 1px solid #e5e7eb; 
                            border-radius: 12px; 
                            padding: 24px 26px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        }
                        .notes-panel .block-label { 
                            margin-bottom: 12px;
                            color: #64748b;
                        }
                        .notes-body { 
                            font-size: 12px; 
                            color: #475569; 
                            line-height: 1.75; 
                            font-style: italic;
                        }
                        .sum-panel { 
                            width: 320px; 
                            flex-shrink: 0;
                            background: linear-gradient(to bottom, #ffffff, #f8fafc);
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            padding: 24px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        }
                        .sum-row { 
                            display: flex; 
                            justify-content: space-between; 
                            padding: 10px 0; 
                            font-size: 14px; 
                            color: #64748b; 
                            font-weight: 500;
                            align-items: center;
                        }
                        .sum-row.grand { 
                            border-top: 3px solid #1e40af; 
                            margin-top: 16px; 
                            padding-top: 20px; 
                            font-size: 24px; 
                            font-weight: 800; 
                            color: #0f172a;
                            background: linear-gradient(to right, transparent, rgba(59,130,246,0.05), transparent);
                            padding-left: 12px;
                            padding-right: 12px;
                            margin-left: -12px;
                            margin-right: -12px;
                            border-radius: 8px;
                        }
                        .sum-row.ok { 
                            font-weight: 700; 
                            font-size: 15px; 
                            color: #059669; 
                            margin-top: 12px;
                            padding-top: 14px;
                            border-top: 1px solid #d1fae5;
                        }
                        .sum-row.due { 
                            font-weight: 700; 
                            color: #dc2626;
                            font-size: 15px;
                        }
                        .sign-row { 
                            display: flex; 
                            justify-content: space-between; 
                            gap: 48px; 
                            margin-bottom: 48px;
                            margin-top: 40px;
                        }
                        .sign-box { 
                            flex: 1;
                            max-width: 240px;
                            border-top: 2px dashed #cbd5e1; 
                            padding-top: 16px; 
                            font-size: 9px; 
                            font-weight: 800; 
                            color: #94a3b8; 
                            text-transform: uppercase; 
                            letter-spacing: 0.12em;
                            min-height: 80px;
                        }
                        .legal { 
                            text-align: center; 
                            font-size: 10px; 
                            color: #94a3b8; 
                            font-weight: 600; 
                            line-height: 1.8; 
                            padding-top: 28px; 
                            border-top: 1px dashed #e5e7eb;
                            background: linear-gradient(to bottom, transparent, rgba(241,245,249,0.5));
                            margin: 0 -36px -40px;
                            padding-left: 36px;
                            padding-right: 36px;
                            padding-bottom: 32px;
                        }
                        .legal strong {
                            color: #64748b;
                            font-weight: 700;
                        }
                        @media print { 
                            body { 
                                background: #fff; 
                                padding: 0; 
                            } 
                            .sheet { 
                                box-shadow: none; 
                                border-radius: 0;
                                width: 100%;
                                margin: 0;
                            } 
                            .strip { 
                                height: 4px;
                            }
                            .inner { 
                                padding: 20mm 25mm;
                            }
                            .inv-table tbody tr:nth-child(even) td {
                                background: #fafbfc !important;
                            }
                            .inv-table tbody tr:hover td {
                                background: #fafbfc !important;
                            }
                        }
                        @page {
                            margin: 0;
                            size: A4;
                        }
                    </style>
                </head>
                <body>
                    <div class="sheet">
                        <div class="strip"></div>
                        <div class="inner">
                            <div class="top">
                                <div class="store">
                                    <h1 class="title">${storeName}</h1>
                                    <p class="tag">Premium Sanitary & Lifestyle Solutions</p>
                                    <div class="details">
                                        ${contactLine
                                          .split(" | ")
                                          .map(
                                            (part: string, idx: number) =>
                                              `<span>${part}</span>`,
                                          )
                                          .join("")}
                                    </div>
                                </div>
                                <div class="badge-block">
                                    <div class="inv-badge">${
                                      isChallan ? "INVOICE" : title
                                    }</div>
                                    <div class="inv-meta">
                                        <p>Invoice ref # <b>${
                                          sale.invoiceId
                                        }</b></p>
                                        <p>Date of issue <b>${new Date(
                                          sale.createdAt,
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}</b></p>
                                        ${
                                          sale.referenceNo
                                            ? `<p>External ref <b>${sale.referenceNo}</b></p>`
                                            : ""
                                        }
                                    </div>
                                </div>
                            </div>

                            <div class="blocks">
                                <div>
                                    <div class="block-label">${
                                      isChallan
                                        ? "Invoice name"
                                        : "Billing entity"
                                    }</div>
                                    ${
                                      isChallan
                                        ? `
                                        <div class="block-value">${
                                          sale.invoiceId
                                        }</div>
                                        ${
                                          sale.customerName
                                            ? `<div class="block-note" style="margin-top: 8px;">Customer: ${
                                                sale.customerName
                                              }${
                                                sale.customerPhone
                                                  ? ` • ${sale.customerPhone}`
                                                  : ""
                                              }${
                                                sale.customerAddress
                                                  ? ` • ${sale.customerAddress}`
                                                  : ""
                                              }</div>`
                                            : '<div class="block-note" style="margin-top: 8px;">Cash / Walk-in Customer</div>'
                                        }
                                    `
                                        : `
                                        <div class="block-value">${
                                          sale.customerName ||
                                          "Cash / Walk-in Customer"
                                        }</div>
                                        ${
                                          sale.customerPhone ||
                                          sale.customerAddress
                                            ? `<div class="block-note">${[
                                                sale.customerPhone,
                                                sale.customerAddress,
                                              ]
                                                .filter(Boolean)
                                                .join(" • ")}</div>`
                                            : ""
                                        }
                                    `
                                    }
                                </div>
                                <div style="text-align: right;">
                                    <div class="block-label">Financial status</div>
                                    <div class="block-value highlight">${
                                      sale.paidAmount >= sale.totalAmount
                                        ? "Fully Discharged"
                                        : "Pending Settlement"
                                    }</div>
                                    <div class="block-note">Operator: ${
                                      sale.salesman?.name || "Authorized Staff"
                                    }</div>
                                </div>
                            </div>

                            <table class="inv-table">
                                <thead>
                                    <tr>
                                        <th style="width: 50px">#</th>
                                        <th>Article description</th>
                                        <th class="c" style="width: 90px">Qty</th>
                                        ${
                                          !isChallan
                                            ? '<th class="num" style="width: 120px">Unit valuation</th><th class="num" style="width: 130px">Net amount</th>'
                                            : ""
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sale.items
                                      ?.map(
                                        (item: any, index: number) => `
                                        <tr>
                                            <td style="color: #94a3b8; font-weight: 700; font-size: 13px;">${String(
                                              index + 1,
                                            ).padStart(2, "0")}</td>
                                            <td>
                                                <div class="prod-name">${
                                                  item.product?.name || "Item"
                                                }</div>
                                                <div class="prod-code">Serial/Code: ${
                                                  item.product?.barcode || "—"
                                                }</div>
                                            </td>
                                            <td class="c" style="font-weight: 700; font-size: 15px; color: #1e40af;">${
                                              item.quantity
                                            }</td>
                                            ${
                                              !isChallan
                                                ? `<td class="num" style="color: #64748b; font-weight: 600;">Rs. ${item.price.toLocaleString()}</td><td class="num" style="font-weight: 800; color: #0f172a; font-size: 15px;">Rs. ${(
                                                    item.quantity * item.price
                                                  ).toLocaleString()}</td>`
                                                : ""
                                            }
                                        </tr>
                                    `,
                                      )
                                      .join("")}
                                </tbody>
                            </table>

                            <div class="row-wrap">
                                <div class="notes-panel">
                                    <div class="block-label">Legal notes & instructions</div>
                                    <div class="notes-body">${
                                      sale.remarks ||
                                      "No specific terms documented for this transaction. Standard warranty and exchange policy applies as per store guidelines."
                                    }</div>
                                </div>
                                ${
                                  !isChallan
                                    ? `
                                <div class="sum-panel">
                                    <div class="sum-row"><span>Gross subtotal</span><span style="font-weight: 600;">Rs. ${sale.subtotal.toLocaleString()}</span></div>
                                    <div class="sum-row"><span>Campaign discount</span><span style="font-weight: 600; color: #dc2626;">- Rs. ${(
                                      sale.invoiceDiscount || 0
                                    ).toLocaleString()}</span></div>
                                    <div class="sum-row grand"><span>Total</span><span>Rs. ${sale.totalAmount.toLocaleString()}</span></div>
                                    <div class="sum-row ok"><span>Received PKR</span><span>Rs. ${sale.paidAmount.toLocaleString()}</span></div>
                                    <div class="sum-row due"><span>Outstanding</span><span>Rs. ${Math.max(
                                      0,
                                      sale.totalAmount - sale.paidAmount,
                                    ).toLocaleString()}</span></div>
                                </div>
                                `
                                    : ""
                                }
                            </div>

                            <div class="sign-row">
                                <div class="sign-box">Customer signature</div>
                                <div class="sign-box">Authorized office control</div>
                            </div>

                            <div class="legal">
                                <strong>Authenticated system-generated document.</strong> No signature required.<br>
                                Build 2.0.1 · Powered by <strong>Sanitary POS Pro Hub</strong>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;

    WindowPrt.document.open();
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
              <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                Sale Completed!
              </h2>
              <p className="mb-6 font-mono text-slate-500 dark:text-slate-400">
                #{lastInvoice.invoiceId}
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => handlePrint(lastInvoice)}
                  className="h-12 gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                  size="lg"
                >
                  <Printer className="h-5 w-5" /> Print Bill / Challan
                </Button>
                <Button
                  onClick={() => setLastInvoice(null)}
                  variant="outline"
                  className="h-12 border-slate-200 dark:border-slate-700"
                  size="lg"
                >
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
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-slate-50/30 dark:bg-slate-950 w-full">
      {/* Top Navigation for POS */}
      <div className="bg-white dark:bg-slate-900 border-b px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center",
              activeMode === "sale"
                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 border border-slate-200 dark:border-slate-600"
                : "text-slate-500 hover:text-slate-700",
            )}
            onClick={() => setActiveMode("sale")}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> NEW SALE
          </button>
          <button
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center",
              activeMode === "history"
                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 border border-slate-200 dark:border-slate-600"
                : "text-slate-500 hover:text-slate-700",
            )}
            onClick={() => setActiveMode("history")}
          >
            <History className="mr-2 h-4 w-4" /> SALES HISTORY
          </button>
        </div>

        {activeMode === "history" && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-9 w-36"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              className="h-9 w-36"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button size="sm" onClick={fetchSales} className="h-9 px-4">
              Filter
            </Button>
            {(startDate || endDate) && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  fetchSales();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {activeMode === "sale" ? (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden w-full">
          {/* Left side: Product Selection — 100% of available screen */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col p-4 md:p-6">
            <div className="relative group w-full shrink-0 mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              <Input
                ref={barcodeRef}
                placeholder="Search products or scan barcode (Product Code)..."
                className="w-full pl-12 h-14 text-base rounded-2xl border border-slate-200 focus:border-blue-500/50 bg-slate-100/80 dark:bg-slate-800/80 dark:border-slate-700 dark:focus:border-blue-500/50"
                value={searchTerm}
                onChange={handleBarcodeChange}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto w-full">
              <div className="grid w-full grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products
                  .filter(
                    (p) =>
                      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.barcode
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                  )
                  .map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => addToCart(p)}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
                    >
                      {p.image ? (
                        <img
                          src={`http://localhost:5000${p.image}`}
                          alt={p.name}
                          className="h-32 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                          <Package className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {p.name}
                            </h3>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {p.category || p.description || "—"}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-bold text-white min-w-[1.75rem] text-center">
                            {p.totalStock}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between gap-2">
                          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            Rs. {Number(p.salePrice).toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 line-through dark:text-slate-500">
                            Rs. {Number(p.costPrice).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          Barcode: {p.barcode}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Right side: Cart & Checkout — same card/label style as other pages */}
          <div className="flex w-full flex-col shrink-0 overflow-hidden border-l border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 lg:w-[420px]">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
              {/* Transaction details card */}
              <Card className="shrink-0 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                    <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Transaction
                  </CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Customer and reference
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="customer-search"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      Customer
                    </Label>
                    {selectedCustomer ? (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-blue-50/50 px-3 py-2 dark:border-slate-700 dark:bg-blue-900/20">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {selectedCustomer.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {selectedCustomer.phone}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setSelectedCustomer(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          id="customer-search"
                          placeholder="Search by phone..."
                          className="h-10 dark:bg-slate-800/50 dark:border-slate-700"
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            if (e.target.value.length > 2)
                              fetchCustomers(e.target.value);
                          }}
                        />
                        {customers.length > 0 && (
                          <div className="absolute top-full left-0 z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                            {customers.map((c) => (
                              <button
                                key={c._id}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                                onClick={() => handleCustomerSelection(c)}
                              >
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {c.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {c.phone}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="referenceNo"
                        className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        Reference No.
                      </Label>
                      <Input
                        id="referenceNo"
                        placeholder="Optional"
                        className="h-9 dark:bg-slate-800/50 dark:border-slate-700"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="remarks"
                        className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        Remarks
                      </Label>
                      <Input
                        id="remarks"
                        placeholder="Optional"
                        className="h-9 dark:bg-slate-800/50 dark:border-slate-700"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cart card */}
              <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="shrink-0 pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Cart
                  </CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {cart.length === 0
                      ? "Add products from the catalog"
                      : `${cart.length} item(s)`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-12 dark:border-slate-700">
                      <ShoppingCart className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        No items yet.
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Tap a product to add to cart.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3 p-4 pt-0">
                      {cart.map((item) => (
                        <li
                          key={item._id}
                          className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50"
                        >
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                            {item.image ? (
                              <img
                                src={`http://localhost:5000${item.image}`}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {item.name}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                onClick={() => removeFromCart(item._id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Rs. {Number(item.salePrice).toLocaleString()} /
                              unit
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateQuantity(item._id, item.quantity - 1)
                                  }
                                >
                                  −
                                </Button>
                                <span className="min-w-[1.25rem] text-center text-xs font-bold">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateQuantity(item._id, item.quantity + 1)
                                  }
                                >
                                  +
                                </Button>
                              </div>
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                Rs.{" "}
                                {(
                                  item.salePrice * item.quantity
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Summary card */}
              <Card className="shrink-0 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Payment summary
                  </CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Subtotal, discount and amount received
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Subtotal
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="discount"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      Discount (Rs.)
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      className="h-10 dark:bg-slate-800/50 dark:border-slate-700"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-baseline justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Grand total
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      Rs. {total.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="paid"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      Amount received (PKR)
                    </Label>
                    <Input
                      id="paid"
                      type="number"
                      placeholder={total.toString()}
                      className="h-12 text-lg font-semibold dark:bg-slate-800/50 dark:border-slate-700"
                      value={paidAmount || ""}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    className="w-full gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                    size="lg"
                    disabled={cart.length === 0 || loading}
                    onClick={handleCheckout}
                  >
                    {loading ? "Processing..." : "Complete sale & print"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                  <History className="h-8 w-8 text-blue-600 dark:text-blue-400" />{" "}
                  Sales History
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  View and print past invoices.
                </p>
              </div>
            </div>

            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">
                  Historical Sales Data
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Invoice ID, customer and amount
                </CardDescription>
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
                        <th className="rounded-r-lg px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sales.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center italic text-slate-400"
                          >
                            No sales found.
                          </td>
                        </tr>
                      ) : (
                        sales.map((sale) => (
                          <tr
                            key={sale._id}
                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="px-4 py-3 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                              {sale.invoiceId}
                              {sale.referenceNo && (
                                <span className="block text-[10px] font-normal text-slate-400">
                                  Ref: {sale.referenceNo}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                              {new Date(sale.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {sale.customerName ||
                                sale.customer?.name ||
                                "Walk-in"}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                              Rs. {sale.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                  sale.paymentStatus === "paid"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : sale.paymentStatus === "partial"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                )}
                              >
                                {sale.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Edit Details"
                                  className="h-9 w-9 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                  onClick={() => handleEditMetadata(sale)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                  onClick={() => handlePrint(sale)}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                  onClick={() => handleVoid(sale._id)}
                                >
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
        {/* Print Options Modal — Advanced Print Controller */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <Card className="w-full max-w-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-xl animate-in zoom-in-95 duration-200">
              <CardHeader className="border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                        <Settings2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Advanced Print Controller
                    </CardTitle>
                    <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                      Configure store header and document type before printing
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPrintModal(false)}
                    className="h-9 w-9 shrink-0 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 1. Store Branding */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-0.5 rounded-full bg-blue-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        1. Store Branding
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Load Header Preset
                        </Label>
                        <select
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          onChange={(e) => {
                            const s = stores.find(
                              (st) => st._id === e.target.value,
                            );
                            if (s) setSelectedPrintStore({ ...s });
                          }}
                          value={selectedPrintStore?._id || ""}
                        >
                          {stores.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Edit Business Identity
                        </Label>
                        <Input
                          value={selectedPrintStore?.name || ""}
                          onChange={(e) =>
                            setSelectedPrintStore({
                              ...selectedPrintStore,
                              name: e.target.value,
                            })
                          }
                          className="h-10 rounded-lg border-slate-200 dark:bg-slate-800 dark:border-slate-600"
                          placeholder="Store name"
                        />
                        <Input
                          value={selectedPrintStore?.contactNumber || ""}
                          onChange={(e) =>
                            setSelectedPrintStore({
                              ...selectedPrintStore,
                              contactNumber: e.target.value,
                            })
                          }
                          className="h-10 rounded-lg border-slate-200 dark:bg-slate-800 dark:border-slate-600"
                          placeholder="Contact number"
                        />
                        <Input
                          value={selectedPrintStore?.location || ""}
                          onChange={(e) =>
                            setSelectedPrintStore({
                              ...selectedPrintStore,
                              location: e.target.value,
                            })
                          }
                          className="h-10 rounded-lg border-slate-200 dark:bg-slate-800 dark:border-slate-600"
                          placeholder="Business location"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Document Mode */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-0.5 rounded-full bg-blue-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        2. Document Mode
                      </span>
                    </div>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setIsChallan(false)}
                        className={cn(
                          "w-full rounded-xl border-2 p-4 text-left transition-all flex items-center justify-between gap-4",
                          !isChallan
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-600"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600",
                        )}
                      >
                        <div>
                          <p
                            className={cn(
                              "font-semibold text-sm",
                              !isChallan
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-slate-900 dark:text-white",
                            )}
                          >
                            Sales Invoice
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Include full pricing & financial totals
                          </p>
                        </div>
                        {!isChallan && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600">
                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsChallan(true)}
                        className={cn(
                          "w-full rounded-xl border-2 p-4 text-left transition-all flex items-center justify-between gap-4",
                          isChallan
                            ? "border-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:border-orange-600"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600",
                        )}
                      >
                        <div>
                          <p
                            className={cn(
                              "font-semibold text-sm",
                              isChallan
                                ? "text-orange-700 dark:text-orange-300"
                                : "text-slate-900 dark:text-white",
                            )}
                          >
                            SALES INVOICE WITHOUT PRICE
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Render document without financial data
                          </p>
                        </div>
                        {isChallan && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600">
                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                    <div className="rounded-lg bg-slate-800 px-4 py-3 dark:bg-slate-800">
                      <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed">
                        Note: Header overrides are session-based. For permanent
                        changes to store info, visit the Store Management
                        console.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center gap-4 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                <Button
                  variant="ghost"
                  onClick={() => setShowPrintModal(false)}
                  className="font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                >
                  Abort
                </Button>
                <Button
                  onClick={() => {
                    triggerPrint(printingSale, {
                      isChallan,
                      customStore: selectedPrintStore,
                    });
                    setShowPrintModal(false);
                  }}
                  className={cn(
                    "gap-2 px-6 h-11 font-semibold rounded-lg shadow-sm",
                    isChallan
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white",
                  )}
                >
                  <Printer className="h-5 w-5" />
                  {isChallan ? "Print Challan" : "Print Invoice"}
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
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Client Identity / Name
                    </Label>
                    <Input
                      value={editFormData.customerName}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          customerName: e.target.value,
                        })
                      }
                      className="h-12 font-black border-2 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">
                        Communication (Phone)
                      </Label>
                      <Input
                        value={editFormData.customerPhone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            customerPhone: e.target.value,
                          })
                        }
                        className="h-12 font-bold border-2 focus:border-blue-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">
                        Control Reference
                      </Label>
                      <Input
                        value={editFormData.referenceNo}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            referenceNo: e.target.value,
                          })
                        }
                        className="h-12 font-mono border-2 focus:border-blue-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">
                      Logistics (Address)
                    </Label>
                    <Input
                      value={editFormData.customerAddress}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          customerAddress: e.target.value,
                        })
                      }
                      className="h-12 border-2 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">
                      Transaction Remarks
                    </Label>
                    <Input
                      value={editFormData.remarks}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          remarks: e.target.value,
                        })
                      }
                      className="h-12 italic border-2 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 px-8 pb-8">
                <Button
                  variant="ghost"
                  onClick={() => setShowEditModal(false)}
                  className="font-bold"
                >
                  Discard
                </Button>
                <Button
                  onClick={saveMetadata}
                  disabled={loading}
                  className="bg-slate-900 hover:bg-black text-white px-10 h-12 font-black uppercase tracking-widest shadow-xl rounded-xl"
                >
                  {loading ? "Updating..." : "Commit Changes"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </>
    );
  }
}
