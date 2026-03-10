#!/usr/bin/env node
/**
 * GridSpace Issue Orchestrator
 *
 * Context-aware, architecture-aware dispatcher that:
 * 1. Fetches open parity issues from GitHub
 * 2. Classifies each by domain (frontend-ui, store, backend, fullstack)
 * 3. Resolves dependency order
 * 4. Builds per-issue context prompts with relevant files & docs
 * 5. Dispatches in waves (parallel where safe, sequential where dependent)
 *
 * Usage:
 *   node scripts/orchestrate.mjs                    # Dry-run: show plan
 *   node scripts/orchestrate.mjs --dispatch          # Label issues for Claude
 *   node scripts/orchestrate.mjs --dispatch --wave 1 # Dispatch only wave 1
 *   node scripts/orchestrate.mjs --local             # Run locally via Claude Code agents
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Architecture Domain Registry ────────────────────────────────────────────
// Maps issue keywords/patterns to domains, required context files, and agent docs.
const DOMAIN_REGISTRY = {
  "frontend-menu": {
    description: "Menu bar items, dropdowns, menu structure",
    paths: [
      "packages/client/src/components/ui/MenuBar.tsx",
      "packages/client/src/components/ui/",
    ],
    stores: ["uiStore"],
    agentDocs: ["state-management.md"],
    testPattern: "MenuBar",
  },
  "frontend-dialog": {
    description: "Dialogs, modals, sidebars, panels",
    paths: [
      "packages/client/src/components/ui/",
      "packages/client/src/components/data/",
    ],
    stores: ["uiStore"],
    agentDocs: ["state-management.md"],
    testPattern: "Dialog",
  },
  "frontend-grid": {
    description: "Canvas grid, cell rendering, selection, overlays",
    paths: [
      "packages/client/src/components/grid/Grid.tsx",
      "packages/client/src/components/grid/",
    ],
    stores: ["gridStore", "cellStore", "uiStore"],
    agentDocs: ["grid-rendering.md", "state-management.md"],
    testPattern: "Grid",
  },
  "frontend-toolbar": {
    description: "Toolbar buttons, formatting actions",
    paths: [
      "packages/client/src/components/toolbar/",
      "packages/client/src/components/ui/MenuBar.tsx",
    ],
    stores: ["uiStore", "cellStore"],
    agentDocs: ["formatting-system.md", "state-management.md"],
    testPattern: "Toolbar",
  },
  "frontend-file-ops": {
    description: "Import, export, download, file operations",
    paths: [
      "packages/client/src/components/file-ops/",
      "packages/client/src/components/ui/MenuBar.tsx",
    ],
    stores: ["spreadsheetStore"],
    agentDocs: ["state-management.md"],
    testPattern: "file|export|import",
  },
  "frontend-collab": {
    description: "Real-time collaboration, presence, cursors",
    paths: [
      "packages/client/src/components/realtime/",
      "packages/client/src/components/sharing/",
      "packages/client/src/services/realtimeService.ts",
    ],
    stores: ["realtimeStore", "sharingStore"],
    agentDocs: ["collaboration-system.md", "state-management.md"],
    testPattern: "realtime|collab",
  },
  "frontend-dashboard": {
    description: "Dashboard, spreadsheet list, templates, navigation",
    paths: [
      "packages/client/src/components/dashboard/",
      "packages/client/src/stores/cloudStore.ts",
    ],
    stores: ["cloudStore", "authStore"],
    agentDocs: ["state-management.md"],
    testPattern: "dashboard|Dashboard",
  },
  "frontend-profile": {
    description: "User profile, settings, account management",
    paths: [
      "packages/client/src/components/auth/",
      "packages/client/src/stores/authStore.ts",
    ],
    stores: ["authStore"],
    agentDocs: ["auth-system.md", "state-management.md"],
    testPattern: "profile|auth",
  },
  "backend-api": {
    description: "REST API endpoints, controllers, services",
    paths: [
      "packages/server/src/routes/",
      "packages/server/src/controllers/",
      "packages/server/src/services/",
    ],
    stores: [],
    agentDocs: ["backend-architecture.md", "api-design.md"],
    testPattern: "api|route",
  },
  "backend-db": {
    description: "Database schema, migrations, Prisma models",
    paths: [
      "packages/server/prisma/schema.prisma",
      "packages/server/src/services/",
    ],
    stores: [],
    agentDocs: ["backend-architecture.md", "database-schema.md"],
    testPattern: "prisma|migration",
  },
  "backend-ws": {
    description: "WebSocket handlers, real-time sync",
    paths: ["packages/server/src/websocket/", "packages/server/src/services/"],
    stores: [],
    agentDocs: ["collaboration-system.md", "backend-architecture.md"],
    testPattern: "websocket|socket",
  },
  "backend-email": {
    description: "Email sending, templates, notifications",
    paths: ["packages/server/src/email/", "packages/server/src/services/"],
    stores: [],
    agentDocs: ["backend-architecture.md"],
    testPattern: "email|notification",
  },
  fullstack: {
    description: "Changes spanning both client and server",
    paths: ["packages/client/src/", "packages/server/src/"],
    stores: [],
    agentDocs: [
      "backend-architecture.md",
      "state-management.md",
      "api-design.md",
    ],
    testPattern: "",
  },
};

// ─── Issue Classification Rules ──────────────────────────────────────────────
// Maps issue titles/bodies to domains and dependencies.
const ISSUE_RULES = [
  {
    match: /conditional.format/i,
    domain: "frontend-menu",
    deps: [],
    contextHint:
      "ConditionalFormatManager.tsx exists but is unreachable. Add a menu item in Format menu to open it.",
    keyFiles: [
      "packages/client/src/components/data/ConditionalFormatManager.tsx",
      "packages/client/src/components/ui/MenuBar.tsx",
    ],
  },
  {
    match: /download.*csv|csv.*download/i,
    domain: "frontend-file-ops",
    deps: [],
    contextHint:
      "toCSV() utility exists in file-ops. Add 'Download as CSV' option next to XLSX/PDF in File menu.",
    keyFiles: [
      "packages/client/src/components/file-ops/",
      "packages/client/src/components/ui/MenuBar.tsx",
    ],
  },
  {
    match: /trash|recycle.bin/i,
    domain: "fullstack",
    deps: [],
    contextHint:
      "Needs: 1) Add deletedAt field to Prisma schema, 2) Soft-delete API endpoint, 3) Trash tab on dashboard, 4) Restore endpoint",
    keyFiles: [
      "packages/server/prisma/schema.prisma",
      "packages/server/src/routes/spreadsheet.routes.ts",
      "packages/server/src/services/spreadsheet.service.ts",
      "packages/client/src/components/dashboard/DashboardPage.tsx",
      "packages/client/src/stores/cloudStore.ts",
    ],
  },
  {
    match: /folder/i,
    domain: "fullstack",
    deps: ["trash|recycle"],
    contextHint:
      "Needs: 1) Folder model in Prisma, 2) CRUD API for folders, 3) Dashboard sidebar/breadcrumb nav, 4) Move-to-folder action",
    keyFiles: [
      "packages/server/prisma/schema.prisma",
      "packages/client/src/components/dashboard/DashboardPage.tsx",
      "packages/client/src/stores/cloudStore.ts",
    ],
  },
  {
    match: /show.formula/i,
    domain: "frontend-grid",
    deps: [],
    contextHint:
      "Add View menu item + Ctrl+` shortcut. Toggle gridStore.showFormulas flag. Grid renderer checks flag to display formula text vs computed value.",
    keyFiles: [
      "packages/client/src/components/ui/MenuBar.tsx",
      "packages/client/src/stores/gridStore.ts",
      "packages/client/src/components/grid/Grid.tsx",
    ],
  },
  {
    match: /avatar.upload/i,
    domain: "fullstack",
    deps: [],
    contextHint:
      "avatarUrl field exists in schema. Need: 1) Upload endpoint on server, 2) Profile page upload UI, 3) Display in CollaboratorAvatars",
    keyFiles: [
      "packages/server/prisma/schema.prisma",
      "packages/server/src/routes/auth.routes.ts",
      "packages/client/src/components/auth/ProfilePage.tsx",
      "packages/client/src/components/realtime/CollaboratorAvatars.tsx",
    ],
  },
  {
    match: /suggestion|track.change/i,
    domain: "fullstack",
    deps: ["filter.view"],
    contextHint:
      "Major feature: needs suggestion model in DB, WebSocket events for suggestions, UI mode toggle, accept/reject UI. Consider implementing as a simplified version first.",
    keyFiles: [
      "packages/server/prisma/schema.prisma",
      "packages/client/src/stores/cellStore.ts",
      "packages/client/src/components/grid/Grid.tsx",
      "packages/client/src/components/toolbar/Toolbar.tsx",
    ],
  },
  {
    match: /filter.view/i,
    domain: "fullstack",
    deps: [],
    contextHint:
      "Needs: 1) FilterView model in Prisma (userId, spreadsheetId, name, criteria JSON), 2) CRUD API, 3) Data menu submenu, 4) Active filter view indicator in grid header",
    keyFiles: [
      "packages/server/prisma/schema.prisma",
      "packages/client/src/components/data/",
      "packages/client/src/components/ui/MenuBar.tsx",
      "packages/client/src/stores/filterStore.ts",
    ],
  },
  {
    match: /publish.*web/i,
    domain: "fullstack",
    deps: [],
    contextHint:
      "Needs: 1) Public token/slug for spreadsheets, 2) Public read-only route (no auth), 3) Share dialog section for publishing, 4) Embed code generator",
    keyFiles: [
      "packages/server/prisma/schema.prisma",
      "packages/server/src/routes/spreadsheet.routes.ts",
      "packages/client/src/components/sharing/ShareDialog.tsx",
    ],
  },
  {
    match: /insert.*(comment|checkbox|dropdown|new.sheet)/i,
    domain: "frontend-menu",
    deps: [],
    contextHint:
      "Add menu items to Insert menu. Comment opens CommentsSidebar, Checkbox/Dropdown use DataValidation, New Sheet calls spreadsheetStore.addSheet()",
    keyFiles: [
      "packages/client/src/components/ui/MenuBar.tsx",
      "packages/client/src/components/ui/CommentsSidebar.tsx",
      "packages/client/src/stores/spreadsheetStore.ts",
    ],
  },
  {
    match: /email.*attachment/i,
    domain: "fullstack",
    deps: [],
    contextHint:
      "Needs: 1) Email dialog component, 2) Server endpoint that generates attachment + sends via Resend, 3) File menu entry",
    keyFiles: [
      "packages/server/src/email/",
      "packages/client/src/components/ui/MenuBar.tsx",
    ],
  },
  {
    match: /context.menu/i,
    domain: "frontend-menu",
    deps: [],
    contextHint:
      "Expand ContextMenu.tsx with insert/delete row/col, hide, resize, comment, link, protect range items",
    keyFiles: [
      "packages/client/src/components/ui/ContextMenu.tsx",
      "packages/client/src/components/grid/Grid.tsx",
    ],
  },
  {
    match: /edit.menu/i,
    domain: "frontend-menu",
    deps: [],
    contextHint:
      "Add Paste Special submenu, Select All, Delete values/row/column to Edit menu",
    keyFiles: [
      "packages/client/src/components/ui/MenuBar.tsx",
      "packages/client/src/components/ui/PasteSpecialDialog.tsx",
    ],
  },
  {
    match: /version.history.*file|file.*version.history/i,
    domain: "frontend-menu",
    deps: [],
    contextHint:
      "VersionHistorySidebar already rendered. Add File menu entry to toggle its visibility via uiStore.",
    keyFiles: [
      "packages/client/src/components/ui/MenuBar.tsx",
      "packages/client/src/components/versions/VersionHistorySidebar.tsx",
      "packages/client/src/stores/uiStore.ts",
    ],
  },
  {
    match: /import.*file|file.*import/i,
    domain: "frontend-file-ops",
    deps: [],
    contextHint:
      "Add Import dialog with file upload, format detection, import mode (replace/insert/append). Leverage existing SheetJS/PapaParse in file-ops.",
    keyFiles: [
      "packages/client/src/components/file-ops/",
      "packages/client/src/components/ui/MenuBar.tsx",
    ],
  },
  {
    match: /notification.rule/i,
    domain: "fullstack",
    deps: [],
    contextHint:
      "Tools > Notifications is a stub. Needs: 1) NotificationRule model in Prisma, 2) CRUD API, 3) Config dialog, 4) Backend trigger on spreadsheet changes",
    keyFiles: [
      "packages/server/prisma/schema.prisma",
      "packages/server/src/services/",
      "packages/client/src/components/notifications/",
      "packages/client/src/components/ui/MenuBar.tsx",
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gh(cmd) {
  try {
    return execSync(`gh ${cmd}`, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch (e) {
    console.error(`  gh command failed: ${cmd}`);
    return "";
  }
}

function fetchOpenIssues() {
  const raw = gh(
    `issue list --state open --label parity --json number,title,body,labels --limit 50`,
  );
  if (!raw) return [];
  return JSON.parse(raw);
}

function classifyIssue(issue) {
  const text = `${issue.title} ${issue.body || ""}`;
  for (const rule of ISSUE_RULES) {
    if (rule.match.test(text)) {
      const domain = DOMAIN_REGISTRY[rule.domain];
      return {
        ...issue,
        domain: rule.domain,
        domainInfo: domain,
        deps: rule.deps,
        contextHint: rule.contextHint,
        keyFiles: rule.keyFiles,
        agentDocs: domain.agentDocs,
      };
    }
  }
  // Fallback: classify by labels or title keywords
  if (/backend|server|api|prisma|database/i.test(text))
    return {
      ...issue,
      domain: "backend-api",
      domainInfo: DOMAIN_REGISTRY["backend-api"],
      deps: [],
      contextHint: "",
      keyFiles: [],
      agentDocs: [],
    };
  if (/frontend|component|ui|menu|toolbar/i.test(text))
    return {
      ...issue,
      domain: "frontend-menu",
      domainInfo: DOMAIN_REGISTRY["frontend-menu"],
      deps: [],
      contextHint: "",
      keyFiles: [],
      agentDocs: [],
    };
  return {
    ...issue,
    domain: "fullstack",
    domainInfo: DOMAIN_REGISTRY.fullstack,
    deps: [],
    contextHint: "",
    keyFiles: [],
    agentDocs: [],
  };
}

function resolveDeps(classified) {
  // Check if a dependency pattern matches any other issue's title
  return classified.map((issue) => {
    const resolvedDeps = (issue.deps || [])
      .map((depPattern) => {
        const re = new RegExp(depPattern, "i");
        const dep = classified.find(
          (other) => other.number !== issue.number && re.test(other.title),
        );
        return dep ? dep.number : null;
      })
      .filter(Boolean);
    return { ...issue, resolvedDeps };
  });
}

function buildWaves(issues) {
  const waves = [];
  const completed = new Set();
  const remaining = [...issues];
  let safety = 0;

  while (remaining.length > 0 && safety < 20) {
    safety++;
    const wave = [];
    const deferred = [];

    for (const issue of remaining) {
      const allDepsResolved = issue.resolvedDeps.every((d) => completed.has(d));
      if (allDepsResolved) {
        wave.push(issue);
      } else {
        deferred.push(issue);
      }
    }

    if (wave.length === 0) {
      // Circular dep or unresolvable — push all remaining as final wave
      waves.push(remaining);
      break;
    }

    waves.push(wave);
    for (const issue of wave) completed.add(issue.number);
    remaining.length = 0;
    remaining.push(...deferred);
  }

  return waves;
}

function buildContextPrompt(issue) {
  const lines = [];
  lines.push(`## Issue #${issue.number}: ${issue.title}`);
  lines.push("");
  lines.push(
    `**Domain:** ${issue.domain} — ${issue.domainInfo?.description || "General"}`,
  );
  lines.push("");

  if (issue.contextHint) {
    lines.push(`### Implementation Guidance`);
    lines.push(issue.contextHint);
    lines.push("");
  }

  if (issue.keyFiles?.length) {
    lines.push(`### Key Files to Read First`);
    for (const f of issue.keyFiles) lines.push(`- \`${f}\``);
    lines.push("");
  }

  if (issue.agentDocs?.length) {
    lines.push(`### Architecture Docs to Reference`);
    for (const d of issue.agentDocs) lines.push(`- \`agent_docs/${d}\``);
    lines.push("");
  }

  const stores = issue.domainInfo?.stores || [];
  if (stores.length) {
    lines.push(`### Relevant Zustand Stores`);
    for (const s of stores)
      lines.push(`- \`packages/client/src/stores/${s}.ts\``);
    lines.push("");
  }

  lines.push(`### Quality Gates`);
  lines.push(`1. \`npx tsc --noEmit\` — fix all type errors`);
  lines.push(`2. \`npx vitest run\` — fix all test failures`);
  lines.push(`3. \`npm run build\` — verify production build`);
  if (issue.domain.startsWith("frontend")) {
    lines.push(`4. \`npx playwright test\` — verify E2E tests pass`);
  }

  return lines.join("\n");
}

function buildDispatchComment(issue) {
  return `@claude Please implement this issue.

${buildContextPrompt(issue)}

### Rules
- Follow CLAUDE.md and the agent_docs referenced above
- Keep changes minimal and focused on this issue only
- Write at least one Vitest unit test for new functionality
- Do NOT use \`any\` in TypeScript
- Business logic in stores/services, not in React components`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const shouldDispatch = args.includes("--dispatch");
const localMode = args.includes("--local");
const waveFilter = args.includes("--wave")
  ? parseInt(args[args.indexOf("--wave") + 1], 10)
  : null;
const dryRun = !shouldDispatch && !localMode;

console.log("GridSpace Issue Orchestrator");
console.log("═".repeat(50));
console.log(
  `Mode: ${dryRun ? "DRY RUN (plan only)" : shouldDispatch ? "DISPATCH (label for Claude)" : "LOCAL (Claude Code agents)"}`,
);
console.log("");

// 1. Fetch issues
console.log("Fetching open parity issues...");
const rawIssues = fetchOpenIssues();
if (rawIssues.length === 0) {
  console.log("No open parity issues found.");
  process.exit(0);
}
console.log(`  Found ${rawIssues.length} open issues`);
console.log("");

// 2. Classify
console.log("Classifying issues by domain...");
const classified = rawIssues.map(classifyIssue);
for (const issue of classified) {
  console.log(
    `  #${issue.number} → ${issue.domain} | ${issue.title.slice(0, 60)}`,
  );
}
console.log("");

// 3. Resolve dependencies
const withDeps = resolveDeps(classified);

// 4. Build waves
const waves = buildWaves(withDeps);
console.log(`Execution Plan: ${waves.length} wave(s)`);
console.log("─".repeat(50));

for (let i = 0; i < waves.length; i++) {
  const wave = waves[i];
  const isActive = waveFilter === null || waveFilter === i + 1;
  console.log(
    `\nWave ${i + 1} (${wave.length} issues)${!isActive ? " [SKIPPED]" : ""}${wave.length > 1 ? " — parallelizable" : ""}`,
  );
  for (const issue of wave) {
    const depStr =
      issue.resolvedDeps.length > 0
        ? ` [waits for: ${issue.resolvedDeps.map((d) => `#${d}`).join(", ")}]`
        : "";
    console.log(
      `  #${issue.number} [${issue.domain}] ${issue.title.slice(0, 55)}${depStr}`,
    );
  }
}

// 5. Generate context files
const contextDir = resolve(ROOT, ".codex-output");
if (!existsSync(contextDir)) {
  execSync(`mkdir -p ${contextDir}`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  totalIssues: classified.length,
  waves: waves.map((wave, i) => ({
    wave: i + 1,
    issues: wave.map((issue) => ({
      number: issue.number,
      title: issue.title,
      domain: issue.domain,
      deps: issue.resolvedDeps,
    })),
  })),
};

writeFileSync(
  resolve(contextDir, "orchestration-plan.json"),
  JSON.stringify(manifest, null, 2),
);

// Write per-issue context prompts
for (const issue of classified) {
  const promptFile = resolve(contextDir, `issue-${issue.number}-context.md`);
  writeFileSync(promptFile, buildContextPrompt(issue));
}

console.log(`\nContext files written to .codex-output/`);

// 6. Dispatch
if (shouldDispatch) {
  console.log("\n" + "═".repeat(50));
  console.log("DISPATCHING TO CLAUDE VIA GITHUB");
  console.log("═".repeat(50));

  for (let i = 0; i < waves.length; i++) {
    if (waveFilter !== null && waveFilter !== i + 1) continue;

    const wave = waves[i];
    console.log(`\nDispatching Wave ${i + 1}...`);

    for (const issue of wave) {
      console.log(
        `  #${issue.number}: Adding claude-code label + context comment...`,
      );

      // Post architecture-aware context comment
      const comment = buildDispatchComment(issue);
      const escaped = comment.replace(/'/g, "'\\''");
      gh(`issue comment ${issue.number} --body '${escaped}'`);

      // Add the label that triggers claude.yml
      gh(`issue edit ${issue.number} --add-label claude-code`);

      console.log(`  #${issue.number}: Dispatched`);
    }

    if (waveFilter === null && i < waves.length - 1) {
      console.log(
        `\n  ** Wave ${i + 1} dispatched. Wave ${i + 2} depends on wave ${i + 1} completing first.`,
      );
      console.log(
        `  ** Re-run with --wave ${i + 2} after wave ${i + 1} PRs are merged.`,
      );
      break; // Only dispatch one wave at a time by default
    }
  }
}

if (localMode) {
  console.log("\n" + "═".repeat(50));
  console.log("LOCAL EXECUTION PLAN");
  console.log("═".repeat(50));
  console.log(
    "\nTo execute locally with Claude Code, run these commands in order:\n",
  );

  for (let i = 0; i < waves.length; i++) {
    if (waveFilter !== null && waveFilter !== i + 1) continue;

    const wave = waves[i];
    console.log(
      `# Wave ${i + 1} (${wave.length > 1 ? "run in parallel" : "single issue"})`,
    );

    for (const issue of wave) {
      console.log(
        `claude --print "Read .codex-output/issue-${issue.number}-context.md, then read the issue at https://github.com/sarathfrancis90/grid-space/issues/${issue.number}, implement it following the context guidance. Create branch claude/issue-${issue.number}, commit, push, and open a PR with 'Closes #${issue.number}'."`,
      );
    }
    console.log("");
  }
}

if (dryRun) {
  console.log("\n" + "─".repeat(50));
  console.log("This was a DRY RUN. To dispatch:");
  console.log(
    "  node scripts/orchestrate.mjs --dispatch          # via GitHub Actions",
  );
  console.log(
    "  node scripts/orchestrate.mjs --dispatch --wave 1 # dispatch wave 1 only",
  );
  console.log(
    "  node scripts/orchestrate.mjs --local             # show local CLI commands",
  );
}
