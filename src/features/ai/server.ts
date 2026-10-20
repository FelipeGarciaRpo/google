// Server-only: builds AgentKit models from env keys. Never import this in client components.
import { gemini, openai } from "@inngest/agent-kit";

import {
  AI_MODELS,
  type AiProvider,
  type AvailableAiModel,
  getModelInfo,
  isModelId,
} from "./models";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/";

// Free models tried, in this order, after the chosen one fails.
// Groq first: more free requests per day; Gemini catches Groq's per-minute token limit.
const FALLBACK_ORDER = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "gemini-2.5-flash",
];

export const isProviderConfigured = (provider: AiProvider) => {
  switch (provider) {
    case "google":
      return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    case "groq":
      return Boolean(process.env.GROQ_API_KEY);
    case "custom":
      return Boolean(process.env.CUSTOM_AI_BASE_URL && process.env.CUSTOM_AI_MODEL);
  }
};

export const getModelLabel = (id: string) => {
  const info = getModelInfo(id);
  if (!info) return id;
  if (info.provider === "custom") return process.env.CUSTOM_AI_LABEL || info.label;
  return info.label;
};

export const getAvailableModels = (): AvailableAiModel[] =>
  AI_MODELS.map((model) => ({
    ...model,
    label: getModelLabel(model.id),
    available: isProviderConfigured(model.provider),
  }));

// The chosen model first, then the configured free fallbacks (never the custom model)
export const getModelChain = (preferred: unknown): string[] => {
  const candidates = [isModelId(preferred) ? preferred : FALLBACK_ORDER[0], ...FALLBACK_ORDER];

  return [...new Set(candidates)].filter((id) => {
    const info = getModelInfo(id);
    return info !== undefined && isProviderConfigured(info.provider);
  });
};

export const createAgentModel = (id: string) => {
  const info = getModelInfo(id);

  switch (info?.provider) {
    case "google":
      return gemini({
        model: info.id,
        // AgentKit looks for GEMINI_API_KEY by default; reuse the AI SDK key instead
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
    case "groq":
      return openai({
        model: info.id,
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: GROQ_BASE_URL,
      });
    case "custom":
      return openai({
        model: process.env.CUSTOM_AI_MODEL ?? "",
        // Local servers like Ollama ignore the key, but the header must not be empty
        apiKey: process.env.CUSTOM_AI_API_KEY || "not-needed",
        baseUrl: process.env.CUSTOM_AI_BASE_URL,
      });
    default:
      throw new Error(`Unknown model "${id}"`);
  }
};

// Gemini uses its own schema format; OpenAI-compatible servers (Groq, Ollama…)
// often reject "strict" tool schemas with optional fields, so turn it off there
export const usesStrictTools = (id: string) => getModelInfo(id)?.provider === "google";
