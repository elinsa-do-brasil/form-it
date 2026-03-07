-- AlterTable
ALTER TABLE "user" ADD COLUMN "lastActiveOrganizationId" TEXT;

-- CreateIndex
CREATE INDEX "user_lastActiveOrganizationId_idx" ON "user"("lastActiveOrganizationId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_lastActiveOrganizationId_fkey" FOREIGN KEY ("lastActiveOrganizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
