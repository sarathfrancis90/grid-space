#!/usr/bin/env node

/**
 * Reads feature_list.json and generates a summary JSON
 * for the server to serve at /api/status.
 *
 * This runs as a prebuild step so the Docker image
 * reflects real feature progress.
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const featureListPath = path.join(rootDir, "feature_list.json");
const outputDir = path.join(rootDir, "packages", "server", "src", "generated");
const outputPath = path.join(outputDir, "feature-count.json");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let features;
try {
  features = JSON.parse(fs.readFileSync(featureListPath, "utf-8"));
} catch {
  // If feature_list.json doesn't exist (e.g., in Docker without it), write defaults
  const defaultData = { total: 427, completed: 0, remaining: 427, sprints: 16 };
  fs.writeFileSync(outputPath, JSON.stringify(defaultData, null, 2));
  console.log("feature_list.json not found — wrote defaults to", outputPath);
  process.exit(0);
}

const total = features.length;
const completed = features.filter((f) => f.passes === true).length;
const remaining = total - completed;

// Count unique sprints
const sprints = new Set(features.map((f) => f.sprint)).size;

const result = { total, completed, remaining, sprints };

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(
  `Feature count generated: ${completed}/${total} complete → ${outputPath}`,
);
