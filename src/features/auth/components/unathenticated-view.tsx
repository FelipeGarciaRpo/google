"use client";

import { useState } from "react";
import { SignInButton, SignUpButton, useClerk } from "@clerk/nextjs";

import { StudioPromptBox } from "@/components/studio-prompt-box";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingHeadline, LandingShell, LANDING_SUGGESTIONS } from "@/features/landing/components/landing-shell";

// Public landing: same hero as the signed-in home, but building asks to sign in first
export const UnauthenticatedView = ()=>{
    const [prompt, setPrompt] = useState("");
    const { openSignIn } = useClerk();

    return (
        <LandingShell
            headerActions={
                <>
                    <ThemeToggle />
                    <SignInButton mode="modal">
                        <button
                            type="button"
                            className="h-9 px-4 rounded-full text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            Sign in
                        </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                        <button
                            type="button"
                            className="h-9 px-4 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
                        >
                            Get started
                        </button>
                    </SignUpButton>
                </>
            }
        >
            <div className="flex flex-col items-center px-5 sm:px-8 pt-[14vh] pb-20">
                <LandingHeadline />

                <StudioPromptBox
                    size="lg"
                    value={prompt}
                    onValueChange={setPrompt}
                    onSubmit={() => openSignIn()}
                    submitLabel="Build"
                    placeholder="Describe the app you want to build…"
                    className="mt-10 max-w-2xl bg-card/80 backdrop-blur-xl animate-fade-in-up [animation-delay:80ms]"
                />

                <div className="mt-4 flex flex-wrap justify-center gap-2 animate-fade-in-up [animation-delay:120ms]">
                    {LANDING_SUGGESTIONS.map((suggestion) => (
                        <button
                            key={suggestion.label}
                            type="button"
                            onClick={() => setPrompt(suggestion.prompt)}
                            className="h-8 px-3.5 rounded-full border bg-background/60 backdrop-blur text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            {suggestion.label}
                        </button>
                    ))}
                </div>
            </div>
        </LandingShell>
    )
}
