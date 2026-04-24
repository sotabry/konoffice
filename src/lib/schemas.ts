import { z } from "zod";

export const intentSchema = z.enum(["push", "deflect", "align"]);

export type Intent = z.infer<typeof intentSchema>;

export const phraseDifficultySchema = z.enum(["easy", "medium", "hard"]);

export const phraseResultSchema = z.enum(["pass", "near", "miss"]);

export const enemyTypeSchema = z.enum([
  "scopeCreepSlime",
  "meetingHydra",
  "calendarLeech",
  "passiveAggressiveMushroom",
  "deckGoblin",
  "urgencyImp",
  "vpOfAmbiguity",
]);

export const enemySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(48),
  type: enemyTypeSchema,
  hp: z.number().int().min(8).max(40),
  attack: z.number().int().min(2).max(10),
  weaknessIntent: intentSchema,
  flavor: z.string().min(8).max(160),
});

export const bossSchema = enemySchema.extend({
  title: z.string().min(2).max(72),
  phases: z.array(z.string().min(4).max(80)).length(2),
});

export const practicePhraseSchema = z.object({
  id: z.string().min(1),
  intent: intentSchema,
  text: z.string().min(2).max(64),
  meaning: z.string().min(4).max(140),
  difficulty: phraseDifficultySchema,
  successSubtitle: z.string().min(4).max(140),
});

export const practicePhraseSetSchema = z.object({
  push: z.array(practicePhraseSchema).min(1).max(3),
  deflect: z.array(practicePhraseSchema).min(1).max(3),
  align: z.array(practicePhraseSchema).min(1).max(3),
});

export const floorSchema = z.object({
  name: z.string().min(2).max(64),
  roomType: z.enum(["standup", "sync", "planning", "retro", "allHands"]),
  objective: z.string().min(8).max(140),
  enemyId: z.string().min(1),
  eventText: z.string().min(8).max(180),
  practicePhrases: practicePhraseSetSchema,
});

export const runSpecSchema = z.object({
  runTitle: z.string().min(2).max(72),
  companyName: z.string().min(2).max(64),
  department: z.string().min(2).max(64),
  crisis: z.string().min(8).max(180),
  intro: z.string().min(8).max(220),
  player: z.object({
    name: z.string().min(2).max(48),
    role: z.string().min(2).max(64),
    mushroomType: z.string().min(2).max(48),
  }),
  floors: z.array(floorSchema).length(3),
  enemies: z.array(enemySchema).length(2),
  boss: bossSchema,
  victoryText: z.string().min(8).max(220),
  deathText: z.string().min(8).max(220),
  shareSummary: z.string().min(8).max(180),
});

export const phraseAttemptSchema = z.object({
  transcript: z.string().min(1).max(500),
  targetPhrase: z.string().min(2).max(64),
  intent: intentSchema,
  score: z.number().min(0).max(1),
  result: phraseResultSchema,
  tip: z.string().min(4).max(180),
  subtitle: z.string().min(4).max(140),
  multiplier: z.number().min(0).max(1.25),
});

export type EnemySpec = z.infer<typeof enemySchema>;
export type BossSpec = z.infer<typeof bossSchema>;
export type PracticePhrase = z.infer<typeof practicePhraseSchema>;
export type RunSpec = z.infer<typeof runSpecSchema>;
export type PhraseAttempt = z.infer<typeof phraseAttemptSchema>;

const phraseArrayJsonSchema = {
  type: "array",
  minItems: 1,
  maxItems: 3,
  items: {
    type: "object",
    additionalProperties: false,
    required: ["id", "intent", "text", "meaning", "difficulty", "successSubtitle"],
    properties: {
      id: { type: "string", minLength: 1 },
      intent: { type: "string", enum: ["push", "deflect", "align"] },
      text: { type: "string", minLength: 2, maxLength: 64 },
      meaning: { type: "string", minLength: 4, maxLength: 140 },
      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
      successSubtitle: { type: "string", minLength: 4, maxLength: 140 },
    },
  },
} as const;

