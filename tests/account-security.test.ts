import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAccountSecurityState,
  extractAccountAuthInsights,
} from "@/lib/account-security";

describe("account security helpers", () => {
  test("detects social account without local password", () => {
    const insights = extractAccountAuthInsights(
      [
        {
          providerId: "google",
          createdAt: "2026-02-20T12:00:00.000Z",
          password: null,
        },
      ],
      0,
    );

    assert.equal(insights.hasPassword, false);
    assert.equal(insights.hasSocialLogin, true);
    assert.equal(insights.createdWithSocialLogin, true);
    assert.equal(insights.primaryProvider, "google");
  });

  test("prioritizes oldest provider to infer creation method", () => {
    const insights = extractAccountAuthInsights(
      [
        {
          providerId: "google",
          createdAt: "2026-02-22T12:00:00.000Z",
        },
        {
          providerId: "credential",
          createdAt: "2026-02-20T12:00:00.000Z",
          password: "hash",
        },
      ],
      2,
    );

    assert.equal(insights.primaryProvider, "credential");
    assert.equal(insights.createdWithSocialLogin, false);
    assert.equal(insights.hasPassword, true);
    assert.equal(insights.passkeysCount, 2);
  });

  test("calculates high security score when factors are complete", () => {
    const state = calculateAccountSecurityState({
      emailVerified: true,
      hasPassword: true,
      twoFactorEnabled: true,
      hasPasskeys: true,
      hasSocialLogin: true,
    });

    assert.equal(state.score, 100);
    assert.equal(state.label, "Muito alto");
  });

  test("calculates low security score with minimal factors", () => {
    const state = calculateAccountSecurityState({
      emailVerified: false,
      hasPassword: false,
      twoFactorEnabled: false,
      hasPasskeys: false,
      hasSocialLogin: false,
    });

    assert.equal(state.score, 10);
    assert.equal(state.label, "Baixo");
  });
});
