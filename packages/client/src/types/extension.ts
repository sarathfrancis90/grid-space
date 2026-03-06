/**
 * Extension platform types — defines the extension manifest,
 * permissions model, lifecycle, and SDK API surface.
 */

// ─── PERMISSIONS ──────────────────────────────────────────

/** Granular permissions an extension can request */
export type ExtensionPermission =
  | "spreadsheet:read"
  | "spreadsheet:write"
  | "cells:read"
  | "cells:write"
  | "formatting:read"
  | "formatting:write"
  | "sheets:read"
  | "sheets:manage"
  | "charts:read"
  | "charts:write"
  | "ui:sidebar"
  | "ui:dialog"
  | "ui:menu"
  | "network:fetch"
  | "storage:local";

/** All valid permission values */
export const ALL_PERMISSIONS: readonly ExtensionPermission[] = [
  "spreadsheet:read",
  "spreadsheet:write",
  "cells:read",
  "cells:write",
  "formatting:read",
  "formatting:write",
  "sheets:read",
  "sheets:manage",
  "charts:read",
  "charts:write",
  "ui:sidebar",
  "ui:dialog",
  "ui:menu",
  "network:fetch",
  "storage:local",
] as const;

// ─── MANIFEST ─────────────────────────────────────────────

/** Extension manifest — declared in each extension's manifest.json */
export interface ExtensionManifest {
  /** Unique extension identifier (reverse-domain style, e.g. "com.example.my-ext") */
  id: string;
  /** Display name */
  name: string;
  /** Semantic version */
  version: string;
  /** Short description */
  description: string;
  /** Author information */
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  /** Minimum GridSpace version required */
  minAppVersion?: string;
  /** Icon URL (relative to extension root) */
  icon?: string;
  /** Requested permissions */
  permissions: ExtensionPermission[];
  /** Entry point (relative path to main JS file) */
  entryPoint: string;
  /** Menu items to add */
  menuItems?: ExtensionMenuItem[];
  /** Content Security Policy overrides for the sandbox */
  csp?: string;
  /** Homepage / repository URL */
  homepage?: string;
}

export interface ExtensionMenuItem {
  /** Menu item label */
  label: string;
  /** Handler function name exported by the extension */
  handler: string;
  /** Parent menu to add to */
  menu: "extensions" | "tools" | "data";
}

// ─── EXTENSION INSTANCE ───────────────────────────────────

/** Runtime status of an installed extension */
export type ExtensionStatus = "installed" | "active" | "disabled" | "error";

/** An installed extension record */
export interface InstalledExtension {
  /** Internal record ID */
  id: string;
  /** Extension manifest ID (e.g. "com.example.my-ext") */
  extensionId: string;
  /** The full manifest */
  manifest: ExtensionManifest;
  /** Current status */
  status: ExtensionStatus;
  /** Permissions granted by the user (subset of manifest.permissions) */
  grantedPermissions: ExtensionPermission[];
  /** ISO timestamp of install */
  installedAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Error message if status is "error" */
  errorMessage?: string;
  /** Per-extension local storage */
  localStorage: Record<string, string>;
}

// ─── SDK API TYPES ────────────────────────────────────────

/** Messages from host to sandbox iframe */
export type HostToSandboxMessage =
  | { type: "init"; extensionId: string; permissions: ExtensionPermission[] }
  | { type: "api-response"; requestId: string; result: unknown; error?: string }
  | { type: "event"; eventName: string; payload: unknown };

/** Messages from sandbox iframe to host */
export type SandboxToHostMessage =
  | { type: "ready"; extensionId: string }
  | { type: "api-call"; requestId: string; method: string; args: unknown[] }
  | {
      type: "ui-request";
      action: "openSidebar" | "openDialog" | "addMenuItem";
      payload: unknown;
    }
  | { type: "error"; message: string };

// ─── EXTENSION SDK API SURFACE ────────────────────────────

/** API methods available to extensions inside the sandbox */
export interface ExtensionSDKApi {
  /** Read a cell value */
  getCellValue(sheetName: string, cellRef: string): Promise<unknown>;
  /** Write a cell value */
  setCellValue(
    sheetName: string,
    cellRef: string,
    value: unknown,
  ): Promise<void>;
  /** Read a range of cell values */
  getRange(sheetName: string, rangeRef: string): Promise<unknown[][]>;
  /** Write a range of cell values */
  setRange(
    sheetName: string,
    rangeRef: string,
    values: unknown[][],
  ): Promise<void>;
  /** Get the active sheet name */
  getActiveSheet(): Promise<string>;
  /** Get all sheet names */
  getSheetNames(): Promise<string[]>;
  /** Get cell formatting */
  getCellFormat(
    sheetName: string,
    cellRef: string,
  ): Promise<Record<string, unknown>>;
  /** Set cell formatting */
  setCellFormat(
    sheetName: string,
    cellRef: string,
    format: Record<string, unknown>,
  ): Promise<void>;
  /** Store a value in extension-local storage */
  storageGet(key: string): Promise<string | null>;
  /** Retrieve a value from extension-local storage */
  storageSet(key: string, value: string): Promise<void>;
  /** Make an HTTP fetch (subject to network:fetch permission) */
  fetch(
    url: string,
    options?: RequestInit,
  ): Promise<{ status: number; body: string }>;
}

// ─── MARKETPLACE ──────────────────────────────────────────

/** A marketplace listing entry */
export interface MarketplaceListing {
  extensionId: string;
  manifest: ExtensionManifest;
  downloadUrl: string;
  downloads: number;
  rating: number;
  publishedAt: string;
  updatedAt: string;
  verified: boolean;
}

// ─── APPS SCRIPT COMPATIBILITY ────────────────────────────

/** Supported Apps Script service mappings */
export interface AppsScriptCompat {
  /** Maps Google Apps Script service names to GridSpace SDK equivalents */
  serviceMap: Record<string, string>;
  /** Known unsupported services */
  unsupportedServices: string[];
}

export const APPS_SCRIPT_SERVICE_MAP: AppsScriptCompat = {
  serviceMap: {
    "SpreadsheetApp.getActiveSpreadsheet": "gridspace.getActiveSheet",
    "SpreadsheetApp.getActiveSheet": "gridspace.getActiveSheet",
    "SpreadsheetApp.getRange": "gridspace.getRange",
    "SpreadsheetApp.getValue": "gridspace.getCellValue",
    "SpreadsheetApp.setValue": "gridspace.setCellValue",
    "SpreadsheetApp.getValues": "gridspace.getRange",
    "SpreadsheetApp.setValues": "gridspace.setRange",
  },
  unsupportedServices: [
    "DriveApp",
    "GmailApp",
    "CalendarApp",
    "FormApp",
    "SlidesApp",
    "DocumentApp",
  ],
};
