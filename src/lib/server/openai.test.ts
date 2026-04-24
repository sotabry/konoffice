import { describe, expect, it } from "vitest";
import { extractOutputText, parseJsonOutput } from "@/lib/server/openai";

describe("OpenAI helpers", () => {
  it("extracts direct output_text", () => {
    expect(extractOutputText({ output_text: "{\"ok\":true}" })).toBe("{\"ok\":true}");
  });

  it("extracts nested text output", () => {
    expect(
      extractOutputText({
        output: [
          {
            content: [{ text: "{\"intent\":\"push\"}" }],
          },
        ],
      }),
    ).toBe("{\"intent\":\"push\"}");
  });

  it("parses JSON output", () => {
    expect(parseJsonOutput("{\"confidence\":0.9}")).toEqual({ confidence: 0.9 });
  });
});
