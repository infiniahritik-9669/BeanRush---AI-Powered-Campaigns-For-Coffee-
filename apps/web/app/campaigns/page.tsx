"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Loader2, Megaphone, Plus } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  segmentName: string;
  channel: string;
  status: string;
  audienceSize: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your marketing campaigns</p>
        </div>
        <Button onClick={() => router.push("/ai-copilot")}>
          <Plus className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : campaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Audience</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Clicked</TableHead>
                  <TableHead className="text-right">Converted</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/campaigns/${c.id}`)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.segmentName}</TableCell>
                    <TableCell>{c.channel}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{c.audienceSize}</TableCell>
                    <TableCell className="text-right">{c.sent}</TableCell>
                    <TableCell className="text-right">{c.delivered}</TableCell>
                    <TableCell className="text-right">{c.opened}</TableCell>
                    <TableCell className="text-right">{c.clicked}</TableCell>
                    <TableCell className="text-right">{c.converted}</TableCell>
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