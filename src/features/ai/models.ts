// Models the coding agent can use. Safe to import on the client and the server.

export type AiProvider = "google" | "groq" | "custom";

export interface AiModelInfo {
  id: string;
  label: string;
  provider: AiProvider;
  description: string;
}

// Order matters: the selector lists them like this, and when the chosen
// model is not configured the first available one is used
export const AI_MODELS: AiModelInfo[] = [
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "groq",
    description: "Free on Groq, 1,000 requests a day. The default.",
  },
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    provider: "groq",
    description: "Free on Groq and very fast.",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast, with a smaller free quota.",
  },
  {
    id: "custom",
    label: "My model",
    provider: "custom",
    description: "Your own model behind an OpenAI-compatible API.",
  },
];

export const DEFAULT_MODEL_ID = "openai/gpt-oss-120b";

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  google: "Google",
  groq: "Groq",
  custom: "Custom",
};

export const getModelInfo = (id: string) => AI_MODELS.find((model) => model.id === id);

export const isModelId = (id: unknown): id is string =>
  typeof id === "string" && AI_MODELS.some((model) => model.id === id);

// Shape returned by GET /api/models
export interface AvailableAiModel extends AiModelInfo {
  available: boolean;
}
