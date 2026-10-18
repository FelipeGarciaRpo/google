"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Loader2Icon,
  AlertTriangleIcon,
  RefreshCwIcon,
  RotateCwIcon,
  PowerIcon,
  GlobeIcon,
  PlayIcon,
  SquareIcon,
  TerminalIcon,
  InfoIcon,
} from "lucide-react";

import type { WebContainerState } from "@/features/preview/hooks/use-webcontainer";
import { usePythonRunner } from "@/features/preview/hooks/use-python-runner";
import { getTextFilesByPath } from "@/features/preview/utils/detect-runtime";
import { PreviewSettingsPopover } from "@/features/preview/components/preview-settings-popover";
import { PreviewTerminal } from "@/features/preview/components/preview-terminal";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useProject } from "../hooks/use-project";
import { useFiles } from "../hooks/use-files";

import { Id } from "../../../../convex/_generated/dataModel";

interface PreviewViewProps {
  projectId: Id<"projects">;
  webcontainer: WebContainerState;
  // Whether the Preview tab is visible (Python only runs once it is)
  active: boolean;
  // Increases every time the agent finishes a task
  refreshToken: number;
}

const CenteredMessage = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) => (
  <div className="size-full flex items-center justify-center text-muted-foreground p-6">
    <div className="flex flex-col items-center gap-2 max-w-sm mx-auto text-center">
      {icon}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children}
    </div>
  </div>
);

// Program output, like a terminal, with the exit status underneath
const ConsoleOutput = ({
  output,
  statusText,
  failed,
}: {
  output: string;
  statusText: string | null;
  failed?: boolean;
}) => (
  <div className="size-full flex flex-col bg-[#1b1c1d]">
    <PreviewTerminal output={output} />
    {statusText && (
      <div className={cn(
        "h-8 shrink-0 flex items-center gap-2 px-4 border-t border-white/10 text-xs",
        failed ? "text-red-300" : "text-neutral-400"
      )}>
        <TerminalIcon className="size-3.5" />
        {statusText}
      </div>
    )}
  </div>
);

