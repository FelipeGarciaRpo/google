"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { Loader2Icon } from "lucide-react";

import "@xterm/xterm/css/xterm.css";

interface InteractiveTerminalProps {
  container: WebContainer | null;
}

// A real shell (jsh) running inside the project's WebContainer
export const InteractiveTerminal = ({ container }: InteractiveTerminalProps) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!container || !element) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "monospace",
      theme: { background: "#1b1c1d" },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(element);
    fitAddon.fit();

    let disposed = false;
    let shell: WebContainerProcess | null = null;
    let input: WritableStreamDefaultWriter<string> | null = null;

    const startShell = async () => {
      shell = await container.spawn("jsh", {
        terminal: { cols: terminal.cols, rows: terminal.rows },
      });

      if (disposed) {
        shell.kill();
        return;
      }

      shell.output
        .pipeTo(new WritableStream({ write: (data) => { terminal.write(data); } }))
        .catch(() => {});
      input = shell.input.getWriter();

      shell.exit
        .then((code) => {
          if (!disposed) terminal.write(`\r\n\x1b[90m[shell exited with code ${code}]\x1b[0m\r\n`);
        })
        // teardown() aborts every process (restart, switching projects): expected
        .catch(() => {});
    };

    const dataListener = terminal.onData((data) => {
      // The stream is closed once the container is torn down
      input?.write(data).catch(() => {});
    });

    // Keep the shell's idea of the terminal size in sync with the panel
    const resizeObserver = new ResizeObserver(() => {
      if (!element.offsetWidth || !element.offsetHeight) return;
      fitAddon.fit();
      shell?.resize({ cols: terminal.cols, rows: terminal.rows });
    });
    resizeObserver.observe(element);

    startShell().catch((error) => {
      terminal.write(`\x1b[31mUnable to start the shell: ${error instanceof Error ? error.message : "unknown error"}\x1b[0m\r\n`);
    });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      dataListener.dispose();
      input?.releaseLock();
      shell?.kill();
      terminal.dispose();
    };
  }, [container]);

  if (!container) {
    return (
      <div className="size-full flex items-center justify-center gap-2 bg-[#1b1c1d] text-xs text-neutral-400">
        <Loader2Icon className="size-3.5 animate-spin" />
        Starting environment…
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className="size-full p-3 bg-[#1b1c1d] [&_.xterm]:h-full! [&_.xterm-viewport]:h-full! [&_.xterm-screen]:h-full!"
    />
  );
};
