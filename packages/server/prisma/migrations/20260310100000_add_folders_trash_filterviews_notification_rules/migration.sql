-- AlterTable: Add soft-delete and folder support to spreadsheets
ALTER TABLE "spreadsheets" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "spreadsheets" ADD COLUMN "folder_id" TEXT;

-- CreateIndex
CREATE INDEX "spreadsheets_deleted_at_idx" ON "spreadsheets"("deleted_at");
CREATE INDEX "spreadsheets_folder_id_idx" ON "spreadsheets"("folder_id");

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folders_user_id_idx" ON "folders"("user_id");
CREATE INDEX "folders_parent_id_idx" ON "folders"("parent_id");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spreadsheets" ADD CONSTRAINT "spreadsheets_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "notification_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "specific_email" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'immediately',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_rules_user_id_idx" ON "notification_rules"("user_id");
CREATE INDEX "notification_rules_spreadsheet_id_idx" ON "notification_rules"("spreadsheet_id");
CREATE INDEX "notification_rules_user_id_spreadsheet_id_idx" ON "notification_rules"("user_id", "spreadsheet_id");

-- AddForeignKey
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_spreadsheet_id_fkey" FOREIGN KEY ("spreadsheet_id") REFERENCES "spreadsheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "filter_views" (
    "id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "sheet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Filter View',
    "criteria" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filter_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "filter_views_spreadsheet_id_sheet_id_idx" ON "filter_views"("spreadsheet_id", "sheet_id");
CREATE INDEX "filter_views_user_id_idx" ON "filter_views"("user_id");

-- AddForeignKey
ALTER TABLE "filter_views" ADD CONSTRAINT "filter_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
