import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WebContainer, type WebContainerProcess } from "@webcontainer/api";

import {
  buildFileTree,
  getFilePath
} from "@/features/preview/utils/file-tree";
import { detectRuntime, type ProjectRuntime } from "@/features/preview/utils/detect-runtime";
import { useFiles } from "@/features/projects/hooks/use-files";

import { Id } from "../../../../convex/_generated/dataModel";

// Singleton WebContainer instance (the API allows one per page)
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let bootedForProject: string | null = null;

const teardownWebContainer = () => {
  if (webcontainerInstance) {
    webcontainerInstance.teardown();
    webcontainerInstance = null;
  }
  bootPromise = null;
  bootedForProject = null;
};

const getWebContainer = async (projectId: string): Promise<WebContainer> => {
  // A different project needs a clean file system and no leftover processes
  if (bootedForProject && bootedForProject !== projectId) {
    teardownWebContainer();
  }
  bootedForProject = projectId;

  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  if (!bootPromise) {
    bootPromise = WebContainer.boot({ coep: "credentialless" });
  }

  webcontainerInstance = await bootPromise;
  return webcontainerInstance;
};

// Keep tools from stopping on interactive prompts
const SPAWN_ENV = {
  npm_config_yes: true,
  NG_CLI_ANALYTICS: "false",
  NEXT_TELEMETRY_DISABLED: "1",
};

// Python runs with Pyodide in the preview, not in the WebContainer
const runsInContainer = (runtime: ProjectRuntime) =>
  runtime.kind === "node" || runtime.kind === "static";

export type WebContainerStatus =
  | "idle"
  | "booting"
  | "waiting" // booted, nothing the container can run yet
  | "installing"
  | "starting" // program running, no server yet
  | "running" // a server is up and the preview URL is ready
  | "exited" // the program finished (console apps)
  | "error";

interface UseWebContainerProps {
  projectId: Id<"projects">;
  enabled: boolean;
  settings?: {
    installCommand?: string;
    devCommand?: string;
  };
};

