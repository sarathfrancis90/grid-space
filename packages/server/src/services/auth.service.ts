import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import prisma from "../models/prisma";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = 900; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 604800; // 7 days in seconds
const RESET_TOKEN_EXPIRY = 3600; // 1 hour in seconds

interface JwtPayload {
  userId: string;
  email: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
}

function signAccessToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function signRefreshToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

function generateTokens(userId: string, email: string): TokenPair {
  return {
    accessToken: signAccessToken(userId, email),
    refreshToken: signRefreshToken(userId, email),
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Token expired");
    }
    throw new AppError(401, "Invalid token");
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Refresh token expired");
    }
    throw new AppError(401, "Invalid refresh token");
  }
}

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
}): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export async function findOrCreateOAuthUser(
  email: string,
  name: string | null,
  avatarUrl: string | null,
  provider: string,
): Promise<{ user: UserProfile; tokens: TokenPair }> {
  let user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        avatarUrl,
        emailVerified: true, // OAuth emails are verified
        passwordHash: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    logger.info({ userId: user.id, provider }, "OAuth user created");
  } else {
    // Update avatar if not set
    if (!user.avatarUrl && avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          emailVerified: true,
          createdAt: true,
        },
      });
    }
    logger.info({ userId: user.id, provider }, "OAuth user logged in");
  }

  const tokens = generateTokens(user.id, user.email);
  return { user: sanitizeUser(user), tokens };
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<{ user: UserProfile; tokens: TokenPair }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  const tokens = generateTokens(user.id, user.email);

  logger.info({ userId: user.id }, "User registered");

  return { user: sanitizeUser(user), tokens };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: UserProfile; tokens: TokenPair }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      passwordHash: true,
      tokenVersion: true,
      createdAt: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const tokens = generateTokens(user.id, user.email);

  logger.info({ userId: user.id }, "User logged in");

  return { user: sanitizeUser(user), tokens };
}

export async function refreshTokens(
  refreshToken: string,
): Promise<{ user: UserProfile; tokens: TokenPair }> {
  const decoded = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(401, "User not found");
  }

  // Rotate tokens
  const tokens = generateTokens(user.id, user.email);

  return { user: sanitizeUser(user), tokens };
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return sanitizeUser(user);
}

export async function updateProfile(
  userId: string,
  data: { name?: string; avatarUrl?: string },
): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return sanitizeUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, tokenVersion: true },
  });

  if (!user || !user.passwordHash) {
    throw new AppError(400, "Cannot change password for OAuth-only account");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Increment token version to invalidate all existing tokens
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      tokenVersion: user.tokenVersion + 1,
    },
  });

  logger.info({ userId }, "Password changed");
}

export async function deleteAccount(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
  logger.info({ userId }, "Account deleted");
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    logger.info({ email }, "Forgot password for non-existent email");
    return;
  }

  // Generate reset token (short-lived) and log it for dev
  // TODO: Send reset email via Resend/SendGrid with this token
  const resetToken = jwt.sign(
    { userId: user.id, type: "reset" },
    env.JWT_SECRET,
    { expiresIn: RESET_TOKEN_EXPIRY },
  );

  logger.info(
    { userId: user.id, resetTokenPreview: resetToken.slice(0, 20) },
    "Password reset requested (email stubbed)",
  );
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  let decoded: { userId: string; type: string };
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      type: string;
    };
  } catch {
    throw new AppError(400, "Invalid or expired reset token");
  }

  if (decoded.type !== "reset") {
    throw new AppError(400, "Invalid token type");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: decoded.userId },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
  });

  logger.info({ userId: decoded.userId }, "Password reset completed");
}

export async function verifyEmail(token: string): Promise<void> {
  let decoded: { userId: string; type: string };
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      type: string;
    };
  } catch {
    throw new AppError(400, "Invalid or expired verification token");
  }

  if (decoded.type !== "verify-email") {
    throw new AppError(400, "Invalid token type");
  }

  await prisma.user.update({
    where: { id: decoded.userId },
    data: { emailVerified: true },
  });

  logger.info({ userId: decoded.userId }, "Email verified");
}
