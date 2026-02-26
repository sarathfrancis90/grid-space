# Run All Tests

```bash
echo "=== TypeScript Check ==="
npx tsc --noEmit

echo ""
echo "=== Unit Tests ==="
npx vitest run

echo ""
echo "=== Build ==="
npm run build

echo ""
echo "=== E2E Tests ==="
npx playwright test

echo ""
echo "=== All Done ==="
```