export const useWebContainer = ({
  projectId,
  enabled,
  settings,
}: UseWebContainerProps) => {
  const [status, setStatus] = useState<WebContainerStatus>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  // Everything (install + program), shown in the Logs tab
  const [terminalOutput, setTerminalOutput] = useState("");
  // Only the program's own output, shown as the console preview
  const [programOutput, setProgramOutput] = useState("");
  const [exitCode, setExitCode] = useState<number | null>(null);
  // Changing it remounts the preview iframe (a page reload)
  const [previewKey, setPreviewKey] = useState(0);
  // Exposed so the interactive terminal and agent commands can use it
  const [container, setContainer] = useState<WebContainer | null>(null);

  const containerRef = useRef<WebContainer | null>(null);
  const programRef = useRef<WebContainerProcess | null>(null);
  const statusRef = useRef(status);
  // Dependencies at the time of the last successful install
  const installedDepsRef = useRef<string | null>(null);
  const hasStartedRef = useRef(false);
  // path -> content already written to the container
  const syncedRef = useRef<Map<string, string>>(new Map());
  // Chain of file syncs, so they never overlap and callers can wait for the latest one
  const syncPromiseRef = useRef<Promise<void>>(Promise.resolve());

  // Fetch files from Convex (auto-updates on changes)
  const files = useFiles(projectId);
  const runtime = useMemo<ProjectRuntime>(
    () => (files ? detectRuntime(files) : { kind: "none" }),
    [files]
  );
  const runtimeRef = useRef(runtime);
  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const isRunnable = runsInContainer(runtime);

  const appendOutput = useCallback((data: string) => {
    setTerminalOutput((prev) => prev + data);
  }, []);

  // Start (or restart) the program without reinstalling dependencies
  const startProgram = useCallback(async (instance: WebContainer, target: ProjectRuntime) => {
    if (!runsInContainer(target)) return;

    const startCmd = (target.kind === "node" && settings?.devCommand) || target.start;

    programRef.current?.kill();
    setPreviewUrl(null);
    setExitCode(null);
    setProgramOutput(`\x1b[90m$ ${startCmd}\x1b[0m\n`);
    setStatus("starting");
    appendOutput(`\n$ ${startCmd}\n`);

    let proc: WebContainerProcess;
    try {
      proc = await instance.spawn("jsh", ["-c", startCmd], { env: SPAWN_ENV });
    } catch (error) {
      // The container went away (restart or project switch): nothing to report
      if (containerRef.current !== instance) return;
      setError(error instanceof Error ? error.message : "Unable to start the program");
      setStatus("error");
      return;
    }
    programRef.current = proc;

    proc.output
      .pipeTo(new WritableStream({
        write(data) {
          appendOutput(data);
          setProgramOutput((prev) => prev + data);
        },
      }))
      .catch(() => {});

    proc.exit
      .then((code) => {
        // Ignore processes replaced by a newer run
        if (programRef.current !== proc) return;
        programRef.current = null;
        setExitCode(code);
        setPreviewUrl(null);
        setStatus("exited");
      })
      // teardown() rejects every running process with "Process aborted"
      // (restart button, switching projects): that's expected
      .catch(() => {});
  }, [appendOutput, settings?.devCommand]);

  // Install dependencies (when there is a package.json) and start the program
  const runProject = useCallback(async (instance: WebContainer, target: ProjectRuntime) => {
    if (!runsInContainer(target)) return;

    try {
      const installCmd = target.kind === "node"
        ? settings?.installCommand || target.install
        : null;

      if (installCmd) {
        setStatus("installing");
        appendOutput(`$ ${installCmd}\n`);
        const installProcess = await instance.spawn("jsh", ["-c", installCmd], { env: SPAWN_ENV });
        installProcess.output
          .pipeTo(new WritableStream({ write: (data) => { appendOutput(data); } }))
          .catch(() => {});
        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          throw new Error(`${installCmd} failed with code ${installExitCode}`);
        }
      }

      installedDepsRef.current = target.kind === "node" ? target.dependencyKey : null;
      await startProgram(instance, target);
    } catch (error) {
      // A restart tore this container down mid-install: the new one takes over
      if (containerRef.current !== instance) return;
      setError(error instanceof Error ? error.message : "Unknown error");
      setStatus("error");
    }
  }, [appendOutput, settings?.installCommand, startProgram]);

  // Initial boot and mount
  useEffect(() => {
    if (!enabled || !files || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const start = async () => {
      let instance: WebContainer | null = null;
      try {
        setStatus("booting");
        setError(null);
        setTerminalOutput("");

        instance = await getWebContainer(projectId);
        containerRef.current = instance;

        await instance.mount(buildFileTree(files));

        const filesMap = new Map(files.map((f) => [f._id, f]));
        syncedRef.current = new Map(
          files
            .filter((f) => f.type === "file" && !f.storageId && f.content !== undefined)
            .map((f) => [getFilePath(f, filesMap), f.content ?? ""])
        );

        instance.on("server-ready", (_port, url) => {
          setPreviewUrl(url);
          setStatus("running");
        });

        setContainer(instance);

        const initialRuntime = detectRuntime(files);
        if (runsInContainer(initialRuntime)) {
          await runProject(instance, initialRuntime);
        } else {
          setStatus("waiting");
        }
      } catch (error) {
        // Torn down while booting (restart or project switch): ignore
        if (instance && containerRef.current !== instance) return;
        setError(error instanceof Error ? error.message : "Unknown error");
        setStatus("error");
      }
    };

    start();
  }, [
    enabled,
    files,
    restartKey,
    projectId,
    runProject,
  ]);

  // Start once the project becomes runnable (e.g. the agent scaffolded an app)
  useEffect(() => {
    const instance = containerRef.current;
    if (status !== "waiting" || !isRunnable || !instance) return;

    // Short delay so the rest of the scaffolded files land first
    const timer = setTimeout(() => runProject(instance, runtimeRef.current), 1500);
    return () => clearTimeout(timer);
  }, [status, isRunnable, runProject]);

  // Sync file changes into the container (hot-reload), including deletes and renames
  useEffect(() => {
    const instance = containerRef.current;
    if (!instance || !files || status === "idle" || status === "booting") return;

    const sync = async () => {
      const filesMap = new Map(files.map((f) => [f._id, f]));
      const next = new Map<string, string>();

      for (const file of files) {
        if (file.type !== "file" || file.storageId || file.content === undefined) continue;

        const filePath = getFilePath(file, filesMap);
        next.set(filePath, file.content);

        if (syncedRef.current.get(filePath) === file.content) continue;

        try {
          const dir = filePath.split("/").slice(0, -1).join("/");
          if (dir) await instance.fs.mkdir(dir, { recursive: true });
          await instance.fs.writeFile(filePath, file.content);
        } catch {
          // A failed write is retried on the next change
          next.delete(filePath);
        }
      }

      for (const filePath of syncedRef.current.keys()) {
        if (!next.has(filePath)) {
          await instance.fs.rm(filePath, { force: true }).catch(() => {});
        }
      }

      syncedRef.current = next;
    };

    syncPromiseRef.current = syncPromiseRef.current.then(sync, sync);
  }, [files, status]);

  // Resolves once the files currently in Convex are written to the container
  const waitForSync = useCallback(() => syncPromiseRef.current, []);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
    }
  }, [enabled]);

  // Run the program again with the latest files (console apps, crashed servers)
  const rerun = useCallback(() => {
    const instance = containerRef.current;
    if (!instance) return;
    syncPromiseRef.current.then(() => startProgram(instance, runtimeRef.current));
  }, [startProgram]);

  // Reload the preview page, like a browser refresh
  const reloadPreview = useCallback(() => {
    setPreviewKey((key) => key + 1);
  }, []);

  // Called when the agent finishes, so the preview shows its final work
  const refreshAfterAgent = useCallback(async () => {
    const instance = containerRef.current;
    if (!instance) return;

    // Make sure the agent's last files are in the container first
    await syncPromiseRef.current;

    const target = runtimeRef.current;
    if (!runsInContainer(target)) return;

    const current = statusRef.current;
    if (current === "booting" || current === "installing") return;

    const dependenciesChanged =
      target.kind === "node" &&
      target.install !== null &&
      target.dependencyKey !== installedDepsRef.current;

    if (current === "waiting" || current === "error" || dependenciesChanged) {
      setError(null);
      await runProject(instance, target);
    } else if (current === "exited" || current === "idle") {
      await startProgram(instance, target);
    } else {
      // A dev server is running: reload the page so it picks up every new file
      setPreviewKey((key) => key + 1);
    }
  }, [runProject, startProgram]);

  // Restart the entire WebContainer process
  const restart = useCallback(() => {
    teardownWebContainer();
    containerRef.current = null;
    programRef.current = null;
    installedDepsRef.current = null;
    hasStartedRef.current = false;
    syncedRef.current = new Map();
    syncPromiseRef.current = Promise.resolve();
    setContainer(null);
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setExitCode(null);
    setProgramOutput("");
    setRestartKey((k) => k + 1);
  }, []);

  return {
    status,
    previewUrl,
    error,
    restart,
    rerun,
    reloadPreview,
    refreshAfterAgent,
    previewKey,
    runtime,
    terminalOutput,
    programOutput,
    exitCode,
    appendOutput,
    container,
    waitForSync,
  };
};

export type WebContainerState = ReturnType<typeof useWebContainer>;
