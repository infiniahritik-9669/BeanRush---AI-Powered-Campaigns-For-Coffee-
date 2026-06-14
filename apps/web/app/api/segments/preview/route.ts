import { NextRequest, NextResponse } from "next/server";
import { getMatchingCustomers, type SegmentRules } from "@/lib/segment-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rules = body.rules as SegmentRules;

    if (!rules) {
      return NextResponse.json({ error: "Rules are required" }, { status: 400 });
    }

    const { customers, count } = await getMatchingCustomers(rules);

    return NextResponse.json({
      customers: customers.slice(0, 50),
      count,
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json({ error: "Failed to preview segment" }, { status: 500 });
  }
}