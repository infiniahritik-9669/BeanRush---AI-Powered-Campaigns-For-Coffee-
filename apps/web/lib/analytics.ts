export interface CampaignAnalytics {
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

export function calculateCampaignAnalytics(communications: {
  status: string;
  conversionRevenue: number | null;
}[]): CampaignAnalytics {
  const total = communications.length;
  const sentCount = communications.filter((c) =>
    ["sent", "delivered", "opened", "clicked", "converted"].includes(c.status)
  ).length;
  const deliveredCount = communications.filter((c) =>
    ["delivered", "opened", "clicked", "converted"].includes(c.status)
  ).length;
  const failedCount = communications.filter((c) => c.status === "failed").length;
  const openedCount = communications.filter((c) =>
    ["opened", "clicked", "converted"].includes(c.status)
  ).length;
  const clickedCount = communications.filter((c) =>
    ["clicked", "converted"].includes(c.status)
  ).length;
  const convertedCount = communications.filter((c) => c.status === "converted").length;
  const revenueAttributed = communications.reduce(
    (sum, c) => sum + (c.conversionRevenue ?? 0),
    0
  );

  return {
    audienceCount: total,
    sentCount,
    deliveredCount,
    failedCount,
    openedCount,
    clickedCount,
    convertedCount,
    revenueAttributed,
    deliveryRate: sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0,
    openRate: sentCount > 0 ? (openedCount / sentCount) * 100 : 0,
    clickRate: sentCount > 0 ? (clickedCount / sentCount) * 100 : 0,
    conversionRate: sentCount > 0 ? (convertedCount / sentCount) * 100 : 0,
  };
}

export async function getCampaignAnalytics(campaignId: string) {
  const { prisma } = await import("./prisma");
  const communications = await prisma.communication.findMany({
    where: { campaignId },
    select: { status: true, conversionRevenue: true },
  });
  return calculateCampaignAnalytics(communications);
}