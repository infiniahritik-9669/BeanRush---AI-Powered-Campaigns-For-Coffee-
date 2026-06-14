import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";

const CITIES = ["Chennai", "Bangalore", "Delhi", "Mumbai", "Hyderabad", "Kolkata", "Pune"];
const GENDERS = ["Male", "Female", "Other"];

const PRODUCTS = [
  { name: "Arabica Coffee Beans", category: "Coffee Beans", amount: 899 },
  { name: "Espresso Roast", category: "Coffee Beans", amount: 999 },
  { name: "Cold Brew Pack", category: "Cold Brew", amount: 499 },
  { name: "Premium Coffee Subscription", category: "Subscription", amount: 2499 },
  { name: "Instant Coffee Combo", category: "Instant Coffee", amount: 699 },
  { name: "French Press Kit", category: "Accessories", amount: 1599 },
  { name: "Coffee Mug", category: "Accessories", amount: 399 },
];

const INDIAN_LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Singh", "Kumar", "Reddy", "Gupta",
  "Joshi", "Nair", "Menon", "Iyer", "Pillai", "Rao", "Naidu",
  "Choudhury", "Banerjee", "Mukherjee", "Das", "Sen", "Ghosh",
];

function generateIndianName(gender: string): string {
  const firstName = gender === "Male" ? faker.person.firstName("male") : faker.person.firstName("female");
  const lastName = faker.helpers.arrayElement(INDIAN_LAST_NAMES);
  return `${firstName} ${lastName}`;
}

function generatePhone(): string {
  const prefixes = ["6", "7", "8", "9"];
  const prefix = faker.helpers.arrayElement(prefixes);
  const rest = faker.string.numeric(9);
  return `+91${prefix}${rest}`;
}

export async function POST() {
  try {
    await prisma.communicationEvent.deleteMany();
    await prisma.communication.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.segment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();

    const customers = [];
    for (let i = 0; i < 120; i++) {
      const gender = faker.helpers.arrayElement(GENDERS);
      customers.push({
        name: generateIndianName(gender),
        email: faker.internet.email().toLowerCase(),
        phone: generatePhone(),
        city: faker.helpers.arrayElement(CITIES),
        gender,
        age: faker.number.int({ min: 18, max: 70 }),
      });
    }

    await prisma.customer.createMany({ data: customers });
    const savedCustomers = await prisma.customer.findMany();

    const maxOrderDate = new Date();
    const minOrderDate = new Date();
    minOrderDate.setMonth(minOrderDate.getMonth() - 8);

    const orderCount = faker.number.int({ min: 400, max: 600 });
    const orders = [];

    for (let i = 0; i < orderCount; i++) {
      const customer = faker.helpers.arrayElement(savedCustomers);
      const product = faker.helpers.arrayElement(PRODUCTS);
      const orderDate = faker.date.between({ from: minOrderDate, to: maxOrderDate });
      orders.push({
        customerId: customer.id,
        productName: product.name,
        category: product.category,
        amount: product.amount,
        orderDate,
      });
    }

    await prisma.order.createMany({ data: orders });

    return NextResponse.json({
      success: true,
      customersCreated: savedCustomers.length,
      ordersCreated: orders.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to generate demo data" }, { status: 500 });
  }
}