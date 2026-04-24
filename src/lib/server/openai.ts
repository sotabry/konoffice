import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

export function getTextModel() {
  return process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini";
}

export function getTranscriptionModel() {
  return process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe";
}

export function extractOutputText(response: unknown) {
  if (typeof response !== "object" || response === null) {
    return "";
  }

  const direct = (response as { output_text?: unknown }).output_text;
  if (typeof direct === "string") {
    return direct;
  }

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      if (typeof item !== "object" || item === null) {
        return [];
      }
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) {
        return [];
      }
      return content.flatMap((part) => {
        if (typeof part !== "object" || part === null) {
          return [];
        }
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? [text] : [];
      });
    })
    .join("");
}

export async function transcribeAudio(file: File) {
  const client = getOpenAIClient();
  if (!client) {
    return "";
  }

  const transcription = await client.audio.transcriptions.create({
    file,
    model: getTranscriptionModel(),
  });

  return transcription.text;
}

export function parseJsonOutput(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("OpenAI returned an empty response.");
  }
  return JSON.parse(trimmed) as unknown;
}
