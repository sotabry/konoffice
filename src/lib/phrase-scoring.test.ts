import { describe, expect, it } from "vitest";
import { scorePhraseAttempt, similarityScore } from "@/lib/phrase-scoring";

describe("phrase scoring", () => {
  it("passes exact phrases regardless of punctuation or case", () => {
    const attempt = scorePhraseAttempt({
      transcript: "Align on scope!",
      targetPhrase: "align on scope",
      intent: "align",
    });

    expect(attempt.result).toBe("pass");
    expect(attempt.score).toBe(1);
  });

  it("marks minor missing words as near", () => {
    const attempt = scorePhraseAttempt({
      transcript: "align scope",
      targetPhrase: "align on scope",
      intent: "align",
    });

    expect(attempt.result).toBe("near");
  });

  it("marks unrelated phrases as misses", () => {
    const attempt = scorePhraseAttempt({
      transcript: "where is my coffee",
      targetPhrase: "drive the outcome",
      intent: "push",
    });

    expect(attempt.result).toBe("miss");
    expect(attempt.multiplier).toBeLessThan(0.5);
  });

  it("returns higher similarity for matching words", () => {
    expect(similarityScore("take it offline", "take it offline")).toBeGreaterThan(
      similarityScore("take a vacation", "take it offline"),
    );
  });
});
