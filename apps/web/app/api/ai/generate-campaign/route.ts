import { NextRequest, NextResponse } from "next/server";
import { generateCampaign } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await generateCampaign(prompt);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI generate-campaign error:", error);
    return NextResponse.json({ error: "Failed to generate campaign" }, { status: 500 });
  }
}