import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa";
import { AlertCircleIcon, GlobeIcon, Loader2Icon, SearchIcon, ArrowRightIcon } from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

import { useProjects } from "../hooks/use-project";
import { Doc } from "../../../../convex/_generated/dataModel";

interface ProjectsCommandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusColor: Record<string, string> = {
    completed: "#3b82f6",
    failed: "#ef4444",
    importing: "#f59e0b",
    default: "#64748b",
};

const getStatusColor = (project: Doc<"projects">) =>
    statusColor[project.importStatus ?? "default"] ?? statusColor.default;

const getProjectIcon = (project: Doc<"projects">) => {
    if (project.importStatus === "completed")
        return <FaGithub className="size-4" style={{ color: "#3b82f6" }} />;
    if (project.importStatus === "failed")
        return <AlertCircleIcon className="size-4" style={{ color: "#ef4444" }} />;
    if (project.importStatus === "importing")
        return <Loader2Icon className="size-4 animate-spin" style={{ color: "#f59e0b" }} />;
    return <GlobeIcon className="size-4" style={{ color: "#64748b" }} />;
};

const formatStatus = (project: Doc<"projects">) => {
    if (project.importStatus === "completed") return "GitHub";
    if (project.importStatus === "failed") return "Error";
    if (project.importStatus === "importing") return "Importing...";
    return "Web";
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
        >
            <div
                className="overflow-hidden rounded-[8px]"
                style={{
                    background: "#11141a",
                    border: "1px solid #1e2635",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08)",
                    fontFamily: "'JetBrains Mono', monospace",
                }}
            >
                {/* Search input row */}
                <div
                    className="flex items-center gap-3 px-4"
                    style={{ borderBottom: "1px solid #1e2635" }}
                >
                    <SearchIcon className="size-4 flex-shrink-0" style={{ color: "#3b82f6" }} />
                    <CommandInput
                        placeholder="Search projects..."
                        className="flex-1 h-12 bg-transparent border-none outline-none text-sm placeholder:text-[#3d4e63]"
                        style={{
                            color: "#e2e8f0",
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    />
                    <kbd
                        className="text-[10px] px-2 py-[3px] rounded-[4px]"
                        style={{
                            background: "#0d0f14",
                            border: "1px solid #243044",
                            color: "#64748b",
                            fontFamily: "inherit",
                        }}
                    >
                        ESC
                    </kbd>
                </div>

                {/* List */}
                <CommandList style={{ maxHeight: "360px" }}>
                    <CommandEmpty>
                        <div className="flex flex-col items-center gap-2 py-10">
                            <SearchIcon className="size-8" style={{ color: "#1e2635" }} />
                            <span className="text-sm" style={{ color: "#3d4e63" }}>
                                No projects found.
                            </span>
                        </div>
                    </CommandEmpty>

                    <CommandGroup
                        heading={
                            <span
                                className="text-[10px] uppercase tracking-widest font-semibold px-4 pt-3 pb-1 block"
                                style={{ color: "#64748b" }}
                            >
                                All Projects
                            </span>
                        }
                    >
                        {projects?.map((project) => (
                            <CommandItem
                                key={project._id}
                                value={`${project.name}-${project._id}`}
                                onSelect={() => handleSelect(project._id)}
                                className="group mx-2 mb-[2px] rounded-[6px] px-3 py-[10px] flex items-center gap-3 cursor-pointer transition-all"
                                style={{
                                    background: "transparent",
                                    border: "1px solid transparent",
                                }}
                                // data-selected handled by cmdk
                            >
                                {/* Icon */}
                                <div
                                    className="w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0"
                                    style={{ background: "#161b24", border: "1px solid #243044" }}
                                >
                                    {getProjectIcon(project)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-medium truncate" style={{ color: "#e2e8f0" }}>
                                        {project.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-[2px]">
                                        <span
                                            className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                                            style={{ background: getStatusColor(project) }}
                                        />
                                        <span className="text-[11px]" style={{ color: "#64748b" }}>
                                            {formatStatus(project)}
                                        </span>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <ArrowRightIcon
                                    className="size-4 opacity-0 group-data-[selected=true]:opacity-100 transition-all group-data-[selected=true]:translate-x-0 -translate-x-1"
                                    style={{ color: "#3b82f6" }}
                                />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>

                {/* Footer */}
                <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ borderTop: "1px solid #1e2635" }}
                >
                    <span className="text-[10px]" style={{ color: "#3d4e63" }}>
                        {projects?.length ?? 0} projects
                    </span>
                    <div className="flex items-center gap-3">
                        {[
                            { key: "↑↓", label: "navigate" },
                            { key: "↵", label: "open" },
                            { key: "esc", label: "close" },
                        ].map(({ key, label }) => (
                            <span key={key} className="flex items-center gap-1 text-[10px]" style={{ color: "#3d4e63" }}>
                                <kbd
                                    className="px-[5px] py-[2px] rounded-[3px]"
                                    style={{
                                        background: "#161b24",
                                        border: "1px solid #243044",
                                        color: "#64748b",
                                        fontFamily: "inherit",
                                        fontSize: "10px",
                                    }}
                                >
                                    {key}
                                </kbd>
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </CommandDialog>
    );
};