# src/auth/

## What's Here

Frontend auth pages: Login, Register, ForgotPassword, ResetPassword, VerifyEmail. OAuth callback handler.

## Patterns to Follow

- Store accessToken in memory (authStore), refreshToken in httpOnly cookie
- Redirect to /dashboard after successful login
- Show loading state during auth checks
- Handle OAuth callback URL with token extraction

## Do NOT

- Import from server/ — frontend and backend are separate
- Use any or @ts-ignore — fix the types
