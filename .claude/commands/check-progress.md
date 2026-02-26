# Check Progress Dashboard
```bash
echo "=== GridSpace Progress ==="
echo ""

# Feature count
TOTAL=$(cat feature_list.json | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
DONE=$(cat feature_list.json | python3 -c "import json,sys; print(sum(1 for f in json.load(sys.stdin) if f['passes']))")
echo "Features: $DONE / $TOTAL completed"

# By sprint
cat feature_list.json | python3 -c "
import json, sys
features = json.load(sys.stdin)
sprints = {}
for f in features:
    s = f['sprint']
    if s not in sprints: sprints[s] = {'total': 0, 'done': 0}
    sprints[s]['total'] += 1
    if f['passes']: sprints[s]['done'] += 1
for s in sorted(sprints):
    d = sprints[s]
    pct = (d['done']/d['total']*100) if d['total'] > 0 else 0
    bar = '█' * int(pct/5) + '░' * (20 - int(pct/5))
    print(f'  Sprint {s:2d}: {bar} {d[\"done\"]:3d}/{d[\"total\"]:3d} ({pct:.0f}%)')
"

echo ""
echo "Recent commits:"
git log --oneline -5

echo ""
echo "Build health:"
npx tsc --noEmit 2>&1 | tail -1
npm run build 2>&1 | tail -1

echo ""
```
