import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  USERNAME_CACHE_TTL_MS,
  clearUsernameAvailabilityCache,
  normalizeUsername,
  readCachedUsernameAvailability,
  validateUsername,
  writeUsernameAvailabilityCache,
} from "@/lib/username-availability";

describe("username availability helpers", () => {
  test("normalizes username by trimming and lowercasing", () => {
    assert.equal(normalizeUsername("  Alice_Dev  "), "alice_dev");
  });

  test("validates usernames before querying availability", () => {
    assert.deepEqual(validateUsername("ab"), {
      isValid: false,
      reason: "too_short",
    });

    assert.deepEqual(validateUsername("name!"), {
      isValid: false,
      reason: "invalid_format",
    });

    assert.deepEqual(validateUsername("valid_name"), {
      isValid: true,
      reason: "ok",
    });
  });

  test("stores and expires availability cache entries", () => {
    clearUsernameAvailabilityCache();
    const now = 10_000;
    writeUsernameAvailabilityCache("alice", true, now);

    assert.deepEqual(readCachedUsernameAvailability("alice", now + 100), {
      available: true,
    });

    assert.equal(
      readCachedUsernameAvailability(
        "alice",
        now + USERNAME_CACHE_TTL_MS + 1,
      ),
      null,
    );
  });
});
