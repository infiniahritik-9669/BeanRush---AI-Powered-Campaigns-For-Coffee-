import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")?.toLowerCase();
    const city = searchParams.get("city")?.toLowerCase();
    const email = searchParams.get("email")?.toLowerCase();

    const customers = await prisma.customer.findMany({
      include: {
        orders: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let result = customers.map((c) => {
      const orders = c.orders;
      const totalSpend = orders.reduce((sum, o) => sum + o.amount, 0);
      const orderCount = orders.length;
      const lastOrderDate = orders.length > 0
        ? orders.reduce((latest, o) => o.orderDate > latest ? o.orderDate : latest, orders[0].orderDate)
        : null;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        gender: c.gender,
        age: c.age,
        totalSpend,
        orderCount,
        lastOrderDate,
        createdAt: c.createdAt,
      };
    });

    if (name) result = result.filter((c) => c.name.toLowerCase().includes(name));
    if (city) result = result.filter((c) => c.city.toLowerCase().includes(city));
    if (email) result = result.filter((c) => c.email.toLowerCase().includes(email));

    return NextResponse.json({ customers: result, total: result.length });
  } catch (error) {
    console.error("Customers API error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}