"use client";

import { ScrollTextIcon, SquareTerminalIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { WebContainerState } from "../hooks/use-webcontainer";
import { InteractiveTerminal } from "./interactive-terminal";
import { PreviewTerminal } from "./preview-terminal";

export type BottomPanelTab = "terminal" | "output";

interface BottomPanelProps {
  webcontainer: WebContainerState;
  tab: BottomPanelTab;
  onTabChange: (tab: BottomPanelTab) => void;
  onClose: () => void;
}

const TABS: {
  value: BottomPanelTab;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "terminal",
    label: "Terminal",
    hint: "Your own shell in the project sandbox. Type commands here.",
    icon: <SquareTerminalIcon className="size-3.5" />,
  },
  {
    value: "output",
    label: "Output",
    hint: "Read only: npm install, the dev server and the commands the agent runs.",
    icon: <ScrollTextIcon className="size-3.5" />,
  },
];

// VS Code style bottom panel: your interactive shell + what the app runs by itself
export const BottomPanel = ({
  webcontainer,
  tab,
  onTabChange,
  onClose,
}: BottomPanelProps) => {
  const activeHint = TABS.find((item) => item.value === tab)?.hint;

  return (
    <div className="h-full flex flex-col bg-[#1b1c1d] text-neutral-300">
      <div className="h-9 shrink-0 flex items-center gap-1 px-2 border-b border-white/10">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onTabChange(item.value)}
            title={item.hint}
            className={cn(
              "flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs transition-colors",
              tab === item.value
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-white"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
        <span className="ml-3 hidden lg:block truncate text-[11px] text-neutral-500">
          {activeHint}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto size-7 shrink-0 inline-flex items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-white"
          title="Close panel (Ctrl+`)"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      {/* Both stay mounted so the shell session and the output survive tab switches */}
      <div className="flex-1 min-h-0 relative">
        <div className={cn("absolute inset-0", tab === "terminal" ? "visible" : "invisible")}>
          <InteractiveTerminal container={webcontainer.container} />
        </div>
        <div className={cn("absolute inset-0 flex flex-col", tab === "output" ? "visible" : "invisible")}>
          <PreviewTerminal output={webcontainer.terminalOutput} />
        </div>
      </div>
    </div>
  );
};
