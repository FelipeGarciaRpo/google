import { strToU8, zipSync, type Zippable } from "fflate";

import { getFilePath } from "@/features/preview/utils/file-tree";

import { Doc, Id } from "../../../../convex/_generated/dataModel";

interface BuildProjectZipOptions {
  projectName: string;
  files: Doc<"files">[];
  // Download URLs for binary files (they live in Convex storage, not in the file docs)
  storageUrls: { fileId: Id<"files">; url: string }[];
}

// Builds the project's ZIP in the browser, inside a folder named after the project
export const buildProjectZip = async ({
  projectName,
  files,
  storageUrls,
}: BuildProjectZipOptions) => {
  const byId = new Map(files.map((file) => [file._id, file]));
  const urlById = new Map(storageUrls.map(({ fileId, url }) => [fileId, url]));
  const root: Zippable = {};
  // Binary files that could not be fetched
  const failed: string[] = [];

  const folderAt = (parts: string[]) => {
    let node = root;
    for (const part of parts) {
      const next = node[part];
      if (!next || next instanceof Uint8Array || Array.isArray(next)) {
        node[part] = {};
      }
      node = node[part] as Zippable;
    }
    return node;
  };

  for (const file of files) {
    const parts = getFilePath(file, byId).split("/");

    // Keeps empty folders too
    if (file.type === "folder") {
      folderAt(parts);
      continue;
    }

    const name = parts.pop()!;
    const folder = folderAt(parts);

    if (!file.storageId) {
      folder[name] = strToU8(file.content ?? "");
      continue;
    }

    try {
      const url = urlById.get(file._id);
      if (!url) throw new Error("No download URL");
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      folder[name] = new Uint8Array(await response.arrayBuffer());
    } catch {
      failed.push([...parts, name].join("/"));
    }
  }

  const folderName = projectName.trim().replace(/[^\w.-]+/g, "-") || "project";
  const data = zipSync({ [folderName]: root }, { level: 6 });

  return { data, fileName: `${folderName}.zip`, failed };
};
