-- CreateTable
CREATE TABLE "comment_reactions" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extensions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "extension_id" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'installed',
    "granted_perms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "local_storage" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_reactions_comment_id_idx" ON "comment_reactions"("comment_id");

-- CreateIndex
CREATE INDEX "comment_reactions_user_id_idx" ON "comment_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_reactions_comment_id_user_id_emoji_key" ON "comment_reactions"("comment_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "extensions_user_id_idx" ON "extensions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "extensions_user_id_extension_id_key" ON "extensions"("user_id", "extension_id");

-- AddForeignKey
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extensions" ADD CONSTRAINT "extensions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