export const PreviewView = ({ projectId, webcontainer, active, refreshToken }: PreviewViewProps) => {
  const project = useProject(projectId);
  const files = useFiles(projectId);
  const python = usePythonRunner();
  const {
    status,
    previewUrl,
    previewKey,
    error,
    restart,
    rerun,
    reloadPreview,
    runtime,
    programOutput,
    exitCode,
  } = webcontainer;

  const runPythonProject = python.run;
  const runPython = useCallback(() => {
    if (runtime.kind !== "python" || !files) return;
    runPythonProject(getTextFilesByPath(files), runtime.entry);
  }, [runtime, files, runPythonProject]);

  // Run a Python project the first time its preview is shown
  const pythonStartedRef = useRef(false);
  useEffect(() => {
    if (!active || runtime.kind !== "python" || pythonStartedRef.current || !files) return;

    const timer = setTimeout(() => {
      pythonStartedRef.current = true;
      runPython();
    }, 0);
    return () => clearTimeout(timer);
  }, [active, runtime.kind, files, runPython]);

  // When the agent finishes, run the Python project again with its new code
  // (web and Node projects are refreshed by the WebContainer hook)
  const handledRefreshRef = useRef(refreshToken);
  useEffect(() => {
    if (refreshToken === handledRefreshRef.current || runtime.kind !== "python") return;

    if (!active) {
      // Run it the next time the preview is opened
      handledRefreshRef.current = refreshToken;
      pythonStartedRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      handledRefreshRef.current = refreshToken;
      runPython();
    }, 300);
    return () => clearTimeout(timer);
  }, [refreshToken, active, runtime.kind, runPython]);

  const isPython = runtime.kind === "python";
  const isLoading = status === "booting" || status === "installing";
  const isConsoleRun = !isPython && !previewUrl && (status === "starting" || status === "exited");
  const pythonBusy = python.state === "loading" || python.state === "running";

  const runtimeLabel = (() => {
    if (runtime.kind === "python") return `Python · ${runtime.entry}`;
    if (runtime.kind === "node" || runtime.kind === "static") return runtime.label;
    return null;
  })();

  const addressText = (() => {
    if (previewUrl) return previewUrl;
    if (isPython) {
      if (python.state === "loading") return "Loading Python…";
      if (python.state === "running") return "Running…";
      return "Console output";
    }
    if (status === "booting") return "Starting…";
    if (status === "installing") return "Installing dependencies…";
    if (status === "starting") return runtime.kind === "node" && runtime.web ? "Starting dev server…" : "Running…";
    if (status === "exited") return "Console output";
    if (status === "waiting") return "Nothing to run yet";
    return "Ready to preview";
  })();

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-11 shrink-0 flex items-center gap-2 px-2 border-b">
        {isPython ? (
          <Button
            size="sm"
            variant={pythonBusy ? "outline" : "default"}
            className="rounded-full h-7 px-3"
            onClick={pythonBusy ? python.stop : runPython}
            title={pythonBusy ? "Stop" : "Run"}
          >
            {pythonBusy ? <SquareIcon className="size-3 fill-current" /> : <PlayIcon className="size-3 fill-current" />}
            {pythonBusy ? "Stop" : "Run"}
          </Button>
        ) : isConsoleRun ? (
          <Button
            size="sm"
            className="rounded-full h-7 px-3"
            onClick={rerun}
            disabled={status === "starting" && !(runtime.kind === "node" && runtime.web)}
            title="Run again"
          >
            <PlayIcon className="size-3 fill-current" />
            Run
          </Button>
        ) : (
          <Button
            size="icon-sm"
            variant="ghost"
            className="rounded-full"
            disabled={!previewUrl}
            onClick={reloadPreview}
            title="Reload preview"
          >
            <RotateCwIcon className="size-3.5" />
          </Button>
        )}

        <div className="flex-1 min-w-0 h-7 flex items-center gap-2 px-3 rounded-full bg-surface border text-xs text-muted-foreground font-mono">
          {(isLoading || pythonBusy || status === "starting") && !previewUrl
            ? <Loader2Icon className="size-3.5 shrink-0 animate-spin" />
            : <GlobeIcon className="size-3.5 shrink-0" />}
          <span className="truncate">{addressText}</span>
        </div>

        {runtimeLabel && (
          <span className="hidden md:inline-flex shrink-0 items-center h-7 px-2.5 rounded-full border text-[11px] text-muted-foreground">
            {runtimeLabel}
          </span>
        )}

        {!isPython && (
          <Button
            size="icon-sm"
            variant="ghost"
            className="rounded-full"
            disabled={isLoading}
            onClick={restart}
            title="Restart environment (reinstall and start again)"
          >
            <PowerIcon className="size-3.5" />
          </Button>
        )}

        {!isPython && (
          <PreviewSettingsPopover
            projectId={projectId}
            initialValues={project?.settings}
            onSave={restart}
          />
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {isPython ? (
          <>
            {runtime.webFramework && (
              <div className="shrink-0 flex items-start gap-2 px-4 py-2.5 border-b bg-surface text-xs text-muted-foreground">
                <InfoIcon className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  {runtime.webFramework} needs a real web server, which the browser can&apos;t run.
                  The preview runs your script and shows its console output.
                </span>
              </div>
            )}
            {python.state === "idle" ? (
              <CenteredMessage icon={<PlayIcon className="size-6" />} title="Python project">
                <p className="text-xs">Press Run to execute {runtime.entry} in your browser with Pyodide.</p>
              </CenteredMessage>
            ) : (
              <ConsoleOutput
                output={python.output}
                failed={python.exitCode !== null && python.exitCode !== 0}
                statusText={
                  python.state === "exited"
                    ? `Process exited with code ${python.exitCode}`
                    : python.state === "loading" ? "Loading Python (first run downloads ~10 MB)…" : "Running…"
                }
              />
            )}
          </>
        ) : error ? (
          <CenteredMessage icon={<AlertTriangleIcon className="size-6" />} title={error}>
            <p className="text-xs">Check the Output tab in the bottom panel for details.</p>
            <Button size="sm" variant="outline" className="rounded-full" onClick={restart}>
              <RefreshCwIcon className="size-4" />
              Restart
            </Button>
          </CenteredMessage>
        ) : previewUrl ? (
          <iframe
            // A new key remounts the iframe: reload button and agent refreshes
            key={previewKey}
            src={previewUrl}
            className="size-full border-0 bg-white"
            title="Preview"
          />
        ) : isConsoleRun ? (
          <ConsoleOutput
            output={programOutput}
            failed={exitCode !== null && exitCode !== 0}
            statusText={
              status === "exited"
                ? `Process exited with code ${exitCode}`
                : runtime.kind === "node" && runtime.web
                  ? "Waiting for the dev server…"
                  : "Running…"
            }
          />
        ) : isLoading ? (
          <CenteredMessage
            icon={<Loader2Icon className="size-6 animate-spin" />}
            title={status === "booting" ? "Starting environment..." : "Installing dependencies..."}
          />
        ) : (
          <CenteredMessage icon={<TerminalIcon className="size-6" />} title="Nothing to run yet">
            <p className="text-xs">
              The preview runs JavaScript and TypeScript apps (React, Next.js, Angular, Vue, Node.js),
              plain HTML and Python scripts. Ask the agent to build one.
            </p>
          </CenteredMessage>
        )}
      </div>
    </div>
  );
};
