"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
  Filter,
} from "lucide-react";
import api from "@/lib/api";
import TrendingChart from "@/components/dashboard/TrendingChart";
import SummaryBarChart from "@/components/dashboard/SummaryBarChart";

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

  if (loading && !stats)
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <ShoppingCart className="h-5 w-5 animate-pulse text-blue-500" />
          <span className="font-medium">Loading dashboard...</span>
        </div>
      </div>
    );

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
    <div className="min-h-screen space-y-8 bg-slate-50 p-6 dark:bg-slate-950 md:p-8">
      {/* Header — matches Login / Select Store */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Business Intelligence
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Comprehensive overview of your store performance.
          </p>
        </div>

        <Card className="w-full border-slate-200 dark:border-slate-800 dark:bg-slate-900 md:w-auto">
          <CardContent className="pt-4">
            <form
              onSubmit={handleFilter}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="startDate"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Start Date
                </Label>
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-40 dark:bg-slate-800/50 dark:border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="endDate"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  End Date
                </Label>
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-40 dark:bg-slate-800/50 dark:border-slate-700"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-9 gap-2 bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Filter className="h-4 w-4" /> {loading ? "..." : "Filter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Smart Metric boxes — compact, no top line */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="group gap-2 border-slate-200 py-4 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-1 pt-0">
              <CardTitle className="text-[10px] font-bold uppercase leading-tight tracking-wider text-slate-500 dark:text-slate-400">
                {card.title}
              </CardTitle>
              <div
                className={`rounded-lg p-2 transition-all duration-200 ${card.bg} group-hover:bg-blue-600 dark:group-hover:bg-blue-600`}
              >
                <card.icon
                  className={`h-4 w-4 ${card.color} transition-colors group-hover:text-white dark:group-hover:text-white`}
                />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row: Sales & Profit Trend + Revenue Overview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">
              Sales & Profit Trend
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Daily performance over the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.trend && stats.trend.length > 0 ? (
              <TrendingChart data={stats.trend} />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm italic text-slate-400">
                Not enough data to generate trends yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">
              Revenue Overview
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Sales, purchases, expenses and profit for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SummaryBarChart
              totalSales={stats?.totalSales ?? 0}
              totalPurchases={stats?.totalPurchases ?? 0}
              totalExpenses={stats?.totalExpenses ?? 0}
              totalProfit={stats?.totalProfit ?? 0}
            />
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview Table — same card style */}
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">
            Inventory Status
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Product stock and value
          </CardDescription>
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
