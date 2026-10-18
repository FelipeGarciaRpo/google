import { z } from "zod";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface EditFileToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  oldString: z.string().min(1, "oldString cannot be empty"),
  newString: z.string(),
  replaceAll: z.boolean().optional(),
});

const countOccurrences = (text: string, search: string) => text.split(search).length - 1;

export const createEditFileTool = ({ internalKey }: EditFileToolOptions) => {
  return createTool({
    name: "editFile",
    description:
      "Replace an exact piece of text inside a file without rewriting the whole file. oldString must match the file exactly (including whitespace and indentation) and be unique unless replaceAll is true. Prefer this over updateFile for small changes.",
    parameters: z.object({
      fileId: z.string().describe("The ID of the file to edit"),
      oldString: z.string().describe("Exact text to replace. Include a few surrounding lines so it is unique"),
      newString: z.string().describe("Text that replaces oldString"),
      replaceAll: z.boolean().optional().describe("Replace every occurrence instead of exactly one. Defaults to false"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileId, oldString, newString, replaceAll = false } = parsed.data;

      if (oldString === newString) {
        return "Error: oldString and newString are identical, nothing to change.";
      }

      // Validate before running the step, so errors go back to the model as text
      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileId as Id<"files">,
      });

      if (!file) {
        return `Error: File with ID "${fileId}" not found. Use listFiles or globFiles to get valid file IDs.`;
      }

      if (file.type === "folder") {
        return `Error: "${file.name}" is a folder, not a file.`;
      }

      if (file.content === undefined) {
        return `Error: "${file.name}" is a binary file and cannot be edited as text.`;
      }

      const occurrences = countOccurrences(file.content, oldString);

      if (occurrences === 0) {
        return `Error: oldString was not found in "${file.name}". Read the file again and copy the text exactly, including whitespace.`;
      }

      if (occurrences > 1 && !replaceAll) {
        return `Error: oldString appears ${occurrences} times in "${file.name}". Add more surrounding context to make it unique, or set replaceAll to true.`;
      }

      const content = replaceAll
        ? file.content.split(oldString).join(newString)
        : file.content.replace(oldString, () => newString);

      try {
        return await toolStep?.run("edit-file", async () => {
          await convex.mutation(api.system.updateFile, {
            internalKey,
            fileId: fileId as Id<"files">,
            content,
          });

          return `Edited "${file.name}": replaced ${replaceAll ? occurrences : 1} occurrence(s).`;
        });
      } catch (error) {
        return `Error editing file: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }
  });
};
