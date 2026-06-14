"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, Search, Users, MapPin, ShoppingBag } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  totalSpend: number;
  orderCount: number;
  lastOrderDate: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nameFilter) params.set("name", nameFilter);
      if (cityFilter) params.set("city", cityFilter);
      if (emailFilter) params.set("email", emailFilter);
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [nameFilter, cityFilter, emailFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">View and search your customer base</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by city..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-right">Total Spend</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead>Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.city}</Badge>
                    </TableCell>
                    <TableCell>{c.gender}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(c.totalSpend)}</TableCell>
                    <TableCell className="text-right">{c.orderCount}</TableCell>
                    <TableCell>{formatDate(c.lastOrderDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-sm">Generate demo data from the dashboard to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}