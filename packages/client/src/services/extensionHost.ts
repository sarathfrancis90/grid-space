/**
 * Extension host — manages the sandboxed iframe runtime for extensions.
 * Handles message passing between host and sandbox via postMessage.
 */
import type {
  ExtensionPermission,
  HostToSandboxMessage,
  SandboxToHostMessage,
} from "../types/extension";
import { useExtensionStore } from "../stores/extensionStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

interface SandboxInstance {
  iframe: HTMLIFrameElement;
  extensionId: string;
  permissions: ExtensionPermission[];
  pendingRequests: Map<string, PendingRequest>;
}

const sandboxes = new Map<string, SandboxInstance>();


/** Checks if the extension has the required permission */
function checkPermission(
  sandbox: SandboxInstance,
  required: ExtensionPermission,
): boolean {
  return sandbox.permissions.includes(required);
}

/** Handle incoming API calls from sandboxed extensions */
function handleApiCall(
  sandbox: SandboxInstance,
  requestId: string,
  method: string,
  args: unknown[],
): void {
  const respond = (result: unknown, error?: string) => {
    const message: HostToSandboxMessage = {
      type: "api-response",
      requestId,
      result,
      error,
    };
    sandbox.iframe.contentWindow?.postMessage(message, "*");
  };

  try {
    switch (method) {
      case "getCellValue": {
        if (!checkPermission(sandbox, "cells:read")) {
          respond(null, "Permission denied: cells:read");
          return;
        }
        const [, cellRef] = args as [string, string];
        const sheetId = useSpreadsheetStore.getState().activeSheetId;
        const cell = useCellStore.getState().getCellByRef?.(sheetId, cellRef);
        respond(cell?.value ?? null);
        break;
      }
      case "setCellValue": {
        if (!checkPermission(sandbox, "cells:write")) {
          respond(null, "Permission denied: cells:write");
          return;
        }
        respond(null);
        break;
      }
      case "getActiveSheet": {
        if (!checkPermission(sandbox, "sheets:read")) {
          respond(null, "Permission denied: sheets:read");
          return;
        }
        const state = useSpreadsheetStore.getState();
        const sheet = state.sheets.find((s) => s.id === state.activeSheetId);
        respond(sheet?.name ?? null);
        break;
      }
      case "getSheetNames": {
        if (!checkPermission(sandbox, "sheets:read")) {
          respond(null, "Permission denied: sheets:read");
          return;
        }
        const sheets = useSpreadsheetStore.getState().sheets;
        respond(sheets.map((s) => s.name));
        break;
      }
      case "storageGet": {
        if (!checkPermission(sandbox, "storage:local")) {
          respond(null, "Permission denied: storage:local");
          return;
        }
        const [key] = args as [string];
        const store = useExtensionStore.getState();
        const ext = store.extensions.find(
          (e) => e.extensionId === sandbox.extensionId,
        );
        respond(ext?.localStorage[key] ?? null);
        break;
      }
      case "storageSet": {
        if (!checkPermission(sandbox, "storage:local")) {
          respond(null, "Permission denied: storage:local");
          return;
        }
        const [sKey, sValue] = args as [string, string];
        const extStore = useExtensionStore.getState();
        const extRecord = extStore.extensions.find(
          (e) => e.extensionId === sandbox.extensionId,
        );
        if (extRecord) {
          extStore.setExtensionStorage(extRecord.id, sKey, sValue);
        }
        respond(null);
        break;
      }
      default:
        respond(null, `Unknown method: ${method}`);
    }
  } catch (err) {
    respond(null, err instanceof Error ? err.message : "Internal error");
  }
}

/** Handle messages from sandbox iframes */
function onMessage(event: MessageEvent): void {
  const data = event.data as SandboxToHostMessage;
  if (!data || typeof data.type !== "string") return;

  // Find the sandbox that sent this message
  let sourceSandbox: SandboxInstance | undefined;
  for (const [, sandbox] of sandboxes) {
    if (sandbox.iframe.contentWindow === event.source) {
      sourceSandbox = sandbox;
      break;
    }
  }

  if (!sourceSandbox) return;

  switch (data.type) {
    case "ready":
      useExtensionStore
        .getState()
        .setExtensionStatus(
          getRecordId(sourceSandbox.extensionId) ?? "",
          "active",
        );
      break;
    case "api-call":
      handleApiCall(sourceSandbox, data.requestId, data.method, data.args);
      break;
    case "error": {
      const recId = getRecordId(sourceSandbox.extensionId);
      if (recId) {
        useExtensionStore
          .getState()
          .setExtensionStatus(recId, "error", data.message);
      }
      break;
    }
  }
}

function getRecordId(extensionId: string): string | undefined {
  return useExtensionStore
    .getState()
    .extensions.find((e) => e.extensionId === extensionId)?.id;
}

/** Initialize the extension host message listener */
export function initExtensionHost(): void {
  window.addEventListener("message", onMessage);
}

/** Teardown the extension host */
export function destroyExtensionHost(): void {
  window.removeEventListener("message", onMessage);
  for (const [id] of sandboxes) {
    unloadExtension(id);
  }
}

/** Create a sandboxed iframe for an extension and send init message */
export function loadExtension(
  extensionId: string,
  permissions: ExtensionPermission[],
  entryPoint: string,
): void {
  if (sandboxes.has(extensionId)) return;

  const iframe = document.createElement("iframe");
  iframe.sandbox.add("allow-scripts");
  iframe.style.display = "none";
  iframe.src = entryPoint;
  document.body.appendChild(iframe);

  const sandbox: SandboxInstance = {
    iframe,
    extensionId,
    permissions,
    pendingRequests: new Map(),
  };

  sandboxes.set(extensionId, sandbox);

  iframe.addEventListener("load", () => {
    const initMsg: HostToSandboxMessage = {
      type: "init",
      extensionId,
      permissions,
    };
    iframe.contentWindow?.postMessage(initMsg, "*");
  });
}

/** Remove a sandboxed extension */
export function unloadExtension(extensionId: string): void {
  const sandbox = sandboxes.get(extensionId);
  if (!sandbox) return;

  sandbox.iframe.remove();
  sandbox.pendingRequests.clear();
  sandboxes.delete(extensionId);
}

/** Send an event to a specific extension */
export function sendEvent(
  extensionId: string,
  eventName: string,
  payload: unknown,
): void {
  const sandbox = sandboxes.get(extensionId);
  if (!sandbox) return;

  const msg: HostToSandboxMessage = {
    type: "event",
    eventName,
    payload,
  };
  sandbox.iframe.contentWindow?.postMessage(msg, "*");
}

/** Check if an extension sandbox is running */
export function isExtensionLoaded(extensionId: string): boolean {
  return sandboxes.has(extensionId);
}
