import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMatchingCustomers, type SegmentRules } from "@/lib/segment-engine";

export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ segments });
  } catch (error) {
    console.error("Segments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, rules, createdByAi } = body;

    if (!name || !rules) {
      return NextResponse.json({ error: "Name and rules are required" }, { status: 400 });
    }

    const segment = await prisma.segment.create({
      data: {
        name,
        description: description || null,
        rulesJson: rules,
        createdByAi: createdByAi || false,
      },
    });

    const { count } = await getMatchingCustomers(rules as SegmentRules);

    return NextResponse.json({ segment, matchedCustomerCount: count });
  } catch (error) {
    console.error("Segments POST error:", error);
    return NextResponse.json({ error: "Failed to create segment" }, { status: 500 });
  }
}