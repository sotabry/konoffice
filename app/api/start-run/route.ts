import { NextResponse } from "next/server";
import { createFallbackRun } from "@/lib/fallback-run";
import { runSpecJsonSchema, runSpecSchema } from "@/lib/schemas";
import {
  extractOutputText,
  getOpenAIClient,
  getTextModel,
  parseJsonOutput,
  transcribeAudio,
} from "@/lib/server/openai";

export const runtime = "nodejs";

const defaultPrompt =
  "A tired mushroom office worker has to survive a day of impossible meetings.";

export async function POST(request: Request) {
  const formData = await request.formData();
  const promptText = String(formData.get("promptText") ?? "").trim();
  const audio = formData.get("audio");
  const hasAudio = audio instanceof File && audio.size > 0;
  const client = getOpenAIClient();

  let transcript = promptText;
  if (client && hasAudio) {
    transcript = await transcribeAudio(audio);
  }

  const prompt = transcript.trim() || defaultPrompt;

  if (!client) {
    return NextResponse.json({
      run: createFallbackRun(prompt),
      transcript: prompt,
      usedFallback: true,
    });
  }

  try {
    const response = await client.responses.create({
      model: getTextModel(),
      input: [
        {
          role: "system",
          content:
            "Generate a short, playable satire roguelike run. Keep it cozy, corporate, mushroom-themed, concise, and safe for a workplace comedy game. Each floor must include workplace English practice phrases for push, deflect, and align. Use natural business English. Floor 1 phrases should be 2-3 words, floor 2 phrases 3-4 words, and the boss floor phrases 4-5 words.",
        },
        {
          role: "user",
          content: `Create a 3-encounter konoffice run from this player prompt: ${prompt}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "konoffice_run_spec",
          strict: true,
          schema: runSpecJsonSchema,
        },
      },
    } as never);
    const parsed = runSpecSchema.parse(parseJsonOutput(extractOutputText(response)));

    return NextResponse.json({
      run: parsed,
      transcript: prompt,
      usedFallback: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI error.";
    return NextResponse.json(
      {
        run: createFallbackRun(prompt),
        transcript: prompt,
        usedFallback: true,
        warning: message,
      },
      { status: 200 },
    );
  }
}
