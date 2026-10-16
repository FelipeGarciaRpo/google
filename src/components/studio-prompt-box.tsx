"use client";

import { useEffect, useRef } from "react";
import { CornerDownLeftIcon, SquareIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StudioPromptBoxProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (text: string) => void;
  placeholder?: string;
  submitLabel?: string;
  disabled?: boolean;
  // While the AI is working the button turns into "Stop"
  isProcessing?: boolean;
  onStop?: () => void;
  size?: "default" | "lg";
  autoFocus?: boolean;
  // Extra controls rendered at the bottom left (chips, import button…)
  toolbar?: React.ReactNode;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  className?: string;
}

// Prompt box modeled on the AI Studio "Start typing a prompt" composer
export const StudioPromptBox = ({
  value,
  onValueChange,
  onSubmit,
  placeholder = "Start typing a prompt",
  submitLabel = "Run",
  disabled = false,
  isProcessing = false,
  onStop,
  size = "default",
  autoFocus = false,
  toolbar,
  textareaRef,
  className,
}: StudioPromptBoxProps) => {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? innerRef;

  const maxHeight = size === "lg" ? 260 : 200;
  const canSubmit = !disabled && value.trim().length > 0;

  // Grow with the content up to maxHeight
  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight, ref]);

  const submit = () => {
    if (isProcessing) {
      onStop?.();
      return;
    }
    if (!canSubmit) return;
    onSubmit(value.trim());
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        "group/prompt w-full rounded-[22px] border bg-surface transition-colors",
        "focus-within:border-input",
        size === "lg" ? "p-3 shadow-[0_8px_40px_-12px_rgb(0_0_0/0.45)]" : "p-2.5",
        className
      )}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter adds a new line
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={size === "lg" ? 2 : 1}
        className={cn(
          "w-full resize-none bg-transparent px-2 outline-none! placeholder:text-muted-foreground",
          "disabled:opacity-60",
          size === "lg" ? "pt-1.5 text-base" : "pt-1 text-sm"
        )}
      />
      <div className="flex items-center gap-2 pt-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">{toolbar}</div>
        <button
          type="submit"
          disabled={!isProcessing && !canSubmit}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 rounded-full px-3.5 text-sm font-medium transition-colors",
            isProcessing
              ? "bg-foreground text-background hover:opacity-90"
              : canSubmit
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "border text-muted-foreground cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <>
              <SquareIcon className="size-3 fill-current" />
              Stop
            </>
          ) : (
            <>
              {submitLabel}
              <CornerDownLeftIcon className="size-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
