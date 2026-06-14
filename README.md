# Xeno AI Campaign Co-Pilot

An AI-native Mini CRM for shopper engagement, built for BeanRush Coffee — a fictional D2C coffee brand.

## Problem Statement

Marketers at D2C brands struggle to:
- Understand their customer base across orders, spend patterns, and preferences
- Create meaningful audience segments without SQL or data analysis skills
- Craft personalized campaign messages at scale
- Track campaign performance across the full communication lifecycle (send → deliver → open → click → convert)

This product solves these problems by providing an AI-powered co-pilot that ingests customer data, generates intelligent segments, creates personalized campaigns, sends through multiple channels, and provides full funnel analytics.

## Product Overview

The Xeno AI Campaign Co-Pilot is a CRM that helps marketers:
1. Ingest customer and order data (with realistic demo data generation)
2. Create shopper segments manually or using natural language AI
3. Generate personalized campaign names, channels, and message templates using AI
4. Send campaigns through a stubbed channel service
5. Receive asynchronous delivery/engagement callbacks
6. View comprehensive campaign performance analytics

## Features

- **Dashboard**: Real-time metrics on customers, orders, revenue, campaigns, and delivery performance
- **Customer Management**: View and search customer profiles with spend analytics
- **Order Management**: Browse orders with filtering by category, city, and date range
- **Segment Builder**: Create segments manually (city, spend, inactivity, category) or via AI from natural language
- **AI Co-Pilot**: The showcase feature — describe your campaign goal in plain English, and AI generates segment rules, campaign name, channel, personalized message, and strategic reasoning
- **Campaign Management**: Send campaigns, monitor lifecycle, view funnel analytics
- **Campaign Analytics**: Track sent, delivered, failed, opened, clicked, converted, and revenue attributed
- **Channel Service**: Separate Express.js service that simulates real communication lifecycle events with realistic probabilities

## AI-Native Workflow

The core flow demonstrates the AI-native approach:

1. Open dashboard → view metrics
2. Click Generate Demo Data → create 120 customers & 400-600 orders
3. Open AI Co-Pilot → enter campaign goal:
   > "Bring back high-value inactive coffee customers with a 15% discount"
4. AI generates:
   - Segment name, rules, description
   - Campaign name, objective, recommended channel, personalized message template, strategic reasoning
5. Preview matched customers
6. Save segment and campaign
7. Send campaign → CRM creates communication records
8. CRM calls channel service
9. Channel service simulates events (sent → delivered → opened → clicked → converted)
10. Channel service calls CRM receipt API for each event
11. Campaign analytics page updates in real-time

## Architecture

```mermaid
graph TD
    A[Next.js Web App] --> B[API Routes]
    B --> C[Prisma ORM]
    C --> D[(Supabase PostgreSQL)]
    B --> E[AI Layer]
    E --> F[OpenAI / Gemini API]
    E --> G[Fallback Engine]
    B --> H[Channel Client]
    H --> I[Channel Service]
    I --> J[Express.js]
    I --> K[Simulation Engine]
    K --> L[CRM Callbacks]
    L --> B

    subgraph "Web App (Vercel)"
        A
        B
        C
        E
        H
    end

    subgraph "Channel Service (Render/Railway)"
        I
        J
        K
    end

    subgraph "Database (Supabase)"
        D
    end
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, ShadCN UI |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Next.js API Routes, TypeScript |
| Database | Supabase PostgreSQL |
| ORM | Prisma |
| AI | OpenAI API / Gemini API (with fallback) |
| Channel Service | Express.js, TypeScript |
| Fake Data | @faker-js/faker |
| Package Manager | npm |

## Database Schema

### Customer
Core customer profile with name, email, phone, city, gender, age, and timestamps. Each customer has orders and communications.

### Order
Purchase records linked to customers with product name, category, amount, and order date. Supports the segment engine for spend analysis and purchase history.

### Segment
Named segments with JSON-stored rules. Segments can be created manually or by AI. Each segment can have multiple campaigns.

### Campaign
Marketing campaigns linked to a segment with a channel (WhatsApp/SMS/Email/RCS), message template, status tracking, and AI reasoning. Campaign statuses: draft → sending → completed.

### Communication
Individual messages sent to customers as part of a campaign. Tracks full lifecycle: queued → sent → delivered/failed → opened → clicked → converted. Stores personalized message and conversion revenue.

### CommunicationEvent
Audit log of all events for each communication, enabling detailed analytics and timeline views.

## Communication Lifecycle

```
Queued → Sent (1s) → Delivered (2-4s) → Opened (5-8s) → Clicked (8-12s) → Converted (12-15s)
                         ↘ Failed (10%) → END
