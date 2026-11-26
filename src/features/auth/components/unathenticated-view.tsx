"use client";

import { useState } from "react";
import { SignInButton, SignUpButton, useClerk } from "@clerk/nextjs";

import { StudioPromptBox } from "@/components/studio-prompt-box";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingHeadline, LandingShell, LandingSuggestions } from "@/features/landing/components/landing-shell";
import {
    LandingClosing,
    LandingFooter,
    LandingInside,
    LandingMoments,
    StudioShot,
} from "@/features/landing/components/landing-sections";

// Public landing: the prompt box beside the product, then what it does. Building asks to sign in first
export const UnauthenticatedView = ()=>{
    const [prompt, setPrompt] = useState("");
    const { openSignIn } = useClerk();

    return (
        <LandingShell
            headerActions={
                <>
                    <ThemeToggle />
                    {/* Hidden on a phone, where the bar has no room: "Get started" and "Build" both lead to sign in */}
                    <SignInButton mode="modal">
                        <button
                            type="button"
                            className="hidden sm:block h-9 px-4 rounded-full text-sm whitespace-nowrap text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            Sign in
                        </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                        <button
                            type="button"
                            className="shrink-0 h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap bg-primary text-primary-foreground hover:opacity-90"
                        >
                            Get started
                        </button>
                    </SignUpButton>
                </>
            }
        >
            <section className="mx-auto flex w-full max-w-336 flex-col gap-12 px-5 pt-10 pb-20 sm:px-8 xl:flex-row xl:items-center xl:gap-16 xl:pt-14 xl:pb-24">
                <div className="flex w-full max-w-150 shrink-0 flex-col xl:w-150">
                    <LandingHeadline />

                    <StudioPromptBox
                        size="lg"
                        value={prompt}
                        onValueChange={setPrompt}
                        onSubmit={() => openSignIn()}
                        submitLabel="Build"
                        placeholder="Describe the app you want to build…"
                        className="mt-7 max-w-140 shadow-none animate-fade-in-up [animation-delay:80ms]"
                    />

                    <LandingSuggestions onPick={setPrompt} className="mt-3.5" />
                </div>

                <StudioShot />
            </section>

            <LandingMoments />
            <LandingInside />
            <LandingClosing />
            <LandingFooter />
        </LandingShell>
    )
}
