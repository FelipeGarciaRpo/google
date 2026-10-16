"use client";

import {
  Loader2Icon,
  AlertTriangleIcon,
  RefreshCwIcon,
  PackageIcon,
  GlobeIcon,
} from "lucide-react";

import type { WebContainerState } from "@/features/preview/hooks/use-webcontainer";
import { PreviewSettingsPopover } from "@/features/preview/components/preview-settings-popover";

import { Button } from "@/components/ui/button";

import { useProject } from "../hooks/use-project";

import { Id } from "../../../../convex/_generated/dataModel";

interface PreviewViewProps {
  projectId: Id<"projects">;
  webcontainer: WebContainerState;
}

export const PreviewView = ({ projectId, webcontainer }: PreviewViewProps) => {
  const project = useProject(projectId);
  const { status, previewUrl, error, restart } = webcontainer;

  const isLoading = status === "booting" || status === "installing";

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-11 shrink-0 flex items-center gap-2 px-2 border-b">
        <Button
          size="icon-sm"
          variant="ghost"
          className="rounded-full"
          disabled={isLoading}
          onClick={restart}
          title="Restart container"
        >
          <RefreshCwIcon className="size-3.5" />
        </Button>

        <div className="flex-1 min-w-0 h-7 flex items-center gap-2 px-3 rounded-full bg-surface border text-xs text-muted-foreground font-mono">
          <GlobeIcon className="size-3.5 shrink-0" />
          {isLoading && (
            <span className="flex items-center gap-1.5">
              <Loader2Icon className="size-3 animate-spin" />
              {status === "booting" ? "Starting..." : "Installing..."}
            </span>
          )}
          {previewUrl && <span className="truncate">{previewUrl}</span>}
          {!isLoading && !previewUrl && !error && (
            <span>{status === "waiting" ? "Waiting for package.json" : "Ready to preview"}</span>
          )}
          {error && !previewUrl && <span className="truncate text-destructive">{error}</span>}
        </div>

        <PreviewSettingsPopover
          projectId={projectId}
          initialValues={project?.settings}
          onSave={restart}
        />
      </div>

      <div className="flex-1 min-h-0">
        {error && (
          <div className="size-full flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
              <AlertTriangleIcon className="size-6" />
              <p className="text-sm font-medium">{error}</p>
              <p className="text-xs">Check the Logs tab in the bottom panel for details.</p>
              <Button size="sm" variant="outline" className="rounded-full" onClick={restart}>
                <RefreshCwIcon className="size-4" />
                Restart
              </Button>
            </div>
          </div>
        )}

        {isLoading && !error && (
          <div className="size-full flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
              <Loader2Icon className="size-6 animate-spin" />
              <p className="text-sm font-medium">
                {status === "booting" ? "Starting environment..." : "Installing dependencies..."}
              </p>
            </div>
          </div>
        )}

        {status === "waiting" && !error && (
          <div className="size-full flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2 max-w-sm mx-auto text-center">
              <PackageIcon className="size-6" />
              <p className="text-sm font-medium">No package.json yet</p>
              <p className="text-xs">
                Ask the agent to build an app. The preview starts by itself once the project has a package.json.
              </p>
            </div>
          </div>
        )}

        {previewUrl && (
          <iframe
            src={previewUrl}
            className="size-full border-0 bg-white"
            title="Preview"
          />
        )}
      </div>
    </div>
  );
};
