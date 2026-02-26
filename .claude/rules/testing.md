# Testing Rules

- Every feature in feature_list.json needs at least one E2E test
- E2E: Playwright — test user flows in real browser
- Unit: Vitest — test pure functions, parsers, stores
- API: Supertest — test Express endpoints
- Use data-testid selectors, not CSS classes
- Test helpers: loginAsTestUser(), typeInCell(), expectCellValue()
- Auth tests need test user fixtures
- API tests need JWT token helper
- Collaboration tests need multi-browser setup (Playwright contexts)
- Run full suite before every commit: typecheck → unit → build → e2e
