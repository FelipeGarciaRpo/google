"use client";

import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import {
    SparkleIcon, SearchIcon, FolderIcon,
    MessageSquareIcon, PanelLeftIcon,
    ChevronRightIcon, ArrowRightIcon, GlobeIcon, Loader2Icon,
    AlertCircleIcon, PlusIcon, XIcon, SettingsIcon, UserIcon
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Kbd } from "@/components/ui/kbd";
import { useCreateProject, useProjectsPartial } from "../hooks/use-project";
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { useEffect, useState } from "react";
import { ProjectsCommandDialog } from "./projects-command-dialog";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Doc } from "../../../../convex/_generated/dataModel";

const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const MOCK_CHATS = [
    { id: "1", title: "Fix auth middleware bug", model: "Claude 3.5", time: "2m ago", active: true },
    { id: "2", title: "Refactor API routes to REST", model: "Claude 3.5", time: "1h ago", active: false },
    { id: "3", title: "Add dark mode support", model: "GPT-4o", time: "3h ago", active: false },
    { id: "4", title: "Write unit tests for utils", model: "Claude 3.5", time: "Yesterday", active: false },
    { id: "5", title: "Database schema design", model: "GPT-4o", time: "2d ago", active: false },
    { id: "6", title: "Deploy pipeline setup", model: "Claude 3.5", time: "Last week", active: false },
];

const statusColor: Record<string, string> = {
    completed: "#3b82f6", failed: "#ef4444", importing: "#f59e0b", default: "#64748b",
};
const getStatusColor = (p: Doc<"projects">) =>
    statusColor[p.importStatus ?? "default"] ?? statusColor.default;

const getProjectIcon = (p: Doc<"projects">) => {
    if (p.importStatus === "completed") return <FaGithub className="size-[13px]" style={{ color: "#3b82f6" }} />;
    if (p.importStatus === "failed") return <AlertCircleIcon className="size-[13px]" style={{ color: "#ef4444" }} />;
    if (p.importStatus === "importing") return <Loader2Icon className="size-[13px] animate-spin" style={{ color: "#f59e0b" }} />;
    return <GlobeIcon className="size-[13px]" style={{ color: "#64748b" }} />;
};

const fmt = (ts: number) => formatDistanceToNow(new Date(ts), { addSuffix: true });

