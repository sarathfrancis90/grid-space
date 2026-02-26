# API Design Guide

> Read this before working on Sprint 16 (API & Production) and any API endpoints

## API Endpoint Reference

### Authentication
```
POST   /auth/register         Register new user (email, password, name)
POST   /auth/login            Login (email, password) → { accessToken, user }
POST   /auth/refresh           Refresh access token (httpOnly cookie)
POST   /auth/logout            Invalidate refresh token
POST   /auth/forgot-password   Send reset email
POST   /auth/reset-password    Reset password with token
GET    /auth/google            Redirect to Google OAuth
GET    /auth/google/callback   Google OAuth callback
GET    /auth/github            Redirect to GitHub OAuth
GET    /auth/github/callback   GitHub OAuth callback
```

### Users
```
GET    /api/users/me           Get current user profile
PUT    /api/users/me           Update profile (name, avatarUrl)
PUT    /api/users/me/password  Change password
DELETE /api/users/me           Delete account
```

### Spreadsheets
```
GET    /api/spreadsheets                    List user's spreadsheets (owned + shared)
POST   /api/spreadsheets                    Create new spreadsheet
GET    /api/spreadsheets/:id                Get spreadsheet with all sheets
PUT    /api/spreadsheets/:id                Update metadata (title, starred)
DELETE /api/spreadsheets/:id                Delete spreadsheet (owner only)
POST   /api/spreadsheets/:id/duplicate      Duplicate spreadsheet
```

### Sheets (Tabs)
```
GET    /api/spreadsheets/:id/sheets              List sheets in spreadsheet
POST   /api/spreadsheets/:id/sheets              Add new sheet
PUT    /api/spreadsheets/:id/sheets/:sheetId      Update sheet (name, color, index)
DELETE /api/spreadsheets/:id/sheets/:sheetId      Delete sheet
```

### Cell Data
```
GET    /api/spreadsheets/:id/sheets/:sheetId/cells           Get all cell data
PUT    /api/spreadsheets/:id/sheets/:sheetId/cells           Bulk update cells
PUT    /api/spreadsheets/:id/sheets/:sheetId/cells/:cellRef  Update single cell
```

### Sharing
```
GET    /api/spreadsheets/:id/access                   List collaborators
POST   /api/spreadsheets/:id/access                   Add collaborator (email, role)
PUT    /api/spreadsheets/:id/access/:userId            Change role
DELETE /api/spreadsheets/:id/access/:userId            Remove access
POST   /api/spreadsheets/:id/share-link                Create/update share link
DELETE /api/spreadsheets/:id/share-link                Disable share link
POST   /api/spreadsheets/:id/transfer-ownership        Transfer to another user
```

### Version History
```
GET    /api/spreadsheets/:id/versions                  List versions (paginated)
GET    /api/spreadsheets/:id/versions/:versionId       Get version snapshot
POST   /api/spreadsheets/:id/versions/:versionId/restore  Restore version
PUT    /api/spreadsheets/:id/versions/:versionId       Name a version
```

### Comments
```
GET    /api/spreadsheets/:id/comments                  List all comments
POST   /api/spreadsheets/:id/comments                  Add comment
PUT    /api/spreadsheets/:id/comments/:commentId       Edit comment
DELETE /api/spreadsheets/:id/comments/:commentId       Delete comment
PUT    /api/spreadsheets/:id/comments/:commentId/resolve  Resolve thread
```

### Notifications
```
GET    /api/notifications                              List user's notifications
PUT    /api/notifications/:id/read                     Mark as read
PUT    /api/notifications/read-all                     Mark all as read
DELETE /api/notifications/:id                          Delete notification
```

### Templates
```
GET    /api/templates                                  List available templates
POST   /api/spreadsheets/from-template/:templateId     Create from template
```

### Export
```
GET    /api/spreadsheets/:id/export/csv                Download as CSV
GET    /api/spreadsheets/:id/export/xlsx               Download as XLSX
GET    /api/spreadsheets/:id/export/pdf                Download as PDF
```

