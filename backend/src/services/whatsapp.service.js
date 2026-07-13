import twilio from "twilio";

// Lazily create a single Twilio client the first time it's needed and reuse it
// across all sends. Returns null when credentials aren't configured so callers
// can skip silently.
let client = null;
const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  if (!client) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }
  return client;
};

// phone should be in E.164 format: +2348012345678
// Twilio will prepend 'whatsapp:' to it
export const sendWhatsApp = async ({ to, body }) => {
  const client = getClient();
  if (!client) {
    // Not yet configured — skip silently
    return { skipped: true };
  }

  // Ensure the number is in E.164 format
  const formattedTo = to.startsWith("+") ? to : `+${to}`;

  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // 'whatsapp:+234xxxxxxxxxx'
      to: `whatsapp:${formattedTo}`,
      body,
    });
    return message;
  } catch (error) {
    // Same philosophy as email — log but don't throw
    console.error("[WHATSAPP ERROR]", error.message);
    return { error: error.message };
  }
};
