"use client";

import { useEffect, useRef } from "react";
import ky from "ky";
import { useMutation, useQuery } from "convex/react";
import type { WebContainer } from "@webcontainer/api";

import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";

// Colors and cursor moves are noise for the model
const ANSI_PATTERN = /\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][^\x07]*\x07/g;

const cleanOutput = (raw: string) =>
  raw
    .replace(ANSI_PATTERN, "")
    .split("\n")
    // Progress bars redraw a line with \r: keep only its final state
    .map((line) => line.split("\r").filter(Boolean).at(-1) ?? "")
    .join("\n");

interface UseAgentCommandsProps {
  projectId: Id<"projects">;
  container: WebContainer | null;
  waitForSync: () => Promise<void>;
  appendOutput: (data: string) => void;
  onCommandStart?: () => void;
}

// Runs the commands the agent queues (runCommand tool) inside this tab's WebContainer
export const useAgentCommands = ({
  projectId,
  container,
  waitForSync,
  appendOutput,
  onCommandStart,
}: UseAgentCommandsProps) => {
  const pending = useQuery(api.commands.getPending, { projectId });
  const claim = useMutation(api.commands.claim);
  const startedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!container || !pending) return;

    const execute = async (command: Doc<"commands">) => {
      // Another tab may run it instead
      const claimed = await claim({ commandId: command._id }).catch(() => false);
      if (!claimed) return;

      onCommandStart?.();

      // Let the agent's latest file changes reach the container first
      await new Promise((resolve) => setTimeout(resolve, 300));
      await waitForSync();

      appendOutput(`\n\x1b[36m[agent] $ ${command.command}\x1b[0m\n`);

      let output = "";
      let exitCode: number | undefined;
      let timedOut = false;

      try {
        // npm_config_yes stops npx from waiting on its "Ok to proceed?" prompt
        const proc = await container.spawn("jsh", ["-c", command.command], {
          env: { npm_config_yes: true },
        });
        proc.output
          .pipeTo(new WritableStream({
            write(data) {
              output += data;
              appendOutput(data);
            },
          }))
          .catch(() => {});

        let timer: ReturnType<typeof setTimeout> | undefined;
        const result = await Promise.race([
          proc.exit,
          new Promise<"timeout">((resolve) => {
            timer = setTimeout(() => resolve("timeout"), command.timeoutSeconds * 1000);
          }),
        ]);
        clearTimeout(timer);

        if (result === "timeout") {
          timedOut = true;
          proc.kill();
          appendOutput(`\n\x1b[33m[agent] stopped after ${command.timeoutSeconds}s\x1b[0m\n`);
        } else {
          exitCode = result;
        }

        // Give the output stream a moment to flush its last chunk
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        output += `\nUnable to start the command: ${error instanceof Error ? error.message : "unknown error"}`;
        exitCode = 1;
      }

      await ky
        .post("/api/commands/complete", {
          json: {
            commandId: command._id,
            output: cleanOutput(output),
            exitCode,
            timedOut,
          },
        })
        .catch(() => {
          appendOutput("\n\x1b[31m[agent] could not report the result back\x1b[0m\n");
        });
    };

    for (const command of pending) {
      if (startedRef.current.has(command._id)) continue;
      startedRef.current.add(command._id);
      execute(command);
    }
  }, [pending, container, claim, waitForSync, appendOutput, onCommandStart]);
};
