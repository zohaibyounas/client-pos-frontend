"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShoppingCart, LogIn } from "lucide-react";
import api from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      console.log(res);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data));

      if (res.data.role === "admin") {
        router.push("/dashboard/select-store");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top bar: theme toggle — matches dashboard header area */}
      <header className="flex shrink-0 items-center justify-end border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:px-8">
        <ThemeToggle />
      </header>

      {/* Centered login card */}
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-[400px] border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
          {/* Blue accent bar — same as dashboard primary */}
          <div className="h-1 rounded-t-xl bg-blue-600" />

          <CardHeader className="space-y-4 pb-2">
            {/* Brand: same as dashboard sidebar */}
            <div className="flex items-center gap-2 text-blue-600">
              <ShoppingCart className="h-7 w-7" />
              <span className="text-xl font-bold">SANITARY POS</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                Sign in
              </CardTitle>
              <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
                Enter your credentials to access the system.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="dark:bg-slate-800/50 dark:border-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="dark:bg-slate-800/50 dark:border-slate-700"
                  required
                />
              </div>
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
