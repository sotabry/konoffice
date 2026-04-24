import type { RunSpec } from "@/lib/schemas";

export function createFallbackRun(prompt = "survive a normal workday"): RunSpec {
  const cleanPrompt = prompt.trim() || "survive a normal workday";

  return {
    runTitle: "Quarterly Alignment Dungeon",
    companyName: "konoffice",
    department: "Narrative Operations",
    crisis: `A routine sync has mutated into a full-company initiative about ${cleanPrompt}.`,
    intro:
      "Your badge chirps. The office lights dim. Three meetings stand between you and the end of the day.",
    player: {
      name: "Mina Mycelium",
      role: "Associate Synergy Witch",
      mushroomType: "Amanita analyst",
    },
    floors: [
      {
        name: "Standup Vestibule",
        roomType: "standup",
        objective: "Turn a vague blocker into something leadership can nod at.",
        enemyId: "scope-creep",
        eventText: "Sticky notes peel themselves from the wall and demand a broader mandate.",
        practicePhrases: createPracticePhrases("easy", "standup"),
      },
      {
        name: "Cross-Functional Sync Pit",
        roomType: "sync",
        objective: "Survive the agenda expanding in real time.",
        enemyId: "meeting-hydra",
        eventText: "Three calendar invites arrive before anyone explains why you are here.",
        practicePhrases: createPracticePhrases("medium", "sync"),
      },
      {
        name: "All-Hands Atrium",
        roomType: "allHands",
        objective: "Defeat ambiguity before it becomes the roadmap.",
        enemyId: "vp-ambiguity",
        eventText: "A teal banner descends: It's literally your job.",
        practicePhrases: createPracticePhrases("hard", "all-hands"),
      },
    ],
    enemies: [
      {
        id: "scope-creep",
        name: "Scope Creep Slime",
        type: "scopeCreepSlime",
        hp: 18,
        attack: 4,
        weaknessIntent: "align",
        flavor: "It smiles sweetly while adding three extra deliverables.",
      },
      {
        id: "meeting-hydra",
        name: "Meeting Hydra",
        type: "meetingHydra",
        hp: 24,
        attack: 5,
        weaknessIntent: "deflect",
        flavor: "Every head says this should only take five minutes.",
      },
    ],
    boss: {
      id: "vp-ambiguity",
      name: "VP of Ambiguity",
      type: "vpOfAmbiguity",
      hp: 34,
      attack: 7,
      weaknessIntent: "push",
      flavor: "A floating executive presence made entirely of roadmap fog.",
      title: "Executive Sponsor of Strategic Maybe",
      phases: ["Vision without nouns", "Accountability without owners"],
    },
    victoryText:
      "You achieve alignment, document the next steps, and escape before anyone schedules a follow-up.",
    deathText:
      "You are absorbed into an evergreen working group with no clear owner.",
    shareSummary:
      "Survived konoffice by weaponizing corporate language against the VP of Ambiguity.",
  };
}

function createPracticePhrases(difficulty: "easy" | "medium" | "hard", prefix: string) {
  if (difficulty === "easy") {
    return {
      push: [
        {
          id: `${prefix}-push-1`,
          intent: "push" as const,
          text: "drive progress",
          meaning: "Move the work forward.",
          difficulty,
          successSubtitle: "You turn a vague ask into visible motion.",
        },
      ],
      deflect: [
        {
          id: `${prefix}-deflect-1`,
          intent: "deflect" as const,
          text: "take it offline",
          meaning: "Move the discussion out of the current meeting.",
          difficulty,
          successSubtitle: "You move the danger into a harmless side thread.",
        },
      ],
      align: [
        {
          id: `${prefix}-align-1`,
          intent: "align" as const,
          text: "align on scope",
          meaning: "Agree on what is included and excluded.",
          difficulty,
          successSubtitle: "The room briefly understands the boundaries.",
        },
      ],
    };
  }

  if (difficulty === "medium") {
    return {
      push: [
        {
          id: `${prefix}-push-1`,
          intent: "push" as const,
          text: "drive the outcome",
          meaning: "Take active ownership of the result.",
          difficulty,
          successSubtitle: "You create enough momentum to bruise the agenda.",
        },
      ],
      deflect: [
        {
          id: `${prefix}-deflect-1`,
          intent: "deflect" as const,
          text: "protect our bandwidth",
          meaning: "Avoid accepting too much work at once.",
          difficulty,
          successSubtitle: "You preserve enough energy to survive the sync.",
        },
      ],
      align: [
        {
          id: `${prefix}-align-1`,
          intent: "align" as const,
          text: "create shared visibility",
          meaning: "Make the situation clear to everyone involved.",
          difficulty,
          successSubtitle: "Hidden blockers become visible on the meeting wall.",
        },
      ],
    };
  }

  return {
    push: [
      {
        id: `${prefix}-push-1`,
        intent: "push" as const,
        text: "accelerate the key deliverable",
        meaning: "Move the most important work forward quickly.",
        difficulty,
        successSubtitle: "The roadmap trembles under precise executive pressure.",
      },
    ],
    deflect: [
      {
        id: `${prefix}-deflect-1`,
        intent: "deflect" as const,
        text: "deprioritize the urgent request",
        meaning: "Reduce the importance of a request that claims to be urgent.",
        difficulty,
        successSubtitle: "The false emergency loses its calendar invite.",
      },
    ],
    align: [
      {
        id: `${prefix}-align-1`,
        intent: "align" as const,
        text: "clarify the decision owner",
        meaning: "Identify who is responsible for making the decision.",
        difficulty,
        successSubtitle: "The boss becomes vulnerable to accountability.",
      },
    ],
  };
}
