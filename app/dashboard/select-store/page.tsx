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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Store, ArrowRight, Plus, ShoppingCart, LogOut } from "lucide-react";
import api from "@/lib/api";

export default function SelectStorePage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStore, setNewStore] = useState({
    name: "",
    location: "",
    contactNumber: "",
  });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const fetchStores = async () => {
    try {
      const res = await api.get("/stores");
      console.log(res);
      setStores(res.data);
      console.log(res.data);
    } catch (error) {
      console.error("Failed to fetch stores", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/stores", newStore);
      setNewStore({ name: "", location: "", contactNumber: "" });
      setShowAddForm(false);
      fetchStores();
    } catch (error) {
      console.error("Failed to create store", error);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectStore = (store: any) => {
    localStorage.setItem("selectedStore", JSON.stringify(store));
    router.push("/dashboard");
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Store className="h-5 w-5 animate-pulse text-blue-500" />
          <span className="font-medium">Loading stores...</span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top bar — matches login/dashboard */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:px-8">
        <div className="flex items-center gap-2 text-blue-600">
          <ShoppingCart className="h-6 w-6" />
          <span className="text-lg font-bold">SANITARY POS</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Welcome Back!
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Please select a store to manage today.
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "outline" : "default"}
              className={
                showAddForm
                  ? "shrink-0 md:mb-0"
                  : "shrink-0 bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 md:mb-0"
              }
            >
              {showAddForm ? (
                "Cancel"
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add New Store
                </>
              )}
            </Button>
          </div>

          {showAddForm && (
            <Card className="animate-in fade-in zoom-in border-slate-200 duration-300 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-1 rounded-t-xl bg-blue-600" />
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">
                  Create New Store
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Enter details to add a new business location.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleCreateStore}
                  className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      Store Name
                    </Label>
                    <Input
                      id="name"
                      value={newStore.name}
                      onChange={(e) =>
                        setNewStore({ ...newStore, name: e.target.value })
                      }
                      placeholder="Main Branch"
                      className="dark:bg-slate-800/50 dark:border-slate-700"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="location"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={newStore.location}
                      onChange={(e) =>
                        setNewStore({ ...newStore, location: e.target.value })
                      }
                      placeholder="Downtown"
                      className="dark:bg-slate-800/50 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="contact"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      Contact Number
                    </Label>
                    <Input
                      id="contact"
                      value={newStore.contactNumber}
                      onChange={(e) =>
                        setNewStore({
                          ...newStore,
                          contactNumber: e.target.value,
                        })
                      }
                      placeholder="+123..."
                      className="dark:bg-slate-800/50 dark:border-slate-700"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    {creating ? "Creating..." : "Create & Refresh"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stores.length === 0 && !showAddForm ? (
              <Card className="col-span-full border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                <Store className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="mb-4 text-slate-500 dark:text-slate-400">
                  No stores found. Get started by adding your first store.
                </p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Store
                </Button>
              </Card>
            ) : (
              stores.map((store) => (
                <Card
                  key={store._id}
                  className="group cursor-pointer border-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
                  onClick={() => handleSelectStore(store)}
                >
                  <div className="h-1 rounded-t-xl bg-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="rounded-xl bg-blue-50 p-3 transition-colors group-hover:bg-blue-600 dark:bg-blue-900/30 group-hover:dark:bg-blue-600">
                      <Store className="h-6 w-6 text-blue-600 transition-colors group-hover:text-white dark:text-blue-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-blue-600 dark:text-slate-500" />
                  </CardHeader>
                  <CardContent className="pt-2">
                    <CardTitle className="text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                      {store.name}
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
                      {store.location || "No location set"}
                    </CardDescription>
                    <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">
                      {store.contactNumber || "No contact info"}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-center pt-6">
            <Button
              variant="ghost"
              className="gap-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout and Switch User
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
