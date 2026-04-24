import { describe, expect, it } from "vitest";
import { createFallbackRun } from "@/lib/fallback-run";
import { createInitialGameState, resolveAction } from "@/lib/game";

describe("game rules", () => {
  it("push damages an enemy", () => {
    const state = createInitialGameState(createFallbackRun());
    const before = state.enemy.currentHp;
    const result = resolveAction(state, {
      transcript: "we need to push this deliverable over the line",
      targetPhrase: "drive progress",
      intent: "push",
      score: 1,
      result: "pass",
      tip: "clear",
      subtitle: "forward motion appears",
      multiplier: 1,
    });

    expect(result.state.enemy.currentHp).toBeLessThan(before);
  });

  it("deflect adds shield before enemy damage", () => {
    const state = createInitialGameState(createFallbackRun());
    const result = resolveAction(state, {
      transcript: "let's take this offline until there is bandwidth",
      targetPhrase: "take it offline",
      intent: "deflect",
      score: 1,
      result: "pass",
      tip: "clear",
      subtitle: "the danger leaves the room",
      multiplier: 1,
    });

    expect(result.state.playerHp).toBe(state.playerHp);
    expect(result.state.shield).toBeGreaterThan(0);
  });

  it("align reveals weakness and buffs the next action", () => {
    const state = createInitialGameState(createFallbackRun());
    const result = resolveAction(state, {
      transcript: "let's align on scope and clarify requirements",
      targetPhrase: "align on scope",
      intent: "align",
      score: 1,
      result: "pass",
      tip: "clear",
      subtitle: "clarity enters the meeting",
      multiplier: 1,
    });

    expect(result.state.enemy.revealed).toBe(true);
    expect(result.state.focus).toBeGreaterThan(0);
  });

  it("can complete a three-encounter run", () => {
    let state = createInitialGameState(createFallbackRun());
    const actions = [
      "align",
      "push",
      "push",
      "deflect",
      "push",
      "push",
      "push",
      "push",
      "push",
      "deflect",
      "push",
      "deflect",
      "push",
    ] as const;

    for (const intent of actions) {
      if (state.phase === "victory") {
        break;
      }
      state = resolveAction(state, {
        transcript: `we should ${intent} the corporate situation`,
        targetPhrase: `${intent} the work`,
        intent,
        score: 1,
        result: "pass",
        tip: "clear",
        subtitle: "the office reacts",
        multiplier: 1,
      }).state;
    }

    expect(state.phase).toBe("victory");
  });

  it("near phrase attempts use reduced power", () => {
    const state = createInitialGameState(createFallbackRun());
    const pass = resolveAction(state, {
      transcript: "drive progress",
      targetPhrase: "drive progress",
      intent: "push",
      score: 1,
      result: "pass",
      tip: "clear",
      subtitle: "full power",
      multiplier: 1,
    }).state;
    const near = resolveAction(state, {
      transcript: "drive",
      targetPhrase: "drive progress",
      intent: "push",
      score: 0.66,
      result: "near",
      tip: "say progress",
      subtitle: "reduced power",
      multiplier: 0.65,
    }).state;

    expect(pass.enemy.currentHp).toBeLessThan(near.enemy.currentHp);
  });

  it("misses still advance the turn but increase incoming damage", () => {
    const state = createInitialGameState(createFallbackRun());
    const result = resolveAction(state, {
      transcript: "coffee please",
      targetPhrase: "drive progress",
      intent: "push",
      score: 0,
      result: "miss",
      tip: "try the target phrase",
      subtitle: "missed",
      multiplier: 0.25,
    }).state;

    expect(result.playerHp).toBeLessThan(state.playerHp - state.enemy.attack + 1);
    expect(result.log[0]).toContain("coffee please");
  });
});
