"use client";

import { useState } from "react";
import { CloudCheckIcon, LoaderIcon, PencilIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Id } from "../../../../convex/_generated/dataModel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProject, useRenameProject } from "../hooks/use-project";
import { ExportPopover } from "./export-popover";
import { DownloadButton } from "./download-button";

// Page header, like the "Playground" title bar in AI Studio
export const Navbar = ({
    projectId
}: {
    projectId: Id<"projects">
})=>{
    const project = useProject(projectId);
    const renameProject = useRenameProject();

    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState("");

    const handleStartRename = ()=>{
        if(!project) return;
        setName(project.name)
        setIsRenaming(true)
    }

    const handleSubmit = ()=>{
        if(!project) return;
        setIsRenaming(false)
        const trimmedName = name.trim();
        if(!trimmedName || trimmedName === project.name) return;

        renameProject({id: projectId, name: trimmedName})
    };

    const handleKeyDown = (e: React.KeyboardEvent)=>{
        if(e.key === "Enter"){
            handleSubmit();
        } else if(e.key === "Escape") {
            setIsRenaming(false);
        }
    }

    return(
        <header className="h-14 shrink-0 flex items-center justify-between gap-4 px-5 border-b">
            <div className="flex items-center gap-2 min-w-0">
                { isRenaming ? (
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e)=>setName(e.target.value)}
                        onFocus={(e)=>e.currentTarget.select()}
                        onBlur={handleSubmit}
                        onKeyDown={handleKeyDown}
                        className="text-lg bg-transparent text-foreground outline-none! border-b border-primary max-w-80"
                    />
                ): (
                    <button
                        type="button"
                        onClick={handleStartRename}
                        className="group flex items-center gap-2 min-w-0 text-lg text-foreground"
                        title="Rename project"
                    >
                        <span className="truncate">{project?.name ?? "Loading..."}</span>
                        <PencilIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </button>
                )}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-muted-foreground">
                                {project?.importStatus === "importing"
                                    ? <LoaderIcon className="size-4 animate-spin"/>
                                    : <CloudCheckIcon className="size-4"/>}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {project?.importStatus === "importing"
                                ? "Importing..."
                                : <>Saved{" "}{project?.updatedAt ? formatDistanceToNow(project.updatedAt, {addSuffix: true}) : ""}</>}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
                <DownloadButton projectId={projectId}/>
                <ExportPopover projectId={projectId}/>
            </div>
        </header>
    )
}
