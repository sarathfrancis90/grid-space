-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "oauth_provider" TEXT,
    "oauth_id" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spreadsheets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Spreadsheet',
    "owner_id" TEXT NOT NULL,
    "share_link" TEXT,
    "share_link_role" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_url" TEXT,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "template_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spreadsheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spreadsheet_access" (
    "id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spreadsheet_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sheets" (
    "id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Sheet1',
    "index" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "cell_data" JSONB NOT NULL DEFAULT '{}',
    "column_meta" JSONB NOT NULL DEFAULT '{}',
    "row_meta" JSONB NOT NULL DEFAULT '{}',
    "frozen_rows" INTEGER NOT NULL DEFAULT 0,
    "frozen_cols" INTEGER NOT NULL DEFAULT 0,
    "filter_state" JSONB,
    "sort_state" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versions" (
    "id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "name" TEXT,
    "snapshot" JSONB NOT NULL,
    "changeset" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "rate_limit" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY['spreadsheet.updated']::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "sheet_id" TEXT NOT NULL,
    "cell_key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_replies" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "spreadsheet_id" TEXT,
    "cell_ref" TEXT,
    "from_user_id" TEXT,
    "from_user_name" TEXT,
    "from_user_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spreadsheet_id" TEXT,
    "email_sharing" BOOLEAN NOT NULL DEFAULT false,
    "email_comments" BOOLEAN NOT NULL DEFAULT false,
    "email_mentions" BOOLEAN NOT NULL DEFAULT false,
    "in_app_sharing" BOOLEAN NOT NULL DEFAULT true,
    "in_app_comments" BOOLEAN NOT NULL DEFAULT true,
    "in_app_mentions" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_oauth_provider_oauth_id_key" ON "users"("oauth_provider", "oauth_id");

-- CreateIndex
CREATE UNIQUE INDEX "spreadsheets_share_link_key" ON "spreadsheets"("share_link");

-- CreateIndex
CREATE UNIQUE INDEX "spreadsheets_published_url_key" ON "spreadsheets"("published_url");

-- CreateIndex
CREATE INDEX "spreadsheets_owner_id_idx" ON "spreadsheets"("owner_id");

-- CreateIndex
CREATE INDEX "spreadsheets_updated_at_idx" ON "spreadsheets"("updated_at");

-- CreateIndex
CREATE INDEX "spreadsheet_access_user_id_idx" ON "spreadsheet_access"("user_id");

-- CreateIndex
CREATE INDEX "spreadsheet_access_spreadsheet_id_idx" ON "spreadsheet_access"("spreadsheet_id");

-- CreateIndex
CREATE UNIQUE INDEX "spreadsheet_access_spreadsheet_id_user_id_key" ON "spreadsheet_access"("spreadsheet_id", "user_id");

-- CreateIndex
CREATE INDEX "sheets_spreadsheet_id_idx" ON "sheets"("spreadsheet_id");

-- CreateIndex
CREATE UNIQUE INDEX "sheets_spreadsheet_id_index_key" ON "sheets"("spreadsheet_id", "index");

-- CreateIndex
CREATE INDEX "versions_spreadsheet_id_created_at_idx" ON "versions"("spreadsheet_id", "created_at");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "webhooks_spreadsheet_id_idx" ON "webhooks"("spreadsheet_id");

-- CreateIndex
CREATE INDEX "webhooks_user_id_idx" ON "webhooks"("user_id");

-- CreateIndex
CREATE INDEX "comments_spreadsheet_id_idx" ON "comments"("spreadsheet_id");

-- CreateIndex
CREATE INDEX "comments_spreadsheet_id_sheet_id_idx" ON "comments"("spreadsheet_id", "sheet_id");

-- CreateIndex
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");

-- CreateIndex
CREATE INDEX "comment_replies_comment_id_idx" ON "comment_replies"("comment_id");

-- CreateIndex
CREATE INDEX "comment_replies_author_id_idx" ON "comment_replies"("author_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_spreadsheet_id_key" ON "notification_preferences"("user_id", "spreadsheet_id");

-- AddForeignKey
ALTER TABLE "spreadsheets" ADD CONSTRAINT "spreadsheets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spreadsheet_access" ADD CONSTRAINT "spreadsheet_access_spreadsheet_id_fkey" FOREIGN KEY ("spreadsheet_id") REFERENCES "spreadsheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spreadsheet_access" ADD CONSTRAINT "spreadsheet_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_spreadsheet_id_fkey" FOREIGN KEY ("spreadsheet_id") REFERENCES "spreadsheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_spreadsheet_id_fkey" FOREIGN KEY ("spreadsheet_id") REFERENCES "spreadsheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_spreadsheet_id_fkey" FOREIGN KEY ("spreadsheet_id") REFERENCES "spreadsheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_spreadsheet_id_fkey" FOREIGN KEY ("spreadsheet_id") REFERENCES "spreadsheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_replies" ADD CONSTRAINT "comment_replies_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_replies" ADD CONSTRAINT "comment_replies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_spreadsheet_id_fkey" FOREIGN KEY ("spreadsheet_id") REFERENCES "spreadsheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

