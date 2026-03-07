CREATE TYPE "RequesterRole" AS ENUM ('manager', 'coordinator');

CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('pending', 'delivered', 'failed');

CREATE TABLE "equipment_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "submittedByUserId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterRole" "RequesterRole" NOT NULL,
    "requesterDepartment" TEXT NOT NULL,
    "requesterPhone" TEXT,
    "futureUserName" TEXT NOT NULL,
    "futureUserEmail" TEXT NOT NULL,
    "futureUserDepartment" TEXT NOT NULL,
    "futureUserJobTitle" TEXT,
    "futureUserLocation" TEXT,
    "justification" TEXT NOT NULL,
    "notes" TEXT,
    "items" JSONB NOT NULL,
    "normalizedPayload" JSONB NOT NULL,
    "webhookStatus" "WebhookDeliveryStatus" NOT NULL DEFAULT 'pending',
    "webhookHttpStatus" INTEGER,
    "webhookResponseBody" TEXT,
    "webhookAttemptedAt" TIMESTAMP(3),
    "webhookDeliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_request_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "equipment_request_organizationId_idx" ON "equipment_request"("organizationId");

CREATE INDEX "equipment_request_submittedByUserId_idx" ON "equipment_request"("submittedByUserId");

CREATE INDEX "equipment_request_createdAt_idx" ON "equipment_request"("createdAt");

ALTER TABLE "equipment_request"
ADD CONSTRAINT "equipment_request_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "equipment_request"
ADD CONSTRAINT "equipment_request_submittedByUserId_fkey"
FOREIGN KEY ("submittedByUserId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
