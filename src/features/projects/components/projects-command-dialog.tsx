import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { AlertCircleIcon, FolderIcon, Loader2Icon, ArrowRightIcon } from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";

import { useProjects } from "../hooks/use-project";
import { Doc } from "../../../../convex/_generated/dataModel";

interface ProjectsCommandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const getProjectIcon = (project: Doc<"projects">) => {
    if (project.importStatus === "completed")
        return <FaGithub className="size-4 text-foreground" />;
    if (project.importStatus === "failed")
        return <AlertCircleIcon className="size-4 text-destructive" />;
    if (project.importStatus === "importing")
        return <Loader2Icon className="size-4 animate-spin text-amber-500" />;
    return <FolderIcon className="size-4 text-muted-foreground" />;
};

export const ProjectsCommandDialog = ({
    open,
    onOpenChange,
}: ProjectsCommandDialogProps) => {
    const router = useRouter();
    const projects = useProjects();

    const handleSelect = (projectId: string) => {
        router.push(`/projects/${projectId}`);
        onOpenChange(false);
    };

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Search Projects"
            description="Search and navigate to your projects"
            className="rounded-2xl"
        >
            <CommandInput placeholder="Search projects..." />
            <CommandList className="max-h-[380px]">
                <CommandEmpty>No projects found.</CommandEmpty>
                <CommandGroup heading="My projects">
                    {projects?.map((project) => (
                        <CommandItem
                            key={project._id}
                            value={`${project.name}-${project._id}`}
                            onSelect={() => handleSelect(project._id)}
                            className="group rounded-lg px-3 py-2.5 gap-3"
                        >
                            <span className="size-8 rounded-lg bg-surface border flex items-center justify-center shrink-0">
                                {getProjectIcon(project)}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium truncate">{project.name}</span>
                                <span className="block text-xs text-muted-foreground">
                                    {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                                </span>
                            </span>
                            <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
            <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                <span>{projects?.length ?? 0} projects</span>
                <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Kbd>↑↓</Kbd> navigate</span>
                    <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
                    <span className="flex items-center gap-1"><Kbd>Esc</Kbd> close</span>
                </span>
            </div>
        </CommandDialog>
    );
};
