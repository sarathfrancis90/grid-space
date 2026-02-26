#!/usr/bin/env bash
echo "═══════════════════════════════════════════════════════════"
echo "  GridSpace Progress Dashboard"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Feature count
if [ -f feature_list.json ]; then
    TOTAL=$(python3 -c "import json; d=json.load(open('feature_list.json')); print(len(d))" 2>/dev/null || echo "?")
    DONE=$(python3 -c "import json; d=json.load(open('feature_list.json')); print(sum(1 for f in d if f['passes']))" 2>/dev/null || echo "?")
    PCT=$(python3 -c "import json; d=json.load(open('feature_list.json')); t=len(d); p=sum(1 for f in d if f['passes']); print(f'{p/t*100:.1f}%' if t>0 else '0%')" 2>/dev/null || echo "?")
    echo "Features: $DONE / $TOTAL ($PCT)"
    
    # Per-sprint breakdown
    echo ""
    python3 -c "
import json
d = json.load(open('feature_list.json'))
sprints = {}
for f in d:
    s = f['sprint']
    if s not in sprints: sprints[s] = {'total': 0, 'done': 0}
    sprints[s]['total'] += 1
    if f['passes']: sprints[s]['done'] += 1

names = {1:'Grid',2:'Formula',3:'Format',4:'Data',5:'FileOps',6:'Charts',7:'UI',8:'Keyboard',
         9:'Backend',10:'Auth',11:'Storage',12:'Sharing',13:'Versions',14:'Realtime',15:'Notif',16:'API+Prod'}
for s in sorted(sprints):
    t = sprints[s]['total']; d = sprints[s]['done']
    bar = '█' * int(d/t*20) + '░' * (20 - int(d/t*20))
    status = '✅' if d == t else '🔄' if d > 0 else '⬜'
    print(f'  Sprint {s:2d} ({names.get(s,\"??\"):8s}): {bar} {d:3d}/{t:3d} {status}')
" 2>/dev/null
else
    echo "feature_list.json not found"
fi

echo ""

# Infrastructure status
echo "Infrastructure:"
docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || echo "  Docker not running"

echo ""

# Git status
echo "Git:"
echo "  Branch: $(git branch --show-current 2>/dev/null || echo '?')"
echo "  Last commit: $(git log --oneline -1 2>/dev/null || echo 'none')"
echo "  Uncommitted: $(git status --short 2>/dev/null | wc -l) files"
UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l)
[ "$UNPUSHED" -gt 0 ] && echo "  ⚠️  $UNPUSHED unpushed commits" || echo "  Up to date with remote"

echo ""

# Build health
echo "Build Health:"
npx tsc --noEmit --project packages/client/tsconfig.json 2>/dev/null && echo "  Client TypeCheck: ✅" || echo "  Client TypeCheck: ❌"
npx tsc --noEmit --project packages/server/tsconfig.json 2>/dev/null && echo "  Server TypeCheck: ✅" || echo "  Server TypeCheck: ❌"

echo ""

fi

echo ""
echo "═══════════════════════════════════════════════════════════"
