"use client";

import { cn } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Allotment } from "allotment";
import { api } from "../../../../convex/_generated/api";
import { Code2Icon, EyeIcon, SquareTerminalIcon } from "lucide-react";
import { FileExplorer } from "./file-explorer";
import { EditorView } from "@/features/editor/components/editor-view";
import { PreviewView } from "./preview-view";
import { useProject } from "../hooks/use-project";
import { useWebContainer } from "@/features/preview/hooks/use-webcontainer";
import { useAgentCommands } from "@/features/preview/hooks/use-agent-commands";
import { BottomPanel, type BottomPanelTab } from "@/features/preview/components/bottom-panel";

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 240;
const DEFAULT_MAIN_SIZE = 1000;

type View = "editor" | "preview";

// Segmented control, like the "Models | Agents" switch in AI Studio
const ViewToggle = ({
  value,
  onChange,
}: {
  value: View;
  onChange: (value: View) => void;
}) => {
  const options: { value: View; label: string; icon: React.ReactNode }[] = [
    { value: "editor", label: "Code", icon: <Code2Icon className="size-3.5" /> },
    { value: "preview", label: "Preview", icon: <EyeIcon className="size-3.5" /> },
  ];

  return (
    <div className="inline-flex items-center rounded-full bg-surface border p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-1.5 h-7 px-3.5 rounded-full text-[13px] transition-colors",
            value === option.value
              ? "bg-accent text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
};

export const ProjectIdView = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const [activeView, setActiveView] = useState<View>("editor");
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<BottomPanelTab>("terminal");

  const project = useProject(projectId);
  // One WebContainer per project, shared by the preview, the terminal and agent commands
  const webcontainer = useWebContainer({
    projectId,
    enabled: true,
    settings: project?.settings,
  });

  // Show the Output tab while the agent runs a command
  const handleAgentCommandStart = useCallback(() => {
    setPanelOpen(true);
    setPanelTab("output");
  }, []);

  // When the agent finishes, refresh the preview so it shows the final work
  const agentBusy = useQuery(api.conversations.isProjectBusy, { projectId }) ?? false;
  const [agentFinishedCount, setAgentFinishedCount] = useState(0);
  const [previousAgentBusy, setPreviousAgentBusy] = useState(agentBusy);
  if (agentBusy !== previousAgentBusy) {
    setPreviousAgentBusy(agentBusy);
    if (previousAgentBusy && !agentBusy) {
      setAgentFinishedCount((count) => count + 1);
    }
  }

  const { refreshAfterAgent } = webcontainer;
  useEffect(() => {
    if (agentFinishedCount === 0) return;
    // Short delay so the agent's last file writes reach the browser first
    const timer = setTimeout(() => refreshAfterAgent(), 800);
    return () => clearTimeout(timer);
  }, [agentFinishedCount, refreshAfterAgent]);

  useAgentCommands({
    projectId,
    container: webcontainer.container,
    waitForSync: webcontainer.waitForSync,
    appendOutput: webcontainer.appendOutput,
    onCommandStart: handleAgentCommandStart,
  });

  // Ctrl+` toggles the bottom panel, like VS Code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "`") {
        e.preventDefault();
        setPanelOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b">
        <ViewToggle value={activeView} onChange={setActiveView} />
        <button
          type="button"
          onClick={() => setPanelOpen((value) => !value)}
          className={cn(
            "ml-auto flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] transition-colors",
            panelOpen
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          title="Toggle terminal (Ctrl+`)"
        >
          <SquareTerminalIcon className="size-4" />
          Terminal
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <Allotment vertical>
          <Allotment.Pane>
            <div className="h-full relative">
              <div
                className={cn(
                  "absolute inset-0",
                  activeView === "editor" ? "visible" : "invisible"
                )}
              >
                <Allotment defaultSizes={[DEFAULT_SIDEBAR_WIDTH, DEFAULT_MAIN_SIZE]}>
                  <Allotment.Pane
                    snap
                    minSize={MIN_SIDEBAR_WIDTH}
                    maxSize={MAX_SIDEBAR_WIDTH}
                    preferredSize={DEFAULT_SIDEBAR_WIDTH}
                  >
                    <FileExplorer projectId={projectId} />
                  </Allotment.Pane>
                  <Allotment.Pane>
                    <EditorView projectId={projectId} />
                  </Allotment.Pane>
                </Allotment>
              </div>

              <div
                className={cn(
                  "absolute inset-0",
                  activeView === "preview" ? "visible" : "invisible"
                )}
              >
                <PreviewView
                  projectId={projectId}
                  webcontainer={webcontainer}
                  active={activeView === "preview"}
                  refreshToken={agentFinishedCount}
                />
              </div>
            </div>
          </Allotment.Pane>

          <Allotment.Pane
            visible={panelOpen}
            minSize={120}
            maxSize={600}
            preferredSize={230}
          >
            <BottomPanel
              webcontainer={webcontainer}
              tab={panelTab}
              onTabChange={setPanelTab}
              onClose={() => setPanelOpen(false)}
            />
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
};
