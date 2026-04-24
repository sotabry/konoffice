import { describe, expect, it } from "vitest";
import { phraseAttemptSchema, runSpecSchema } from "@/lib/schemas";
import { createFallbackRun } from "@/lib/fallback-run";

describe("schemas", () => {
  it("accepts the fallback run", () => {
    expect(runSpecSchema.parse(createFallbackRun("a doomed roadmap"))).toBeTruthy();
  });

  it("rejects invalid phrase attempt intents", () => {
    expect(() =>
      phraseAttemptSchema.parse({
        transcript: "let us vibe",
        targetPhrase: "align on scope",
        intent: "synergize",
        score: 0.8,
        result: "pass",
        tip: "try again",
        subtitle: "not a valid move",
        multiplier: 1,
      }),
    ).toThrow();
  });
});
