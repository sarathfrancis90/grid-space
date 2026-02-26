# State Management (Zustand + Immer)

## 12 Stores

### Core Spreadsheet Stores (Sprints 1-8)

```typescript
// spreadsheetStore — metadata
{ id, title, sheets: Sheet[], activeSheetId }

// gridStore — viewport
{ scrollTop, scrollLeft, viewportWidth, viewportHeight, frozenRows, frozenCols }

// cellStore — THE source of truth for cell data
{ cells: Map<sheetId, Map<cellRef, CellData>> }
// CellData = { value, formula?, format?: CellFormat, comment?, validation? }

// formulaStore — engine state
{ dependencyGraph, calculationQueue, formulaCache }

// historyStore — undo/redo
{ undoStack: Action[], redoStack: Action[], maxSize: 100 }

// clipboardStore
{ mode: 'copy'|'cut'|null, cells: CellData[], sourceRange }

// filterStore
{ filters: Map<sheetId, FilterState>, sortState: Map<sheetId, SortState> }

// uiStore — UI state
{ selection, editingCell, isEditing, activeMenu, openModals, zoom, showGridlines, showFormulaBar }
```

### Backend-Connected Stores (Sprints 9-16)

```typescript
// authStore
{ user: User|null, accessToken, refreshToken, isAuthenticated, isLoading }

// sharingStore
{ collaborators: Collaborator[], shareLink, permissions, shareDialogOpen }

// versionStore
{ versions: Version[], previewVersion, isPreviewMode }

// realtimeStore
{ connected, collaborators: Collaborator[], cursors: Map, lockedCells: Map, connectionStatus }
```

## Cross-Store Communication

```typescript
// GOOD: Actions compose across stores
const editCell = (ref: string, value: string) => {
  cellStore.getState().setCell(ref, value);
  formulaStore.getState().recalculate(ref);
  historyStore.getState().push({ type: "edit", ref, value });
  // In collaboration mode:
  realtimeStore.getState().broadcastEdit(ref, value);
};

// BAD: Don't subscribe stores to each other
// This creates circular dependencies
```

## Immer Rules

- Always use `set((state) => { state.x = y })` pattern
- Immer handles immutability — mutate the draft directly
- NEVER spread nested objects manually
- NEVER return new objects from set() — just mutate

## Persistence Strategy

- Sprints 1-8: localStorage autosave (fallback)
- Sprints 9+: Server autosave (debounced 5s) with localStorage backup
- Auth tokens: memory (accessToken) + httpOnly cookie (refreshToken)
- Collaboration state: Yjs document (CRDT) — NOT in Zustand

## New Platform Stores (Sprints 9-16)

### Auth Store (`stores/authStore.ts`)

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithOAuth: (provider: "google" | "github") => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

**Owner:** Sprint 10 (Auth). Used by: API interceptor, ProtectedRoute, all auth pages.

### Sharing Store (`stores/sharingStore.ts`)

```typescript
interface SharingState {
  collaborators: Collaborator[]; // users with access
  shareLink: ShareLink | null; // link-based sharing config
  isShareDialogOpen: boolean;
  currentUserRole: "owner" | "editor" | "commenter" | "viewer";
}

interface SharingActions {
  loadAccess: (spreadsheetId: string) => Promise<void>;
  addCollaborator: (email: string, role: string) => Promise<void>;
  removeCollaborator: (userId: string) => Promise<void>;
  changeRole: (userId: string, role: string) => Promise<void>;
  createShareLink: (role: string) => Promise<void>;
  disableShareLink: () => Promise<void>;
  openShareDialog: () => void;
  closeShareDialog: () => void;
}
```

**Owner:** Sprint 12 (Sharing). Used by: ShareDialog, toolbar, permission checks.

### Realtime Store (`stores/realtimeStore.ts`)

```typescript
interface RealtimeState {
  connectionStatus: "connected" | "connecting" | "disconnected";
  connectedUsers: PresenceUser[];
  activeCursors: Record<string, CursorPosition>; // userId → cursor
  lockedCells: Record<string, string>; // cellRef → userId
}

interface RealtimeActions {
  connect: (spreadsheetId: string) => void;
  disconnect: () => void;
  setConnectionStatus: (status: string) => void;
  addUser: (user: PresenceUser) => void;
  removeUser: (userId: string) => void;
  updateCursor: (userId: string, cursor: CursorPosition) => void;
  lockCell: (cellRef: string, userId: string) => void;
  unlockCell: (cellRef: string) => void;
  broadcastCursorMove: (cell: string, range?: string) => void;
}
```

**Owner:** Sprint 14 (Real-Time). Used by: PresenceBar, CollaboratorCursor, grid overlay.

### Notification Store (`stores/notificationStore.ts`)

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isNotificationPanelOpen: boolean;
}

interface NotificationActions {
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void; // from WebSocket
  openPanel: () => void;
  closePanel: () => void;
}
```

**Owner:** Sprint 15 (Notifications). Used by: NotificationBell, NotificationPanel.

## Cross-Store Orchestration (Platform)

### Auto-save Flow (Sprint 11)

```
User edits cell → cellStore.setCell()
                → spreadsheetStore.markDirty()
                → debounce(5s) → spreadsheetApi.save()
                → spreadsheetStore.setLastSaved()
                → UI shows "All changes saved"
```

### Real-time Edit Flow (Sprint 14)

```
Local user edits → cellStore.setCell() (local apply)
                 → Yjs update (automatic via shared doc)
                 → WebSocket broadcasts to server
                 → Server relays to other clients
                 → Other clients: Yjs applies → cellStore.setCellFromRemote()
```

### Permission Check Flow (Sprint 12)

```
Any write action → check sharingStore.currentUserRole
                 → if viewer: show "View only" toast, block action
                 → if commenter: allow only comments
                 → if editor/owner: allow all
                 → Server ALSO checks on every API call
```
