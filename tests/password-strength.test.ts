import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  evaluatePasswordStrength,
  resolvePasswordStrengthTone,
} from "@/lib/password-strength";

describe("password strength helper", () => {
  test("returns null when password is empty", () => {
    assert.equal(evaluatePasswordStrength(""), null);
  });

  test("maps score levels to expected labels", () => {
    assert.deepEqual(resolvePasswordStrengthTone(0), {
      label: "Muito fraca",
      progressClassName: "bg-red-500",
      textClassName: "text-red-500",
    });
    assert.deepEqual(resolvePasswordStrengthTone(2), {
      label: "Razoável",
      progressClassName: "bg-yellow-500",
      textClassName: "text-yellow-500",
    });
    assert.deepEqual(resolvePasswordStrengthTone(4), {
      label: "Forte",
      progressClassName: "bg-emerald-500",
      textClassName: "text-emerald-500",
    });
  });

  test("returns translated feedback in portuguese", () => {
    const result = evaluatePasswordStrength("test");
    assert.ok(result);

    const combinedFeedback = [result.warning, ...result.suggestions]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    assert.equal(
      combinedFeedback.includes("single words are easy to guess"),
      false,
    );
    assert.ok(
      combinedFeedback.includes("palavr") ||
        combinedFeedback.includes("adicione"),
    );
  });
});
