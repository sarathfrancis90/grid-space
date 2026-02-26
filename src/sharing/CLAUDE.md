# src/sharing/

## What's Here

Share dialog component, permission management UI, share link controls. Collaborator list with role management.

## Patterns to Follow

- Use authStore for current user
- Use React Router for navigation
- Loading skeletons while data fetches
- Error boundaries for failed API calls

## Do NOT

- Import from server/ — frontend and backend are separate
- Use any or @ts-ignore — fix the types
