import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCampaignAnalytics } from "@/lib/analytics";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        segment: true,
        communications: {
          include: {
            customer: true,
            events: {
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const analytics = calculateCampaignAnalytics(
      campaign.communications.map((c) => ({
        status: c.status,
        conversionRevenue: c.conversionRevenue,
      }))
    );

    const commRows = campaign.communications.map((c) => ({
      id: c.id,
      customerName: c.customer.name,
      customerEmail: c.customer.email,
      recipient: c.recipient,
      channel: c.channel,
      personalizedMessage: c.personalizedMessage,
      status: c.status,
      sentAt: c.sentAt,
      deliveredAt: c.deliveredAt,
      failedAt: c.failedAt,
      openedAt: c.openedAt,
      clickedAt: c.clickedAt,
      convertedAt: c.convertedAt,
      conversionRevenue: c.conversionRevenue,
      events: c.events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        timestamp: e.createdAt,
        payload: e.payload,
      })),
    }));

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        segmentId: campaign.segmentId,
        segmentName: campaign.segment.name,
        channel: campaign.channel,
        messageTemplate: campaign.messageTemplate,
        status: campaign.status,
        aiReasoning: campaign.aiReasoning,
        createdAt: campaign.createdAt,
      },
      analytics,
      communications: commRows,
    });
  } catch (error) {
    console.error("Campaign detail error:", error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}