### Public API (API Key auth)
```
GET    /api/v1/spreadsheets/:id                        Read spreadsheet
GET    /api/v1/spreadsheets/:id/sheets/:sheetId/cells  Read cells
PUT    /api/v1/spreadsheets/:id/sheets/:sheetId/cells  Write cells
GET    /api/v1/spreadsheets/:id/export/:format         Export

# API Key Management
GET    /api/users/me/api-keys                          List API keys
POST   /api/users/me/api-keys                          Create API key
DELETE /api/users/me/api-keys/:keyId                   Revoke API key
```

### Health & Admin
```
GET    /health                                         Health check
GET    /api/stats                                      Server stats (admin)
```

## Authentication Methods

### 1. JWT Bearer Token (primary — web app)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 2. API Key (programmatic access)
```
X-API-Key: gs_abc123def456...
```
- Keys are prefixed with `gs_` for easy identification
- Full key shown only once on creation
- Stored as bcrypt hash in database
- Has separate rate limits (lower than JWT)

### 3. Share Link Token (anonymous access)
```
GET /api/spreadsheets/share/:shareToken
```
- Grants viewer/commenter/editor based on link settings
- No user account required
- Rate limited per IP

## Request/Response Patterns

### Standard Success Response
```json
{
  "success": true,
  "data": {
    "id": "clx1234...",
    "title": "Q4 Budget"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [
    { "id": "clx1234...", "title": "Q4 Budget" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": 403,
    "message": "You do not have permission to edit this spreadsheet",
    "details": { "requiredRole": "editor", "currentRole": "viewer" }
  }
}
```

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": 422,
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Must be at least 8 characters" }
    ]
  }
}
```

## Rate Limits

| Endpoint Group | Limit | Window |
|---|---|---|
| Auth (login/register) | 5 requests | 1 minute |
| Auth (refresh) | 20 requests | 1 minute |
| Read operations | 100 requests | 1 minute |
| Write operations | 30 requests | 1 minute |
| Export | 10 requests | 1 minute |
| API Key access | 60 requests | 1 minute |
| WebSocket messages | 50 events | 1 second |

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1709912345
```

## Webhook Events (Sprint 16)

Users can register webhook URLs to receive events:

```json
{
  "event": "spreadsheet.cell.updated",
  "timestamp": "2026-02-25T12:00:00Z",
  "data": {
    "spreadsheetId": "clx1234...",
    "sheetId": "clx5678...",
    "changes": [
      { "cell": "A1", "oldValue": "100", "newValue": "200" }
    ],
    "userId": "clx9012..."
  }
}
```

Events: `spreadsheet.created`, `spreadsheet.updated`, `spreadsheet.deleted`,
`spreadsheet.shared`, `cell.updated`, `comment.created`

## Frontend API Client

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // for refresh token cookie
});

// Auto-attach JWT
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Spreadsheet API
export const spreadsheetApi = {
  list: () => api.get('/api/spreadsheets'),
  get: (id: string) => api.get(`/api/spreadsheets/${id}`),
  create: (title?: string) => api.post('/api/spreadsheets', { title }),
  update: (id: string, data: Partial<Spreadsheet>) => api.put(`/api/spreadsheets/${id}`, data),
  delete: (id: string) => api.delete(`/api/spreadsheets/${id}`),
};
```

## Rules

1. **All endpoints return the standard envelope** ({ success, data } or { success, error })
2. **All write endpoints require auth** — no anonymous writes ever
3. **All inputs validated with Zod** — reject early with 422
4. **Use HTTP verbs correctly**: GET reads, POST creates, PUT updates, DELETE removes
5. **Use plural nouns**: `/spreadsheets` not `/spreadsheet`
6. **Pagination defaults**: page=1, limit=20, max limit=100
7. **Never expose internal IDs** (Prisma cuid is fine — it's not auto-increment)
8. **API keys hashed with bcrypt** — never stored in plain text
9. **Webhooks use HMAC signature** for verification
10. **Version the public API** (`/api/v1/`) — internal API doesn't need versioning
