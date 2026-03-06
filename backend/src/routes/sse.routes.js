import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { addClient, removeClient, sendToUsers } from "../utils/sseManager.js";
import prisma from "../config/prisma.js";

const router = Router();

// GET /api/sse — establish a persistent SSE connection
router.get("/", authenticate, async (req, res) => {
  const userId = req.user.userId;

  // Set SSE headers — these tell the browser this is a streaming response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disables Nginx buffering (important on Railway)

  // Flush headers immediately — starts the persistent connection
  res.flushHeaders();

  // Register this connection
  addClient(userId, res);

  const admins = await prisma.user.findMany({
    where: { role: { in: ["STAFF_ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  sendToUsers(
    admins.map((a) => a.id),
    "presence",
    {
      userId: userId,
      online: true,
    },
  );

  // Send an initial "connected" event so the client knows the connection is live
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ message: "Connected", userId })}\n\n`);

  // Heartbeat every 25 seconds — keeps the connection alive through proxies and load
  // balancers that would otherwise close idle connections
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
      // Lines starting with ':' are SSE comments — browsers ignore them
      // but the data being sent keeps the TCP connection alive
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  // Clean up when the client disconnects
  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(userId, res);

    sendToUsers(
      admins.map((a) => a.id),
      "presence",
      {
        userId: userId,
        online: false,
      },
    );
  });
});

export default router;
