"use client";

import { useState } from "react";
import { useConvex } from "convex/react";
import { toast } from "sonner";
import { DownloadIcon, Loader2Icon } from "lucide-react";

import { useProject } from "../hooks/use-project";
import { useFiles } from "../hooks/use-files";
import { buildProjectZip } from "../utils/build-project-zip";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Downloads the whole project as a ZIP, like AI Studio's "Download" button
export const DownloadButton = ({ projectId }: { projectId: Id<"projects"> }) => {
  const convex = useConvex();
  const project = useProject(projectId);
  const files = useFiles(projectId);
  const [isPreparing, setIsPreparing] = useState(false);

  const hasFiles = (files?.length ?? 0) > 0;

  const handleDownload = async () => {
    if (!project || isPreparing) return;

    setIsPreparing(true);

    try {
      // Fresh copies, not the live subscription, so the ZIP has the latest saved code
      const [allFiles, storageUrls] = await Promise.all([
        convex.query(api.files.getFiles, { projectId }),
        convex.query(api.files.getStorageUrls, { projectId }),
      ]);

      const { data, fileName, failed } = await buildProjectZip({
        projectName: project.name,
        files: allFiles,
        storageUrls,
      });

      const url = URL.createObjectURL(
        new Blob([data as Uint8Array<ArrayBuffer>], { type: "application/zip" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser time to start the download before freeing the memory
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      if (failed.length > 0) {
        toast.warning(`Downloaded ${fileName}, but ${failed.length} file(s) couldn't be included`, {
          description: failed.slice(0, 3).join(", "),
        });
      } else {
        toast.success(`Downloaded ${fileName}`);
      }
    } catch {
      toast.error("Unable to download the project");
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isPreparing || !hasFiles}
      className="flex items-center gap-2 h-9 px-4 rounded-full border text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
      title={hasFiles ? "Download the project as a ZIP" : "There are no files to download yet"}
    >
      {isPreparing
        ? <Loader2Icon className="size-4 animate-spin" />
        : <DownloadIcon className="size-4" />}
      <span>{isPreparing ? "Preparing…" : "Download"}</span>
    </button>
  );
};
