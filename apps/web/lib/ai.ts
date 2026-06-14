export interface GeneratedSegment {
  name: string;
  description: string;
  rules: {
    city?: string;
    minTotalSpent?: number;
    maxTotalSpent?: number;
    inactiveDays?: number;
    recentBuyerDays?: number;
    category?: string;
    gender?: string;
  };
}

export interface GeneratedCampaign {
  campaignName: string;
  objective: string;
  channel: "WhatsApp" | "SMS" | "Email" | "RCS";
  messageTemplate: string;
  reasoning: string;
}

function getAIClient() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openaiKey) {
    return { provider: "openai" as const, key: openaiKey };
  }
  if (groqKey) {
    return { provider: "groq" as const, key: groqKey };
  }
  if (geminiKey) {
    return { provider: "gemini" as const, key: geminiKey };
  }
  return null;
}

const SYSTEM_PROMPT_SEGMENT = `You are a CRM segment generator. Given a natural language marketing goal, generate structured segment rules for a coffee brand called BeanRush Coffee.

Available fields:
- city (string: Chennai, Bangalore, Delhi, Mumbai, Hyderabad, Kolkata, Pune)
- minTotalSpent (number, minimum INR spent)
- maxTotalSpent (number, maximum INR spent)
- inactiveDays (number, days since last order)
- recentBuyerDays (number, days since last order for recent buyers)
- category (string: Coffee Beans, Cold Brew, Subscription, Instant Coffee, Accessories)
- gender (string: Male, Female, Other)

Return ONLY valid JSON with no markdown formatting:
{
  "name": "Segment Name",
  "description": "Brief description of the segment",
  "rules": { ... }
}`;

const SYSTEM_PROMPT_CAMPAIGN = `You are a campaign generator for a coffee brand called BeanRush Coffee. Given a marketing goal and optional segment rules, generate a campaign.

Return ONLY valid JSON with no markdown formatting:
{
  "campaignName": "Campaign Name",
  "objective": "Marketing objective",
  "channel": "WhatsApp" | "SMS" | "Email" | "RCS",
  "messageTemplate": "Message with {{name}} placeholder",
  "reasoning": "Explanation of the strategy"
}

The messageTemplate MUST include {{name}} as a placeholder for the customer's name.`;

async function callOpenAI(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    return response.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return null;
  }
}

async function callGroq(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const Groq = (await import("groq-sdk")).default;
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    return response.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("Groq API error:", error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(prompt: string, systemPrompt: string): Promise<string | null> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? jsonMatch[0] : text;
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes("429");
      const retryDelay = error?.errorDetails?.find((d: any) => d.retryDelay)
        ?.retryDelay || "10s";
      const delayMs = parseInt(retryDelay) * 1000 || 10000;

      if (isRateLimit && attempt < maxRetries) {
        console.log(`Gemini rate limited (attempt ${attempt}/${maxRetries}). Waiting ${delayMs/1000}s...`);
        await sleep(delayMs);
        continue;
      }
      console.error("Gemini API error:", error?.message || error);
      return null;
    }
  }
  return null;
}

export async function generateSegment(prompt: string): Promise<GeneratedSegment> {
  const client = getAIClient();

  if (client) {
    let content: string | null = null;
    if (client.provider === "openai") {
      content = await callOpenAI(prompt, SYSTEM_PROMPT_SEGMENT);
    } else if (client.provider === "groq") {
      content = await callGroq(prompt, SYSTEM_PROMPT_SEGMENT);
    } else {
      content = await callGemini(prompt, SYSTEM_PROMPT_SEGMENT);
    }

    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.name && parsed.rules) {
          return parsed;
        }
      } catch {
        console.warn("Failed to parse AI response, using fallback");
      }
    }
  }

  return generateSegmentFallback(prompt);
}

export async function generateCampaign(prompt: string): Promise<GeneratedCampaign> {
  const client = getAIClient();

  if (client) {
    let content: string | null = null;
    if (client.provider === "openai") {
      content = await callOpenAI(prompt, SYSTEM_PROMPT_CAMPAIGN);
    } else if (client.provider === "groq") {
      content = await callGroq(prompt, SYSTEM_PROMPT_CAMPAIGN);
    } else {
      content = await callGemini(prompt, SYSTEM_PROMPT_CAMPAIGN);
    }

    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.campaignName && parsed.messageTemplate) {
          return parsed;
        }
      } catch {
        console.warn("Failed to parse AI response, using fallback");
      }
    }
  }

  return generateCampaignFallback(prompt);
}

