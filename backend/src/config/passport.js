import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as TwitterStrategy } from "passport-twitter";
import handleOAuthUser from "../utils/oauthHandler.js";

// ─── Google Strategy ───────────────────────────────────────────────────────

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        scope: ["profile", "email"], // what we're asking Google to share
      },
      async (accessToken, refreshToken, profile, done) => {
        // accessToken and refreshToken here are GOOGLE'S tokens — not ours
        // We don't use or store them
        // profile contains everything Google returned about the user
        try {
          const user = await handleOAuthUser({
            provider: "google",
            providerId: profile.id,
            email: profile.emails?.[0]?.value || null,
            fullName: profile.displayName,
            profilePicture: profile.photos?.[0]?.value || null,
          });

          // done(error, user) — Passport's way of signalling success or failure
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );
} else {
  console.warn("⚠️  Google OAuth not configured — GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
}

// ─── Facebook Strategy ─────────────────────────────────────────────────────

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "picture.type(large)"],
        // profileFields tells Facebook exactly which fields to return
        // Without this, Facebook returns almost nothing by default
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await handleOAuthUser({
            provider: "facebook",
            providerId: profile.id,
            email: profile.emails?.[0]?.value || null,
            fullName:
              `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim(),
            profilePicture: profile.photos?.[0]?.value || null,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );
} else {
  console.warn("⚠️  Facebook OAuth not configured — FACEBOOK_APP_ID or FACEBOOK_APP_SECRET missing");
}

// ─── Twitter Strategy ──────────────────────────────────────────────────────

if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CLIENT_ID,
        consumerSecret: process.env.TWITTER_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/twitter/callback`,
        includeEmail: true, // Twitter requires explicit permission to return email
      },
      async (token, tokenSecret, profile, done) => {
        // Twitter uses OAuth 1.0a — uses token + tokenSecret instead of
        // accessToken + refreshToken. The logic is the same for us.
        try {
          const user = await handleOAuthUser({
            provider: "twitter",
            providerId: profile.id,
            email: profile.emails?.[0]?.value || null,
            fullName: profile.displayName,
            profilePicture: profile.photos?.[0]?.value || null,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );
} else {
  console.warn("⚠️  Twitter OAuth not configured — TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET missing");
}

export default passport;

