import { Doc, Id } from "../../../../../convex/_generated/dataModel";

export interface FileWithPath {
  file: Doc<"files">;
  path: string;
}

// Convex stores files flat (parentId links), the search tools need full paths
export const withPaths = (files: Doc<"files">[]): FileWithPath[] => {
  const byId = new Map<Id<"files">, Doc<"files">>(files.map((f) => [f._id, f]));

  const getPath = (file: Doc<"files">): string => {
    const parts = [file.name];
    let parentId = file.parentId;
    // Guard against broken parent chains
    let depth = 0;

    while (parentId && depth < 100) {
      const parent = byId.get(parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      parentId = parent.parentId;
      depth++;
    }

    return parts.join("/");
  };

  return files
    .map((file) => ({ file, path: getPath(file) }))
    .sort((a, b) => a.path.localeCompare(b.path));
};
