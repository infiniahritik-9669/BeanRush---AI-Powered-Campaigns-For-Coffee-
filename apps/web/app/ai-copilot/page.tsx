"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Loader2, Bot, Sparkles, Send, Eye, Save, Users, Megaphone, MessageSquare, Lightbulb } from "lucide-react";

interface GeneratedSegment {
  name: string;
  description: string;
  rules: Record<string, unknown>;
}

interface GeneratedCampaign {
  campaignName: string;
  objective: string;
  channel: string;
  messageTemplate: string;
  reasoning: string;
}

export default function AICopilotPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [segment, setSegment] = useState<GeneratedSegment | null>(null);
  const [campaign, setCampaign] = useState<GeneratedCampaign | null>(null);
  const [previewCustomers, setPreviewCustomers] = useState<Array<{ name: string; city: string; totalSpend: number }>>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setSegment(null);
    setCampaign(null);
    setPreviewCustomers([]);
    setPreviewCount(0);
    setSelectedSegmentId(null);
    setSelectedCampaignId(null);

    try {
      const [segmentRes, campaignRes] = await Promise.all([
        fetch("/api/ai/generate-segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }),
        fetch("/api/ai/generate-campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }),
      ]);

      const segmentData = await segmentRes.json();
      const campaignData = await campaignRes.json();

      if (segmentData.name) setSegment(segmentData);
      if (campaignData.campaignName) setCampaign(campaignData);
    } catch {
      toast({ title: "Failed to generate", variant: "destructive" });
    }
    setLoading(false);
  }

  async function handlePreview() {
    if (!segment?.rules) return;
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: segment.rules }),
      });
      const data = await res.json();
      setPreviewCustomers(data.customers || []);
      setPreviewCount(data.count || 0);
    } catch {
      toast({ title: "Preview failed", variant: "destructive" });
    }
    setPreviewLoading(false);
  }

  async function handleSaveCampaign() {
    if (!segment || !campaign) return;

    try {
      // Save segment first
      const segmentRes = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: segment.name,
          description: segment.description,
          rules: segment.rules,
          createdByAi: true,
        }),
      });
      const segmentData = await segmentRes.json();
      if (!segmentData.segment) {
        toast({ title: "Failed to create segment", variant: "destructive" });
        return;
      }

      // Save campaign
      const campaignRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaign.campaignName,
          segmentId: segmentData.segment.id,
          channel: campaign.channel,
          messageTemplate: campaign.messageTemplate,
          aiReasoning: campaign.reasoning,
        }),
      });
      const campaignData = await campaignRes.json();
      if (!campaignData.campaign) {
        toast({ title: "Failed to create campaign", variant: "destructive" });
        return;
      }

      setSelectedSegmentId(segmentData.segment.id);
      setSelectedCampaignId(campaignData.campaign.id);
      toast({ title: "Campaign saved!", description: "You can now send it.", variant: "success" });
    } catch {
      toast({ title: "Failed to save campaign", variant: "destructive" });
    }
  }

  async function handleSend() {
    if (!selectedCampaignId) return;
    setSending(true);
    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: selectedCampaignId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Campaign sent!",
          description: `Sent to ${data.channelServiceAccepted} customers. Channel service is processing.`,
          variant: "success",
        });
        router.push(`/campaigns/${selectedCampaignId}`);
      } else {
        toast({ title: data.error || "Failed to send", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to send campaign", variant: "destructive" });
    }
    setSending(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          AI Co-Pilot
        </h1>
        <p className="text-muted-foreground mt-1">
          Describe your campaign goal and let AI generate segments, messages, and strategy
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign Goal</CardTitle>
          <CardDescription>
            Describe your marketing objective in natural language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Bring back high-value inactive coffee customers with a 15% discount"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {segment && campaign && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Segment: {segment.name}
              </CardTitle>
              <CardDescription>{segment.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Segment Rules</p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {JSON.stringify(segment.rules, null, 2)}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePreview} disabled={previewLoading}>
                  {previewLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  Preview Customers {previewCount > 0 && `(${previewCount})`}
                </Button>
              </div>

              {previewCustomers.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  <div className="p-2 bg-muted/50 text-xs font-medium sticky top-0">Matched: {previewCount} customers</div>
                  {previewCustomers.slice(0, 20).map((c, i) => (
                    <div key={i} className="flex justify-between px-3 py-1.5 text-sm border-b last:border-0">
                      <span>{c.name}</span>
                      <span className="text-muted-foreground">{c.city} · ₹{c.totalSpend.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {previewCount > 20 && (
                    <div className="p-2 text-center text-xs text-muted-foreground">...and {previewCount - 20} more</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Campaign: {campaign.campaignName}
              </CardTitle>
              <CardDescription>{campaign.objective}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  <MessageSquare className="mr-1 h-3 w-3" /> {campaign.channel}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium">Message Template</Label>
                <div className="mt-1 bg-muted rounded-lg p-4 text-sm">
                  {campaign.messageTemplate}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" /> AI Reasoning
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">{campaign.reasoning}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {segment && campaign && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3 justify-end">
              {!selectedCampaignId ? (
                <Button onClick={handleSaveCampaign} size="lg">
                  <Save className="mr-2 h-4 w-4" />
                  Save Segment & Campaign
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={sending} size="lg">
                  {sending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Campaign Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!segment && !loading && (
        <div className="py-16 text-center text-muted-foreground">
          <Bot className="mx-auto h-16 w-16 mb-4 opacity-30" />
          <h3 className="text-xl font-medium mb-2">Ready to create your campaign</h3>
          <p className="max-w-md mx-auto">
            Type your campaign goal above and let AI generate the perfect segment rules, channel, and message for your audience.
          </p>
        </div>
      )}
    </div>
  );
}