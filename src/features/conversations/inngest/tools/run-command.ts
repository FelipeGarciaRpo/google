import { z } from "zod";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Doc, Id } from "../../../../../convex/_generated/dataModel";

interface RunCommandToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
}

const DEFAULT_TIMEOUT_SECONDS = 60;
const MAX_TIMEOUT_SECONDS = 120;
// waitForEvent only sees events sent after it starts, so wait in short
// slices and re-check Convex in case the browser finished in between
const WAIT_SLICE_SECONDS = 20;
// If nobody claimed the command after this many slices, no browser has the project open
const UNCLAIMED_SLICES = 2;

const paramsSchema = z.object({
  command: z.string().min(1, "Command is required"),
  timeoutSeconds: z.number().int().positive().optional(),
});

const formatResult = (command: Doc<"commands">) => {
  const header = command.status === "timeout"
    ? `$ ${command.command}\nTimed out after ${command.timeoutSeconds}s and was stopped.`
    : `$ ${command.command}\nExit code: ${command.exitCode ?? "unknown"}`;

  const output = command.output?.trim();
  return `${header}\n${output ? output : "(no output)"}`;
};

export const createRunCommandTool = ({
  projectId,
  internalKey,
}: RunCommandToolOptions) => {
  return createTool({
    name: "runCommand",
    description:
      "Run a shell command in the project's sandbox (a WebContainer in the user's browser) and get its exit code and output. Only Node.js tooling exists: npm, npx, node, ls, cat, etc. Use it to install a package, build, type-check, lint or run tests, then fix any errors you read. Never start dev servers or watch mode (the preview already runs the app), and never run interactive commands.",
    parameters: z.object({
      command: z.string().describe("The command to run, e.g. \"npm run build\" or \"npx tsc --noEmit\""),
      timeoutSeconds: z.number().optional().describe(`Seconds before the command is stopped. Defaults to ${DEFAULT_TIMEOUT_SECONDS}, max ${MAX_TIMEOUT_SECONDS}`),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      if (!toolStep) {
        return "Error: runCommand needs the Inngest runtime.";
      }

      const { command } = parsed.data;
      const timeoutSeconds = Math.min(
        parsed.data.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS,
        MAX_TIMEOUT_SECONDS
      );

      try {
        const commandId = await toolStep.run("queue-command", async () => {
          return await convex.mutation(api.system.createCommand, {
            internalKey,
            projectId,
            command,
            timeoutSeconds,
          });
        });

        // Enough slices for the command itself plus some slack for syncing files
        const slices = Math.ceil((timeoutSeconds + 30) / WAIT_SLICE_SECONDS);

        for (let slice = 0; slice < slices; slice++) {
          await toolStep.waitForEvent(`wait-command-${commandId}-${slice}`, {
            event: "command/completed",
            timeout: `${WAIT_SLICE_SECONDS}s`,
            if: `async.data.commandId == "${commandId}"`,
          });

          const current = await toolStep.run(`check-command-${commandId}-${slice}`, async () => {
            return await convex.query(api.system.getCommand, { internalKey, commandId });
          });

          if (!current) {
            return "Error: the command disappeared before it finished.";
          }

          if (current.status === "completed" || current.status === "timeout") {
            return formatResult(current);
          }

          if (current.status === "pending" && slice + 1 >= UNCLAIMED_SLICES) {
            await toolStep.run(`expire-command-${commandId}`, async () => {
              await convex.mutation(api.system.expireCommand, { internalKey, commandId });
            });
            return "Error: no browser picked up the command. The project must be open in the browser for commands to run. Tell the user to open it, and continue without running commands.";
          }
        }

        await toolStep.run(`expire-command-${commandId}`, async () => {
          await convex.mutation(api.system.expireCommand, { internalKey, commandId });
        });
        return `Error: "${command}" did not report back in time.`;
      } catch (error) {
        return `Error running command: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }
  });
};
