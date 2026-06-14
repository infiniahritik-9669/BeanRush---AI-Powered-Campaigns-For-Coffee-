"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateTime, getStatusColor, personalizeMessage } from "@/lib/utils";
import { Loader2, RefreshCw, BarChart3, Users, Send, CheckCircle2, XCircle, Eye, MousePointerClick, TrendingUp, IndianRupee, Lightbulb, MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CampaignDetail {
  id: string;
  name: string;
  segmentName: string;
  channel: string;
  messageTemplate: string;
  status: string;
  aiReasoning: string | null;
  createdAt: string;
}

interface Analytics {
  audienceCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  revenueAttributed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

interface CommunicationRow {
  id: string;
  customerName: string;
  customerEmail: string;
  recipient: string;
  channel: string;
  personalizedMessage: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  convertedAt: string | null;
  conversionRevenue: number | null;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [communications, setCommunications] = useState<CommunicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  async function fetchCampaign() {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${params.id}`);
      const data = await res.json();
      if (data.campaign) {
        setCampaign(data.campaign);
        setAnalytics(data.analytics);
        setCommunications(data.communications || []);
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-lg font-medium">Campaign not found</p>
      </div>
    );
  }

  const lifecycleData = [
    { name: "Sent", value: analytics?.sentCount || 0, color: "#3b82f6" },
    { name: "Delivered", value: analytics?.deliveredCount || 0, color: "#22c55e" },
    { name: "Opened", value: analytics?.openedCount || 0, color: "#a855f7" },
    { name: "Clicked", value: analytics?.clickedCount || 0, color: "#6366f1" },
    { name: "Converted", value: analytics?.convertedCount || 0, color: "#14b8a6" },
  ];

  const analyticsCards = [
    { title: "Audience", value: analytics?.audienceCount ?? 0, icon: Users },
    { title: "Sent", value: analytics?.sentCount ?? 0, icon: Send, color: "text-blue-600" },
    { title: "Delivered", value: analytics?.deliveredCount ?? 0, icon: CheckCircle2, color: "text-green-600" },
    { title: "Failed", value: analytics?.failedCount ?? 0, icon: XCircle, color: "text-red-600" },
    { title: "Opened", value: analytics?.openedCount ?? 0, icon: Eye, color: "text-purple-600" },
    { title: "Clicked", value: analytics?.clickedCount ?? 0, icon: MousePointerClick, color: "text-indigo-600" },
    { title: "Converted", value: analytics?.convertedCount ?? 0, icon: TrendingUp, color: "text-emerald-600" },
    { title: "Revenue", value: formatCurrency(analytics?.revenueAttributed ?? 0), icon: IndianRupee, color: "text-cyan-600" },
  ];

  const rateCards = [
    { title: "Delivery Rate", value: `${(analytics?.deliveryRate ?? 0).toFixed(1)}%` },
    { title: "Open Rate", value: `${(analytics?.openRate ?? 0).toFixed(1)}%` },
    { title: "Click Rate", value: `${(analytics?.clickRate ?? 0).toFixed(1)}%` },
    { title: "Conversion Rate", value: `${(analytics?.conversionRate ?? 0).toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {campaign.segmentName} · {campaign.channel}
          </p>
        </div>
        <Button variant="outline" onClick={fetchCampaign}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Analytics
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Message Template</p>
              <div className="mt-1 bg-muted rounded-lg p-3 text-sm">
                {campaign.messageTemplate}
              </div>
            </div>
            {campaign.aiReasoning && (
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> AI Reasoning
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{campaign.aiReasoning}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {analyticsCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color || "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {rateCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Message Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lifecycleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Count">
                  {lifecycleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Communication Details</CardTitle>
        </CardHeader>
        <CardContent>
          {communications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Converted</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communications.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.customerName}</TableCell>
                    <TableCell>{c.recipient}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(c.sentAt)}</TableCell>
                    <TableCell>{formatDateTime(c.deliveredAt)}</TableCell>
                    <TableCell>{formatDateTime(c.openedAt)}</TableCell>
                    <TableCell>{formatDateTime(c.clickedAt)}</TableCell>
                    <TableCell>{formatDateTime(c.convertedAt)}</TableCell>
                    <TableCell className="text-right">{c.conversionRevenue ? formatCurrency(c.conversionRevenue) : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p>No communications yet. Send the campaign to see results.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}