import { useState } from "react";
import ky from "ky";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Id } from "../../../../convex/_generated/dataModel";

// Creates a project + conversation from a prompt and opens it
export const useCreateProjectWithPrompt = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createProject = async (prompt: string) => {
        if (!prompt.trim() || isSubmitting) return false;

        setIsSubmitting(true);

        try {
            const { projectId } = await ky
                .post("/api/projects/create-with-prompt", {
                    json: { prompt: prompt.trim() },
                })
                .json<{ projectId: Id<"projects"> }>();

            toast.success("Project created");
            router.push(`/projects/${projectId}`);
            return true;
        } catch {
            toast.error("Unable to create project");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { createProject, isSubmitting };
};
