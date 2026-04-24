import type { Intent, PhraseAttempt } from "@/lib/schemas";

export function scorePhraseAttempt(input: {
  transcript: string;
  targetPhrase: string;
  intent: Intent;
  successSubtitle?: string;
}): PhraseAttempt {
  const transcript = input.transcript.trim() || "unrecognized speech";
  const targetPhrase = input.targetPhrase.trim();
  const score = similarityScore(transcript, targetPhrase);
  const result = score >= 0.82 ? "pass" : score >= 0.55 ? "near" : "miss";

  return {
    transcript,
    targetPhrase,
    intent: input.intent,
    score,
    result,
    tip: correctionTip(result, transcript, targetPhrase),
    subtitle: subtitle(result, input.successSubtitle),
    multiplier: multiplier(result),
  };
}

export function similarityScore(transcript: string, targetPhrase: string) {
  const spoken = tokenize(transcript);
  const target = tokenize(targetPhrase);
  if (spoken.length === 0 || target.length === 0) {
    return 0;
  }

  const spokenCounts = countTokens(spoken);
  const targetCounts = countTokens(target);
  let overlap = 0;
  for (const [token, count] of targetCounts) {
    overlap += Math.min(count, spokenCounts.get(token) ?? 0);
  }

  const precision = overlap / spoken.length;
  const recall = overlap / target.length;
  if (precision + recall === 0) {
    return 0;
  }

  const exactBonus = normalize(transcript).includes(normalize(targetPhrase)) ? 0.08 : 0;
  return Math.min(1, round((2 * precision * recall) / (precision + recall) + exactBonus));
}

function tokenize(value: string) {
  return normalize(value)
    .split(" ")
    .filter(Boolean);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function countTokens(tokens: string[]) {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

function correctionTip(result: PhraseAttempt["result"], transcript: string, targetPhrase: string) {
  if (result === "pass") {
    return "Clear enough for the meeting notes.";
  }

  const missing = tokenize(targetPhrase).filter((token) => !tokenize(transcript).includes(token));
  if (missing.length > 0) {
    return `Try again with: ${missing.slice(0, 3).join(", ")}.`;
  }

  return `Aim for the exact phrase: "${targetPhrase}".`;
}

function subtitle(result: PhraseAttempt["result"], successSubtitle?: string) {
  if (result === "pass") {
    return successSubtitle ?? "Your corporate English lands cleanly.";
  }
  if (result === "near") {
    return "Close enough to move the agenda, but the room asks for clarification.";
  }
  return "The phrase misses the room and the meeting pushes back.";
}

function multiplier(result: PhraseAttempt["result"]) {
  if (result === "pass") {
    return 1;
  }
  if (result === "near") {
    return 0.65;
  }
  return 0.25;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
