"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SummaryBarChartProps {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalProfit: number;
}

// Project primary blue (matches buttons, sidebar, TrendingChart)
const PROJECT_BLUE = "#2563eb"; // tailwind blue-600
const COLORS = [
  PROJECT_BLUE, // Sales – project blue
  "#f59e0b",   // Purchases – amber
  "#ef4444",   // Expenses – red
  "#10b981",   // Profit – emerald
];

export default function SummaryBarChart({
  totalSales,
  totalPurchases,
  totalExpenses,
  totalProfit,
}: SummaryBarChartProps) {
  const data = [
    { name: "Sales", value: totalSales, fill: COLORS[0] },
    { name: "Purchases", value: totalPurchases, fill: COLORS[1] },
    { name: "Expenses", value: totalExpenses, fill: COLORS[2] },
    { name: "Profit", value: totalProfit, fill: COLORS[3] },
  ];

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          layout="vertical"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e2e8f0"
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
            tickFormatter={(value) =>
              `Rs.${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, ""]}
            labelFormatter={(label) => label}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            maxBarSize={48}
            fill={PROJECT_BLUE}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
