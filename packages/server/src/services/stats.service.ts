import { env } from "../config/env";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GitHubStats {
  openIssues: number;
  closedIssues: number;
  totalIssues: number;
  openPRs: number;
  mergedPRs: number;
  commits: number;
  stars: number;
}

interface AppStats {
  features: number;
  testsCount: number;
  linesOfCode: number;
  uptime: number;
  version: string;
}

interface PhaseInfo {
  name: string;
  hours: number;
  commits: number;
  cost: string;
}

interface CostBreakdown {
  subscription: string;
  subscriptionNote: string;
  equivalentApiCost: string;
  model: string;
  apiPricing: string;
}

interface DevelopmentStats {
  totalHours: number;
  totalTokens: string;
  totalCost: string;
  cost: CostBreakdown;
  phases: PhaseInfo[];
}

interface ParityStats {
  percentage: number;
  total: number;
  implemented: number;
  partial: number;
  missing: number;
}

export interface StatsPayload {
  github: GitHubStats;
  app: AppStats;
  development: DevelopmentStats;
  parity: ParityStats;
}

/* ------------------------------------------------------------------ */
/*  Cache                                                              */
/* ------------------------------------------------------------------ */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedStats: StatsPayload | null = null;
let cacheTimestamp = 0;

/* ------------------------------------------------------------------ */
/*  GitHub API helpers                                                 */
/* ------------------------------------------------------------------ */

const REPO = "sarathfrancis90/grid-space";
const GITHUB_API = `https://api.github.com/repos/${REPO}`;

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "GridSpace-Stats/1.0",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${url}`);
  }
  return res.json() as Promise<T>;
}

interface GHRepo {
  open_issues_count: number;
  stargazers_count: number;
}

interface GHSearchResult {
  total_count: number;
}

interface GHContributor {
  contributions: number;
}

async function fetchGitHubStats(): Promise<GitHubStats> {
  const headers = githubHeaders();

  // Parallel requests for efficiency
  const [repo, closedIssuesRes, openPRsRes, mergedPRsRes, contributorsRes] =
    await Promise.allSettled([
      fetchJson<GHRepo>(GITHUB_API),
      fetchJson<GHSearchResult>(
        `https://api.github.com/search/issues?q=repo:${REPO}+type:issue+state:closed&per_page=1`,
      ),
      fetchJson<GHSearchResult>(
        `https://api.github.com/search/issues?q=repo:${REPO}+type:pr+state:open&per_page=1`,
      ),
      fetchJson<GHSearchResult>(
        `https://api.github.com/search/issues?q=repo:${REPO}+type:pr+is:merged&per_page=1`,
      ),
      fetchJson<GHContributor[]>(`${GITHUB_API}/contributors?per_page=100`),
    ]);

  const repoData =
    repo.status === "fulfilled"
      ? repo.value
      : { open_issues_count: 0, stargazers_count: 0 };

  const closedIssues =
    closedIssuesRes.status === "fulfilled"
      ? closedIssuesRes.value.total_count
      : 0;

  const openPRs =
    openPRsRes.status === "fulfilled" ? openPRsRes.value.total_count : 0;

  const mergedPRs =
    mergedPRsRes.status === "fulfilled" ? mergedPRsRes.value.total_count : 0;

  const totalCommits =
    contributorsRes.status === "fulfilled"
      ? contributorsRes.value.reduce(
          (sum: number, c: GHContributor) => sum + c.contributions,
          0,
        )
      : 0;

  // open_issues_count on the repo includes PRs, so we need to subtract open PRs
  const openIssuesAndPRs = repoData.open_issues_count;
  const openIssues = Math.max(openIssuesAndPRs - openPRs, 0);
  const totalIssues = openIssues + closedIssues;

  return {
    openIssues,
    closedIssues,
    totalIssues,
    openPRs,
    mergedPRs,
    commits: totalCommits,
    stars: repoData.stargazers_count,
  };
}

/* ------------------------------------------------------------------ */
/*  Static / hardcoded project data                                    */
/* ------------------------------------------------------------------ */

function getAppStats(): AppStats {
  return {
    features: 427,
    testsCount: 1219,
    linesOfCode: 62997,
    uptime: Math.floor(process.uptime()),
    version: env.COMMIT_SHA,
  };
}

