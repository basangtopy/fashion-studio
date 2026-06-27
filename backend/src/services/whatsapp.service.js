import twilio from "twilio";


// phone should be in E.164 format: +2348012345678
// Twilio will prepend 'whatsapp:' to it
export const sendWhatsApp = async ({ to, body }) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    // Not yet configured — skip silently
    return { skipped: true };
  }

  // Initialise Twilio client
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );

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
