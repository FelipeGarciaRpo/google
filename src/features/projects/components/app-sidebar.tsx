"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useClerk, UserButton, useUser } from "@clerk/nextjs";
import { FaGithub } from "react-icons/fa";
import {
    LayoutGridIcon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
    PlusIcon,
    SearchIcon,
    SparklesIcon,
    UserCogIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useProjectsPartial } from "../hooks/use-project";
import { NewProjectDialog } from "./new-project-dialog";
import { ImportGithubDialog } from "./import-github-dialog";
import { ProjectsCommandDialog } from "./projects-command-dialog";

import { Id } from "../../../../convex/_generated/dataModel";

const SectionLabel = ({ children, collapsed }: { children: string; collapsed: boolean }) => {
    if (collapsed) return <div className="h-px bg-sidebar-border mx-3 my-3" />;
    return (
        <div className="px-3 pt-5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {children}
        </div>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    collapsed: boolean;
    active?: boolean;
    href?: string;
    onClick?: () => void;
    hint?: string;
}

const NavItem = ({ icon, label, collapsed, active, href, onClick, hint }: NavItemProps) => {
    const className = cn(
        "flex items-center gap-3 h-8 rounded-lg px-3 text-sm transition-colors w-full",
        "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        collapsed && "justify-center px-0"
    );

    const content = (
        <>
            <span className="shrink-0 flex items-center justify-center size-[18px]">{icon}</span>
            {!collapsed && <span className="truncate flex-1 text-left">{label}</span>}
            {!collapsed && hint && (
                <span className="text-[11px] text-muted-foreground">{hint}</span>
            )}
        </>
    );

    const item = href ? (
        <Link href={href} className={className}>{content}</Link>
    ) : (
        <button type="button" onClick={onClick} className={className}>{content}</button>
    );

    if (!collapsed) return item;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{item}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
};

interface AppSidebarProps {
    activeProjectId?: Id<"projects">;
}

export const AppSidebar = ({ activeProjectId }: AppSidebarProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const [newProjectOpen, setNewProjectOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [projectsOpen, setProjectsOpen] = useState(false);

    const recentProjects = useProjectsPartial(6);
    const { has } = useAuth();
    const { user } = useUser();
    const { openUserProfile } = useClerk();

    const isPro = has?.({ plan: "pro" }) ?? false;
    const email = user?.primaryEmailAddress?.emailAddress;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey)) return;
            // Inside the code editor Ctrl+K belongs to Quick Edit
            if (e.defaultPrevented) return;
            if ((e.target as HTMLElement | null)?.closest?.(".cm-editor")) return;
            if (e.key === "k") { e.preventDefault(); setProjectsOpen(true); }
            if (e.key === "i") { e.preventDefault(); setImportOpen(true); }
            if (e.key === "j") { e.preventDefault(); setNewProjectOpen(true); }
            if (e.key === "b") { e.preventDefault(); setCollapsed((value) => !value); }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <TooltipProvider delayDuration={300}>
            <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
            <ImportGithubDialog open={importOpen} onOpenChange={setImportOpen} />
            <ProjectsCommandDialog open={projectsOpen} onOpenChange={setProjectsOpen} />

            <aside
                className={cn(
                    "h-full shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border",
                    "transition-[width] duration-200 ease-out",
                    collapsed ? "w-[64px]" : "w-[248px]"
                )}
            >
                {/* Header */}
                <div className={cn(
                    "h-14 flex items-center shrink-0",
                    collapsed ? "justify-center" : "justify-between pl-4 pr-2"
                )}>
                    {!collapsed && <BrandMark />}
                    <button
                        type="button"
                        onClick={() => setCollapsed((value) => !value)}
                        className="size-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                        title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
                    >
                        {collapsed
                            ? <PanelLeftOpenIcon className="size-[18px]" />
                            : <PanelLeftCloseIcon className="size-[18px]" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-2 pb-2">
                    <SectionLabel collapsed={collapsed}>Build</SectionLabel>
                    <div className="flex flex-col gap-0.5">
                        <NavItem
                            collapsed={collapsed}
                            icon={<PlusIcon className="size-[18px]" />}
                            label="New project"
                            hint="Ctrl J"
                            onClick={() => setNewProjectOpen(true)}
                        />
                        <NavItem
                            collapsed={collapsed}
                            icon={<LayoutGridIcon className="size-[17px]" />}
                            label="My projects"
                            hint="Ctrl K"
                            onClick={() => setProjectsOpen(true)}
                        />
                        <NavItem
                            collapsed={collapsed}
                            icon={<FaGithub className="size-4" />}
                            label="Import from GitHub"
                            onClick={() => setImportOpen(true)}
                        />
                    </div>

                    <SectionLabel collapsed={collapsed}>Recent</SectionLabel>
                    <div className="flex flex-col gap-0.5">
                        {recentProjects?.map((project) => (
                            <NavItem
                                key={project._id}
                                collapsed={collapsed}
                                active={project._id === activeProjectId}
                                href={`/projects/${project._id}`}
                                label={project.name}
                                icon={
                                    <span className={cn(
                                        "size-1.5 rounded-full",
                                        project.importStatus === "importing" && "bg-amber-400 animate-pulse",
                                        project.importStatus === "failed" && "bg-destructive",
                                        project.importStatus !== "importing" && project.importStatus !== "failed" && "bg-muted-foreground/60",
                                        project._id === activeProjectId && "bg-primary"
                                    )} />
                                }
                            />
                        ))}
                        {recentProjects?.length === 0 && !collapsed && (
                            <p className="px-3 py-1 text-xs text-muted-foreground">No projects yet</p>
                        )}
                    </div>

                    <SectionLabel collapsed={collapsed}>Manage</SectionLabel>
                    <NavItem
                        collapsed={collapsed}
                        icon={<UserCogIcon className="size-[18px]" />}
                        label="Account & billing"
                        onClick={() => openUserProfile()}
                    />
                </nav>

                {/* Footer */}
                <div className={cn("shrink-0 flex flex-col gap-2 p-2", collapsed && "items-center")}>
                    {!isPro && !collapsed && (
                        // Gradient border, like the AI Studio promo card: a 1px gradient frame
                        // around a panel painted with the sidebar color
                        <button
                            type="button"
                            onClick={() => openUserProfile()}
                            className="group rounded-xl p-px text-left"
                            style={{ background: "linear-gradient(135deg, var(--brand-from), var(--brand-to))" }}
                        >
                            <span className="flex flex-col gap-0.5 rounded-[11px] bg-sidebar px-3 py-2 transition-colors group-hover:bg-card">
                                <span className="flex items-center gap-1.5 text-[13px] font-medium">
                                    <SparklesIcon className="size-3.5 text-primary" />
                                    Upgrade to Pro
                                </span>
                                <span className="text-[11px] text-muted-foreground leading-snug">
                                    GitHub import and export
                                </span>
                            </span>
                        </button>
                    )}

                    <div className={cn("flex items-center gap-1", collapsed ? "flex-col" : "px-1")}>
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => setProjectsOpen(true)}
                            className="size-9 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Search projects (Ctrl+K)"
                        >
                            <SearchIcon className="size-[18px]" />
                        </button>
                    </div>

                    <div className={cn(
                        "flex items-center gap-2.5 rounded-lg border border-sidebar-border",
                        collapsed ? "p-1.5" : "px-2.5 py-2"
                    )}>
                        <UserButton />
                        {!collapsed && (
                            <span className="text-xs text-muted-foreground truncate">
                                {email ?? "Account"}
                            </span>
                        )}
                    </div>
                </div>
            </aside>
        </TooltipProvider>
    );
};
