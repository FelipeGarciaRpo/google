"use client";

import { useEffect, useState } from "react";
import { CheckIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";

import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";

import { Doc } from "../../../../convex/_generated/dataModel";

type Activity = NonNullable<Doc<"messages">["activity"]>;

// How much each kind of step moves the bar
const WEIGHTS: Record<Activity[number]["kind"], number> = {
  start: 1,
  explore: 1,
  read: 1,
  write: 2,
  command: 3,
  info: 0,
};

// There's no way to know how many steps the agent will take, so the estimate
// grows with every step and slows down near the end. It only reaches 100% when
// the agent is actually done.
export const estimateProgress = (activity: Activity) => {
  const score = activity.reduce((sum, step) => sum + WEIGHTS[step.kind], 0);
  return Math.min(95, Math.round(4 + 91 * (1 - Math.exp(-score / 12))));
};

const formatDuration = (ms: number) => {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

// Ticks every second so the elapsed time stays live
const useNow = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
};

interface AgentProgressProps {
  activity: Activity;
  startedAt: number;
}

// Live card shown while the agent works: estimate, current step and recent steps
export const AgentProgress = ({ activity, startedAt }: AgentProgressProps) => {
  const now = useNow();
  const percent = estimateProgress(activity);
  const current = activity.at(-1)?.label ?? "Getting started";
  const recent = activity.slice(-5);

  // Restore the tab title once the agent is done (this card unmounts)
  useEffect(() => {
    const previous = document.title;
    return () => {
      document.title = previous;
    };
  }, []);

  // Progress in the browser tab, visible from other tabs
  useEffect(() => {
    document.title = `(${percent}%) Working… · Telemetry Studio`;
  }, [percent]);

  return (
    <div className="w-full flex flex-col gap-3 rounded-xl border bg-card p-3.5">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <Shimmer as="span" className="text-sm truncate">{`${current}…`}</Shimmer>
        <span className="shrink-0 text-xs font-medium tabular-nums text-primary">{percent}%</span>
      </div>

      <div
        className="h-1.5 rounded-full bg-accent overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {recent.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {recent.map((step, index) => {
            const isCurrent = index === recent.length - 1;
            return (
              <li key={`${step.at}-${index}`} className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                {isCurrent
                  ? <Loader2Icon className="size-3.5 shrink-0 animate-spin text-primary" />
                  : <CheckIcon className="size-3.5 shrink-0 text-emerald-500" />}
                <span className={cn("truncate", isCurrent && "text-foreground")}>{step.label}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {activity.length} {activity.length === 1 ? "step" : "steps"} · {formatDuration(now - startedAt)}
        </span>
        <span>You can leave this page, the agent keeps working.</span>
      </div>
    </div>
  );
};

interface AgentStepsProps {
  activity: Activity;
  startedAt: number;
  completedAt?: number;
}

// Collapsible summary of what the agent did, above its final answer
export const AgentSteps = ({ activity, startedAt, completedAt }: AgentStepsProps) => {
  if (activity.length === 0) return null;

  return (
    <details className="group text-xs text-muted-foreground">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon className="size-3.5 transition-transform group-open:rotate-90" />
        {completedAt ? `Worked for ${formatDuration(completedAt - startedAt)} · ` : ""}
        {activity.length} {activity.length === 1 ? "step" : "steps"}
      </summary>
      <ul className="mt-2 ml-1.5 flex flex-col gap-1 border-l pl-3">
        {activity.map((step, index) => (
          <li key={`${step.at}-${index}`} className="truncate">{step.label}</li>
        ))}
      </ul>
    </details>
  );
};
