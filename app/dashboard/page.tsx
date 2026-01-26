"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import api from "@/lib/api";
import TrendingChart from "@/components/dashboard/TrendingChart";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const router = useRouter();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await api.get(`/analytics/dashboard?${params.toString()}`);
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchStats();
      fetchInventory();
    }
  }, [router]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats();
  };

  if (loading && !stats) return <div className="p-8">Loading Dashboard...</div>;

  const statCards = [
    {
      title: "Total Sales",
      value: `Rs. ${(stats?.totalSales ?? 0).toLocaleString()}`,
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Total Purchases",
      value: `Rs. ${(stats?.totalPurchases ?? 0).toLocaleString()}`,
      icon: Package,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Total Profit",
      value: `Rs. ${(stats?.totalProfit ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: "Total Expenses",
      value: `Rs. ${(stats?.totalExpenses ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Today's Sales",
      value: `Rs. ${(stats?.todaySales ?? 0).toLocaleString()}`,
      icon: Calendar,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-900/20",
    },
    {
      title: "Today's Profit",
      value: `Rs. ${(stats?.todayProfit ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
      title: "Inventory Items",
      value: (stats?.totalInventoryItems ?? 0).toLocaleString(),
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Inventory Value",
      value: `Rs. ${(stats?.totalInventoryCost ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-transparent min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Business Intelligence
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Comprehensive overview of your store performance.
          </p>
        </div>

        <form
          onSubmit={handleFilter}
          className="flex flex-wrap items-end gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border dark:border-slate-800"
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="startDate"
              className="text-xs uppercase font-bold text-slate-400"
            >
              Start Date
            </Label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="endDate"
              className="text-xs uppercase font-bold text-slate-400"
            >
              End Date
            </Label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={loading}
            className="gap-2 h-9"
          >
            <Filter className="h-4 w-4" /> {loading ? "..." : "Filter"}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="border-none shadow-sm hover:shadow-md transition-all duration-200 dark:bg-slate-900 group"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.title}
              </CardTitle>
              <div
                className={`${card.bg} p-2 rounded-lg transition-transform group-hover:scale-110`}
              >
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="lg:col-span-2 dark:bg-slate-900 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Sales & Profit Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.trend && stats.trend.length > 0 ? (
              <TrendingChart data={stats.trend} />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 italic text-sm">
                Not enough data to generate trends yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview Table */}
      <Card className="dark:bg-slate-900 border-none shadow-sm">
        <CardHeader>
          <CardTitle className="uppercase tracking-wider text-sm font-semibold text-slate-500 dark:text-slate-400">
            Inventory Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs font-bold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Product Name</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3 text-right">Stock Qty</th>
                  <th className="px-4 py-3 text-right">Cost Price</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-400 italic"
                    >
                      No inventory data available.
                    </td>
                  </tr>
                ) : (
                  products.map((product: any) => (
                    <tr
                      key={product._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        {product.barcode}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          product.totalStock <= 0
                            ? "text-red-500"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {product.totalStock}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                        Rs. {product.costPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        Rs.{" "}
                        {(
                          product.totalStock * product.costPrice
                        ).toLocaleString()}
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
