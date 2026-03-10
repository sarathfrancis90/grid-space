import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    pendingInvite: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn(),
    },
    spreadsheetAccess: {
      upsert: vi.fn(),
    },
    $transaction: vi
      .fn()
      .mockImplementation((fn: (tx: unknown) => Promise<void>) =>
        fn(mockPrisma),
      ),
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
    compare: vi.fn(),
  },
}));

import { uploadAvatar, removeAvatar } from "../services/auth.service";
import prisma from "../models/prisma";

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const VALID_PNG_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  emailVerified: true,
  createdAt: new Date("2024-01-01"),
};

describe("Avatar Upload Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadAvatar", () => {
    it("accepts a valid PNG data URI", async () => {
      const updatedUser = { ...mockUser, avatarUrl: VALID_PNG_DATA_URI };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await uploadAvatar("user-1", VALID_PNG_DATA_URI);

      expect(result.avatarUrl).toBe(VALID_PNG_DATA_URI);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { avatarUrl: VALID_PNG_DATA_URI },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          emailVerified: true,
          createdAt: true,
        },
      });
    });

    it("accepts a valid JPEG data URI", async () => {
      const jpegUri = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
      const updatedUser = { ...mockUser, avatarUrl: jpegUri };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await uploadAvatar("user-1", jpegUri);
      expect(result.avatarUrl).toBe(jpegUri);
    });

    it("accepts a valid GIF data URI", async () => {
      const gifUri = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAA=";
      const updatedUser = { ...mockUser, avatarUrl: gifUri };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await uploadAvatar("user-1", gifUri);
      expect(result.avatarUrl).toBe(gifUri);
    });

    it("rejects invalid data URI format", async () => {
      await expect(
        uploadAvatar("user-1", "not-a-data-uri"),
      ).rejects.toThrow("Invalid image data URI format");
    });

    it("rejects unsupported image types", async () => {
      const bmpUri = "data:image/bmp;base64,Qk0=";
      await expect(uploadAvatar("user-1", bmpUri)).rejects.toThrow(
        "Unsupported image type",
      );
    });

    it("rejects images exceeding 2MB", async () => {
      // Create a data URI with >2MB of base64 data
      const largeBase64 = "A".repeat(3 * 1024 * 1024); // ~2.25MB decoded
      const largeUri = `data:image/png;base64,${largeBase64}`;

      await expect(uploadAvatar("user-1", largeUri)).rejects.toThrow(
        "Image exceeds 2MB limit",
      );
    });
  });

  describe("removeAvatar", () => {
    it("sets avatarUrl to null", async () => {
      const updatedUser = { ...mockUser, avatarUrl: null };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await removeAvatar("user-1");

      expect(result.avatarUrl).toBeNull();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { avatarUrl: null },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          emailVerified: true,
          createdAt: true,
        },
      });
    });
  });

  describe("Avatar API routes (unauthenticated)", () => {
    it("POST /api/users/me/avatar returns 401 without token", async () => {
      const res = await request(app)
        .post("/api/users/me/avatar")
        .send({ avatar: VALID_PNG_DATA_URI });
      expect(res.status).toBe(401);
    });

    it("DELETE /api/users/me/avatar returns 401 without token", async () => {
      const res = await request(app).delete("/api/users/me/avatar");
      expect(res.status).toBe(401);
    });
  });
});
