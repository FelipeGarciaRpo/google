import { useCallback, useRef, useState, useTransition } from "react";
import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useSelectedModel } from "@/features/ai/hooks/use-selected-model";

import { Id } from "../../../../convex/_generated/dataModel";

// Creates a project + conversation from a prompt and opens it
export const useCreateProjectWithPrompt = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Stays true from the redirect until the project page has rendered
    const [isOpening, startOpening] = useTransition();
    const [modelId] = useSelectedModel();
    const warmedUpRef = useRef(false);

    // Development only: Next compiles a page the first time it's visited and the
    // project page is the heaviest one, so request it in the background while the
    // user is still typing. router.prefetch() does nothing in development.
    const warmUp = useCallback(() => {
        if (process.env.NODE_ENV !== "development" || warmedUpRef.current) return;
        warmedUpRef.current = true;
        fetch("/projects/warmup", { redirect: "manual" }).catch(() => {});
    }, []);

    const createProject = async (prompt: string) => {
        if (!prompt.trim() || isSubmitting || isOpening) return false;

        setIsSubmitting(true);

        try {
            const { projectId } = await ky
                .post("/api/projects/create-with-prompt", {
                    json: { prompt: prompt.trim(), model: modelId },
                })
                .json<{ projectId: Id<"projects"> }>();

            toast.success("Project created", {
                description: "Opening it now, the agent is already working.",
            });
            startOpening(() => {
                router.push(`/projects/${projectId}`);
            });
            return true;
        } catch (error) {
            // Show the server's reason (e.g. Inngest not running) when there is one
            const body = error instanceof HTTPError
                ? await error.response.json<{ error?: string }>().catch(() => null)
                : null;
            toast.error(body?.error ?? "Unable to create project");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { createProject, isSubmitting, isOpening, warmUp };
};
