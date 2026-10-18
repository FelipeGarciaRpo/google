"use client";

import { CheckIcon, ChevronDownIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AI_MODELS, type AiProvider, PROVIDER_LABELS } from "../models";
import { useAvailableModels } from "../hooks/use-available-models";

const PROVIDERS: AiProvider[] = ["google", "groq", "custom"];

const SETUP_HINTS: Record<AiProvider, string> = {
  google: "Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local",
  groq: "Add a free GROQ_API_KEY to .env.local",
  custom: "Set CUSTOM_AI_BASE_URL and CUSTOM_AI_MODEL in .env.local",
};

interface ModelSelectorProps {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

// Model picker for the agent, like Claude Code's /model or AI Studio's model menu
export const ModelSelector = ({ value, onChange, className }: ModelSelectorProps) => {
  const availableModels = useAvailableModels();
  // Until /api/models answers, show the static list as available
  const models = availableModels ?? AI_MODELS.map((model) => ({ ...model, available: true }));
  const current = models.find((model) => model.id === value) ?? models[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 h-8 max-w-52 px-3 rounded-full border text-xs text-muted-foreground",
            "hover:bg-accent hover:text-foreground transition-colors data-[state=open]:bg-accent",
            className
          )}
          title="Choose the AI model"
        >
          <SparklesIcon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{current.label}</span>
          <ChevronDownIcon className="size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-80 rounded-xl p-1.5">
        {PROVIDERS.map((provider) => (
          <DropdownMenuGroup key={provider}>
            <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {PROVIDER_LABELS[provider]}
            </DropdownMenuLabel>
            {models
              .filter((model) => model.provider === provider)
              .map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  disabled={!model.available}
                  onSelect={() => onChange(model.id)}
                  className="items-start gap-2.5 rounded-lg py-2"
                >
                  <CheckIcon
                    className={cn(
                      "size-4 mt-0.5 text-primary",
                      model.id === current.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm">{model.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {model.available ? model.description : SETUP_HINTS[provider]}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
          </DropdownMenuGroup>
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
          If the model fails or hits its limit, the agent retries with the next free model.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
