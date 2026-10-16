"use client";

import { cn } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { Allotment } from "allotment";
import { Code2Icon, EyeIcon } from "lucide-react";
import { FileExplorer } from "./file-explorer";
import { EditorView } from "@/features/editor/components/editor-view";
import { PreviewView } from "./preview-view";

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

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 shrink-0 flex items-center px-3 border-b">
        <ViewToggle value={activeView} onChange={setActiveView} />
      </div>

      <div className="flex-1 relative">
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
          <PreviewView projectId={projectId}/>
        </div>
      </div>
    </div>
  );
};
