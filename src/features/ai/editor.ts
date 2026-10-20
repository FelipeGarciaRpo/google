// Server-only: models for the editor's inline suggestions and quick edits.
// These run straight from API routes, and suggestions fire on every pause while
// typing, so they need fast answers and generous free limits: Groq first, Gemini
// only when Groq fails.
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import type { generateText } from "ai";

import { isProviderConfigured } from "./server";

type GenerateOptions = Parameters<typeof generateText>[0];

type EditorTask = "suggestion" | "quickEdit";

interface EditorModel {
  provider: "groq" | "google";
  id: string;
  providerOptions?: GenerateOptions["providerOptions"];
}

const EDITOR_MODELS: Record<EditorTask, EditorModel[]> = {
  // Its own free quota, so suggestions never use up the agent's GPT-OSS 120B requests
  suggestion: [
    { provider: "groq", id: "openai/gpt-oss-20b", providerOptions: { groq: { reasoningEffort: "low" } } },
    // Without thinking it answers in under a second
    { provider: "google", id: "gemini-2.5-flash", providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } } },
  ],
  // The user asked for this edit, so the smarter model is worth the extra second
  quickEdit: [
    { provider: "groq", id: "openai/gpt-oss-120b" },
    { provider: "google", id: "gemini-2.5-flash" },
  ],
};

// Tries each configured model in order, so a rate limit or outage on one
// provider falls through to the next instead of failing the request
export const withEditorModel = async <T>(
  task: EditorTask,
  run: (settings: Pick<GenerateOptions, "model" | "providerOptions">) => Promise<T>,
): Promise<T> => {
  let lastError: unknown = new Error("No AI provider is configured");

  for (const { provider, id, providerOptions } of EDITOR_MODELS[task]) {
    if (!isProviderConfigured(provider)) continue;

    try {
      return await run({
        model: provider === "groq" ? groq(id) : google(id),
        providerOptions,
      });
    } catch (error) {
      lastError = error;
      // Only the reason: the full error carries the request body, i.e. the user's code
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`Model ${id} failed, trying the next one: ${reason}`);
    }
  }

  throw lastError;
};
