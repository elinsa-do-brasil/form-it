import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildPasskeyOptions } from "@/lib/passkey-config";

describe("buildPasskeyOptions", () => {
  test("normalizes and deduplicates origins", () => {
    const options = buildPasskeyOptions({
      betterAuthUrl: "http://localhost:3000/",
      publicUrl: "http://localhost:3000",
      passkeyOrigins: "https://dash.raave.dev/, https://dash.raave.dev",
    });

    assert.deepEqual(options.origin, [
      "http://localhost:3000",
      "https://dash.raave.dev",
    ]);
  });

  test("uses explicit rpID when provided", () => {
    const options = buildPasskeyOptions({
      betterAuthUrl: "https://app.raave.dev",
      passkeyRpId: "raave.dev",
    });

    assert.equal(options.rpID, "raave.dev");
  });

  test("falls back to localhost when no valid origin is available", () => {
    const options = buildPasskeyOptions({
      betterAuthUrl: "not-a-url",
      publicUrl: "",
      passkeyOrigins: "still-not-a-url",
    });

    assert.equal(options.rpID, "localhost");
    assert.equal(options.origin, undefined);
  });
});
