# Xeno AI Campaign Co-Pilot

AI-native Mini CRM for BeanRush Coffee (fictional D2C brand). Helps marketers create segments, generate AI campaigns, send messages via a simulated channel service, and track analytics.

## Core Flow

1. Dashboard → click **Generate Demo Data** (120 customers, 400-600 orders)
2. **AI Co-Pilot** → type a campaign goal → AI generates segment rules + campaign name + channel + message + reasoning
3. Preview matched customers → Save segment & campaign → **Send Campaign**
4. Channel service receives messages → simulates lifecycle (sent → delivered → opened → clicked → converted)
5. Channel service calls back CRM's `/api/receipts` → analytics update in real-time

## Architecture

```
Web App (Next.js) → Prisma → Supabase PostgreSQL
                 → AI Layer (Groq / OpenAI / Gemini / fallback)
                 → Channel Client → Channel Service (Express.js)
Channel Service → simulates events → calls back /api/receipts
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/lib/prisma.ts` | DB client |
| `apps/web/lib/segment-engine.ts` | Customer filtering by rules (city, spend, inactivity, etc.) |
| `apps/web/lib/ai.ts` | AI calls (Groq > OpenAI > Gemini > fallback) |
| `apps/web/lib/analytics.ts` | Campaign analytics calculations |
| `apps/web/lib/channel-client.ts` | Sends messages to channel service |
| `apps/web/prisma/schema.prisma` | DB models: Customer, Order, Segment, Campaign, Communication, CommunicationEvent |
| `apps/channel-service/src/index.ts` | Express server that simulates message lifecycle |

## AI Providers (checked in order)

1. `OPENAI_API_KEY` → uses GPT-4o-mini
2. `GROQ_API_KEY` → uses Llama 3 70B (free, 30 req/min)
3. `GEMINI_API_KEY` → uses Gemini 2.0 Flash (free tier, rate limited)
4. No key → keyword-based fallback (works for common prompts)

## Pages

| Route | What it shows |
|-------|---------------|
| `/dashboard` | Metrics, charts, Generate Demo Data button |
| `/customers` | Customer table with name/city/email search |
| `/orders` | Orders with category/city/date filters |
| `/segments` | Manual + AI segment creation with preview |
| `/ai-copilot` | Main showcase: describe goal → AI generates everything |
| `/campaigns` | Campaign list with analytics |
| `/campaigns/[id]` | Campaign detail: analytics cards + lifecycle chart + comms table |

## Channel Service Lifecycle

Queued → Sent (1s) → Delivered (2-4s, 85%) → Opened (5-8s, 55%) → Clicked (8-12s, 25%) → Converted (12-15s, 8%)

If failed (10%), lifecycle stops. Each event calls `/api/receipts` with retry up to 3 times.

## Local Dev

```bash
# Terminal 1
cd apps/web && npm run dev

# Terminal 2
cd apps/channel-service && npm run dev
```

Push DB schema: `cd apps/web && npx prisma db push`
Seed data: Click "Generate Demo Data" on dashboard

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `GROQ_API_KEY` | No | Free from console.groq.com (recommended) |
| `OPENAI_API_KEY` | No | Paid API |
| `GEMINI_API_KEY` | No | Free but rate-limited |
| `CHANNEL_SERVICE_URL` | No | Default: http://localhost:4000 |
| `NEXT_PUBLIC_APP_URL` | No | Default: http://localhost:3000 |

## Deployment

- **Web app**: Vercel (root: `apps/web`, add env vars)
- **Channel service**: Render/Railway (root: `apps/channel-service`)
- **Database**: Supabase (update `DATABASE_URL` with connection string)