function generateSegmentFallback(prompt: string): GeneratedSegment {
  const lowerPrompt = prompt.toLowerCase();
  const rules: GeneratedSegment["rules"] = {};
  let name = "Custom Segment";
  let description = "Segment created based on your campaign goal.";

  if (lowerPrompt.includes("inactive") || lowerPrompt.includes("win back") || lowerPrompt.includes("reactivate")) {
    rules.inactiveDays = 45;
    name = "Inactive Customers";
    description = "Customers who haven't ordered in 45+ days";
    if (lowerPrompt.includes("high value") || lowerPrompt.includes("premium") || lowerPrompt.includes("high spend")) {
      rules.minTotalSpent = 5000;
      name = "High Value Inactive Customers";
      description = "High-value customers who haven't ordered in 45+ days";
    }
  }

  if (lowerPrompt.includes("recent") || lowerPrompt.includes("new")) {
    rules.recentBuyerDays = 15;
    name = "Recent Buyers";
    description = "Customers who ordered within the last 15 days";
  }

  if (lowerPrompt.includes("chennai")) {
    rules.city = "Chennai";
    name = `${name} - Chennai`;
    description = `${description} from Chennai`;
  } else if (lowerPrompt.includes("bangalore") || lowerPrompt.includes("bengaluru")) {
    rules.city = "Bangalore";
    name = `${name} - Bangalore`;
    description = `${description} from Bangalore`;
  } else if (lowerPrompt.includes("delhi")) {
    rules.city = "Delhi";
    name = `${name} - Delhi`;
    description = `${description} from Delhi`;
  } else if (lowerPrompt.includes("mumbai")) {
    rules.city = "Mumbai";
    name = `${name} - Mumbai`;
    description = `${description} from Mumbai`;
  }

  if (lowerPrompt.includes("coffee beans") || lowerPrompt.includes("arabica") || lowerPrompt.includes("espresso")) {
    rules.category = "Coffee Beans";
    name = `${name} - Coffee Beans`;
  } else if (lowerPrompt.includes("subscription")) {
    rules.category = "Subscription";
    name = `${name} - Subscription`;
  }

  if (lowerPrompt.includes("female")) {
    rules.gender = "Female";
  } else if (lowerPrompt.includes("male")) {
    rules.gender = "Male";
  }

  return { name, description, rules };
}

function generateCampaignFallback(prompt: string): GeneratedCampaign {
  const lowerPrompt = prompt.toLowerCase();
  let campaignName = "Customer Campaign";
  let objective = "Engage customers with a personalized offer";
  let channel: GeneratedCampaign["channel"] = "WhatsApp";
  let reasoning = "This campaign targets the identified audience segment.";
  let messageTemplate = "Hey {{name}}, check out our latest offers at BeanRush Coffee!";

  if (lowerPrompt.includes("inactive") || lowerPrompt.includes("win back") || lowerPrompt.includes("reactivate")) {
    campaignName = "Win Back Campaign";
    objective = "Reactivate inactive customers with a discount offer";
    reasoning = "Inactive customers are more likely to return with a direct incentive.";
    if (lowerPrompt.includes("discount") || lowerPrompt.includes("15%") || lowerPrompt.includes("offer")) {
      messageTemplate = "Hey {{name}}, we miss you! Enjoy 15% off your next BeanRush Coffee order. Use code RUSH15.";
    } else {
      messageTemplate = "Hey {{name}}, we've got fresh new blends at BeanRush Coffee. Come taste the difference!";
    }
  }

  if (lowerPrompt.includes("new") || lowerPrompt.includes("welcome") || lowerPrompt.includes("recent")) {
    campaignName = "Welcome Campaign";
    objective = "Welcome recent customers and encourage repeat purchase";
    reasoning = "Recent buyers are warm leads who are more likely to purchase again.";
    messageTemplate = "Hey {{name}}, welcome to BeanRush Coffee! Enjoy 10% off your next purchase.";
  }

  if (lowerPrompt.includes("premium") || lowerPrompt.includes("high value")) {
    campaignName = "Premium Coffee Lovers";
    objective = "Reward high-value customers with exclusive offers";
    reasoning = "High-value customers deserve special treatment to maintain loyalty.";
    messageTemplate = "Hey {{name}}, you're a valued BeanRush Coffee customer! Enjoy free shipping on your next order.";
  }

  if (lowerPrompt.includes("email")) {
    channel = "Email";
  } else if (lowerPrompt.includes("sms")) {
    channel = "SMS";
  } else if (lowerPrompt.includes("rcs")) {
    channel = "RCS";
  }

  if (!lowerPrompt.includes("discount") && !lowerPrompt.includes("offer")) {
    if (lowerPrompt.includes("discount") || lowerPrompt.includes("offer") || lowerPrompt.includes("15%")) {
      messageTemplate = messageTemplate;
    }
  }

  return { campaignName, objective, channel, messageTemplate, reasoning };
}