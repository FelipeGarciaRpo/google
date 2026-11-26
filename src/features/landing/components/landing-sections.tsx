"use client";

import Image from "next/image";
import { SignUpButton } from "@clerk/nextjs";

import { Kbd } from "@/components/ui/kbd";

// The studio after a real run: the conversation with the agent and the app it built.
// On wide screens it is wider than its column and runs past the right edge of the page.
export const StudioShot = () => {
  return (
    // No entrance animation here: it is the largest thing above the fold, so it should paint at once
    <figure className="min-w-0 flex-1">
      <div className="overflow-hidden rounded-[14px] border bg-card shadow-[0_30px_60px_-36px_rgb(0_0_0/0.5)] xl:w-[clamp(40rem,calc((100vw-43.5rem)*1.3),53.75rem)]">
        <Image
          src="/landing/studio-run.jpg"
          alt="The studio after building a pomodoro timer: the conversation with the agent on the left and the running app on the right"
          width={1666}
          height={945}
          preload
          sizes="(min-width: 1280px) 860px, 100vw"
          className="h-auto w-full"
        />
      </div>
    </figure>
  );
};

const MOMENTS = [
  {
    image: "/landing/agent-progress.jpg",
    width: 480,
    height: 320,
    alt: "The agent's progress while it builds: the steps done so far and the one in progress",
    title: "The agent works in the open",
    text: "It reads your request, creates the files and runs the build. Each step shows up as it happens, and you can leave the page: it keeps working.",
  },
  {
    image: "/landing/live-preview.jpg",
    width: 666,
    height: 444,
    alt: "The pomodoro timer it built, running in the live preview",
    title: "It runs in your browser",
    text: "The app starts in a live preview next to the code, in a sandbox on your machine. There is nothing to install.",
  },
  {
    image: "/landing/editor.jpg",
    width: 930,
    height: 620,
    alt: "The generated code open in the editor, with the project's files beside it",
    title: "The code is yours",
    text: "Every file opens in an editor with AI autocomplete. Edit it yourself, ask for changes or download it as a ZIP.",
  },
];

// Three real moments of a build, each with its screenshot
export const LandingMoments = () => {
  return (
    <section className="mx-auto w-full max-w-336 px-5 sm:px-8">
      <div className="flex flex-col gap-9 border-t py-16">
        <h2 className="text-[clamp(1.75rem,3.4vw,2.125rem)] font-medium leading-[1.15] tracking-[-0.025em]">
          From a sentence to a running app
        </h2>
        <div className="grid gap-x-8 gap-y-10 md:grid-cols-3">
          {MOMENTS.map((moment) => (
            <figure key={moment.title} className="flex flex-col gap-4.5">
              <div className="overflow-hidden rounded-xl border bg-card">
                <Image
                  src={moment.image}
                  alt={moment.alt}
                  width={moment.width}
                  height={moment.height}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="aspect-3/2 h-auto w-full object-cover"
                />
              </div>
              <figcaption className="flex flex-col gap-1.5">
                <h3 className="text-xl font-medium tracking-[-0.01em]">{moment.title}</h3>
                <p className="leading-[1.55] text-muted-foreground text-pretty">{moment.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

// What the studio comes with, as a plain list
export const LandingInside = () => {
  return (
    <section className="mx-auto w-full max-w-336 px-5 sm:px-8">
      <div className="flex flex-col gap-x-16 gap-y-7 border-t py-16 lg:flex-row">
        <h2 className="shrink-0 text-[clamp(1.75rem,3.4vw,2.125rem)] font-medium leading-[1.15] tracking-[-0.025em] lg:w-85">
          What&apos;s inside
        </h2>
        <dl className="flex min-w-0 flex-1 flex-col border-b">
          <InsideRow term="Agent">
            Twelve tools: it searches, reads, creates and edits files, runs commands and reads web
            pages you point it to.
          </InsideRow>
          <InsideRow term="Sandbox">
            Builds and tests run in your browser. React, Next.js, Vue, Angular and Express
            projects, and Python too.
          </InsideRow>
          <InsideRow term="Editor">
            Syntax highlighting, AI autocomplete and quick edits with <Kbd>Ctrl K</Kbd>.
          </InsideRow>
          <InsideRow term="Terminal">Your own shell in the project sandbox.</InsideRow>
          <InsideRow term="Export">
            Download a ZIP. GitHub import and export come with Pro.
          </InsideRow>
        </dl>
      </div>
    </section>
  );
};

const InsideRow = ({ term, children }: { term: string; children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-x-6 gap-y-1 border-t py-4 sm:flex-row">
      <dt className="shrink-0 font-medium sm:w-35">{term}</dt>
      <dd className="min-w-0 flex-1 leading-[1.55] text-muted-foreground">{children}</dd>
    </div>
  );
};

// The same call to action as the header, at the end of the page
export const LandingClosing = () => {
  return (
    <section className="mx-auto w-full max-w-336 px-5 pb-18 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 rounded-[22px] bg-surface px-7 py-8 sm:px-9">
        <p className="text-[clamp(1.375rem,3vw,1.75rem)] font-medium leading-tight tracking-[-0.02em]">
          Start with a sentence.
        </p>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="h-12 px-6 rounded-full font-medium bg-primary text-primary-foreground hover:opacity-90"
          >
            Get started
          </button>
        </SignUpButton>
      </div>
    </section>
  );
};

export const LandingFooter = () => {
  return (
    <footer className="mx-auto mt-auto w-full max-w-336 px-5 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t py-6 text-[13px] text-muted-foreground">
        <span>Telemetry Studio · portfolio project</span>
        <span>AI can make mistakes, so review the code before you ship it.</span>
      </div>
    </footer>
  );
};
