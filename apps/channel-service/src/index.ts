import express from "express";
import fetch from "node-fetch";

const PORT = parseInt(process.env.PORT || "4000", 10);
const CRM_RECEIPT_URL = process.env.CRM_RECEIPT_URL || "http://localhost:3000/api/receipts";

const app = express();
app.use(express.json());

interface SendRequest {
  communicationId: string;
  recipient: string;
  channel: string;
  message: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldHappen(probability: number): boolean {
  return Math.random() < probability;
}

async function callReceiptAPI(
  communicationId: string,
  event: string,
  metadata: Record<string, unknown> = {},
  retries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(CRM_RECEIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationId,
          event,
          timestamp: new Date().toISOString(),
          metadata,
        }),
      });

      if (res.ok) {
        console.log(`[CALLBACK SUCCESS] ${communicationId} -> ${event}`);
        return true;
      }

      const body = await res.text();
      console.log(`[CALLBACK FAILURE] Attempt ${attempt}/${retries} - ${res.status}: ${body}`);
    } catch (error) {
      console.log(`[CALLBACK ERROR] Attempt ${attempt}/${retries} - ${error}`);
    }

    if (attempt < retries) {
      await sleep(1000 * attempt);
    }
  }

  console.log(`[CALLBACK FAILED] ${communicationId} -> ${event} after ${retries} retries`);
  return false;
}

async function simulateLifecycle(communicationId: string): Promise<void> {
  // sent after 1 second
  await sleep(1000);
  await callReceiptAPI(communicationId, "sent");
  console.log(`[EVENT] ${communicationId} -> sent`);

  if (!shouldHappen(0.95)) {
    console.log(`[STOP] ${communicationId} -> failed at send stage`);
    return;
  }

  // delivered or failed after 2-4 seconds
  await sleep(randomBetween(2000, 4000));

  if (shouldHappen(0.85)) {
    await callReceiptAPI(communicationId, "delivered");
    console.log(`[EVENT] ${communicationId} -> delivered`);
  } else {
    await callReceiptAPI(communicationId, "failed");
    console.log(`[EVENT] ${communicationId} -> failed`);
    return; // stop lifecycle
  }

  // opened after 5-8 seconds
  await sleep(randomBetween(5000, 8000));
  if (shouldHappen(0.55)) {
    await callReceiptAPI(communicationId, "opened");
    console.log(`[EVENT] ${communicationId} -> opened`);
  } else {
    return; // lifecycle stops here naturally
  }

  // clicked after 8-12 seconds
  await sleep(randomBetween(8000, 12000));
  if (shouldHappen(0.25)) {
    await callReceiptAPI(communicationId, "clicked");
    console.log(`[EVENT] ${communicationId} -> clicked`);
  } else {
    return;
  }

  // converted after 12-15 seconds
  await sleep(randomBetween(12000, 15000));
  if (shouldHappen(0.08)) {
    const revenue = randomBetween(399, 2499);
    await callReceiptAPI(communicationId, "converted", { revenue });
    console.log(`[EVENT] ${communicationId} -> converted (₹${revenue})`);
  }
}

app.post("/send", (req, res) => {
  const { communicationId, recipient, channel, message } = req.body as SendRequest;

  console.log(`[ACCEPTED] Communication ${communicationId}`);
  console.log(`  Recipient: ${recipient}`);
  console.log(`  Channel: ${channel}`);
  console.log(`  Message: ${message.substring(0, 50)}...`);

  // Return accepted immediately
  res.json({ accepted: true });

  // Simulate lifecycle asynchronously
  simulateLifecycle(communicationId).catch((err) =>
    console.error(`[FATAL] Lifecycle error for ${communicationId}:`, err)
  );
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Channel Service] Running on port ${PORT}`);
  console.log(`[Channel Service] CRM Receipt URL: ${CRM_RECEIPT_URL}`);
});