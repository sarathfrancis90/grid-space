/**
 * Server-side proxy service for fetching external URLs.
 * Used by IMPORTHTML, IMPORTXML, IMPORTFEED, and IMPORTDATA formula functions
 * to avoid CORS issues in the browser.
 */
import logger from "../utils/logger";
import { AppError } from "../utils/AppError";

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5 MB
const FETCH_TIMEOUT_MS = 15_000;

/** Allowlist of URL protocols */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** Blocklist of hostnames to prevent SSRF */
const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254",
]);

function validateUrl(urlString: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new AppError(400, "Invalid URL");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new AppError(400, "Only http and https URLs are allowed");
  }

  if (BLOCKED_HOSTS.has(parsed.hostname)) {
    throw new AppError(403, "Access to this host is not allowed");
  }

  return parsed;
}

export interface ProxyFetchResult {
  content: string;
  contentType: string;
  statusCode: number;
}

/**
 * Fetch a URL server-side and return its text content.
 */
export async function fetchUrl(urlString: string): Promise<ProxyFetchResult> {
  const url = validateUrl(urlString);

  logger.info({ url: url.toString() }, "Proxy: fetching URL");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "User-Agent": "GridSpace/1.0 (Spreadsheet Import)",
      Accept:
        "text/html, application/xml, text/xml, application/rss+xml, application/atom+xml, text/csv, application/json, */*",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new AppError(
      502,
      `Remote server returned ${response.status} ${response.statusText}`,
    );
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
    throw new AppError(413, "Response too large");
  }

  const content = await response.text();

  if (content.length > MAX_RESPONSE_SIZE) {
    throw new AppError(413, "Response too large");
  }

  const contentType = response.headers.get("content-type") ?? "text/plain";

  return {
    content,
    contentType,
    statusCode: response.status,
  };
}
