import { describe, it, expect, vi } from "vitest";
import type { Mock } from "vitest";

// Mock Prisma before importing the service
vi.mock("../models/prisma", () => ({
  default: {
    extension: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    extensionInstall: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../utils/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import * as extensionService from "../services/extension.service";
import prisma from "../models/prisma";

// Cast to access mock methods
const extFindMany = prisma.extension.findMany as unknown as Mock;
const extFindUnique = prisma.extension.findUnique as unknown as Mock;
const extCreate = prisma.extension.create as unknown as Mock;
const installFindUnique = prisma.extensionInstall.findUnique as unknown as Mock;

describe("extension.service", () => {
  describe("listPublishedExtensions", () => {
    it("returns published extensions sorted by install count", async () => {
      const mockExtensions = [
        {
          id: "ext-1",
          name: "Popular Ext",
          slug: "popular-ext",
          description: "Desc",
          version: "1.0.0",
          iconUrl: null,
          permissions: ["read:cells"],
          isPublished: true,
          isVerified: true,
          installCount: 100,
          author: { id: "u-1", name: "Author" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      extFindMany.mockResolvedValue(mockExtensions);

      const result = await extensionService.listPublishedExtensions();
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("popular-ext");
      expect(extFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true },
          orderBy: { installCount: "desc" },
        }),
      );
    });
  });

  describe("getExtension", () => {
    it("throws NotFoundError for unknown slug", async () => {
      extFindUnique.mockResolvedValue(null);

      await expect(
        extensionService.getExtension("nonexistent"),
      ).rejects.toThrow("Extension not found");
    });

    it("returns extension detail for valid slug", async () => {
      const mockExt = {
        id: "ext-1",
        name: "Test",
        slug: "test",
        description: "",
        version: "1.0.0",
        iconUrl: null,
        permissions: [],
        isPublished: true,
        isVerified: false,
        installCount: 0,
        author: { id: "u-1", name: "Dev" },
        entryPoint: "index.js",
        sourceCode: "console.log('hi')",
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      extFindUnique.mockResolvedValue(mockExt);

      const result = await extensionService.getExtension("test");
      expect(result.slug).toBe("test");
      expect(result.sourceCode).toBe("console.log('hi')");
    });
  });

  describe("createExtension", () => {
    it("creates extension with valid data", async () => {
      extFindUnique.mockResolvedValue(null);

      const created = {
        id: "ext-new",
        name: "My Extension",
        slug: "my-extension",
        description: "A test extension",
        version: "1.0.0",
        iconUrl: null,
        permissions: ["read:cells"],
        isPublished: false,
        isVerified: false,
        installCount: 0,
        author: { id: "u-1", name: "Dev" },
        entryPoint: "index.js",
        sourceCode: "",
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      extCreate.mockResolvedValue(created);

      const result = await extensionService.createExtension("u-1", {
        name: "My Extension",
        description: "A test extension",
        permissions: ["read:cells"],
      });

      expect(result.slug).toBe("my-extension");
      expect(extCreate).toHaveBeenCalled();
    });

    it("rejects duplicate slug", async () => {
      extFindUnique.mockResolvedValue({ id: "existing" });

      await expect(
        extensionService.createExtension("u-1", {
          name: "My Extension",
        }),
      ).rejects.toThrow("Extension slug already taken");
    });

    it("rejects invalid permissions", async () => {
      extFindUnique.mockResolvedValue(null);

      await expect(
        extensionService.createExtension("u-1", {
          name: "Bad Ext",
          permissions: ["hack:system"],
        }),
      ).rejects.toThrow("Invalid permission: hack:system");
    });
  });

  describe("deleteExtension", () => {
    it("throws NotFoundError for unknown extension", async () => {
      extFindUnique.mockResolvedValue(null);

      await expect(
        extensionService.deleteExtension("u-1", "nonexistent"),
      ).rejects.toThrow("Extension not found");
    });

    it("throws ForbiddenError for non-author", async () => {
      extFindUnique.mockResolvedValue({
        id: "ext-1",
        authorId: "u-other",
      });

      await expect(
        extensionService.deleteExtension("u-1", "some-ext"),
      ).rejects.toThrow("Only the author can delete this extension");
    });
  });

  describe("installExtension", () => {
    it("throws NotFoundError for unknown extension", async () => {
      extFindUnique.mockResolvedValue(null);

      await expect(
        extensionService.installExtension("u-1", "nonexistent"),
      ).rejects.toThrow("Extension not found");
    });

    it("throws ForbiddenError for unpublished extension by non-author", async () => {
      extFindUnique.mockResolvedValue({
        id: "ext-1",
        isPublished: false,
        authorId: "u-other",
      });

      await expect(
        extensionService.installExtension("u-1", "private-ext"),
      ).rejects.toThrow("Extension is not published");
    });

    it("throws ValidationError for already installed extension", async () => {
      extFindUnique.mockResolvedValue({
        id: "ext-1",
        isPublished: true,
        authorId: "u-other",
        name: "Test",
        slug: "test",
        description: "",
        version: "1.0.0",
        iconUrl: null,
        permissions: [],
        isVerified: false,
        installCount: 5,
        author: { id: "u-other", name: "Dev" },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      installFindUnique.mockResolvedValue({ id: "inst-1" });

      await expect(
        extensionService.installExtension("u-1", "test"),
      ).rejects.toThrow("Extension already installed");
    });
  });

  describe("uninstallExtension", () => {
    it("throws NotFoundError when extension not found", async () => {
      extFindUnique.mockResolvedValue(null);

      await expect(
        extensionService.uninstallExtension("u-1", "nonexistent"),
      ).rejects.toThrow("Extension not found");
    });

    it("throws NotFoundError when extension not installed", async () => {
      extFindUnique.mockResolvedValue({ id: "ext-1" });
      installFindUnique.mockResolvedValue(null);

      await expect(
        extensionService.uninstallExtension("u-1", "test"),
      ).rejects.toThrow("Extension not installed");
    });
  });

  describe("toggleExtension", () => {
    it("throws NotFoundError for unknown extension", async () => {
      extFindUnique.mockResolvedValue(null);

      await expect(
        extensionService.toggleExtension("u-1", "nonexistent", true),
      ).rejects.toThrow("Extension not found");
    });

    it("throws NotFoundError when extension not installed", async () => {
      extFindUnique.mockResolvedValue({ id: "ext-1" });
      installFindUnique.mockResolvedValue(null);

      await expect(
        extensionService.toggleExtension("u-1", "test", false),
      ).rejects.toThrow("Extension not installed");
    });
  });
});