export const runSpecJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "runTitle",
    "companyName",
    "department",
    "crisis",
    "intro",
    "player",
    "floors",
    "enemies",
    "boss",
    "victoryText",
    "deathText",
    "shareSummary",
  ],
  properties: {
    runTitle: { type: "string", minLength: 2, maxLength: 72 },
    companyName: { type: "string", minLength: 2, maxLength: 64 },
    department: { type: "string", minLength: 2, maxLength: 64 },
    crisis: { type: "string", minLength: 8, maxLength: 180 },
    intro: { type: "string", minLength: 8, maxLength: 220 },
    player: {
      type: "object",
      additionalProperties: false,
      required: ["name", "role", "mushroomType"],
      properties: {
        name: { type: "string", minLength: 2, maxLength: 48 },
        role: { type: "string", minLength: 2, maxLength: 64 },
        mushroomType: { type: "string", minLength: 2, maxLength: 48 },
      },
    },
    floors: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "roomType", "objective", "enemyId", "eventText", "practicePhrases"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 64 },
          roomType: {
            type: "string",
            enum: ["standup", "sync", "planning", "retro", "allHands"],
          },
          objective: { type: "string", minLength: 8, maxLength: 140 },
          enemyId: { type: "string", minLength: 1 },
          eventText: { type: "string", minLength: 8, maxLength: 180 },
          practicePhrases: {
            type: "object",
            additionalProperties: false,
            required: ["push", "deflect", "align"],
            properties: {
              push: phraseArrayJsonSchema,
              deflect: phraseArrayJsonSchema,
              align: phraseArrayJsonSchema,
            },
          },
        },
      },
    },
    enemies: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "type", "hp", "attack", "weaknessIntent", "flavor"],
        properties: {
          id: { type: "string", minLength: 1 },
          name: { type: "string", minLength: 2, maxLength: 48 },
          type: {
            type: "string",
            enum: [
              "scopeCreepSlime",
              "meetingHydra",
              "calendarLeech",
              "passiveAggressiveMushroom",
              "deckGoblin",
              "urgencyImp",
              "vpOfAmbiguity",
            ],
          },
          hp: { type: "integer", minimum: 8, maximum: 40 },
          attack: { type: "integer", minimum: 2, maximum: 10 },
          weaknessIntent: { type: "string", enum: ["push", "deflect", "align"] },
          flavor: { type: "string", minLength: 8, maxLength: 160 },
        },
      },
    },
    boss: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "name",
        "type",
        "hp",
        "attack",
        "weaknessIntent",
        "flavor",
        "title",
        "phases",
      ],
      properties: {
        id: { type: "string", minLength: 1 },
        name: { type: "string", minLength: 2, maxLength: 48 },
        type: {
          type: "string",
          enum: [
            "scopeCreepSlime",
            "meetingHydra",
            "calendarLeech",
            "passiveAggressiveMushroom",
            "deckGoblin",
            "urgencyImp",
            "vpOfAmbiguity",
          ],
        },
        hp: { type: "integer", minimum: 8, maximum: 40 },
        attack: { type: "integer", minimum: 2, maximum: 10 },
        weaknessIntent: { type: "string", enum: ["push", "deflect", "align"] },
        flavor: { type: "string", minLength: 8, maxLength: 160 },
        title: { type: "string", minLength: 2, maxLength: 72 },
        phases: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: { type: "string", minLength: 4, maxLength: 80 },
        },
      },
    },
    victoryText: { type: "string", minLength: 8, maxLength: 220 },
    deathText: { type: "string", minLength: 8, maxLength: 220 },
    shareSummary: { type: "string", minLength: 8, maxLength: 180 },
  },
} as const;

export const phraseAttemptJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["transcript", "targetPhrase", "intent", "score", "result", "tip", "subtitle", "multiplier"],
  properties: {
    transcript: { type: "string", minLength: 1, maxLength: 500 },
    targetPhrase: { type: "string", minLength: 2, maxLength: 64 },
    intent: { type: "string", enum: ["push", "deflect", "align"] },
    score: { type: "number", minimum: 0, maximum: 1 },
    result: { type: "string", enum: ["pass", "near", "miss"] },
    tip: { type: "string", minLength: 4, maxLength: 180 },
    subtitle: { type: "string", minLength: 4, maxLength: 140 },
    multiplier: { type: "number", minimum: 0, maximum: 1.25 },
  },
} as const;
