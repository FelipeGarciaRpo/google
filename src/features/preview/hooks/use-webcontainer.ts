import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";

import {
  buildFileTree,
  getFilePath
} from "@/features/preview/utils/file-tree";
import { useFiles } from "@/features/projects/hooks/use-files";

import { Doc, Id } from "../../../../convex/_generated/dataModel";

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

const isRootPackageJson = (file: Doc<"files">) =>
  file.type === "file" && file.name === "package.json" && !file.parentId;

export type WebContainerStatus =
  | "idle"
  | "booting"
  | "waiting" // booted, but the project has no package.json yet
  | "installing"
  | "running"
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
  const [terminalOutput, setTerminalOutput] = useState("");
  // Exposed so the interactive terminal and agent commands can use it
  const [container, setContainer] = useState<WebContainer | null>(null);

  const containerRef = useRef<WebContainer | null>(null);
  const hasStartedRef = useRef(false);
  // path -> content already written to the container
  const syncedRef = useRef<Map<string, string>>(new Map());
  // Chain of file syncs, so they never overlap and callers can wait for the latest one
  const syncPromiseRef = useRef<Promise<void>>(Promise.resolve());

  // Fetch files from Convex (auto-updates on changes)
  const files = useFiles(projectId);
  const hasPackageJson = !!files?.some(isRootPackageJson);

  const appendOutput = useCallback((data: string) => {
    setTerminalOutput((prev) => prev + data);
  }, []);

  // Install dependencies and start the dev server
  const runProject = useCallback(async (instance: WebContainer) => {
    try {
      setStatus("installing");

      // Parse install command (default: npm install)
      const installCmd = settings?.installCommand || "npm install";
      const [installBin, ...installArgs] = installCmd.split(" ");
      appendOutput(`$ ${installCmd}\n`)
      const installProcess = await instance.spawn(installBin, installArgs);
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            appendOutput(data);
          },
        })
      );
      const installExitCode = await installProcess.exit;

      if (installExitCode !== 0) {
        throw new Error(
          `${installCmd} failed with code ${installExitCode}`
        );
      }

      // Parse dev command (default: npm run dev)
      const devCmd = settings?.devCommand || "npm run dev";
      const [devBin, ...devArgs] = devCmd.split(" ");
      appendOutput(`\n$ ${devCmd}\n`);
      const devProcess = await instance.spawn(devBin, devArgs);
      devProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            appendOutput(data);
          },
        })
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      setStatus("error");
    }
  }, [appendOutput, settings?.installCommand, settings?.devCommand]);

  // Initial boot and mount
  useEffect(() => {
    if (!enabled || !files || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const start = async () => {
      try {
        setStatus("booting");
        setError(null);
        setTerminalOutput("");

        const instance = await getWebContainer(projectId);
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

        if (files.some(isRootPackageJson)) {
          await runProject(instance);
        } else {
          appendOutput("No package.json yet. The dev server starts as soon as the project has one.\n");
          setStatus("waiting");
        }
      } catch (error) {
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
    appendOutput,
  ]);

  // Start the dev server once a package.json shows up (e.g. the agent scaffolded the app)
  useEffect(() => {
    const instance = containerRef.current;
    if (status !== "waiting" || !hasPackageJson || !instance) return;

    // Short delay so the rest of the scaffolded files land first
    const timer = setTimeout(() => runProject(instance), 1500);
    return () => clearTimeout(timer);
  }, [status, hasPackageJson, runProject]);

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

  // Restart the entire WebContainer process
  const restart = useCallback(() => {
    teardownWebContainer();
    containerRef.current = null;
    hasStartedRef.current = false;
    syncedRef.current = new Map();
    syncPromiseRef.current = Promise.resolve();
    setContainer(null);
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setRestartKey((k) => k + 1);
  }, []);

  return {
    status,
    previewUrl,
    error,
    restart,
    terminalOutput,
    appendOutput,
    container,
    waitForSync,
  };
};

export type WebContainerState = ReturnType<typeof useWebContainer>;
