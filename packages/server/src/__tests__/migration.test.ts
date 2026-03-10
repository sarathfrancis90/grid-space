import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = join(__dirname, "../../prisma/migrations");

describe("Prisma migrations", () => {
  it("folders/trash/filterviews migration file exists", () => {
    const migrationPath = join(
      MIGRATIONS_DIR,
      "20260310100000_add_folders_trash_filterviews_notification_rules",
      "migration.sql",
    );
    expect(existsSync(migrationPath)).toBe(true);
  });

  it("migration creates folders table", () => {
    const sql = readFileSync(
      join(
        MIGRATIONS_DIR,
        "20260310100000_add_folders_trash_filterviews_notification_rules",
        "migration.sql",
      ),
      "utf-8",
    );

    expect(sql).toContain('CREATE TABLE "folders"');
    expect(sql).toContain('"user_id" TEXT NOT NULL');
    expect(sql).toContain('"parent_id" TEXT');
    expect(sql).toContain("folders_user_id_fkey");
    expect(sql).toContain("folders_parent_id_fkey");
  });

  it("migration adds deleted_at and folder_id to spreadsheets", () => {
    const sql = readFileSync(
      join(
        MIGRATIONS_DIR,
        "20260310100000_add_folders_trash_filterviews_notification_rules",
        "migration.sql",
      ),
      "utf-8",
    );

    expect(sql).toContain('ALTER TABLE "spreadsheets" ADD COLUMN "deleted_at"');
    expect(sql).toContain('ALTER TABLE "spreadsheets" ADD COLUMN "folder_id"');
    expect(sql).toContain("spreadsheets_deleted_at_idx");
    expect(sql).toContain("spreadsheets_folder_id_idx");
    expect(sql).toContain("spreadsheets_folder_id_fkey");
  });

  it("migration creates filter_views table", () => {
    const sql = readFileSync(
      join(
        MIGRATIONS_DIR,
        "20260310100000_add_folders_trash_filterviews_notification_rules",
        "migration.sql",
      ),
      "utf-8",
    );

    expect(sql).toContain('CREATE TABLE "filter_views"');
    expect(sql).toContain('"spreadsheet_id" TEXT NOT NULL');
    expect(sql).toContain('"sheet_id" TEXT NOT NULL');
    expect(sql).toContain("filter_views_user_id_fkey");
  });

  it("migration creates notification_rules table", () => {
    const sql = readFileSync(
      join(
        MIGRATIONS_DIR,
        "20260310100000_add_folders_trash_filterviews_notification_rules",
        "migration.sql",
      ),
      "utf-8",
    );

    expect(sql).toContain('CREATE TABLE "notification_rules"');
    expect(sql).toContain('"trigger_type" TEXT NOT NULL');
    expect(sql).toContain('"frequency" TEXT NOT NULL');
    expect(sql).toContain("notification_rules_user_id_fkey");
    expect(sql).toContain("notification_rules_spreadsheet_id_fkey");
  });
});
