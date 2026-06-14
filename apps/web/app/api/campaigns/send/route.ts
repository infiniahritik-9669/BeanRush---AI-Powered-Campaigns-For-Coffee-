import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMatchingCustomers, type SegmentRules } from "@/lib/segment-engine";
import { sendToChannelService } from "@/lib/channel-client";
import { personalizeMessage } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { segment: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "draft") {
      return NextResponse.json({ error: "Campaign has already been sent or is sending" }, { status: 400 });
    }

    const rules = campaign.segment.rulesJson as SegmentRules;
    const { customers, count } = await getMatchingCustomers(rules);

    if (count === 0) {
      return NextResponse.json({ error: "No customers match the segment rules" }, { status: 400 });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "sending" },
    });

    const communications = await prisma.communication.createMany({
      data: customers.map((customer) => ({
        campaignId,
        customerId: customer.id,
        channel: campaign.channel,
        recipient: customer.phone,
        personalizedMessage: personalizeMessage(campaign.messageTemplate, customer.name),
        status: "queued",
      })),
    });

    const createdComms = await prisma.communication.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
      take: count,
    });

    const channelResults: { communicationId: string; accepted: boolean }[] = [];
    for (const comm of createdComms) {
      const result = await sendToChannelService({
        communicationId: comm.id,
        recipient: comm.recipient,
        channel: comm.channel,
        message: comm.personalizedMessage,
      });
      channelResults.push({ communicationId: comm.id, accepted: result.accepted });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "completed" },
    });

    const acceptedCount = channelResults.filter((r) => r.accepted).length;

    return NextResponse.json({
      success: true,
      totalCustomers: count,
      communicationsCreated: communications.count,
      channelServiceAccepted: acceptedCount,
      channelServiceFailed: count - acceptedCount,
    });
  } catch (error) {
    console.error("Campaign send error:", error);
    return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 });
  }
}