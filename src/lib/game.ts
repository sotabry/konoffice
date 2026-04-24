import type { EnemySpec, Intent, PhraseAttempt, RunSpec } from "@/lib/schemas";

export type Phase = "intro" | "generating" | "encounter" | "interpreting" | "resolving" | "victory" | "death" | "error";

export type CombatEnemy = EnemySpec & {
  currentHp: number;
  maxHp: number;
  revealed: boolean;
};

export type GameState = {
  run: RunSpec;
  encounterIndex: number;
  playerHp: number;
  maxPlayerHp: number;
  shield: number;
  focus: number;
  enemy: CombatEnemy;
  log: string[];
  phase: Phase;
};

export type ResolveResult = {
  state: GameState;
  defeatedEnemy: boolean;
};

export function createInitialGameState(run: RunSpec): GameState {
  const enemy = makeEncounterEnemy(run, 0);
  return {
    run,
    encounterIndex: 0,
    playerHp: 36,
    maxPlayerHp: 36,
    shield: 0,
    focus: 0,
    enemy,
    log: [run.intro, run.floors[0].eventText],
    phase: "encounter",
  };
}

export function makeEncounterEnemy(run: RunSpec, encounterIndex: number): CombatEnemy {
  const spec = encounterIndex < 2 ? run.enemies[encounterIndex] : run.boss;
  return {
    ...spec,
    currentHp: spec.hp,
    maxHp: spec.hp,
    revealed: false,
  };
}

export function resolveAction(state: GameState, attempt: PhraseAttempt): ResolveResult {
  const enemy = { ...state.enemy };
  const floor = state.run.floors[state.encounterIndex];
  const log = [
    `${state.run.player.name}: "${attempt.transcript}"`,
    `${labelIntent(attempt.intent)} ${labelResult(attempt.result)}: ${attempt.subtitle}`,
  ];
  let playerHp = state.playerHp;
  let shield = Math.max(0, state.shield - 1);
  let focus = state.focus;
  let defeatedEnemy = false;

  if (attempt.intent === "push") {
    const weaknessBonus = enemy.weaknessIntent === "push" ? 4 : 0;
    const damage = Math.max(1, Math.round((8 + focus + weaknessBonus) * attempt.multiplier));
    enemy.currentHp = Math.max(0, enemy.currentHp - damage);
    focus = 0;
    log.push(`${enemy.name} takes ${damage} pressure damage.`);
  }

  if (attempt.intent === "deflect") {
    const weaknessBonus = enemy.weaknessIntent === "deflect" ? 3 : 0;
    const cover = Math.max(1, Math.round((7 + weaknessBonus + focus) * attempt.multiplier));
    shield += cover;
    focus = 0;
    log.push(`You gain ${cover} stakeholder cover.`);
  }

  if (attempt.intent === "align") {
    enemy.revealed = true;
    const weaknessBonus = enemy.weaknessIntent === "align" ? Math.max(1, Math.round(5 * attempt.multiplier)) : 0;
    if (weaknessBonus > 0) {
      enemy.currentHp = Math.max(0, enemy.currentHp - weaknessBonus);
      log.push(`${enemy.name}'s ambiguity cracks for ${weaknessBonus} clarity damage.`);
    } else {
      log.push(`${enemy.name}'s weakness is now visible: ${labelIntent(enemy.weaknessIntent)}.`);
    }
    focus += attempt.result === "pass" ? 3 : attempt.result === "near" ? 2 : 0;
  }

  defeatedEnemy = enemy.currentHp <= 0;

  if (!defeatedEnemy) {
    const mitigated = Math.min(shield, enemy.attack);
    const missPenalty = attempt.result === "miss" ? 2 : 0;
    const incoming = Math.max(0, enemy.attack + missPenalty - mitigated);
    shield -= mitigated;
    playerHp = Math.max(0, playerHp - incoming);
    log.push(enemyAttackLine(enemy, incoming, mitigated));
  } else {
    log.push(`${enemy.name} has been action-itemed into silence.`);
  }

  const nextLog = [...log, ...state.log].slice(0, 12);
  let nextState: GameState = {
    ...state,
    playerHp,
    shield,
    focus,
    enemy,
    log: nextLog,
    phase: playerHp <= 0 ? "death" : "encounter",
  };

  if (playerHp <= 0) {
    nextState = {
      ...nextState,
      log: [state.run.deathText, ...nextState.log].slice(0, 12),
      phase: "death",
    };
    return { state: nextState, defeatedEnemy };
  }

  if (defeatedEnemy) {
    const nextEncounterIndex = state.encounterIndex + 1;
    if (nextEncounterIndex >= 3) {
      nextState = {
        ...nextState,
        phase: "victory",
        log: [state.run.victoryText, ...nextState.log].slice(0, 12),
      };
      return { state: nextState, defeatedEnemy };
    }

    const nextEnemy = makeEncounterEnemy(state.run, nextEncounterIndex);
    nextState = {
      ...nextState,
      encounterIndex: nextEncounterIndex,
      shield: Math.min(8, nextState.shield + 2),
      focus: 0,
      enemy: nextEnemy,
      log: [
        state.run.floors[nextEncounterIndex].eventText,
        `You enter ${state.run.floors[nextEncounterIndex].name}.`,
        ...nextState.log,
      ].slice(0, 12),
    };
  }

  if (!floor) {
    return { state: nextState, defeatedEnemy };
  }

  return { state: nextState, defeatedEnemy };
}

export function labelIntent(intent: Intent) {
  if (intent === "push") {
    return "Push";
  }
  if (intent === "deflect") {
    return "Deflect";
  }
  return "Align";
}

export function labelResult(result: PhraseAttempt["result"]) {
  if (result === "pass") {
    return "Pass";
  }
  if (result === "near") {
    return "Near";
  }
  return "Miss";
}

function enemyAttackLine(enemy: CombatEnemy, incoming: number, mitigated: number) {
  const blocked = mitigated > 0 ? ` ${mitigated} got buried in a follow-up thread.` : "";
  if (incoming <= 0) {
    return `${enemy.name} attacks, but your cover absorbs the entire ask.${blocked}`;
  }
  return `${enemy.name} creates ${incoming} stress damage.${blocked}`;
}
