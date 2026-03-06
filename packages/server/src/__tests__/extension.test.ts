import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma — factory must be self-contained (hoisted)
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    extension: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { default: mockPrisma };
});

vi.mock("../utils/logger", () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import prisma from "../models/prisma";
import * as extensionService from "../services/extension.service";

const mockPrisma = prisma as unknown as {
  extension: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

function makeManifest(overrides?: Record<string, unknown>) {
  return {
    id: "com.test.ext",
    name: "Test Extension",
    version: "1.0.0",
    description: "A test extension",
    author: { name: "Test Author" },
    permissions: ["cells:read", "cells:write"],
    entryPoint: "index.js",
    ...overrides,
  };
}

describe("extension.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listExtensions", () => {
    it("returns extensions for a user", async () => {
      const extensions = [
        {
          id: "ext-1",
          extensionId: "com.test.ext",
          manifest: makeManifest(),
          status: "installed",
          grantedPerms: ["cells:read"],
          localStorage: {},
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrisma.extension.findMany.mockResolvedValue(extensions);

      const result = await extensionService.listExtensions("user-1");
      expect(result).toEqual(extensions);
      expect(mockPrisma.extension.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        select: expect.objectContaining({ id: true, extensionId: true }),
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getExtension", () => {
    it("returns extension when owner matches", async () => {
      const ext = {
        id: "ext-1",
        userId: "user-1",
        extensionId: "com.test.ext",
        manifest: makeManifest(),
        status: "installed",
        grantedPerms: [],
        localStorage: {},
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.extension.findUnique.mockResolvedValue(ext);

      const result = await extensionService.getExtension("user-1", "ext-1");
      expect(result.id).toBe("ext-1");
    });

    it("throws NotFoundError for missing extension", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue(null);

      await expect(
        extensionService.getExtension("user-1", "missing"),
      ).rejects.toThrow("Extension not found");
    });

    it("throws ForbiddenError for wrong user", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        id: "ext-1",
        userId: "other-user",
      });

      await expect(
        extensionService.getExtension("user-1", "ext-1"),
      ).rejects.toThrow("Access denied");
    });
  });

  describe("installExtension", () => {
    it("installs an extension with valid manifest", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue(null);
      mockPrisma.extension.create.mockResolvedValue({
        id: "ext-new",
        extensionId: "com.test.ext",
        manifest: makeManifest(),
        status: "installed",
        grantedPerms: ["cells:read"],
        localStorage: {},
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await extensionService.installExtension(
        "user-1",
        makeManifest(),
        ["cells:read"],
      );

      expect(result.id).toBe("ext-new");
      expect(mockPrisma.extension.create).toHaveBeenCalled();
    });

    it("rejects invalid manifest (missing id)", async () => {
      await expect(
        extensionService.installExtension("user-1", { name: "No ID" }, []),
      ).rejects.toThrow("Invalid manifest");
    });

    it("rejects manifest with invalid permission", async () => {
      await expect(
        extensionService.installExtension(
          "user-1",
          makeManifest({ permissions: ["invalid:perm"] }),
          [],
        ),
      ).rejects.toThrow("Invalid permission");
    });

    it("rejects if extension already installed", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        id: "existing",
      });

      await expect(
        extensionService.installExtension("user-1", makeManifest(), []),
      ).rejects.toThrow("already installed");
    });

    it("rejects granted permissions not in manifest", async () => {
      await expect(
        extensionService.installExtension("user-1", makeManifest(), [
          "storage:local",
        ]),
      ).rejects.toThrow("was not requested");
    });
  });

  describe("uninstallExtension", () => {
    it("deletes extension for the correct user", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        userId: "user-1",
        extensionId: "com.test.ext",
      });
      mockPrisma.extension.delete.mockResolvedValue({});

      await extensionService.uninstallExtension("user-1", "ext-1");
      expect(mockPrisma.extension.delete).toHaveBeenCalledWith({
        where: { id: "ext-1" },
      });
    });

    it("throws for wrong user", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        userId: "other-user",
        extensionId: "com.test.ext",
      });

      await expect(
        extensionService.uninstallExtension("user-1", "ext-1"),
      ).rejects.toThrow("Access denied");
    });
  });

  describe("updateExtensionStatus", () => {
    it("updates status", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        userId: "user-1",
      });
      mockPrisma.extension.update.mockResolvedValue({
        id: "ext-1",
        status: "active",
      });

      const result = await extensionService.updateExtensionStatus(
        "user-1",
        "ext-1",
        "active",
      );
      expect(result.status).toBe("active");
    });

    it("rejects invalid status", async () => {
      await expect(
        extensionService.updateExtensionStatus("user-1", "ext-1", "bogus"),
      ).rejects.toThrow("Invalid status");
    });
  });

  describe("updatePermissions", () => {
    it("updates granted permissions", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        userId: "user-1",
        manifest: makeManifest(),
      });
      mockPrisma.extension.update.mockResolvedValue({
        id: "ext-1",
        grantedPerms: ["cells:read", "cells:write"],
      });

      const result = await extensionService.updatePermissions(
        "user-1",
        "ext-1",
        ["cells:read", "cells:write"],
      );
      expect(result.grantedPerms).toEqual(["cells:read", "cells:write"]);
    });

    it("rejects permissions not in manifest", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        userId: "user-1",
        manifest: makeManifest(),
      });

      await expect(
        extensionService.updatePermissions("user-1", "ext-1", [
          "storage:local",
        ]),
      ).rejects.toThrow("was not requested");
    });
  });

  describe("updateStorage", () => {
    it("sets a storage value", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        userId: "user-1",
        grantedPerms: ["storage:local"],
        localStorage: {},
      });
      mockPrisma.extension.update.mockResolvedValue({});

      await extensionService.updateStorage(
        "user-1",
        "ext-1",
        "myKey",
        "myValue",
      );
      expect(mockPrisma.extension.update).toHaveBeenCalledWith({
        where: { id: "ext-1" },
        data: { localStorage: { myKey: "myValue" } },
      });
    });

    it("deletes key when value is null", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        userId: "user-1",
        grantedPerms: ["storage:local"],
        localStorage: { myKey: "old" },
      });
      mockPrisma.extension.update.mockResolvedValue({});

      await extensionService.updateStorage("user-1", "ext-1", "myKey", null);
      expect(mockPrisma.extension.update).toHaveBeenCalledWith({
        where: { id: "ext-1" },
        data: { localStorage: {} },
      });
    });

    it("rejects without storage:local permission", async () => {
      mockPrisma.extension.findUnique.mockResolvedValue({
        userId: "user-1",
        grantedPerms: [],
        localStorage: {},
      });

      await expect(
        extensionService.updateStorage("user-1", "ext-1", "key", "val"),
      ).rejects.toThrow("storage:local permission");
    });
  });
});
