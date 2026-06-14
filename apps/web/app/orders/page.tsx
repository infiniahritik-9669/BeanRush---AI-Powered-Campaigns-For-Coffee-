"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, ShoppingCart, Search, Calendar } from "lucide-react";

interface Order {
  id: string;
  customerName: string;
  customerCity: string;
  productName: string;
  category: string;
  amount: number;
  orderDate: string;
}

const CATEGORIES = ["All", "Coffee Beans", "Cold Brew", "Subscription", "Instant Coffee", "Accessories"];
const CITIES = ["All", "Chennai", "Bangalore", "Delhi", "Mumbai", "Hyderabad", "Kolkata", "Pune"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (city && city !== "All") params.set("city", city);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [category, city, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">View customer orders and filter by category, city, or date</p>
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">City</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Order Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.customerName}</TableCell>
                    <TableCell>{o.productName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{o.category}</Badge>
                    </TableCell>
                    <TableCell>{o.customerCity}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(o.amount)}</TableCell>
                    <TableCell>{formatDate(o.orderDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm">Generate demo data from the dashboard to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}