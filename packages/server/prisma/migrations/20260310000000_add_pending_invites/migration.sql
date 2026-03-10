-- CreateTable
CREATE TABLE "pending_invites" (
    "id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "invited_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_invites_email_idx" ON "pending_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pending_invites_spreadsheet_id_email_key" ON "pending_invites"("spreadsheet_id", "email");

-- AddForeignKey
ALTER TABLE "pending_invites" ADD CONSTRAINT "pending_invites_spreadsheet_id_fkey" FOREIGN KEY ("spreadsheet_id") REFERENCES "spreadsheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
