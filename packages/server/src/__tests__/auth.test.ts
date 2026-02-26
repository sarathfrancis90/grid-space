import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

// Mock Prisma to avoid needing a real database
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
    compare: vi.fn(),
  },
}));

import prisma from "../models/prisma";
import bcrypt from "bcryptjs";

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const mockBcrypt = bcrypt as unknown as {
  hash: ReturnType<typeof vi.fn>;
  compare: ReturnType<typeof vi.fn>;
};

describe("Auth Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("creates a user and returns tokens", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        avatarUrl: null,
        emailVerified: false,
        createdAt: new Date(),
      });

      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "password123",
        name: "Test",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("test@example.com");
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("rejects duplicate email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
      });

      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("rejects short password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "short",
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it("rejects invalid email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "not-an-email",
        password: "password123",
      });

      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns tokens for valid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        avatarUrl: null,
        emailVerified: true,
        passwordHash: "$2b$12$hashedpassword",
        tokenVersion: 0,
        createdAt: new Date(),
      });
      mockBcrypt.compare.mockResolvedValue(true);

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("test@example.com");
      expect(res.body.data.accessToken).toBeDefined();
      // Check refresh token cookie
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const refreshCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.includes("refreshToken"))
        : cookies;
      expect(refreshCookie).toContain("refreshToken");
      expect(refreshCookie).toContain("HttpOnly");
    });

    it("rejects invalid password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        passwordHash: "$2b$12$hashedpassword",
        tokenVersion: 0,
      });
      mockBcrypt.compare.mockResolvedValue(false);

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post("/api/auth/login").send({
        email: "nobody@example.com",
        password: "password123",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("rejects request without refresh token cookie", async () => {
      const res = await request(app).post("/api/auth/refresh");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears the refresh token cookie", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("Logged out");
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("returns success even for non-existent email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "nobody@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Protected routes", () => {
    it("GET /api/users/me returns 401 without token", async () => {
      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(401);
    });

    it("GET /api/users/me returns 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });
  });

  describe("OAuth stubs", () => {
    it("GET /api/auth/oauth/google returns 501", async () => {
      const res = await request(app).get("/api/auth/oauth/google");
      expect(res.status).toBe(501);
    });

    it("GET /api/auth/oauth/github returns 501", async () => {
      const res = await request(app).get("/api/auth/oauth/github");
      expect(res.status).toBe(501);
    });
  });
});
