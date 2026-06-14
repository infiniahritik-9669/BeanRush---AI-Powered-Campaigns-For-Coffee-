import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.toLowerCase();
    const city = searchParams.get("city")?.toLowerCase();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const orders = await prisma.order.findMany({
      include: {
        customer: true,
      },
      orderBy: { orderDate: "desc" },
    });

    let result = orders.map((o) => ({
      id: o.id,
      customerId: o.customerId,
      customerName: o.customer.name,
      customerCity: o.customer.city,
      productName: o.productName,
      category: o.category,
      amount: o.amount,
      orderDate: o.orderDate,
    }));

    if (category) result = result.filter((o) => o.category.toLowerCase().includes(category));
    if (city) result = result.filter((o) => o.customerCity.toLowerCase().includes(city));
    if (startDate) result = result.filter((o) => new Date(o.orderDate) >= new Date(startDate));
    if (endDate) result = result.filter((o) => new Date(o.orderDate) <= new Date(endDate));

    return NextResponse.json({ orders: result, total: result.length });
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}