```

Probabilities:
- 95% sent
- 85% delivered, 10% failed
- 55% opened
- 25% clicked
- 8% converted

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seed` | Generate demo data (120 customers, 400-600 orders) |
| GET | `/api/customers` | List customers with spend, order count, last order |
| GET | `/api/orders` | List orders with filters |
| GET | `/api/segments` | List all segments |
| POST | `/api/segments` | Create segment |
| POST | `/api/segments/preview` | Preview matched customers for rules |
| POST | `/api/ai/generate-segment` | Generate segment from natural language |
| POST | `/api/ai/generate-campaign` | Generate campaign from natural language |
| GET | `/api/campaigns` | List campaigns with analytics |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/[id]` | Campaign details with full analytics |
| POST | `/api/campaigns/send` | Send campaign to channel service |
| POST | `/api/receipts` | Receive callbacks from channel service |

## Local Setup

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL instance (local or Supabase)

### 1. Web App

```bash
cd apps/web
npm install
cp .env.example .env
```

Edit `.env` with your database URL:
```
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Push schema and generate Prisma client:
```bash
npx prisma generate
npx prisma db push
```

Run the dev server:
```bash
npm run dev
```

### 2. Channel Service

```bash
cd apps/channel-service
npm install
cp .env.example .env
npm run dev
```

### 3. Seed Data

Either click **Generate Demo Data** on the dashboard, or call:
```bash
curl -X POST http://localhost:3000/api/seed
```

The seed generates 120 customers and 400-600 orders with realistic Indian data.

## Environment Variables

### Web App (`apps/web/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Optional |
| `GEMINI_API_KEY` | Google Gemini API key | Optional |
| `CHANNEL_SERVICE_URL` | URL of the channel service | `http://localhost:4000` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the web app | `http://localhost:3000` |

### Channel Service (`apps/channel-service/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to run the service on | `4000` |
| `CRM_RECEIPT_URL` | Callback URL for communication events | `http://localhost:3000/api/receipts` |

## Deployment

### Web App (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Set root directory to `apps/web`
4. Add environment variables
5. Deploy

### Channel Service (Render/Railway)

1. Set root directory to `apps/channel-service`
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add environment variables
5. Set `CRM_RECEIPT_URL` to your production CRM URL

### Database (Supabase)

1. Create a Supabase project
2. Copy the PostgreSQL connection string
3. Update `DATABASE_URL` in your web app environment
4. Run `npx prisma db push`

## Tradeoffs

For this assignment, I used simulated customer and order data because the brief allows realistic simulated data. The channel service is stubbed and simulates lifecycle events instead of integrating real WhatsApp, SMS, Email, or RCS providers. For assignment scope, the CRM directly calls the channel service synchronously per communication. At production scale, I would move campaign sends to a queue like BullMQ, Kafka, or SQS, process them using workers, add retry logic, idempotency keys, observability, rate limiting, and dead-letter queues.

## Future Improvements

- **Message queue**: Move campaign sends to BullMQ or Kafka for async processing
- **Real channel integrations**: Connect to WhatsApp Business API, Twilio SMS, SendGrid Email
- **Multi-tenant**: Add organization/brand support for multiple D2C brands
- **Advanced segments**: Support RFM analysis, lookalike segments, behavioral cohorts
- **A/B testing**: Test different message templates within a campaign
- **Scheduling**: Schedule campaigns for future dates
- **Automated triggers**: Set up triggered campaigns based on customer events (abandoned cart, birthday, etc.)
- **CSV import**: Allow importing customer data via CSV uploads
- **Webhooks**: Let customers subscribe to campaign events via webhooks
- **Roles & Permissions**: Team member access control
- **Export**: Export analytics data to CSV/PDF
