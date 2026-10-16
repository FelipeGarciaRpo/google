"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex items-center justify-center size-9 rounded-full text-muted-foreground",
        "hover:bg-accent hover:text-foreground transition-colors",
        className
      )}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {/* Both icons render and CSS picks one, so server and client markup match */}
      <SunIcon className="size-[18px] hidden dark:block" />
      <MoonIcon className="size-[18px] dark:hidden" />
    </button>
  );
};
