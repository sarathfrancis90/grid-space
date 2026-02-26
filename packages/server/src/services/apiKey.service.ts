/**
 * API Key service — create, validate, list, revoke API keys.
 * Keys are prefixed with gs_ and stored as bcrypt hashes.
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

const KEY_PREFIX = "gs_";
const KEY_BYTES = 32;
const BCRYPT_ROUNDS = 10;

interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  rateLimit: number;
  createdAt: Date;
}

interface CreateKeyResult {
  key: string;
  apiKey: ApiKeyInfo;
}

/** Generate a new random API key with gs_ prefix */
function generateKey(): string {
  const random = crypto.randomBytes(KEY_BYTES).toString("hex");
  return `${KEY_PREFIX}${random}`;
}

/** Create a new API key for a user — returns the raw key (shown only once) */
export async function createApiKey(
  userId: string,
  name: string,
  expiresAt?: Date,
): Promise<CreateKeyResult> {
  const rawKey = generateKey();
  const keyHash = await bcrypt.hash(rawKey, BCRYPT_ROUNDS);
  const prefix = rawKey.slice(0, 11); // "gs_" + first 8 hex chars

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash,
      prefix,
      expiresAt: expiresAt ?? null,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      expiresAt: true,
      rateLimit: true,
      createdAt: true,
    },
  });

  logger.info({ userId, keyId: apiKey.id }, "API key created");

  return { key: rawKey, apiKey };
}

/** List all API keys for a user (without hashes) */
export async function listApiKeys(userId: string): Promise<ApiKeyInfo[]> {
  return prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      expiresAt: true,
      rateLimit: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Revoke (delete) an API key */
export async function revokeApiKey(
  keyId: string,
  userId: string,
): Promise<void> {
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId },
    select: { userId: true },
  });

  if (!key) {
    throw new NotFoundError("API key not found");
  }

  if (key.userId !== userId) {
    throw new ForbiddenError("You can only revoke your own API keys");
  }

  await prisma.apiKey.delete({ where: { id: keyId } });

  logger.info({ userId, keyId }, "API key revoked");
}

/** Validate an API key — returns the userId if valid, null if not */
export async function validateApiKey(
  rawKey: string,
): Promise<{ userId: string; keyId: string } | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) {
    return null;
  }

  const prefix = rawKey.slice(0, 11);

  // Find candidate keys by prefix to narrow the bcrypt comparison
  const candidates = await prisma.apiKey.findMany({
    where: { prefix },
    select: {
      id: true,
      userId: true,
      keyHash: true,
      expiresAt: true,
    },
  });

  for (const candidate of candidates) {
    // Check expiration
    if (candidate.expiresAt && candidate.expiresAt < new Date()) {
      continue;
    }

    const match = await bcrypt.compare(rawKey, candidate.keyHash);
    if (match) {
      // Update lastUsedAt asynchronously (fire-and-forget)
      prisma.apiKey
        .update({
          where: { id: candidate.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {
          // Ignore update errors — non-critical
        });

      return { userId: candidate.userId, keyId: candidate.id };
    }
  }

  return null;
}
