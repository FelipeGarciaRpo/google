// Records what the agent is doing, so the chat can show live progress
import type { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export type ActivityKind = "start" | "explore" | "read" | "write" | "command" | "info";

type AnyTool = ReturnType<typeof createTool>;
type ToolOptions = Parameters<AnyTool["handler"]>[1];

// Structural type so both the function's step and a tool's step fit
type StepRunner = {
  run: (id: string, fn: () => Promise<void>) => Promise<unknown>;
} | undefined;

interface ActivityTrackerOptions {
  internalKey: string;
  messageId: Id<"messages">;
}

const MAX_NAMES = 3;

const listNames = (names: string[]) =>
  names.length <= MAX_NAMES
    ? names.join(", ")
    : `${names.slice(0, MAX_NAMES).join(", ")} and ${names.length - MAX_NAMES} more`;

const asString = (value: unknown) => (typeof value === "string" ? value : "");
const asArray = (value: unknown) => (Array.isArray(value) ? value : []);

export const createActivityTracker = ({ internalKey, messageId }: ActivityTrackerOptions) => {
  const fileName = async (fileId: unknown) => {
    if (typeof fileId !== "string" || !fileId) return "a file";
    const file = await convex
      .query(api.system.getFileById, { internalKey, fileId: fileId as Id<"files"> })
      .catch(() => null);
    return file?.name ?? "a file";
  };

  // Turns a tool call into a short, human readable step
  const describe = async (
    toolName: string,
    input: Record<string, unknown>
  ): Promise<{ kind: ActivityKind; label: string }> => {
    switch (toolName) {
      case "listFiles":
        return { kind: "explore", label: "Looking at the project files" };
      case "globFiles":
        return { kind: "explore", label: `Finding files: ${asString(input.pattern)}` };
      case "grepFiles":
        return { kind: "explore", label: `Searching for "${asString(input.pattern)}"` };
      case "readFiles": {
        const names = await Promise.all(asArray(input.fileIds).slice(0, MAX_NAMES + 1).map(fileName));
        return { kind: "read", label: `Reading ${listNames(names)}` };
      }
      case "editFile":
        return { kind: "write", label: `Editing ${await fileName(input.fileId)}` };
      case "updateFile":
        return { kind: "write", label: `Rewriting ${await fileName(input.fileId)}` };
      case "createFiles": {
        const names = asArray(input.files).map((file) => asString((file as { name?: unknown })?.name));
        return { kind: "write", label: `Creating ${listNames(names.filter(Boolean))}` };
      }
      case "createFolder":
        return { kind: "write", label: `Creating folder ${asString(input.name)}` };
      case "renameFile":
        return { kind: "write", label: `Renaming ${await fileName(input.fileId)} to ${asString(input.newName)}` };
      case "deleteFiles": {
        const names = await Promise.all(asArray(input.fileIds).slice(0, MAX_NAMES + 1).map(fileName));
        return { kind: "write", label: `Deleting ${listNames(names)}` };
      }
      case "runCommand":
        return { kind: "command", label: `Running ${asString(input.command)}` };
      case "scrapeUrls":
        return { kind: "read", label: `Reading ${asArray(input.urls).length} web page(s)` };
      default:
        return { kind: "info", label: `Using ${toolName}` };
    }
  };

  // Inside a step so Inngest replays don't record the same step twice
  const record = async (
    step: StepRunner,
    kind: ActivityKind,
    label: string | (() => Promise<string>)
  ) => {
    if (!step) return;

    await step.run("agent-activity", async () => {
      const text = typeof label === "string" ? label : await label();
      await convex.mutation(api.system.appendMessageActivity, {
        internalKey,
        messageId,
        kind,
        label: text,
      });
    }).catch(() => {
      // Progress is nice to have; never fail the agent because of it
    });
  };

  // Wraps a tool so every call is recorded before it runs
  const track = <T extends AnyTool>(tool: T): T => {
    const original = tool.handler.bind(tool);

    return {
      ...tool,
      handler: async (input: never, opts: ToolOptions) => {
        const args = (input ?? {}) as Record<string, unknown>;
        if (opts.step) {
          await opts.step.run("agent-activity", async () => {
            const { kind, label } = await describe(tool.name, args);
            await convex.mutation(api.system.appendMessageActivity, {
              internalKey,
              messageId,
              kind,
              label,
            });
          }).catch(() => {});
        }
        return original(input, opts);
      },
    } as unknown as T;
  };

  return { record, track };
};
