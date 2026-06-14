const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || "http://localhost:4000";

export interface SendPayload {
  communicationId: string;
  recipient: string;
  channel: string;
  message: string;
}

export async function sendToChannelService(payload: SendPayload): Promise<{ accepted: boolean }> {
  try {
    const res = await fetch(`${CHANNEL_SERVICE_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Channel service responded with ${res.status}`);
      return { accepted: false };
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to reach channel service:", error);
    return { accepted: false };
  }
}