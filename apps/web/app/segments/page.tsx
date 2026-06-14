"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { Layers, Loader2, Plus, Bot, Users, Eye } from "lucide-react";

interface Segment {
  id: string;
  name: string;
  description: string | null;
  rulesJson: Record<string, unknown>;
  createdByAi: boolean;
  createdAt: string;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual segment form
  const [manualName, setManualName] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [manualMinSpend, setManualMinSpend] = useState("");
  const [manualMaxSpend, setManualMaxSpend] = useState("");
  const [manualInactiveDays, setManualInactiveDays] = useState("");
  const [manualRecentDays, setManualRecentDays] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualGender, setManualGender] = useState("");

  // AI segment
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ name: string; description: string; rules: Record<string, unknown> } | null>(null);

  // Preview
  const [previewCustomers, setPreviewCustomers] = useState<unknown[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, []);

  async function fetchSegments() {
    setLoading(true);
    try {
      const res = await fetch("/api/segments");
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error("Failed to fetch segments:", error);
    }
    setLoading(false);
  }

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/ai/generate-segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      setAiResult(data);
      // Auto-preview
      handlePreview(data.rules);
    } catch {
      toast({ title: "Failed to generate segment", variant: "destructive" });
    }
    setAiLoading(false);
  }

  async function handlePreview(rules: Record<string, unknown>) {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const data = await res.json();
      setPreviewCustomers(data.customers || []);
      setPreviewCount(data.count || 0);
    } catch {
      toast({ title: "Failed to preview segment", variant: "destructive" });
    }
    setPreviewLoading(false);
  }

  async function handleSaveSegment(rules: Record<string, unknown>, name: string, description: string, createdByAi: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, rules, createdByAi }),
      });
      const data = await res.json();
      if (data.segment) {
        toast({ title: "Segment created!", description: `${data.matchedCustomerCount} customers matched.`, variant: "success" });
        fetchSegments();
        setShowCreateDialog(false);
        resetForm();
      }
    } catch {
      toast({ title: "Failed to create segment", variant: "destructive" });
    }
    setSaving(false);
  }

  function resetForm() {
    setManualName("");
    setManualCity("");
    setManualMinSpend("");
    setManualMaxSpend("");
    setManualInactiveDays("");
    setManualRecentDays("");
    setManualCategory("");
    setManualGender("");
    setAiPrompt("");
    setAiResult(null);
    setPreviewCustomers([]);
    setPreviewCount(0);
  }

  function getManualRules() {
    const rules: Record<string, unknown> = {};
    if (manualCity) rules.city = manualCity;
    if (manualMinSpend) rules.minTotalSpent = Number(manualMinSpend);
    if (manualMaxSpend) rules.maxTotalSpent = Number(manualMaxSpend);
    if (manualInactiveDays) rules.inactiveDays = Number(manualInactiveDays);
    if (manualRecentDays) rules.recentBuyerDays = Number(manualRecentDays);
    if (manualCategory) rules.category = manualCategory;
    if (manualGender) rules.gender = manualGender;
    return rules;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground mt-1">Create and manage customer segments</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Segment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Segment</DialogTitle>
              <DialogDescription>Create a segment manually or using AI</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="ai">AI Assistant</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div>
                  <Label>Segment Name</Label>
                  <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="e.g. High Value Chennai Customers" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Select value={manualCity} onValueChange={setManualCity}>
                      <SelectTrigger><SelectValue placeholder="Any city" /></SelectTrigger>
                      <SelectContent>
                        {["", "Chennai", "Bangalore", "Delhi", "Mumbai", "Hyderabad", "Kolkata", "Pune"].map((c) => (
                          <SelectItem key={c} value={c}>{c || "Any"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={manualGender} onValueChange={setManualGender}>
                      <SelectTrigger><SelectValue placeholder="Any gender" /></SelectTrigger>
                      <SelectContent>
                        {["", "Male", "Female", "Other"].map((g) => (
                          <SelectItem key={g} value={g}>{g || "Any"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Total Spend (₹)</Label>
                    <Input type="number" value={manualMinSpend} onChange={(e) => setManualMinSpend(e.target.value)} placeholder="e.g. 5000" />
                  </div>
                  <div>
                    <Label>Max Total Spend (₹)</Label>
                    <Input type="number" value={manualMaxSpend} onChange={(e) => setManualMaxSpend(e.target.value)} placeholder="e.g. 50000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Inactive Days</Label>
                    <Input type="number" value={manualInactiveDays} onChange={(e) => setManualInactiveDays(e.target.value)} placeholder="e.g. 45" />
                  </div>
                  <div>
                    <Label>Recent Buyer Days</Label>
                    <Input type="number" value={manualRecentDays} onChange={(e) => setManualRecentDays(e.target.value)} placeholder="e.g. 15" />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={manualCategory} onValueChange={setManualCategory}>
                    <SelectTrigger><SelectValue placeholder="Any category" /></SelectTrigger>
                    <SelectContent>
                      {["", "Coffee Beans", "Cold Brew", "Subscription", "Instant Coffee", "Accessories"].map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat || "Any"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handlePreview(getManualRules())} disabled={previewLoading}>
                    <Eye className="mr-2 h-4 w-4" /> Preview
                  </Button>
                  <Button onClick={() => handleSaveSegment(getManualRules(), manualName || "Manual Segment", "", false)} disabled={saving || !manualName}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Segment
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <div>
                  <Label>Describe your segment</Label>
                  <Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. Find high-value customers from Chennai who have not ordered in 45 days" />
                </div>
                <Button onClick={handleAIGenerate} disabled={aiLoading || !aiPrompt.trim()}>
                  {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                  Generate with AI
                </Button>

                {aiResult && (
                  <div className="space-y-3 border rounded-lg p-4">
                    <div>
                      <Label>Segment Name</Label>
                      <Input value={aiResult.name} onChange={(e) => setAiResult({ ...aiResult, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={aiResult.description} onChange={(e) => setAiResult({ ...aiResult, description: e.target.value })} />
                    </div>
                    <div className="bg-muted rounded p-3 text-sm">
                      <p className="font-medium mb-1">Rules:</p>
                      <pre className="text-muted-foreground">{JSON.stringify(aiResult.rules, null, 2)}</pre>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handlePreview(aiResult.rules)} disabled={previewLoading}>
                        <Eye className="mr-2 h-4 w-4" /> Preview ({previewCount} matched)
                      </Button>
                      <Button onClick={() => handleSaveSegment(aiResult.rules, aiResult.name, aiResult.description, true)} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Segment
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {previewCustomers.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-3 bg-muted/50 text-sm font-medium">Matched Customers: {previewCount}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Total Spend</TableHead>
                      <TableHead>Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(previewCustomers as Array<{ name: string; city: string; totalSpend: number; orderCount: number }>).slice(0, 10).map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.city}</TableCell>
                        <TableCell>₹{c.totalSpend.toLocaleString("en-IN")}</TableCell>
                        <TableCell>{c.orderCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewCount > 10 && <div className="p-2 text-center text-sm text-muted-foreground">...and {previewCount - 10} more</div>}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Segments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : segments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Rules</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.description || "-"}</TableCell>
                    <TableCell>{formatDate(s.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={s.createdByAi ? "default" : "secondary"}>
                        {s.createdByAi ? "AI" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <pre className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {JSON.stringify(s.rulesJson)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Layers className="mx-auto h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No segments yet</p>
              <p className="text-sm">Create your first segment to start targeting customers</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}