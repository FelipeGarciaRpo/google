"use client";

import { ScrollTextIcon, SquareTerminalIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { WebContainerState } from "../hooks/use-webcontainer";
import { InteractiveTerminal } from "./interactive-terminal";
import { PreviewTerminal } from "./preview-terminal";

export type BottomPanelTab = "terminal" | "logs";

interface BottomPanelProps {
  webcontainer: WebContainerState;
  tab: BottomPanelTab;
  onTabChange: (tab: BottomPanelTab) => void;
  onClose: () => void;
}

const TABS: { value: BottomPanelTab; label: string; icon: React.ReactNode }[] = [
  { value: "terminal", label: "Terminal", icon: <SquareTerminalIcon className="size-3.5" /> },
  { value: "logs", label: "Logs", icon: <ScrollTextIcon className="size-3.5" /> },
];

// VS Code style bottom panel: interactive shell + dev server logs
export const BottomPanel = ({
  webcontainer,
  tab,
  onTabChange,
  onClose,
}: BottomPanelProps) => {
  return (
    <div className="h-full flex flex-col bg-[#1b1c1d] text-neutral-300">
      <div className="h-9 shrink-0 flex items-center gap-1 px-2 border-b border-white/10">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onTabChange(item.value)}
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
        <button
          type="button"
          onClick={onClose}
          className="ml-auto size-7 inline-flex items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-white"
          title="Close panel (Ctrl+`)"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      {/* Both stay mounted so the shell session and logs survive tab switches */}
      <div className="flex-1 min-h-0 relative">
        <div className={cn("absolute inset-0", tab === "terminal" ? "visible" : "invisible")}>
          <InteractiveTerminal container={webcontainer.container} />
        </div>
        <div className={cn("absolute inset-0 flex flex-col", tab === "logs" ? "visible" : "invisible")}>
          <PreviewTerminal output={webcontainer.terminalOutput} />
        </div>
      </div>
    </div>
  );
};
