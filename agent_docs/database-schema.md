# Database Schema Guide

> Read this before working on Sprints 9-13 (any database work)

## Complete Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USER ──────────────────────────────────────────────────
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String?
  avatarUrl      String?
  passwordHash   String?   // null if OAuth-only user
  oauthProvider  String?   // 'google' | 'github'
  oauthId        String?   // provider-specific ID
  emailVerified  Boolean   @default(false)

  // Relations
  ownedSpreadsheets  Spreadsheet[]       @relation("OwnedSpreadsheets")
  access             SpreadsheetAccess[]
  versions           Version[]
  comments           Comment[]
  notifications      Notification[]
  apiKeys            ApiKey[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([oauthProvider, oauthId])
  @@index([email])
}

// ─── SPREADSHEET ───────────────────────────────────────────
model Spreadsheet {
  id             String    @id @default(cuid())
  title          String    @default("Untitled Spreadsheet")

  // Owner
  ownerId        String
  owner          User      @relation("OwnedSpreadsheets", fields: [ownerId], references: [id])

  // Sharing
  shareLink      String?   @unique  // null = not shared via link
  shareLinkRole  String?   // 'viewer' | 'commenter' | 'editor'
  isPublished    Boolean   @default(false)  // published to web
  publishedUrl   String?   @unique

  // Status
  isStarred      Boolean   @default(false)
  isTemplate     Boolean   @default(false)
  templateName   String?

  // Relations
  sheets         Sheet[]
  access         SpreadsheetAccess[]
  versions       Version[]
  comments       Comment[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([ownerId])
  @@index([updatedAt])
}

// ─── ACCESS CONTROL ────────────────────────────────────────
model SpreadsheetAccess {
  id             String      @id @default(cuid())

  spreadsheetId  String
  spreadsheet    Spreadsheet @relation(fields: [spreadsheetId], references: [id], onDelete: Cascade)

  userId         String
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  role           String      // 'owner' | 'editor' | 'commenter' | 'viewer'

  createdAt      DateTime    @default(now())

  @@unique([spreadsheetId, userId])
  @@index([userId])
  @@index([spreadsheetId])
}

// ─── SHEET (TAB) ───────────────────────────────────────────
model Sheet {
  id             String      @id @default(cuid())

  spreadsheetId  String
  spreadsheet    Spreadsheet @relation(fields: [spreadsheetId], references: [id], onDelete: Cascade)

  name           String      @default("Sheet1")
  index          Int         @default(0)  // order in tab bar
  color          String?     // tab color hex
  isHidden       Boolean     @default(false)

  // All cell data stored as JSONB for performance
  // Structure: { "A1": { value, formula, format, ... }, "B2": { ... } }
  cellData       Json        @default("{}")

  // Column/row metadata (widths, heights, hidden, groups)
  columnMeta     Json        @default("{}")  // { "A": { width: 100, hidden: false }, ... }
  rowMeta        Json        @default("{}")  // { "1": { height: 25, hidden: false }, ... }

  // Freeze panes
  frozenRows     Int         @default(0)
  frozenCols     Int         @default(0)

  // Filter/sort state
  filterState    Json?       // active filters
  sortState      Json?       // active sort

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([spreadsheetId])
  @@unique([spreadsheetId, index])
}

// ─── VERSION HISTORY ───────────────────────────────────────
model Version {
  id             String      @id @default(cuid())

  spreadsheetId  String
  spreadsheet    Spreadsheet @relation(fields: [spreadsheetId], references: [id], onDelete: Cascade)

  createdById    String
  createdBy      User        @relation(fields: [createdById], references: [id])

  name           String?     // user-assigned name (null = auto)

  // Snapshot of entire spreadsheet state
  // Stores all sheets + cellData + metadata
  snapshot       Json

  // For efficient diffing: which cells changed
  changeset      Json?       // { sheetId: { cellRef: { before, after } } }

  createdAt      DateTime    @default(now())

  @@index([spreadsheetId, createdAt])
}

// ─── COMMENTS ──────────────────────────────────────────────
model Comment {
  id             String      @id @default(cuid())

  spreadsheetId  String
  spreadsheet    Spreadsheet @relation(fields: [spreadsheetId], references: [id], onDelete: Cascade)

  authorId       String
  author         User        @relation(fields: [authorId], references: [id])

  sheetId        String      // which sheet tab
  cellRef        String      // "A1", "B5", etc.

  content        String
  isResolved     Boolean     @default(false)

  // Threading
  parentId       String?     // null = top-level comment
  parent         Comment?    @relation("CommentThread", fields: [parentId], references: [id])
  replies        Comment[]   @relation("CommentThread")

  // Mentions
  mentions       String[]    // array of userIds mentioned with @

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([spreadsheetId, sheetId, cellRef])
  @@index([parentId])
}

// ─── NOTIFICATIONS ─────────────────────────────────────────
model Notification {
  id             String      @id @default(cuid())

  userId         String
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  type           String      // 'share_invite' | 'comment_mention' | 'comment_reply'
  title          String
  body           String

  // Link to relevant resource
  spreadsheetId  String?
  sheetId        String?
  cellRef        String?

  isRead         Boolean     @default(false)

  createdAt      DateTime    @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

// ─── API KEYS ──────────────────────────────────────────────
model ApiKey {
  id             String      @id @default(cuid())

  userId         String
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  name           String      // user-given name for the key
  keyHash        String      @unique  // bcrypt hash of the key
  keyPrefix      String      // first 8 chars for identification "gs_abc123..."

  lastUsedAt     DateTime?
  expiresAt      DateTime?

  createdAt      DateTime    @default(now())

  @@index([keyHash])
  @@index([userId])
}

// ─── TEMPLATES ─────────────────────────────────────────────
model Template {
  id             String      @id @default(cuid())

  name           String
  description    String?
  category       String      // 'finance' | 'project' | 'education' | 'personal'
  thumbnailUrl   String?

  // Template data (same structure as Sheet.cellData)
  sheets         Json        // array of { name, cellData, columnMeta, rowMeta }

  isBuiltIn      Boolean     @default(false)  // system template vs user-created
  createdById    String?     // null for built-in templates

  createdAt      DateTime    @default(now())

  @@index([category])
}
```

## Key Design Decisions

### Why JSONB for Cell Data (not individual Cell rows)?

- A spreadsheet with 10k cells would need 10k rows — slow for load/save
- JSONB loads entire sheet in one query — fast
- JSONB supports indexing and partial updates in PostgreSQL
- Trade-off: can't query individual cells efficiently — acceptable since we always load the whole sheet

### Cell Data Structure (inside JSONB)

```typescript
interface CellData {
  [cellRef: string]: {
    value: string | number | boolean | null; // display value
    formula?: string; // raw formula string (e.g., "=SUM(A1:A10)")
    format?: CellFormat; // formatting (see formatting-system.md)
    validation?: DataValidation;
    comment?: boolean; // has comments (actual comments in Comment table)
    hyperlink?: string; // URL
    note?: string; // simple note text
  };
}
```

### Version Snapshots vs Deltas

- First version: full snapshot (complete JSON of all sheets)
- Subsequent versions: snapshot + changeset (delta for efficient diffing)
- Keep last 200 versions per spreadsheet
- Cleanup job removes old versions beyond limit

## Common Queries

### Load spreadsheet with sheets + access info

```typescript
const spreadsheet = await prisma.spreadsheet.findUnique({
  where: { id },
  include: {
    sheets: { orderBy: { index: "asc" } },
    access: {
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    },
    owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
  },
});
```

### Get user's spreadsheets (dashboard)

```typescript
const spreadsheets = await prisma.spreadsheet.findMany({
  where: {
    OR: [{ ownerId: userId }, { access: { some: { userId } } }],
  },
  select: {
    id: true,
    title: true,
    updatedAt: true,
    isStarred: true,
    owner: { select: { name: true, avatarUrl: true } },
    access: { where: { userId }, select: { role: true } },
  },
  orderBy: { updatedAt: "desc" },
  take: limit,
  skip: offset,
});
```

### Save cell data (auto-save)

```typescript
await prisma.sheet.update({
  where: { id: sheetId },
  data: {
    cellData: newCellData, // full JSONB replace
    updatedAt: new Date(),
  },
});
```

### Check permission

```typescript
const access = await prisma.spreadsheetAccess.findUnique({
  where: { spreadsheetId_userId: { spreadsheetId, userId } },
});
const role = access?.role ?? null; // null = no access
```

## Migration Workflow

```bash
# Create migration after schema changes
npx prisma migrate dev --name description_of_change

# Apply in production
npx prisma migrate deploy

# Generate client after schema changes
npx prisma generate

# Reset database (development only!)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

## Rules

1. **Always use `select` or `omit`** to exclude sensitive fields (passwordHash)
2. **Use transactions** for multi-table operations
3. **Add indexes** for any field used in WHERE or ORDER BY
4. **Use `onDelete: Cascade`** for child records
5. **Never store raw cell formulas in separate columns** — keep in JSONB
6. **Version snapshots are immutable** — never update, only create
7. **Test migrations** with `prisma migrate dev` before pushing
