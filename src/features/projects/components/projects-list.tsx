import { Spinner } from "@/components/ui/spinner";
import { useProjectsPartial } from "../hooks/use-project";
import { Doc } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { AlertCircleIcon, ArrowRightIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FaGithub } from "react-icons/fa";

interface ProjectsListProps {
    onViewAll: () => void;
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
        return <FaGithub className="size-[14px]" style={{ color: "#3b82f6" }} />;
    if (project.importStatus === "failed")
        return <AlertCircleIcon className="size-[14px]" style={{ color: "#ef4444" }} />;
    if (project.importStatus === "importing")
        return <Loader2Icon className="size-[14px] animate-spin" style={{ color: "#f59e0b" }} />;
    return <GlobeIcon className="size-[14px]" style={{ color: "#64748b" }} />;
};

const formatTimestamp = (timestamp: number) =>
    formatDistanceToNow(new Date(timestamp), { addSuffix: true });

const ContinueCard = ({ data }: { data: Doc<"projects"> }) => (
    <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#64748b" }}>
            Last Updated
        </span>
        <Link
            href={`/projects/${data._id}`}
            className="group flex flex-col gap-3 p-4 rounded-[8px] transition-all"
            style={{ background: "#161b24", border: "1px solid #1e2635", textDecoration: "none" }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#1d3a6b";
                (e.currentTarget as HTMLElement).style.background = "#1c2230";
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#1e2635";
                (e.currentTarget as HTMLElement).style.background = "#161b24";
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: getStatusColor(data) }} />
                    <span className="text-[13px] font-medium truncate" style={{ color: "#e2e8f0" }}>
                        {data.name}
                    </span>
                </div>
                <ArrowRightIcon
                    className="size-4 transition-transform group-hover:translate-x-[2px]"
                    style={{ color: "#3b82f6" }}
                />
            </div>
            <span className="text-[11px]" style={{ color: "#64748b" }}>
                {formatTimestamp(data.updatedAt)}
            </span>
        </Link>
    </div>
);

const ProjectItem = ({ data }: { data: Doc<"projects"> }) => (
    <Link
        href={`/projects/${data._id}`}
        className="group flex items-center gap-3 py-[9px] px-3 rounded-[4px] transition-all"
        style={{ textDecoration: "none" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#161b24"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
    >
        <div className="w-6 h-6 rounded-[4px] flex items-center justify-center flex-shrink-0"
            style={{ background: "#161b24", border: "1px solid #1e2635" }}>
            {getProjectIcon(data)}
        </div>
        <span className="text-[12px] font-medium truncate flex-1" style={{ color: "#94a3b8" }}>
            {data.name}
        </span>
        <span className="text-[11px]" style={{ color: "#3d4e63" }}>
            {formatTimestamp(data.updatedAt)}
        </span>
    </Link>
);

export const ProjectsList = ({ onViewAll }: ProjectsListProps) => {
    const projects = useProjectsPartial(8);

    if (projects === undefined)
        return <Spinner className="size-5" style={{ color: "#3b82f6" }} />;

    const [mostRecent, ...rest] = projects;

    return (
        <div className="flex flex-col gap-4">
            {mostRecent && <ContinueCard data={mostRecent} />}

            {rest.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#64748b" }}>
                            Recent Projects
                        </span>
                        <button
                            onClick={onViewAll}
                            className="flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70"
                            style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                        >
                            View all
                            <ArrowRightIcon className="size-[13px]" />
                        </button>
                    </div>

                    <div className="rounded-[8px] overflow-hidden" style={{ border: "1px solid #1e2635", background: "#11141a" }}>
                        {rest.map((project, i) => (
                            <div key={project._id}
                                style={{ borderBottom: i < rest.length - 1 ? "1px solid #1e2635" : "none", padding: "0 6px" }}>
                                <ProjectItem data={project} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};