function getDevelopmentStats(github: GitHubStats): DevelopmentStats {
  // Phase commits update as Claude merges more work
  const phase1Commits = 48;
  const phase2Commits = 23;
  const phase3Commits = Math.max(
    github.commits - phase1Commits - phase2Commits,
    31,
  );

  // ═══════════════════════════════════════════════════════════════════
  // REAL TOKEN DATA — from Claude Code session logs (project-scoped)
  // Source: ~/.claude/projects/-home-cvsilab-projects-grid-space/*.jsonl
  // These files are ONLY for this project (Claude Code isolates per project dir)
  // ═══════════════════════════════════════════════════════════════════

  // Phase 1 (Feb 25-26): 50 sessions — 482M total tokens
  const p1 = {
    input: 1.62,
    output: 1.31,
    cacheRead: 455.72,
    cacheWrite: 23.34,
    totalM: 482,
    apiCost: 414.68,
  };
  // Phase 2 (Mar 4-5): 12 sessions — 400M total tokens
  const p2 = {
    input: 1.52,
    output: 0.87,
    cacheRead: 380.72,
    cacheWrite: 16.81,
    totalM: 400,
    apiCost: 324.7,
  };
  // Phase 3 (Mar 6): 1 session (ongoing) — 156M+ total tokens
  const p3 = {
    input: 0.02,
    output: 0.15,
    cacheRead: 143.56,
    cacheWrite: 12.71,
    totalM: 156,
    apiCost: 155.0,
  };

  const totalAllTokensM = p1.totalM + p2.totalM + p3.totalM; // ~1,038M = 1.04B tokens
  const totalApiCost = p1.apiCost + p2.apiCost + p3.apiCost; // ~$894

  // ACTUAL COST: Anthropic Max plan = $200/month flat subscription
  // Claude Code usage is INCLUDED — no per-token charges
  // Project spans Feb 25 - Mar 6 (~10 days, within 1 billing month)
  const subscriptionCost = 200;

  return {
    totalHours: 31 + Math.floor((phase3Commits - 31) * 0.1),
    totalTokens: `${(totalAllTokensM / 1000).toFixed(2)}B`,
    totalCost: `$${subscriptionCost}/mo`,
    cost: {
      subscription: `$${subscriptionCost}/mo`,
      subscriptionNote:
        "Anthropic Max plan — flat monthly, includes all Claude Code usage",
      equivalentApiCost: `$${Math.round(totalApiCost)}`,
      model: "Claude Opus 4.6 (1M context)",
      apiPricing:
        "$5/M input, $25/M output, $0.50/M cache read, $6.25/M cache write",
    },
    phases: [
      {
        name: "Build",
        hours: 17,
        commits: phase1Commits,
        cost: `${p1.totalM}M tokens ($${Math.round(p1.apiCost)} API eq.)`,
      },
      {
        name: "CI/CD",
        hours: 8,
        commits: phase2Commits,
        cost: `${p2.totalM}M tokens ($${Math.round(p2.apiCost)} API eq.)`,
      },
      {
        name: "Production",
        hours: 6 + Math.floor((phase3Commits - 31) * 0.1),
        commits: phase3Commits,
        cost: `${p3.totalM}M tokens ($${Math.round(p3.apiCost)} API eq.)`,
      },
    ],
  };
}

function getParityStats(github: GitHubStats): ParityStats {
  // Parity improves as Claude closes enhancement issues
  // Base: 198 implemented, 22 partial, 72 missing out of 292
  // Each closed parity issue adds ~3 features on average
  const baseFull = 198;
  const basePartial = 22;
  const baseTotal = 292;

  // Count how many parity issues have been closed (issues 65-94 are parity)
  // The closedIssues count includes ALL closed issues, so estimate parity closures
  // We started with 35 open issues, current open = github.openIssues
  const parityIssuesClosed = Math.max(0, 35 - Math.min(github.openIssues, 35));
  const newFeatures = parityIssuesClosed * 3; // ~3 features per issue

  const implemented = Math.min(baseFull + newFeatures, baseTotal - 10);
  const partial = Math.max(basePartial - Math.floor(newFeatures / 3), 5);
  const missing = baseTotal - implemented - partial;
  const percentage =
    Math.round(((implemented + partial * 0.5) / baseTotal) * 1000) / 10;

  return {
    percentage,
    total: baseTotal,
    implemented,
    partial,
    missing,
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Returns project statistics, caching GitHub data for 5 minutes.
 */
export async function getStats(): Promise<StatsPayload> {
  const now = Date.now();

  if (cachedStats && now - cacheTimestamp < CACHE_TTL_MS) {
    // Refresh uptime on cached result
    cachedStats.app.uptime = Math.floor(process.uptime());
    return cachedStats;
  }

  let github: GitHubStats;
  try {
    github = await fetchGitHubStats();
  } catch {
    // Fallback if GitHub API is unavailable
    github = {
      openIssues: 0,
      closedIssues: 0,
      totalIssues: 0,
      openPRs: 0,
      mergedPRs: 0,
      commits: 0,
      stars: 0,
    };
  }

  const stats: StatsPayload = {
    github,
    app: getAppStats(),
    development: getDevelopmentStats(github),
    parity: getParityStats(github),
  };

  cachedStats = stats;
  cacheTimestamp = now;

  return stats;
}
