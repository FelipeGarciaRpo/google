"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { FaGithub } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { AlertCircleIcon, ArrowUpRightIcon, LayoutGridIcon, Loader2Icon } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { StudioPromptBox } from "@/components/studio-prompt-box";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingHeadline, LandingShell, LANDING_SUGGESTIONS } from "@/features/landing/components/landing-shell";
import { ModelSelector } from "@/features/ai/components/model-selector";
import { useSelectedModel } from "@/features/ai/hooks/use-selected-model";

import { useProjectsPartial } from "../hooks/use-project";
import { useCreateProjectWithPrompt } from "../hooks/use-create-project-with-prompt";
import { ProjectsCommandDialog } from "./projects-command-dialog";
import { ImportGithubDialog } from "./import-github-dialog";
import { Doc } from "../../../../convex/_generated/dataModel";

const ProjectStatusIcon = ({ project }: { project: Doc<"projects"> }) => {
    if (project.importStatus === "importing") return <Loader2Icon className="size-4 animate-spin text-amber-500" />;
    if (project.importStatus === "failed") return <AlertCircleIcon className="size-4 text-destructive" />;
    if (project.importStatus === "completed") return <FaGithub className="size-4 text-muted-foreground" />;
    return <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />;
};

const RecentProjects = ({ onViewAll }: { onViewAll: () => void }) => {
    const projects = useProjectsPartial(4);

    if (!projects || projects.length === 0) return null;

    return (
        <section className="w-full max-w-4xl animate-fade-in-up [animation-delay:150ms]">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-medium text-muted-foreground">Recent projects</h2>
                <button
                    type="button"
                    onClick={onViewAll}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    View all <Kbd>Ctrl K</Kbd>
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {projects.map((project) => (
                    <Link
                        key={project._id}
                        href={`/projects/${project._id}`}
                        className="group flex flex-col justify-between gap-6 rounded-xl border bg-card/70 backdrop-blur p-4 transition-colors hover:bg-surface-hover"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium truncate">{project.name}</span>
                            <ProjectStatusIcon project={project} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export const ProjectsView = () => {
    const [prompt, setPrompt] = useState("");
    const [commandDialogOpen, setCommandDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const promptRef = useRef<HTMLTextAreaElement>(null);
    const [modelId, setModelId] = useSelectedModel();

    const { createProject, isSubmitting, isOpening, warmUp } = useCreateProjectWithPrompt();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey)) return;
            if (e.key === "k") { e.preventDefault(); setCommandDialogOpen(true); }
            if (e.key === "i") { e.preventDefault(); setImportDialogOpen(true); }
            if (e.key === "j") { e.preventDefault(); promptRef.current?.focus(); }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <>
            <ProjectsCommandDialog open={commandDialogOpen} onOpenChange={setCommandDialogOpen} />
            <ImportGithubDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

            <LandingShell
                headerActions={
                    <>
                        <button
                            type="button"
                            onClick={() => setCommandDialogOpen(true)}
                            className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-full text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <LayoutGridIcon className="size-4" />
                            My projects
                        </button>
                        <ThemeToggle />
                        <div className="ml-1 flex items-center"><UserButton /></div>
                    </>
                }
            >
                <div className="flex flex-col items-center px-5 sm:px-8 pt-[12vh] pb-20 gap-16">
                    <div className="w-full flex flex-col items-center">
                        <LandingHeadline />

                        <StudioPromptBox
                            textareaRef={promptRef}
                            size="lg"
                            value={prompt}
                            onValueChange={(value) => {
                                setPrompt(value);
                                warmUp();
                            }}
                            onSubmit={createProject}
                            disabled={isSubmitting || isOpening}
                            submitLabel={isSubmitting ? "Creating project…" : isOpening ? "Opening project…" : "Build"}
                            placeholder="Describe the app you want to build…"
                            className="mt-10 max-w-2xl bg-card/80 backdrop-blur-xl animate-fade-in-up [animation-delay:80ms]"
                            toolbar={
                                <>
                                    <ModelSelector value={modelId} onChange={setModelId} />
                                    <button
                                        type="button"
                                        onClick={() => setImportDialogOpen(true)}
                                        className="flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                                    >
                                        <FaGithub className="size-3.5" />
                                        Import repo
                                    </button>
                                </>
                            }
                        />

                        <div className="mt-4 flex flex-wrap justify-center gap-2 animate-fade-in-up [animation-delay:120ms]">
                            {LANDING_SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion.label}
                                    type="button"
                                    onClick={() => {
                                        setPrompt(suggestion.prompt);
                                        warmUp();
                                        promptRef.current?.focus();
                                    }}
                                    className="h-8 px-3.5 rounded-full border bg-background/60 backdrop-blur text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    {suggestion.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <RecentProjects onViewAll={() => setCommandDialogOpen(true)} />
                </div>
            </LandingShell>
        </>
    );
};
