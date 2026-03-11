import { chromium, devices } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = "http://127.0.0.1:5173";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(
  "/home/cvsilab/projects/grid-space/qa-screenshots",
  `audit-${stamp}`,
);
await fs.mkdir(outDir, { recursive: true });

function attachTelemetry(page, telemetry) {
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      telemetry.console.push({
        type: msg.type(),
        text: msg.text(),
        url: page.url(),
      });
    }
  });
  page.on("pageerror", (error) => {
    telemetry.pageErrors.push({
      message: String(error),
      url: page.url(),
      type: "runtime",
    });
  });
  page.on("requestfailed", (req) => {
    telemetry.requestFailed.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText ?? "unknown",
      page: page.url(),
    });
  });
}

async function runScenario(label, contextOptions) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const telemetry = {
    console: [],
    pageErrors: [],
    requestFailed: [],
    stepErrors: [],
  };
  attachTelemetry(page, telemetry);

  const shots = [];
  const shot = async (name) => {
    const filename = `${label}-${String(shots.length + 1).padStart(2, "0")}-${name}.png`;
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath, fullPage: true });
    shots.push(filename);
  };

  const safeStep = async (stepName, fn) => {
    try {
      await fn();
    } catch (error) {
      telemetry.stepErrors.push({
        step: stepName,
        message: error instanceof Error ? error.message : String(error),
        url: page.url(),
      });
      try {
        await shot(`${stepName}-error`);
      } catch {
        // no-op
      }
    }
  };

  const waitForAuthState = async (timeout = 20000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await page.locator('[data-testid="dashboard-page"]').count())
        return "dashboard";
      if (await page.locator('[data-testid="register-error"]').count())
        return "register-error";
      if (await page.locator('[data-testid="login-error"]').count())
        return "login-error";
      await page.waitForTimeout(250);
    }
    return "timeout";
  };

  let authenticated = false;

  await safeStep("public-login", async () => {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page
      .locator('[data-testid="login-title"]')
      .waitFor({ timeout: 15000 });
    await shot("login");
  });

  await safeStep("public-register", async () => {
    await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
    await page
      .locator('[data-testid="register-title"]')
      .waitFor({ timeout: 15000 });
    await shot("register");
  });

  await safeStep("public-forgot-password", async () => {
    await page.goto(`${baseUrl}/forgot-password`, { waitUntil: "networkidle" });
    await page
      .locator('[data-testid="forgot-title"]')
      .waitFor({ timeout: 15000 });
    await shot("forgot-password");
    await page.fill(
      '[data-testid="forgot-email"]',
      `audit-forgot-${Date.now()}@example.com`,
    );
    await page.click('[data-testid="forgot-submit"]');
    await page.waitForTimeout(1500);
    await shot("forgot-result");
  });

  await safeStep("public-oauth-callback", async () => {
    await page.goto(`${baseUrl}/oauth/callback`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot("oauth-callback-state");
    if (page.url().endsWith("/oauth/callback")) {
      telemetry.stepErrors.push({
        step: "public-oauth-callback",
        message: "OAuth callback did not redirect automatically",
        url: page.url(),
      });
      await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    }
  });

  await safeStep("public-not-found-explicit", async () => {
    await page.goto(`${baseUrl}/not-found`, { waitUntil: "networkidle" });
    await page
      .locator('[data-testid="not-found-page"]')
      .waitFor({ timeout: 15000 });
    await shot("not-found");
  });

  await safeStep("public-not-found-catchall", async () => {
    await page.goto(`${baseUrl}/some/nonexistent/path`, {
      waitUntil: "networkidle",
    });
    await page
      .locator('[data-testid="not-found-page"]')
      .waitFor({ timeout: 15000 });
    await shot("catch-all-not-found");
  });

  const email = `audit-${label}-${Date.now()}@example.com`;
  const password = "Str0ngPassword!2026";

  await safeStep("auth-register-login", async () => {
    await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
    await page.fill('[data-testid="register-name"]', `Audit ${label}`);
    await page.fill('[data-testid="register-email"]', email);
    await page.fill('[data-testid="register-password"]', password);
    await page.click('[data-testid="register-submit"]');

    let state = await waitForAuthState();
    if (state !== "dashboard") {
      await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
      await page.fill('[data-testid="login-email"]', email);
      await page.fill('[data-testid="login-password"]', password);
      await page.click('[data-testid="login-submit"]');
      state = await waitForAuthState();
    }

    authenticated = state === "dashboard";
    if (!authenticated) {
      telemetry.stepErrors.push({
        step: "auth-register-login",
        message: `Could not reach dashboard after auth (state=${state})`,
        url: page.url(),
      });
      await shot("auth-failure-state");
    }
  });

  if (authenticated) {
    await safeStep("dashboard-grid", async () => {
      await page
        .locator('[data-testid="dashboard-page"]')
        .waitFor({ timeout: 15000 });
      await shot("dashboard-grid");
    });

    await safeStep("dashboard-list", async () => {
      await page.click('[data-testid="view-list-btn"]');
      await page.waitForTimeout(600);
      await shot("dashboard-list");
    });

    await safeStep("dashboard-empty-search", async () => {
      await page.fill(
        '[data-testid="search-input"]',
        "zzzz-no-match-visual-audit",
      );
      await page.waitForTimeout(700);
      await shot("dashboard-empty-state");
      await page.fill('[data-testid="search-input"]', "");
      await page.waitForTimeout(400);
    });

    await safeStep("editor-open", async () => {
      await page.click('[data-testid="create-spreadsheet-btn"]');
      await page.waitForURL(/\/spreadsheet\//, { timeout: 20000 });
      await page
        .locator('[data-testid="spreadsheet-editor"]')
        .waitFor({ timeout: 20000 });
      await page.waitForTimeout(1200);
      await shot("editor-grid");
    });

    await safeStep("editor-share-dialog", async () => {
      if (await page.locator('[data-testid="share-button"]').count()) {
        await page.click('[data-testid="share-button"]');
        await page
          .locator('[data-testid="share-dialog"]')
          .waitFor({ timeout: 10000 });
        await shot("editor-share-dialog");
        if (await page.locator('[data-testid="share-dialog-close"]').count()) {
          await page.click('[data-testid="share-dialog-close"]');
        }
      }
    });

    await safeStep("editor-notifications", async () => {
      if (await page.locator('[data-testid="notification-bell"]').count()) {
        await page.click('[data-testid="notification-bell"]');
        await page.waitForTimeout(400);
        await shot("editor-notification-panel");
        await page.keyboard.press("Escape");
      }
    });

    const probeView = async (buttonSelector, viewSelector, shotName) => {
      if (!(await page.locator(buttonSelector).count())) {
        telemetry.stepErrors.push({
          step: shotName,
          message: `Missing button: ${buttonSelector}`,
          url: page.url(),
        });
        return;
      }
      await page.click(buttonSelector, { timeout: 6000 });
      await page.waitForTimeout(600);
      if (!(await page.locator(viewSelector).count())) {
        telemetry.stepErrors.push({
          step: shotName,
          message: `Expected view not visible: ${viewSelector}`,
          url: page.url(),
        });
      }
      if (await page.locator('[data-testid="view-setup-dialog"]').count()) {
        telemetry.stepErrors.push({
          step: shotName,
          message: "View setup dialog intercepted view switching",
          url: page.url(),
        });
        await shot(`${shotName}-setup-dialog`);
        if (await page.locator('[data-testid="setup-apply-btn"]').count()) {
          await page.click('[data-testid="setup-apply-btn"]');
        } else if (
          await page.locator('[data-testid="setup-cancel-btn"]').count()
        ) {
          await page.click('[data-testid="setup-cancel-btn"]');
        }
        await page.waitForTimeout(500);
      }
      await shot(shotName);
    };

    await safeStep("editor-views", async () => {
      await probeView(
        '[data-testid="view-btn-kanban"]',
        '[data-testid="kanban-view"]',
        "editor-kanban-view",
      );
      await probeView(
        '[data-testid="view-btn-timeline"]',
        '[data-testid="timeline-view"]',
        "editor-timeline-view",
      );
      await probeView(
        '[data-testid="view-btn-calendar"]',
        '[data-testid="calendar-view"]',
        "editor-calendar-view",
      );
      await probeView(
        '[data-testid="view-btn-grid"]',
        '[data-testid="grid-wrapper"]',
        "editor-grid-return",
      );
    });

    await safeStep("profile-page", async () => {
      if (await page.locator('[data-testid="back-to-dashboard"]').count()) {
        await page.click('[data-testid="back-to-dashboard"]');
      }
      await page.waitForURL(/\/dashboard$/, { timeout: 15000 });
      await page.click('[data-testid="profile-link"]');
      await page.waitForURL(/\/profile$/, { timeout: 15000 });
      await page
        .locator('[data-testid="profile-title"]')
        .waitFor({ timeout: 15000 });
      await shot("profile");
    });

    await safeStep("profile-save", async () => {
      await page.fill(
        '[data-testid="profile-name-input"]',
        `Audit ${label} Updated`,
      );
      await page.click('[data-testid="profile-save"]');
      await page.waitForTimeout(1200);
      await shot("profile-saved");
    });

    await safeStep("logout-flow", async () => {
      await page.click('[data-testid="profile-logout"]');
      await page.waitForURL(/\/login$/, { timeout: 15000 });
      await shot("post-logout-login");
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await shot("protected-route-after-logout");
    });
  }

  const summaryPath = path.join(outDir, `${label}-summary.json`);
  await fs.writeFile(
    summaryPath,
    JSON.stringify(
      {
        label,
        authenticated,
        shots,
        telemetry,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );

  await context.close();
  await browser.close();
  return { label, shotsCount: shots.length, summaryPath, authenticated };
}

const desktop = await runScenario("desktop", {
  viewport: { width: 1720, height: 980 },
});
await new Promise((resolve) => setTimeout(resolve, 65000));
const mobile = await runScenario("mobile", { ...devices["iPhone 13"] });

const topSummary = {
  outDir,
  runs: [desktop, mobile],
  generatedAt: new Date().toISOString(),
};
await fs.writeFile(
  path.join(outDir, "summary.json"),
  JSON.stringify(topSummary, null, 2),
  "utf8",
);
console.log(JSON.stringify(topSummary, null, 2));