const BuildPanel = ({ onViewAll }: { onViewAll: () => void }) => {
    const projects = useProjectsPartial(6);
    return (
        <div className="flex flex-col gap-1 px-2">
            <div className="flex items-center justify-between px-2 py-2">
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#64748b" }}>Recent</span>
                <button onClick={onViewAll}
                    className="flex items-center gap-1 text-[10px] hover:opacity-70 transition-opacity"
                    style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    All <ChevronRightIcon className="size-3" />
                </button>
            </div>
            {projects === undefined ? (
                <div className="px-2 py-3 flex items-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" style={{ color: "#3b82f6" }} />
                    <span className="text-[12px]" style={{ color: "#64748b" }}>Loading...</span>
                </div>
            ) : projects.length === 0 ? (
                <div className="px-2 py-6 text-center">
                    <FolderIcon className="size-6 mx-auto mb-2" style={{ color: "#1e2635" }} />
                    <span className="text-[11px]" style={{ color: "#3d4e63" }}>No projects yet</span>
                </div>
            ) : projects.map((p) => (
                <Link key={p._id} href={`/projects/${p._id}`}
                    className="group flex items-center gap-2 px-2 py-[8px] rounded-[6px] transition-all"
                    style={{ textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#161b24"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                    <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: getStatusColor(p) }} />
                    <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium truncate" style={{ color: "#c8d3e0" }}>{p.name}</div>
                        <div className="text-[10px]" style={{ color: "#3d4e63" }}>{fmt(p.updatedAt)}</div>
                    </div>
                    <div className="w-5 h-5 rounded-[4px] flex items-center justify-center flex-shrink-0 opacity-60">
                        {getProjectIcon(p)}
                    </div>
                </Link>
            ))}
        </div>
    );
};

const ChatsPanel = () => (
    <div className="flex flex-col gap-1 px-2">
        <div className="flex items-center justify-between px-2 py-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#64748b" }}>Recent</span>
            <button className="flex items-center gap-1 text-[10px] hover:opacity-70 transition-opacity"
                style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                New <PlusIcon className="size-3" />
            </button>
        </div>
        {MOCK_CHATS.map((chat) => (
            <button key={chat.id}
                className="flex flex-col gap-[3px] px-3 py-[9px] rounded-[6px] text-left transition-all w-full"
                style={{
                    background: chat.active ? "#1c2230" : "transparent",
                    border: chat.active ? "1px solid #243044" : "1px solid transparent",
                    cursor: "pointer", fontFamily: "inherit",
                }}
                onMouseEnter={e => { if (!chat.active) (e.currentTarget as HTMLElement).style.background = "#161b24"; }}
                onMouseLeave={e => { if (!chat.active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium truncate" style={{ color: chat.active ? "#e2e8f0" : "#94a3b8" }}>
                        {chat.title}
                    </span>
                    {chat.active && <span className="w-[6px] h-[6px] rounded-full flex-shrink-0 animate-pulse" style={{ background: "#3b82f6" }} />}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] px-[6px] py-[1px] rounded-[3px]"
                        style={{ background: "#161b24", border: "1px solid #1e2635", color: "#64748b" }}>
                        {chat.model}
                    </span>
                    <span className="text-[10px]" style={{ color: "#3d4e63" }}>{chat.time}</span>
                </div>
            </button>
        ))}
    </div>
);

const LastUpdatedCard = ({ onViewAll }: { onViewAll: () => void }) => {
    const projects = useProjectsPartial(4);
    if (!projects || projects.length === 0) return null;
    const [first, ...rest] = projects;
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#64748b" }}>Last Updated</span>
                <button onClick={onViewAll}
                    className="flex items-center gap-1 text-[11px] hover:opacity-70 transition-opacity"
                    style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    View all <ArrowRightIcon className="size-[13px]" />
                </button>
            </div>
            <Link href={`/projects/${first._id}`}
                className="group flex items-center gap-3 p-4 rounded-[8px] transition-all"
                style={{ background: "#161b24", border: "1px solid #1e2635", textDecoration: "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1d3a6b"; (e.currentTarget as HTMLElement).style.background = "#1c2230"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e2635"; (e.currentTarget as HTMLElement).style.background = "#161b24"; }}
            >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getStatusColor(first) }} />
                <span className="text-[13px] font-medium flex-1 truncate" style={{ color: "#e2e8f0" }}>{first.name}</span>
                <span className="text-[11px]" style={{ color: "#64748b" }}>{fmt(first.updatedAt)}</span>
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-[2px]" style={{ color: "#3b82f6" }} />
            </Link>
            {rest.length > 0 && (
                <div className="rounded-[8px] overflow-hidden" style={{ border: "1px solid #1e2635", background: "#11141a" }}>
                    {rest.map((p, i) => (
                        <div key={p._id} style={{ borderBottom: i < rest.length - 1 ? "1px solid #1e2635" : "none" }}>
                            <Link href={`/projects/${p._id}`}
                                className="group flex items-center gap-3 px-4 py-[9px] transition-all"
                                style={{ textDecoration: "none" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#161b24"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                            >
                                <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: getStatusColor(p) }} />
                                <span className="text-[12px] font-medium flex-1 truncate" style={{ color: "#94a3b8" }}>{p.name}</span>
                                <span className="text-[11px]" style={{ color: "#3d4e63" }}>{fmt(p.updatedAt)}</span>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ProjectsView = () => {
    const [commandDialogOpen, setCommandDialogOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"chats" | "build">("build");
    const createProject = useCreateProject();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSidebarOpen(false);
            if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCommandDialogOpen(true); }
            if ((e.metaKey || e.ctrlKey) && e.key === "b") { e.preventDefault(); setSidebarOpen(v => !v); }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <>
            <ProjectsCommandDialog open={commandDialogOpen} onOpenChange={setCommandDialogOpen} />

            <div className="min-h-screen flex flex-col relative"
                style={{ background: "#0d0f14", fontFamily: "'JetBrains Mono', monospace" }}>

                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(7, 9, 14, 0.6)",
                        backdropFilter: "blur(2px)",
                        zIndex: 30,
                        opacity: sidebarOpen ? 1 : 0,
                        pointerEvents: sidebarOpen ? "auto" : "none",
                        transition: "opacity 0.25s ease",
                    }}
                />

                <div style={{
                    position: "fixed",
                    top: 0, left: 0, bottom: 0,
                    width: "260px",
                    zIndex: 40,
                    background: "#11141a",
                    borderRight: "1px solid #1e2635",
                    transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                    transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: sidebarOpen ? "4px 0 32px rgba(0,0,0,0.5)" : "none",
                }}>
                    <div className="flex items-center gap-2 p-3 flex-shrink-0"
                        style={{ borderBottom: "1px solid #1e2635" }}>
                        <div className="w-7 h-7 rounded-[6px] overflow-hidden flex-shrink-0">
                            <Image src="/blue2.png" alt="Telemetry Studio" width={28} height={28} className="object-cover" />
                        </div>
                        <span className="text-[13px] font-semibold flex-1" style={{ color: "#e2e8f0" }}>
                            Telemetry<span style={{ color: "#3b82f6" }}> Studio</span>
                        </span>
                        <button onClick={() => setSidebarOpen(false)}
                            className="w-7 h-7 flex items-center justify-center rounded-[5px] transition-all flex-shrink-0"
                            style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#161b24"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                        >
                            <XIcon className="size-[14px]" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 px-3 py-2 flex-shrink-0"
                        style={{ borderBottom: "1px solid #1e2635" }}>
                        {(["chats", "build"] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className="flex-1 flex items-center justify-center gap-[6px] py-[7px] rounded-[6px] text-[12px] font-medium transition-all"
                                style={{
                                    background: activeTab === tab ? "#161b24" : "transparent",
                                    border: activeTab === tab ? "1px solid #243044" : "1px solid transparent",
                                    color: activeTab === tab ? "#e2e8f0" : "#64748b",
                                    cursor: "pointer", fontFamily: "inherit",
                                }}>
                                {tab === "chats" ? <MessageSquareIcon className="size-[13px]" /> : <FolderIcon className="size-[13px]" />}
                                {tab === "chats" ? "Chats" : "Build"}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto py-2"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2635 transparent" }}>
                        <div key={activeTab} style={{ animation: "fadeSlideIn 0.2s ease both" }}>
                            {activeTab === "build"
                                ? <BuildPanel onViewAll={() => { setSidebarOpen(false); setCommandDialogOpen(true); }} />
                                : <ChatsPanel />
                            }
                        </div>
                    </div>

                    <div className="flex items-center gap-1 p-2 flex-shrink-0"
                        style={{ borderTop: "1px solid #1e2635" }}>
                        <button className="w-8 h-8 flex items-center justify-center rounded-[6px] transition-all"
                            style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#161b24"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                            <SettingsIcon className="size-4" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-[6px] transition-all"
                            style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#161b24"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                            <UserIcon className="size-4" />
                        </button>
                    </div>
                </div>

                <div className="h-12 flex items-center px-4 gap-3 flex-shrink-0 relative z-20"
                    style={{ background: "#11141a", borderBottom: "1px solid #1e2635" }}>

                    <button onClick={() => setSidebarOpen(v => !v)}
                        title="Toggle sidebar (ctrl+B)"
                        className="w-8 h-8 flex items-center justify-center rounded-[6px] transition-all flex-shrink-0"
                        style={{
                            color: sidebarOpen ? "#3b82f6" : "#64748b",
                            background: sidebarOpen ? "rgba(59,130,246,0.1)" : "none",
                            border: "none", cursor: "pointer"
                        }}
                        onMouseEnter={e => { if (!sidebarOpen) (e.currentTarget as HTMLElement).style.background = "#161b24"; }}
                        onMouseLeave={e => { if (!sidebarOpen) (e.currentTarget as HTMLElement).style.background = "none"; }}
                    >
                        <PanelLeftIcon className="size-[18px]" />
                    </button>

                    <button onClick={() => setCommandDialogOpen(true)}
                        className="flex-1 flex items-center gap-2 rounded-[6px] px-3 py-[7px] transition-all text-left"
                        style={{ background: "#161b24", border: "1px solid #1e2635", color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
                        <SearchIcon className="size-[14px] flex-shrink-0" />
                        <span className="text-[12px] flex-1 hidden sm:block">Search files or run commands...</span>
                        <span className="text-[12px] flex-1 sm:hidden">Search...</span>
                        <Kbd className="text-[10px] hidden sm:flex flex-shrink-0" style={{ background: "#0d0f14", border: "1px solid #243044" }}>ctrl K</Kbd>
                    </button>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden relative">

                    <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: "linear-gradient(#1e2635 1px, transparent 1px), linear-gradient(90deg, #1e2635 1px, transparent 1px)",
                        backgroundSize: "48px 48px", opacity: 0.35,
                        maskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, black, transparent)"
                    }} />
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: "radial-gradient(circle 350px at 50% 45%, rgba(59,130,246,0.06), transparent)"
                    }} />

                    <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
                        <div className="w-full max-w-[520px] flex flex-col gap-7">

                          
                            <div className="flex flex-col items-center gap-4 mb-1">
                                <div className="w-14 h-14 rounded-[12px] overflow-hidden">
                                    <Image src="/blue2.png" alt="Telemetry Studio" width={56} height={56} className="object-cover" />
                                </div>
                                <h1 className={cn("text-2xl font-bold tracking-tight", font.className)} style={{ color: "#e2e8f0" }}>
                                    Telemetry<span style={{ color: "#3b82f6" }}> Studio</span>
                                </h1>
                                <span className="text-[11px] px-3 py-1 rounded-full"
                                    style={{ color: "#64748b", border: "1px solid #1e2635", letterSpacing: "0.1em" }}>
                                    v0.4.1-beta
                                </span>
                            </div>

                
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    {
                                        icon: <SparkleIcon className="size-4" style={{ color: "#3b82f6" }} />,
                                        label: "New Project", sub: "Start from scratch", kbd: "ctrl+J",
                                        onClick: () => createProject({
                                            name: uniqueNamesGenerator({ dictionaries: [adjectives, animals, colors], separator: "-", length: 3 })
                                        }),
                                    },
                                    {
                                        icon: <FaGithub className="size-4" style={{ color: "#64748b" }} />,
                                        label: "Import", sub: "From GitHub repo", kbd: "ctrl+I",
                                        onClick: () => { },
                                    },
                                ].map((btn) => (
                                    <button key={btn.label} onClick={btn.onClick}
                                        className="flex flex-col gap-5 p-5 rounded-[8px] text-left transition-all"
                                        style={{ background: "#161b24", border: "1px solid #1e2635", cursor: "pointer", fontFamily: "inherit" }}
                                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#1d3a6b"; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 6px 20px rgba(0,0,0,0.35)"; }}
                                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#1e2635"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="w-9 h-9 rounded-[6px] flex items-center justify-center"
                                                style={{ background: "#1c2230", border: "1px solid #243044" }}>
                                                {btn.icon}
                                            </div>
                                            <Kbd className="text-[10px] hidden sm:flex" style={{ background: "#0d0f14", border: "1px solid #243044", color: "#64748b" }}>
                                                {btn.kbd}
                                            </Kbd>
                                        </div>
                                        <div>
                                            <div className="text-[13px] font-semibold" style={{ color: "#e2e8f0", letterSpacing: "0.04em" }}>{btn.label}</div>
                                            <div className="text-[11px] mt-1" style={{ color: "#64748b" }}>{btn.sub}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <LastUpdatedCard onViewAll={() => setCommandDialogOpen(true)} />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateX(-8px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </>
    );
};