# Authentication & User Management Guide

> Read this before working on Sprint 10 (Auth & Users)

## Auth Architecture Overview

```
Client                          Server
┌─────────┐                    ┌──────────────┐
│ Login    │─── POST /login ──>│ Passport     │
│ Page     │<── JWT tokens ────│ Local Strat  │
└─────────┘                    └──────────────┘
     │                              │
     │  Store access token          │ Verify password (bcrypt)
     │  in memory (Zustand)         │ Issue JWT + refresh token
     │  Store refresh token         │ Store refresh token in Redis
     │  in httpOnly cookie          │
     │                              │
┌─────────┐                    ┌──────────────┐
│ API      │── Bearer token ──>│ JWT Middleware│
│ Requests │<── 401 expired ───│ Verify token │
└─────────┘                    └──────────────┘
     │                              │
     │  Auto-refresh on 401         │
     │                              │
┌─────────┐                    ┌──────────────┐
│ Refresh  │── POST /refresh ─>│ Verify       │
│          │<── New tokens ────│ Refresh Token│
└─────────┘                    └──────────────┘
```

## JWT Token Strategy

### Access Token

- Short-lived: **15 minutes**
- Stored in **memory** (Zustand auth store) — NOT localStorage
- Sent as `Authorization: Bearer <token>` header
- Contains: `{ userId, email, iat, exp }`

### Refresh Token

- Long-lived: **7 days**
- Stored in **httpOnly, secure, sameSite cookie**
- Sent automatically by browser on `/auth/refresh`
- Stored server-side in **Redis** for invalidation
- Rotated on each use (old one invalidated)

### Why this split?

- Access token in memory = immune to XSS stealing it
- Refresh in httpOnly cookie = immune to JS access
- Short access = minimal damage if somehow leaked
- Redis-backed refresh = instant logout/revocation

## Implementation Guide

### Password Hashing

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// Registration
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

// Login verification
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### JWT Signing and Verification

```typescript
import jwt from "jsonwebtoken";

// Sign
const accessToken = jwt.sign(
  { userId: user.id, email: user.email },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN },
);

// Verify (in middleware)
const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
req.user = { id: decoded.userId, email: decoded.email };
```

### Auth Middleware

```typescript
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError(401, "Access token required");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) throw new AppError(401, "User not found");
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Token expired");
    }
    throw new AppError(401, "Invalid token");
  }
};
```

## OAuth 2.0 Flow (Google + GitHub)

### Google OAuth

```typescript
// Passport strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.SERVER_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await prisma.user.findFirst({
        where: { oauthProvider: "google", oauthId: profile.id },
      });

      if (!user) {
        // Check if email already registered
        user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value },
        });
        if (user) {
          // Link OAuth to existing account
          user = await prisma.user.update({
            where: { id: user.id },
            data: { oauthProvider: "google", oauthId: profile.id },
          });
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              name: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value,
              oauthProvider: "google",
              oauthId: profile.id,
            },
          });
        }
      }

      done(null, user);
    },
  ),
);
```

### OAuth Routes

```
GET  /auth/google          → Redirect to Google consent screen
GET  /auth/google/callback → Receive code, exchange for tokens, redirect to client
GET  /auth/github          → Redirect to GitHub authorize
GET  /auth/github/callback → Receive code, exchange for tokens, redirect to client
```

After OAuth callback success, redirect to:
`${CLIENT_URL}/auth/callback?token=<access_token>`

Client extracts token from URL, stores in auth store, clears URL.

## Frontend Auth Store (Zustand)

```typescript
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
}
```

## Frontend API Client (Axios Interceptor)

```typescript
// Intercept 401s and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { accessToken } = await refreshTokenApi();
        authStore.getState().setAccessToken(accessToken);
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return api(error.config);
      } catch {
        authStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
```

## Auth Pages (Client)

| Page            | Route                    | Components                                                 |
| --------------- | ------------------------ | ---------------------------------------------------------- |
| Login           | `/login`                 | Email/password form, OAuth buttons, "Forgot password" link |
| Register        | `/register`              | Name, email, password form, OAuth buttons                  |
| Forgot Password | `/forgot-password`       | Email input, sends reset link                              |
| Reset Password  | `/reset-password/:token` | New password form                                          |
| Profile         | `/settings/profile`      | Name, avatar, email, change password                       |
| OAuth Callback  | `/auth/callback`         | Extracts token, redirects to dashboard                     |

## Security Rules

1. **NEVER store JWT in localStorage** — use memory + httpOnly cookie
2. **ALWAYS hash passwords with bcrypt** (12 rounds minimum)
3. **ALWAYS validate email format** server-side
4. **Rate limit auth endpoints**: 5 attempts per minute per IP
5. **Rotate refresh tokens** on each use
6. **Invalidate all tokens on password change**
7. **Use CSRF protection** for cookie-based auth (csurf or double-submit)
8. **Sanitize OAuth profile data** before storing
9. **Never return passwordHash** in API responses (use Prisma `select`/`omit`)
10. **Log auth events** (login success/failure, registration, password reset)
