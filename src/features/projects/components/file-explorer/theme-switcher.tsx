"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme, THEMES ,THEME_GROUPS, type ThemeId} from "../../hooks/use-theme";
import { Palette } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  const activeTheme = THEMES.find((t) => t.id === theme)!;
 
  return (
    <div ref={ref} className="relative h-full">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 h-full px-3 cursor-pointer text-muted-foreground border-l",
          "hover:bg-accent/30 transition-colors duration-150",
          open && "bg-accent/20 text-foreground"
        )}
        title="Change theme"
      >
        {/* Swatch(es) activos */}
        <SwatchDot theme={activeTheme} size="sm" />
        <Palette className="size-3.5" />
      </button>
 
      {/* Popover */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+4px)] z-50 w-60",
            "bg-card border border-border rounded-md shadow-xl",
            "animate-fade-in-up overflow-hidden"
          )}
          style={{ boxShadow: "0 8px 32px oklch(0 0 0 / 50%), 0 0 0 1px oklch(1 0 0 / 6%)" }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
              Editor Theme
            </span>
          </div>
 
          {/* Grupos */}
          <div className="p-1.5 flex flex-col gap-3 max-h-[420px] overflow-y-auto">
            {THEME_GROUPS.map((group) => {
              const groupThemes = THEMES.filter((t) => t.group === group);
              return (
                <div key={group}>
                  {/* Label del grupo */}
                  <div className="px-2 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                      {group}
                    </span>
                  </div>
 
                  {/* Temas del grupo */}
                  <div className="flex flex-col gap-0.5">
                    {groupThemes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id as ThemeId);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 w-full px-2.5 py-1.5 rounded-sm text-left",
                          "transition-colors duration-100 hover:bg-accent/30",
                          theme === t.id
                            ? "bg-accent/20 text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        <SwatchDot theme={t} size="md" active={theme === t.id} />
 
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-medium leading-tight truncate">
                            {t.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-tight truncate">
                            {t.description}
                          </span>
                        </div>
 
                        {theme === t.id && (
                          <span
                            className="ml-auto text-[10px] font-bold flex-shrink-0"
                            style={{ color: t.color }}
                          >
                            ✦
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
 
/* ── Swatch helper ─────────────────────────────────────────── */
function SwatchDot({
  theme,
  size,
  active = false,
}: {
  theme: (typeof THEMES)[number];
  size: "sm" | "md";
  active?: boolean;
}) {
  const dim = size === "sm" ? "size-2.5" : "size-3.5";
 
  // Split: dos medios círculos
  if (theme.splitColor) {
    return (
      <span
        className={cn("flex-shrink-0 rounded-full overflow-hidden ring-1 ring-white/10", dim)}
        style={{
          background: `linear-gradient(90deg, ${theme.color} 50%, ${theme.splitColor} 50%)`,
          boxShadow: active
            ? `0 0 8px ${theme.color}bb, 0 0 16px ${theme.color}44`
            : `0 0 4px ${theme.color}55`,
        }}
      />
    );
  }
 
  // Simple: un círculo sólido
  return (
    <span
      className={cn("flex-shrink-0 rounded-full ring-1 ring-white/10", dim)}
      style={{
        backgroundColor: theme.color,
        boxShadow: active
          ? `0 0 8px ${theme.color}bb, 0 0 16px ${theme.color}44`
          : `0 0 4px ${theme.color}55`,
      }}
    />
  );
}