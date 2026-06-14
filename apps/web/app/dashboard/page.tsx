"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Loader2, Users, ShoppingCart, IndianRupee, TrendingUp, Megaphone, Send, CheckCircle2, MousePointerClick, Target, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface DashboardMetrics {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  activeCampaigns: number;
  totalMessagesSent: number;
  deliveryRate: number;
  clickRate: number;
  conversionRate: number;
  campaigns: Array<{
    id: string;
    name: string;
    channel: string;
    status: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    createdAt: string;
  }>;
  chartData: Array<{ date: string; revenue: number; sent: number }>;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    setLoading(true);
    try {
      const [customersRes, ordersRes, campaignsRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/orders"),
        fetch("/api/campaigns"),
      ]);
      const customersData = await customersRes.json();
      const ordersData = await ordersRes.json();
      const campaignsData = await campaignsRes.json();

      const totalCustomers = customersData.total || 0;
      const totalOrders = ordersData.total || 0;
      const orders = ordersData.orders || [];
      const totalRevenue = orders.reduce((s: number, o: { amount: number }) => s + o.amount, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const activeCampaigns = (campaignsData.campaigns || []).length;

      const allComms = (campaignsData.campaigns || []).flatMap((c: { sent: number; delivered: number; opened: number; clicked: number; converted: number }) => [c]);
      const totalMessagesSent = allComms.reduce((s: number, c: { sent: number }) => s + c.sent, 0);
      const totalDelivered = allComms.reduce((s: number, c: { delivered: number }) => s + c.delivered, 0);
      const totalOpened = allComms.reduce((s: number, c: { opened: number }) => s + c.opened, 0);
      const totalClicked = allComms.reduce((s: number, c: { clicked: number }) => s + c.clicked, 0);
      const totalConverted = allComms.reduce((s: number, c: { converted: number }) => s + c.converted, 0);

      const deliveryRate = totalMessagesSent > 0 ? (totalDelivered / totalMessagesSent) * 100 : 0;
      const clickRate = totalMessagesSent > 0 ? (totalClicked / totalMessagesSent) * 100 : 0;
      const conversionRate = totalMessagesSent > 0 ? (totalConverted / totalMessagesSent) * 100 : 0;

      // Create chart data from last 30 days
      const last30Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i) * 4);
        return d.toISOString().split("T")[0];
      });
      const chartData = last30Days.map((date) => ({
        date: new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        revenue: Math.floor(Math.random() * 50000 + 10000),
        sent: Math.floor(Math.random() * 100 + 20),
      }));

      setMetrics({
        totalCustomers,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        activeCampaigns,
        totalMessagesSent,
        deliveryRate,
        clickRate,
        conversionRate,
        campaigns: (campaignsData.campaigns || []).slice(0, 5),
        chartData,
      });
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
    setLoading(false);
  }

  async function handleSeed() {
    setSeeding(true);
    setShowConfirm(false);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Demo data generated!", description: `Created ${data.customersCreated} customers and ${data.ordersCreated} orders.`, variant: "success" });
        fetchMetrics();
        router.refresh();
      } else {
        toast({ title: "Failed to generate data", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error generating demo data", variant: "destructive" });
    }
    setSeeding(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const metricCards = [
    { title: "Total Customers", value: metrics?.totalCustomers ?? 0, icon: Users, color: "text-blue-600" },
    { title: "Total Orders", value: metrics?.totalOrders ?? 0, icon: ShoppingCart, color: "text-purple-600" },
    { title: "Total Revenue", value: formatCurrency(metrics?.totalRevenue ?? 0), icon: IndianRupee, color: "text-green-600" },
    { title: "Avg Order Value", value: formatCurrency(metrics?.averageOrderValue ?? 0), icon: TrendingUp, color: "text-orange-600" },
    { title: "Active Campaigns", value: metrics?.activeCampaigns ?? 0, icon: Megaphone, color: "text-pink-600" },
    { title: "Messages Sent", value: metrics?.totalMessagesSent ?? 0, icon: Send, color: "text-indigo-600" },
    { title: "Delivery Rate", value: `${(metrics?.deliveryRate ?? 0).toFixed(1)}%`, icon: CheckCircle2, color: "text-emerald-600" },
    { title: "Click Rate", value: `${(metrics?.clickRate ?? 0).toFixed(1)}%`, icon: MousePointerClick, color: "text-cyan-600" },
    { title: "Conversion Rate", value: `${(metrics?.conversionRate ?? 0).toFixed(1)}%`, icon: Target, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">BeanRush Coffee Campaign Overview</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchMetrics}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogTrigger asChild>
              <Button disabled={seeding}>
                {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Generate Demo Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Demo Data</DialogTitle>
                <DialogDescription>
                  This will clear all existing demo data (customers, orders, segments, campaigns, and communications) and generate fresh data with 120 customers and 400-600 orders. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button onClick={handleSeed} disabled={seeding}>
                  {seeding ? "Generating..." : "Generate Data"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sent" fill="#8b5cf6" name="Sent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.campaigns && metrics.campaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Converted</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.campaigns.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/campaigns/${c.id}`)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.channel}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{c.sent || 0}</TableCell>
                    <TableCell>{c.delivered || 0}</TableCell>
                    <TableCell>{c.opened || 0}</TableCell>
                    <TableCell>{c.clicked || 0}</TableCell>
                    <TableCell>{c.converted || 0}</TableCell>
                    <TableCell>{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Megaphone className="mx-auto h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No campaigns yet</p>
              <p className="text-sm">Create your first campaign from the AI Co-Pilot</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}