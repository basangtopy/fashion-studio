import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";

import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// ─── Trust Proxy ──────────────────────────────────────────────────────────
// Required when behind a reverse proxy (Railway, Render, Nginx).
// Without this, req.ip returns the proxy's IP — all users share one rate limit.
app.set("trust proxy", 1);

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Parsing Middleware ────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Passport Initialization ───────────────────────────────────────────────
app.use(passport.initialize());

// ─── Logging Middleware ────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Health Check ─────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────
app.use("/api", routes);

// ─── Error Handling ───────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
