"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StudioPromptBox } from "@/components/studio-prompt-box";

import { useCreateProjectWithPrompt } from "../hooks/use-create-project-with-prompt";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewProjectDialog = ({
  open,
  onOpenChange,
}: NewProjectDialogProps) => {
  const [input, setInput] = useState("");
  const { createProject, isSubmitting } = useCreateProjectWithPrompt();

  const handleSubmit = async (text: string) => {
    const created = await createProject(text);
    if (created) {
      onOpenChange(false);
      setInput("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xl p-0 border-none bg-transparent shadow-none"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>What do you want to build?</DialogTitle>
          <DialogDescription>
            Describe your project and AI will help you create it.
          </DialogDescription>
        </DialogHeader>
        <StudioPromptBox
          size="lg"
          autoFocus
          value={input}
          onValueChange={setInput}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
          submitLabel={isSubmitting ? "Creating…" : "Build"}
          placeholder="Describe the app you want to build…"
          className="bg-popover"
        />
      </DialogContent>
    </Dialog>
  );
};
