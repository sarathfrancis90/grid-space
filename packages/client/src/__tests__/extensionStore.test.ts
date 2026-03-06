import { describe, it, expect, beforeEach } from "vitest";
import { useExtensionStore } from "../stores/extensionStore";
import type {
  ExtensionManifest,
  ExtensionPermission,
} from "../types/extension";

function makeManifest(
  overrides?: Partial<ExtensionManifest>,
): ExtensionManifest {
  return {
    id: "com.test.sample-ext",
    name: "Sample Extension",
    version: "1.0.0",
    description: "A test extension",
    author: { name: "Test Author" },
    permissions: ["cells:read", "cells:write", "storage:local"],
    entryPoint: "index.js",
    ...overrides,
  };
}

describe("extensionStore", () => {
  beforeEach(() => {
    useExtensionStore.setState({
      extensions: [],
      isPanelOpen: false,
      selectedExtensionId: null,
      isLoading: false,
    });
  });

  it("has correct initial state", () => {
    const state = useExtensionStore.getState();
    expect(state.extensions).toEqual([]);
    expect(state.isPanelOpen).toBe(false);
    expect(state.selectedExtensionId).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("toggles panel open state", () => {
    useExtensionStore.getState().setPanelOpen(true);
    expect(useExtensionStore.getState().isPanelOpen).toBe(true);
    useExtensionStore.getState().setPanelOpen(false);
    expect(useExtensionStore.getState().isPanelOpen).toBe(false);
  });

  describe("installExtension", () => {
    it("installs an extension with manifest and permissions", () => {
      const manifest = makeManifest();
      const permissions: ExtensionPermission[] = ["cells:read"];

      const id = useExtensionStore
        .getState()
        .installExtension(manifest, permissions);

      expect(id).toBeTruthy();
      const exts = useExtensionStore.getState().extensions;
      expect(exts).toHaveLength(1);
      expect(exts[0].extensionId).toBe("com.test.sample-ext");
      expect(exts[0].manifest.name).toBe("Sample Extension");
      expect(exts[0].status).toBe("installed");
      expect(exts[0].grantedPermissions).toEqual(["cells:read"]);
    });

    it("prevents duplicate installs", () => {
      const manifest = makeManifest();
      useExtensionStore.getState().installExtension(manifest, []);
      useExtensionStore.getState().installExtension(manifest, []);

      expect(useExtensionStore.getState().extensions).toHaveLength(1);
    });

    it("allows different extensions to be installed", () => {
      useExtensionStore.getState().installExtension(makeManifest(), []);
      useExtensionStore
        .getState()
        .installExtension(makeManifest({ id: "com.test.other" }), []);

      expect(useExtensionStore.getState().extensions).toHaveLength(2);
    });
  });

  describe("uninstallExtension", () => {
    it("removes an extension", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), []);

      useExtensionStore.getState().uninstallExtension(id);
      expect(useExtensionStore.getState().extensions).toHaveLength(0);
    });

    it("clears selection if uninstalling selected extension", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), []);

      useExtensionStore.getState().selectExtension(id);
      expect(useExtensionStore.getState().selectedExtensionId).toBe(id);

      useExtensionStore.getState().uninstallExtension(id);
      expect(useExtensionStore.getState().selectedExtensionId).toBeNull();
    });
  });

  describe("setExtensionStatus", () => {
    it("updates status to active", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), []);

      useExtensionStore.getState().setExtensionStatus(id, "active");
      const ext = useExtensionStore.getState().extensions[0];
      expect(ext.status).toBe("active");
    });

    it("sets error message when status is error", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), []);

      useExtensionStore
        .getState()
        .setExtensionStatus(id, "error", "Something broke");
      const ext = useExtensionStore.getState().extensions[0];
      expect(ext.status).toBe("error");
      expect(ext.errorMessage).toBe("Something broke");
    });

    it("clears error message when status is not error", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), []);

      useExtensionStore.getState().setExtensionStatus(id, "error", "Broke");
      useExtensionStore.getState().setExtensionStatus(id, "active");

      const ext = useExtensionStore.getState().extensions[0];
      expect(ext.errorMessage).toBeUndefined();
    });
  });

  describe("permissions", () => {
    it("setGrantedPermissions updates permissions", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), ["cells:read"]);

      useExtensionStore
        .getState()
        .setGrantedPermissions(id, ["cells:read", "cells:write"]);

      const ext = useExtensionStore.getState().extensions[0];
      expect(ext.grantedPermissions).toEqual(["cells:read", "cells:write"]);
    });

    it("hasPermission checks granted permissions", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), ["cells:read"]);

      expect(useExtensionStore.getState().hasPermission(id, "cells:read")).toBe(
        true,
      );
      expect(
        useExtensionStore.getState().hasPermission(id, "cells:write"),
      ).toBe(false);
    });

    it("hasPermission returns false for unknown extension", () => {
      expect(
        useExtensionStore.getState().hasPermission("unknown", "cells:read"),
      ).toBe(false);
    });
  });

  describe("localStorage", () => {
    it("set and get extension storage", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), ["storage:local"]);

      useExtensionStore.getState().setExtensionStorage(id, "key1", "value1");
      expect(useExtensionStore.getState().getExtensionStorage(id, "key1")).toBe(
        "value1",
      );
    });

    it("returns null for missing key", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), []);

      expect(
        useExtensionStore.getState().getExtensionStorage(id, "missing"),
      ).toBeNull();
    });

    it("removes key when value is null", () => {
      const id = useExtensionStore
        .getState()
        .installExtension(makeManifest(), []);

      useExtensionStore.getState().setExtensionStorage(id, "key1", "value1");
      useExtensionStore.getState().setExtensionStorage(id, "key1", null);
      expect(
        useExtensionStore.getState().getExtensionStorage(id, "key1"),
      ).toBeNull();
    });

    it("returns null for unknown extension", () => {
      expect(
        useExtensionStore.getState().getExtensionStorage("unknown", "key"),
      ).toBeNull();
    });
  });

  describe("getExtensionsByStatus", () => {
    it("filters extensions by status", () => {
      const id1 = useExtensionStore
        .getState()
        .installExtension(makeManifest(), []);
      useExtensionStore
        .getState()
        .installExtension(makeManifest({ id: "com.test.ext2" }), []);

      useExtensionStore.getState().setExtensionStatus(id1, "active");

      const active = useExtensionStore
        .getState()
        .getExtensionsByStatus("active");
      const installed = useExtensionStore
        .getState()
        .getExtensionsByStatus("installed");

      expect(active).toHaveLength(1);
      expect(installed).toHaveLength(1);
    });
  });

  describe("loadExtensions", () => {
    it("replaces all extensions from server data", () => {
      useExtensionStore.getState().installExtension(makeManifest(), []);

      useExtensionStore.getState().loadExtensions([
        {
          id: "server-1",
          extensionId: "com.server.ext",
          manifest: makeManifest({ id: "com.server.ext" }),
          status: "active",
          grantedPermissions: ["cells:read"],
          installedAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          localStorage: {},
        },
      ]);

      const exts = useExtensionStore.getState().extensions;
      expect(exts).toHaveLength(1);
      expect(exts[0].id).toBe("server-1");
    });
  });
});
