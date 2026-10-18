// Models the coding agent can use. Safe to import on the client and the server.

export type AiProvider = "google" | "groq" | "custom";

export interface AiModelInfo {
  id: string;
  label: string;
  provider: AiProvider;
  description: string;
}

export const AI_MODELS: AiModelInfo[] = [
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast and free. The default.",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "google",
    description: "Smarter but slower, with a smaller free quota.",
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    provider: "groq",
    description: "Free on Groq and very fast.",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "groq",
    description: "Free on Groq, stronger reasoning.",
  },
  {
    id: "custom",
    label: "My model",
    provider: "custom",
    description: "Your own model behind an OpenAI-compatible API (Ollama, vLLM, LM Studio…).",
  },
];

export const DEFAULT_MODEL_ID = "gemini-2.5-flash";

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
