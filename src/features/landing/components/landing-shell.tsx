"use client";

import { BrandMark } from "@/components/brand";
import { cn } from "@/lib/utils";

interface LandingShellProps {
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

// Page frame for the landing and the signed-in home: plain background and a minimal top bar
export const LandingShell = ({ headerActions, children }: LandingShellProps) => {
  return (
    // overflow-x-clip: the landing's product shot runs past the right edge on wide screens
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
      <header className="mx-auto flex h-16 w-full max-w-336 shrink-0 items-center justify-between px-5 sm:px-8">
        <BrandMark />
        <div className="flex items-center gap-1.5">{headerActions}</div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
};

interface LandingHeadlineProps {
  // The landing sets it beside the product shot; the signed-in home centers it
  align?: "start" | "center";
}

export const LandingHeadline = ({ align = "start" }: LandingHeadlineProps) => {
  return (
    <div
      className={cn(
        "flex flex-col animate-fade-in-up",
        align === "center" ? "items-center text-center" : "items-start"
      )}
    >
      <h1 className="text-[clamp(2.5rem,5.6vw,3.75rem)] font-medium leading-[1.04] tracking-[-0.035em]">
        Describe an app.
        <br />
        Watch it get built.
      </h1>
      <p className="mt-5 max-w-130 text-base sm:text-[1.1875rem] leading-normal text-muted-foreground text-pretty">
        Telemetry Studio writes the code, runs it in your browser and shows you
        every step. When you like it, download it or export it to GitHub.
      </p>
    </div>
  );
};

const LANDING_SUGGESTIONS = [
  { label: "Pomodoro timer", prompt: "Build a pomodoro timer with start, pause, reset and a session counter using Vite + React." },
  { label: "Markdown notes", prompt: "Build a markdown notes app with a live preview and local storage using Vite + React." },
  { label: "Snake game", prompt: "Build a playable Snake game with score and restart using Vite + React and a canvas." },
  { label: "Weather card", prompt: "Build a weather card UI with a 5-day forecast using mock data and Vite + React." },
];

interface LandingSuggestionsProps {
  onPick: (prompt: string) => void;
  className?: string;
}

// Starting ideas under the prompt box: picking one fills the prompt
export const LandingSuggestions = ({ onPick, className }: LandingSuggestionsProps) => {
  return (
    <div className={cn("flex flex-wrap gap-2 animate-fade-in-up [animation-delay:120ms]", className)}>
      {LANDING_SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion.label}
          type="button"
          onClick={() => onPick(suggestion.prompt)}
          className="h-9 px-3.5 rounded-full border text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
};
