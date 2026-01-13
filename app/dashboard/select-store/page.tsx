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
import { Store, ArrowRight, Plus } from "lucide-react";
import api from "@/lib/api";

export default function SelectStorePage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', location: '', contactNumber: '' });
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
      await api.post('/stores', newStore);
      setNewStore({ name: '', location: '', contactNumber: '' });
      setShowAddForm(false);
      fetchStores();
    } catch (error) {
      console.error('Failed to create store', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectStore = (store: any) => {
    localStorage.setItem("selectedStore", JSON.stringify(store));
    router.push("/dashboard");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading Stores...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex justify-between items-center w-full">
          <div className="text-left space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">
              Welcome Back!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Please select a store to manage today.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'}>
            {showAddForm ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Add New Store</>}
          </Button>
        </div>

        {showAddForm && (
          <Card className="animate-in fade-in zoom-in duration-300">
            <CardHeader>
              <CardTitle>Create New Store</CardTitle>
              <CardDescription>Enter details to add a new business location.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStore} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    value={newStore.name}
                    onChange={e => setNewStore({ ...newStore, name: e.target.value })}
                    placeholder="Main Branch"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newStore.location}
                    onChange={e => setNewStore({ ...newStore, location: e.target.value })}
                    placeholder="Downtown"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input
                    id="contact"
                    value={newStore.contactNumber}
                    onChange={e => setNewStore({ ...newStore, contactNumber: e.target.value })}
                    placeholder="+123..."
                  />
                </div>
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create & Refresh'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.length === 0 && !showAddForm ? (
            <Card className="col-span-full p-12 text-center text-slate-400 border-dashed border-2">
              <Store className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p className="mb-4">No stores found. Get started by adding your first store.</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="mt-4"
              >
                Create Your First Store
              </Button>
            </Card>
          ) : (
            stores.map((store) => (
              <Card
                key={store._id}
                className="group cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => handleSelectStore(store)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-2xl group-hover:bg-blue-600 transition-colors">
                    <Store className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </CardHeader>
                <CardContent className="pt-4">
                  <CardTitle className="text-2xl font-bold group-hover:text-blue-600 transition-colors">
                    {store.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {store.location || "No location set"}
                  </CardDescription>
                  <div className="mt-4 flex items-center text-sm font-medium text-slate-400">
                    {store.contactNumber || "No contact info"}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-center pt-8">
          <Button
            variant="ghost"
            className="text-slate-500 hover:text-red-500"
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
          >
            Logout and Switch User
          </Button>
        </div>
      </div>
    </div>
  );
}
