"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PYODIDE_VERSION = "314.0.7";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
// Includes downloading Pyodide the first time
const RUN_TIMEOUT_MS = 90_000;

// Runs in a module worker so a long or infinite loop never freezes the page.
// Pyodide 314 only loads as an ES module (the classic pyodide.js fails in workers).
// Plain JS (no TypeScript) because it is loaded from a Blob URL.
const WORKER_SOURCE = `
import { loadPyodide } from "${PYODIDE_INDEX_URL}pyodide.mjs";
const pyodideReady = loadPyodide({ indexURL: "${PYODIDE_INDEX_URL}" });

// Drop Pyodide's internal frames so tracebacks look like regular Python
const cleanTraceback = (message) => {
  const result = [];
  let skipping = false;
  for (const line of message.split("\\n")) {
    if (/^\\s*File "\\/lib\\/python/.test(line)) { skipping = true; continue; }
    if (/^\\s*File "/.test(line) || !/^\\s/.test(line)) skipping = false;
    if (!skipping) result.push(line);
  }
  return result.join("\\n");
};

self.onmessage = async ({ data }) => {
  const { files, entry } = data;
  const post = (type, text) => self.postMessage({ type, text });

  try {
    const pyodide = await pyodideReady;
    pyodide.setStdout({ batched: (text) => post("stdout", text + "\\n") });
    pyodide.setStderr({ batched: (text) => post("stderr", text + "\\n") });
    // There is no keyboard in the preview: input() raises instead of hanging
    pyodide.setStdin({ error: true });

    // Write the whole project so modules can import each other
    const root = "/home/pyodide/project";
    pyodide.FS.mkdirTree(root);
    for (const [path, content] of Object.entries(files)) {
      const dir = path.split("/").slice(0, -1).join("/");
      if (dir) pyodide.FS.mkdirTree(root + "/" + dir);
      pyodide.FS.writeFile(root + "/" + path, content);
    }
    pyodide.FS.chdir(root);
    pyodide.runPython("import sys\\nif '" + root + "' not in sys.path: sys.path.insert(0, '" + root + "')");

    const code = files[entry];
    // Loads numpy, pandas, etc. when the script imports them
    await pyodide.loadPackagesFromImports(code, {
      messageCallback: (message) => post("info", message + "\\n"),
      errorCallback: (message) => post("info", message + "\\n"),
    });

    self.postMessage({ type: "ready" });
    await pyodide.runPythonAsync(code, { filename: entry });
    self.postMessage({ type: "exit", code: 0 });
  } catch (error) {
    post("stderr", cleanTraceback(String(error && error.message ? error.message : error)) + "\\n");
    self.postMessage({ type: "exit", code: 1 });
  }
};
`;

export type PythonRunState = "idle" | "loading" | "running" | "exited";

// Runs a Python project in the browser and collects its console output
export const usePythonRunner = () => {
  const [output, setOutput] = useState("");
  const [state, setState] = useState<PythonRunState>("idle");
  const [exitCode, setExitCode] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const finish = useCallback((code: number, message?: string) => {
    workerRef.current?.terminate();
    workerRef.current = null;
    clearTimeout(timerRef.current);
    if (message) setOutput((prev) => prev + message);
    setExitCode(code);
    setState("exited");
  }, []);

  const stop = useCallback(() => {
    if (!workerRef.current) return;
    finish(130, "\n\x1b[33mStopped.\x1b[0m\n");
  }, [finish]);

  const run = useCallback((files: Record<string, string>, entry: string) => {
    workerRef.current?.terminate();
    clearTimeout(timerRef.current);

    setOutput(`\x1b[90m$ python ${entry}\x1b[0m\n`);
    setExitCode(null);
    setState("loading");

    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    const worker = new Worker(url, { type: "module" });
    URL.revokeObjectURL(url);
    workerRef.current = worker;

    worker.onmessage = ({ data }) => {
      if (workerRef.current !== worker) return;

      if (data.type === "ready") {
        setState("running");
      } else if (data.type === "exit") {
        finish(data.code);
      } else if (data.type === "stderr") {
        setOutput((prev) => prev + `\x1b[31m${data.text}\x1b[0m`);
      } else if (data.type === "info") {
        setOutput((prev) => prev + `\x1b[90m${data.text}\x1b[0m`);
      } else {
        setOutput((prev) => prev + data.text);
      }
    };

    worker.onerror = (event) => {
      if (workerRef.current !== worker) return;
      finish(1, `\x1b[31m${event.message || "Python could not be loaded. Check your internet connection."}\x1b[0m\n`);
    };

    timerRef.current = setTimeout(() => {
      if (workerRef.current !== worker) return;
      finish(124, `\n\x1b[33mStopped after ${RUN_TIMEOUT_MS / 1000}s.\x1b[0m\n`);
    }, RUN_TIMEOUT_MS);

    worker.postMessage({ files, entry });
  }, [finish]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      clearTimeout(timerRef.current);
    };
  }, []);

  return { output, state, exitCode, run, stop };
};
