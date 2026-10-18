"use client";

import { BrandMark } from "@/components/brand";
import { ParticleField } from "@/components/particle-field";

interface LandingShellProps {
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

// Full-screen backdrop for the landing: particles, a soft glow and a minimal top bar
export const LandingShell = ({ headerActions, children }: LandingShellProps) => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="absolute inset-0 h-[100vh]">
        <ParticleField />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[18vh] size-[min(720px,90vw)] -translate-x-1/2 rounded-full opacity-[0.18] blur-[120px] dark:opacity-25"
        style={{ background: "radial-gradient(circle, var(--brand-from), var(--brand-to) 55%, transparent 70%)" }}
      />

      <header className="relative z-10 h-16 px-5 sm:px-8 flex items-center justify-between">
        <BrandMark />
        <div className="flex items-center gap-1.5">{headerActions}</div>
      </header>

      <main className="relative z-10">{children}</main>
    </div>
  );
};

export const LandingHeadline = () => {
  return (
    <div className="flex flex-col items-center text-center animate-fade-in-up">
      <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
        AI app builder · runs in your browser
      </span>
      <h1 className="mt-6 text-[clamp(2.6rem,7vw,5.2rem)] font-medium leading-[1.02] tracking-[-0.035em]">
        Build apps at
        <br />
        <span className="text-brand-gradient">the speed of thought.</span>
      </h1>
      <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground text-balance">
        Describe it. Telemetry Studio writes the code, runs it live
        and ships it to GitHub.
      </p>
    </div>
  );
};

export const LANDING_SUGGESTIONS = [
  { label: "Pomodoro timer", prompt: "Build a pomodoro timer with start, pause, reset and a session counter using Vite + React." },
  { label: "Markdown notes", prompt: "Build a markdown notes app with a live preview and local storage using Vite + React." },
  { label: "Snake game", prompt: "Build a playable Snake game with score and restart using Vite + React and a canvas." },
  { label: "Weather card", prompt: "Build a weather card UI with a 5-day forecast using mock data and Vite + React." },
];
