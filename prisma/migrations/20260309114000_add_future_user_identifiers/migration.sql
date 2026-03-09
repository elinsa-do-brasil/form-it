ALTER TABLE "equipment_request"
ADD COLUMN "futureUserCpf" TEXT NOT NULL DEFAULT '',
ADD COLUMN "futureUserEmployeeId" TEXT NOT NULL DEFAULT '';

ALTER TABLE "equipment_request"
ALTER COLUMN "futureUserCpf" DROP DEFAULT,
ALTER COLUMN "futureUserEmployeeId" DROP DEFAULT;
