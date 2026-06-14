import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        segment: true,
        communications: {
          select: {
            status: true,
            conversionRevenue: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = campaigns.map((c) => {
      const comms = c.communications;
      const sent = comms.filter((x) => ["sent", "delivered", "opened", "clicked", "converted"].includes(x.status)).length;
      const delivered = comms.filter((x) => ["delivered", "opened", "clicked", "converted"].includes(x.status)).length;
      const opened = comms.filter((x) => ["opened", "clicked", "converted"].includes(x.status)).length;
      const clicked = comms.filter((x) => ["clicked", "converted"].includes(x.status)).length;
      const converted = comms.filter((x) => x.status === "converted").length;
      const revenue = comms.reduce((sum, x) => sum + (x.conversionRevenue ?? 0), 0);

      return {
        id: c.id,
        name: c.name,
        segmentId: c.segmentId,
        segmentName: c.segment.name,
        channel: c.channel,
        status: c.status,
        messageTemplate: c.messageTemplate,
        aiReasoning: c.aiReasoning,
        audienceSize: c.communications.length,
        sent,
        delivered,
        opened,
        clicked,
        converted,
        revenue,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ campaigns: result });
  } catch (error) {
    console.error("Campaigns GET error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, segmentId, channel, messageTemplate, aiReasoning } = body;

    if (!name || !segmentId || !channel || !messageTemplate) {
      return NextResponse.json({ error: "Name, segmentId, channel, and messageTemplate are required" }, { status: 400 });
    }

    const segment = await prisma.segment.findUnique({ where: { id: segmentId } });
    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        segmentId,
        channel,
        messageTemplate,
        status: "draft",
        aiReasoning: aiReasoning || null,
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Campaigns POST error:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}