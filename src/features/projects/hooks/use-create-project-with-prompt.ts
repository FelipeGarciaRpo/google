import { useState } from "react";
import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useSelectedModel } from "@/features/ai/hooks/use-selected-model";

import { Id } from "../../../../convex/_generated/dataModel";

// Creates a project + conversation from a prompt and opens it
export const useCreateProjectWithPrompt = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modelId] = useSelectedModel();

    const createProject = async (prompt: string) => {
        if (!prompt.trim() || isSubmitting) return false;

        setIsSubmitting(true);

        try {
            const { projectId } = await ky
                .post("/api/projects/create-with-prompt", {
                    json: { prompt: prompt.trim(), model: modelId },
                })
                .json<{ projectId: Id<"projects"> }>();

            toast.success("Project created");
            router.push(`/projects/${projectId}`);
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

    return { createProject, isSubmitting };
};
