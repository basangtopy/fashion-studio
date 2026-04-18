import "dotenv/config";
import app from "./app.js";
import prisma from "./config/prisma.js";

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

let server;

async function startServer() {
  try {
    // Test the database connection before starting the server
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    server = app.listen(PORT, HOST, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
// Handles SIGTERM (deploy/restart) and SIGINT (Ctrl+C) — drains connections
// before exiting so in-flight requests and DB transactions finish cleanly.

async function gracefulShutdown(signal) {
  console.log(`\n⏳ ${signal} received — shutting down gracefully...`);

  // 1. Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log("✅ HTTP server closed");
    });
  }

  // 2. Disconnect Prisma (releases connection pool)
  try {
    await prisma.$disconnect();
    console.log("✅ Database disconnected");
  } catch (err) {
    console.error("❌ Error disconnecting database:", err);
  }

  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ─── Global Error Safety Nets ───────────────────────────────────────────────
// Catches errors that escape Express's error boundary (e.g. from background
// tasks, timers, or SSE writes). Without these, Node.js crashes silently.

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION — shutting down...");
  console.error(err);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 UNHANDLED REJECTION — shutting down...");
  console.error(reason);
  gracefulShutdown("unhandledRejection");
});

startServer();

