import { z } from "zod";
import picomatch from "picomatch";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { withPaths } from "./file-paths";

interface GlobFilesToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
}

const MAX_RESULTS = 200;

const paramsSchema = z.object({
  pattern: z.string().min(1, "Pattern is required"),
});

export const createGlobFilesTool = ({
  projectId,
  internalKey,
}: GlobFilesToolOptions) => {
  return createTool({
    name: "globFiles",
    description:
      "Find files by path pattern, e.g. \"src/**/*.tsx\", \"**/package.json\" or \"*.css\". Returns matching paths with their file IDs. Faster than listFiles when you know what you are looking for.",
    parameters: z.object({
      pattern: z.string().describe("Glob pattern matched against full file paths"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { pattern } = parsed.data;

      try {
        return await toolStep?.run("glob-files", async () => {
          const files = await convex.query(api.system.getProjectFiles, {
            internalKey,
            projectId,
          });

          const isMatch = picomatch(pattern, { dot: true });
          const matches = withPaths(files).filter(
            ({ file, path }) => file.type === "file" && isMatch(path)
          );

          if (matches.length === 0) {
            return `No files match "${pattern}".`;
          }

          const lines = matches
            .slice(0, MAX_RESULTS)
            .map(({ file, path }) => `${path} (id: ${file._id})`);

          if (matches.length > MAX_RESULTS) {
            lines.push(`... ${matches.length - MAX_RESULTS} more. Use a narrower pattern.`);
          }

          return lines.join("\n");
        });
      } catch (error) {
        return `Error finding files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }
  });
};
