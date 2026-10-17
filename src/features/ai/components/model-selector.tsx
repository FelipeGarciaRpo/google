"use client";

import { CheckIcon, ChevronDownIcon, Loader2Icon, SparklesIcon } from "lucide-react";

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

import { type AiProvider, getModelInfo, PROVIDER_LABELS } from "../models";
import { useAvailableModels } from "../hooks/use-available-models";

const PROVIDERS: AiProvider[] = ["groq", "google", "custom"];

interface ModelSelectorProps {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

// Model picker for the agent, like Claude Code's /model or AI Studio's model menu
export const ModelSelector = ({ value, onChange, className }: ModelSelectorProps) => {
  const availableModels = useAvailableModels();
  // Only configured models are offered
  const models = availableModels?.filter((model) => model.available) ?? null;

  // A saved choice that is no longer configured falls back to the first available
  // model, which is also what the server uses
  const current =
    models?.find((model) => model.id === value) ??
    models?.[0] ??
    getModelInfo(value);

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
          <span className="truncate">{current?.label ?? "Model"}</span>
          <ChevronDownIcon className="size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-72 rounded-xl p-1.5">
        {models === null ? (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
            <Loader2Icon className="size-3.5 animate-spin" />
            Loading models…
          </div>
        ) : (
          PROVIDERS.map((provider) => {
            const providerModels = models.filter((model) => model.provider === provider);
            if (providerModels.length === 0) return null;

            return (
              <DropdownMenuGroup key={provider}>
                <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {PROVIDER_LABELS[provider]}
                </DropdownMenuLabel>
                {providerModels.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onSelect={() => onChange(model.id)}
                    className="items-start gap-2.5 rounded-lg py-2"
                  >
                    <CheckIcon
                      className={cn(
                        "size-4 mt-0.5 text-primary",
                        model.id === current?.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm">{model.label}</span>
                      <span className="block text-xs text-muted-foreground">{model.description}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            );
          })
        )}
        {models !== null && models.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <p className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
              If the model fails or hits its limit, the agent retries with the next free model.
            </p>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
