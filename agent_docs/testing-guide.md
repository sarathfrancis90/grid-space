# Testing Guide

## Test Stack
- **E2E**: Playwright — tests full user flows in browser
- **Unit**: Vitest — tests pure functions, stores, services
- **API**: Supertest — tests Express endpoints

## E2E Test Structure
```typescript
// tests/e2e/grid.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // For authenticated tests:
    // await loginAsTestUser(page);
    // await page.goto('/spreadsheet/test-id');
  });

  test('should select cell on click', async ({ page }) => {
    await page.click('[data-cell="A1"]');
    await expect(page.locator('.name-box input')).toHaveValue('A1');
  });
});
```

## Selectors Convention
```
data-cell="A1"           — Grid cell
data-row-header="1"      — Row header
data-col-header="A"      — Column header
data-sheet-tab="Sheet1"  — Sheet tab
data-testid="toolbar-bold" — Toolbar button
data-testid="formula-bar"  — Formula bar input
data-testid="share-button" — Share button
data-testid="login-form"   — Login form
```

## Common E2E Patterns
```typescript
// Type in cell
const typeInCell = async (page, cell, text) => {
  await page.click(`[data-cell="${cell}"]`);
  await page.dblclick(`[data-cell="${cell}"]`);
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
};

// Verify cell value
const expectCellValue = async (page, cell, expected) => {
  await page.click(`[data-cell="${cell}"]`);
  await expect(page.locator('.formula-bar-input')).toHaveValue(expected);
};

// Login helper
const loginAsTestUser = async (page) => {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'test@gridspace.app');
  await page.fill('[data-testid="password-input"]', 'TestPassword123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
};
```

## API Test Pattern
```typescript
import request from 'supertest';
import { app } from '../server';

describe('POST /api/v1/spreadsheets', () => {
  let token: string;
  
  beforeAll(async () => {
    token = await getTestUserToken();
  });
  
  it('creates a new spreadsheet', async () => {
    const res = await request(app)
      .post('/api/v1/spreadsheets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Spreadsheet' })
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Spreadsheet');
  });
  
  it('rejects unauthenticated requests', async () => {
    await request(app)
      .post('/api/v1/spreadsheets')
      .send({ title: 'Test' })
      .expect(401);
  });
});
```

## Unit Test Pattern
```typescript
import { describe, it, expect } from 'vitest';
import { parseFormula } from '../src/formula/parser';

describe('parseFormula', () => {
  it('parses SUM function', () => {
    const ast = parseFormula('=SUM(A1:A5)');
    expect(ast.type).toBe('function');
    expect(ast.name).toBe('SUM');
  });
});
```

## Test Organization
```
tests/
├── e2e/
│   ├── grid.spec.ts
│   ├── formula.spec.ts
│   ├── formatting.spec.ts
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   ├── sharing.spec.ts
│   ├── collaboration.spec.ts
│   └── helpers/
│       ├── login.ts
│       └── fixtures.ts
└── unit/
    ├── formula/
    ├── stores/
    ├── server/
    │   ├── controllers/
    │   └── services/
    └── utils/
```

## Key Rule
Every feature in feature_list.json MUST have at least one E2E test. The feature is not "done" until the test passes.
