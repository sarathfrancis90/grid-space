# Find and Start Next Feature

```bash
# Find next incomplete feature from current sprint
NEXT=$(cat feature_list.json | python3 -c "
import json, sys
features = json.load(sys.stdin)
for f in sorted(features, key=lambda x: (x['sprint'], x['priority'])):
    if not f['passes']:
        print(f'Sprint {f[\"sprint\"]} | {f[\"category\"]} | {f[\"name\"]} (P{f[\"priority\"]})')
        break
")
echo "Next feature: $NEXT"
```

## Workflow

1. Read the relevant agent_docs/ for this feature's domain
2. Read the relevant src/<module>/CLAUDE.md
3. Implement the feature
4. Write E2E test for the feature
5. Run all tests
6. Update feature_list.json: set "passes": true
7. Commit and push
