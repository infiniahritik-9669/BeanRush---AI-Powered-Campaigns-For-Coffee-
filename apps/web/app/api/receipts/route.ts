import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVENT_STATUS_MAP: Record<string, string> = {
  sent: "sent",
  delivered: "delivered",
  failed: "failed",
  opened: "opened",
  clicked: "clicked",
  converted: "converted",
};

const EVENT_TIMESTAMP_MAP: Record<string, string> = {
  sent: "sentAt",
  delivered: "deliveredAt",
  failed: "failedAt",
  opened: "openedAt",
  clicked: "clickedAt",
  converted: "convertedAt",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { communicationId, event, timestamp, metadata } = body;

    if (!communicationId || !event) {
      return NextResponse.json({ error: "communicationId and event are required" }, { status: 400 });
    }

    const communication = await prisma.communication.findUnique({
      where: { id: communicationId },
    });

    if (!communication) {
      return NextResponse.json({ error: "Communication not found" }, { status: 404 });
    }

    const existingEvent = await prisma.communicationEvent.findFirst({
      where: {
        communicationId,
        eventType: event,
      },
    });

    if (existingEvent) {
      return NextResponse.json({ success: true, message: "Duplicate event, skipped" });
    }

    await prisma.communicationEvent.create({
      data: {
        communicationId,
        eventType: event,
        payload: metadata || undefined,
      },
    });

    const statusMapKey = EVENT_STATUS_MAP[event];
    if (statusMapKey) {
      const updateData: Record<string, unknown> = {
        status: statusMapKey,
      };

      const timestampField = EVENT_TIMESTAMP_MAP[event];
      if (timestampField && timestamp) {
        updateData[timestampField] = new Date(timestamp);
      }

      if (event === "converted" && metadata?.revenue) {
        updateData.conversionRevenue = metadata.revenue;
      }

      await prisma.communication.update({
        where: { id: communicationId },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Receipt API error:", error);
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 });
  }
}