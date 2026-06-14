import { prisma } from "./prisma";

export interface SegmentRules {
  city?: string;
  minTotalSpent?: number;
  maxTotalSpent?: number;
  inactiveDays?: number;
  recentBuyerDays?: number;
  category?: string;
  gender?: string;
}

export interface CustomerWithStats {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  age: number;
  createdAt: Date;
  totalSpend: number;
  orderCount: number;
  lastOrderDate: Date | null;
  categories: string[];
}

export async function getMatchingCustomers(rules: SegmentRules): Promise<{
  customers: CustomerWithStats[];
  count: number;
}> {
  const allCustomers = await prisma.customer.findMany({
    include: {
      orders: {
        orderBy: { orderDate: "desc" },
      },
    },
  });

  const now = new Date();

  const customersWithStats: CustomerWithStats[] = allCustomers.map((customer) => {
    const orders = customer.orders;
    const totalSpend = orders.reduce((sum, o) => sum + o.amount, 0);
    const orderCount = orders.length;
    const lastOrderDate = orders[0]?.orderDate ?? null;
    const categories = [...new Set(orders.map((o) => o.category))];

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      gender: customer.gender,
      age: customer.age,
      createdAt: customer.createdAt,
      totalSpend,
      orderCount,
      lastOrderDate,
      categories,
    };
  });

  let filtered = customersWithStats;

  if (rules.city) {
    filtered = filtered.filter((c) => c.city.toLowerCase() === rules.city!.toLowerCase());
  }

  if (rules.gender) {
    filtered = filtered.filter((c) => c.gender.toLowerCase() === rules.gender!.toLowerCase());
  }

  if (typeof rules.minTotalSpent === "number") {
    filtered = filtered.filter((c) => c.totalSpend >= rules.minTotalSpent!);
  }

  if (typeof rules.maxTotalSpent === "number") {
    filtered = filtered.filter((c) => c.totalSpend <= rules.maxTotalSpent!);
  }

  if (typeof rules.inactiveDays === "number") {
    const cutoffDate = new Date(now.getTime() - rules.inactiveDays! * 24 * 60 * 60 * 1000);
    filtered = filtered.filter((c) => c.lastOrderDate && c.lastOrderDate < cutoffDate);
  }

  if (typeof rules.recentBuyerDays === "number") {
    const cutoffDate = new Date(now.getTime() - rules.recentBuyerDays! * 24 * 60 * 60 * 1000);
    filtered = filtered.filter((c) => c.lastOrderDate && c.lastOrderDate >= cutoffDate);
  }

  if (rules.category) {
    filtered = filtered.filter((c) => c.categories.includes(rules.category!));
  }

  return {
    customers: filtered,
    count: filtered.length,
  };
}

export function getComputedFields(customer: CustomerWithStats) {
  return {
    totalSpend: customer.totalSpend,
    orderCount: customer.orderCount,
    lastOrderDate: customer.lastOrderDate,
    categories: customer.categories,
    daysSinceLastOrder: customer.lastOrderDate
      ? Math.floor((Date.now() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : null,
    isHighValue: customer.totalSpend > 5000,
    isRecentBuyer: customer.lastOrderDate
      ? (Date.now() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24) <= 15
      : false,
  };
}