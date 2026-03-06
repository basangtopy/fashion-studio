import { Router } from "express";
import passport from "../config/passport.js";
import {
  oauthCallback,
  oauthFailure,
} from "../controllers/oauth.controller.js";

const router = Router();

// ─── Google ────────────────────────────────────────────────────────────────

// Step 1: Redirect user to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, // we don't use sessions — we use JWTs
  }),
);

// Step 2: Google redirects back here after authentication
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/failure",
  }),
  oauthCallback,
);

// ─── Facebook ──────────────────────────────────────────────────────────────

router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
    session: false,
  }),
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/api/auth/failure",
  }),
  oauthCallback,
);

// ─── Twitter ───────────────────────────────────────────────────────────────

router.get(
  "/twitter",
  passport.authenticate("twitter", {
    session: false,
  }),
);

router.get(
  "/twitter/callback",
  passport.authenticate("twitter", {
    session: false,
    failureRedirect: "/api/auth/failure",
  }),
  oauthCallback,
);

// ─── Failure fallback ──────────────────────────────────────────────────────

router.get("/failure", oauthFailure);

export default router;
