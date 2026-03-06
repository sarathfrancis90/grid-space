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

interface DevelopmentStats {
  totalHours: number;
  totalTokens: string;
  totalCost: string;
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

function getDevelopmentStats(): DevelopmentStats {
  return {
    totalHours: 31,
    totalTokens: "5.45M",
    totalCost: "$219",
    phases: [
      { name: "Build", hours: 17, commits: 48, cost: "$122.94" },
      { name: "CI/CD", hours: 8, commits: 23, cost: "$87.92" },
      { name: "Production", hours: 6, commits: 31, cost: "$8.41" },
    ],
  };
}

function getParityStats(): ParityStats {
  return {
    percentage: 75.3,
    total: 292,
    implemented: 198,
    partial: 22,
    missing: 72,
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
    development: getDevelopmentStats(),
    parity: getParityStats(),
  };

  cachedStats = stats;
  cacheTimestamp = now;

  return stats;
}
