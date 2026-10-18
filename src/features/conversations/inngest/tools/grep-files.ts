import { z } from "zod";
import picomatch from "picomatch";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { withPaths } from "./file-paths";

interface GrepFilesToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
}

const MAX_MATCHES = 100;
const MAX_LINE_LENGTH = 200;

const paramsSchema = z.object({
  pattern: z.string().min(1, "Pattern is required"),
  isRegex: z.boolean().optional(),
  caseSensitive: z.boolean().optional(),
  include: z.string().optional(),
});

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createGrepFilesTool = ({
  projectId,
  internalKey,
}: GrepFilesToolOptions) => {
  return createTool({
    name: "grepFiles",
    description:
      "Search the text inside project files. Returns matching lines grouped by file, with file IDs and line numbers. Use it to find where something is defined or used before editing.",
    parameters: z.object({
      pattern: z.string().describe("Text (or regular expression if isRegex is true) to search for"),
      isRegex: z.boolean().optional().describe("Treat pattern as a regular expression. Defaults to false"),
      caseSensitive: z.boolean().optional().describe("Match case exactly. Defaults to false"),
      include: z.string().optional().describe("Only search files whose path matches this glob, e.g. \"src/**/*.ts\""),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { pattern, isRegex = false, caseSensitive = false, include } = parsed.data;

      let regex: RegExp;
      try {
        regex = new RegExp(isRegex ? pattern : escapeRegex(pattern), caseSensitive ? "" : "i");
      } catch {
        return `Error: "${pattern}" is not a valid regular expression.`;
      }

      try {
        return await toolStep?.run("grep-files", async () => {
          const files = await convex.query(api.system.getProjectFiles, {
            internalKey,
            projectId,
          });

          const isIncluded = include ? picomatch(include, { dot: true }) : () => true;
          const results: string[] = [];
          let matchCount = 0;

          for (const { file, path } of withPaths(files)) {
            if (file.type !== "file" || file.content === undefined || !isIncluded(path)) continue;

            const fileMatches: string[] = [];
            const lines = file.content.split("\n");

            for (let i = 0; i < lines.length && matchCount < MAX_MATCHES; i++) {
              if (!regex.test(lines[i])) continue;
              const line = lines[i].trim();
              fileMatches.push(`  ${i + 1}: ${line.length > MAX_LINE_LENGTH ? `${line.slice(0, MAX_LINE_LENGTH)}…` : line}`);
              matchCount++;
            }

            if (fileMatches.length > 0) {
              results.push(`${path} (id: ${file._id})`, ...fileMatches);
            }
            if (matchCount >= MAX_MATCHES) break;
          }

          if (results.length === 0) {
            return `No matches for "${pattern}".`;
          }

          if (matchCount >= MAX_MATCHES) {
            results.push(`Stopped at ${MAX_MATCHES} matches. Narrow the search with include or a more specific pattern.`);
          }

          return results.join("\n");
        });
      } catch (error) {
        return `Error searching files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }
  });
};
