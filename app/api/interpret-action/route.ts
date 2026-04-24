import { NextResponse } from "next/server";
import { scorePhraseAttempt } from "@/lib/phrase-scoring";
import { intentSchema, phraseAttemptSchema } from "@/lib/schemas";
import { getOpenAIClient, transcribeAudio } from "@/lib/server/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  const actionText = String(formData.get("actionText") ?? "").trim();
  const targetPhrase = String(formData.get("targetPhrase") ?? "").trim();
  const successSubtitle = String(formData.get("successSubtitle") ?? "").trim();
  const intent = intentSchema.parse(String(formData.get("intent") ?? ""));
  const client = getOpenAIClient();
  const hasAudio = audio instanceof File && audio.size > 0;

  let transcript = actionText;
  let warning: string | undefined;

  if (hasAudio) {
    if (!client) {
      warning = "Audio transcription requires OPENAI_API_KEY. Use typed phrase fallback.";
      transcript = actionText || "";
    } else {
      try {
        transcript = await transcribeAudio(audio);
      } catch (error) {
        warning = error instanceof Error ? error.message : "Unable to transcribe audio.";
        transcript = actionText || "";
      }
    }
  }

  if (!targetPhrase) {
    return NextResponse.json({ error: "targetPhrase is required." }, { status: 400 });
  }

  const attempt = phraseAttemptSchema.parse(
    scorePhraseAttempt({
      transcript,
      targetPhrase,
      intent,
      successSubtitle,
    }),
  );

  return NextResponse.json({
    attempt,
    usedFallback: !client || !hasAudio,
    warning,
  });
}
