import prisma from "../config/prisma.js";

// This function is called by every OAuth strategy after the provider
// returns the user's profile. It handles finding or creating the user
// and returns the user record.

const handleOAuthUser = async ({
  provider,
  providerId,
  email,
  fullName,
  profilePicture,
}) => {
  // ── Step 1: Look for an existing user with this provider + providerId ──
  // This handles returning users who previously logged in with this provider
  const existingByProvider = await prisma.user.findFirst({
    where: {
      authProvider: provider.toUpperCase(),
      providerId,
    },
  });

  if (existingByProvider) {
    return existingByProvider;
  }

  // ── Step 2: Look for an existing user with this email ──
  // This handles the case where a user registered with credentials
  // and is now trying to log in with OAuth using the same email
  if (email) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Link this OAuth provider to their existing account
      // so future logins with this provider find them immediately (Step 1)
      const updatedUser = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          authProvider: provider.toUpperCase(),
          providerId,
          // Update profile picture only if they don't have one yet
          ...(profilePicture &&
            !existingByEmail.profilePicture && {
              profilePicture,
            }),
          isEmailVerified: true, // email is verified by the provider
        },
      });
      return updatedUser;
    }
  }

  // ── Step 3: No existing user — create a new account ──
  const newUser = await prisma.user.create({
    data: {
      fullName: fullName || "User",
      email: email || null,
      authProvider: provider.toUpperCase(),
      providerId,
      profilePicture: profilePicture || null,
      role: "CLIENT",
      isEmailVerified: true, // OAuth providers verify emails themselves
      // passwordHash is intentionally null — OAuth users have no password
    },
  });

  return newUser;
};

export default handleOAuthUser;
