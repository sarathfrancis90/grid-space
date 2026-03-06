import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import {
  connectSocket,
  disconnectSocket,
  joinSpreadsheet,
  leaveSpreadsheet,
} from "../services/realtimeService";

/**
 * Manages the WebSocket connection lifecycle for the spreadsheet editor.
 * Connects on mount (when authenticated and a spreadsheet ID is provided),
 * joins the spreadsheet room, and cleans up on unmount.
 */
export function useRealtimeConnection(spreadsheetId: string | undefined): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);

  useEffect(() => {
    if (!spreadsheetId || !isAuthenticated) return;

    const socket = connectSocket();

    const onConnect = () => {
      joinSpreadsheet(spreadsheetId, activeSheetId);
    };

    // If already connected, join immediately
    if (socket.connected) {
      joinSpreadsheet(spreadsheetId, activeSheetId);
    } else {
      // The realtimeService already sets up a "connect" handler that rejoins,
      // but we also listen here in case the socket connects after this effect runs
      socket.on("connect", onConnect);
    }

    return () => {
      socket.off("connect", onConnect);
      leaveSpreadsheet();
      disconnectSocket();
    };
  }, [spreadsheetId, isAuthenticated, activeSheetId]);
}
