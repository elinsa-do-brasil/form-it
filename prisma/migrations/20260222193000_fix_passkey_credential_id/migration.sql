-- Align passkey table with @better-auth/passkey v1.4.x schema
-- Required field expected by plugin: credentialID
ALTER TABLE "passkey"
RENAME COLUMN "webauthnUserID" TO "credentialID";

-- Optional AAGUID metadata supported by the plugin
ALTER TABLE "passkey"
ADD COLUMN "aaguid" TEXT;

CREATE INDEX "passkey_credentialID_idx" ON "passkey"("credentialID");
