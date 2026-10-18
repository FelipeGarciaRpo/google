"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

const LINK_DISTANCE = 96;
const MOUSE_RADIUS = 130;

// Reads --primary (a #rrggbb token) so the particles follow the theme
const readPrimaryRgb = () => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim()
    .replace("#", "");
  if (value.length !== 6) return "138,180,248";
  const n = parseInt(value, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

// Sparse particles drifting upward ("antigravity") that move away from the cursor
export const ParticleField = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let particles: Particle[] = [];
    let rgb = readPrimaryRgb();
    const mouse = { x: -9999, y: -9999 };

    const seed = () => {
      const count = Math.round(Math.min(120, (width * height) / 13000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -(0.04 + Math.random() * 0.16),
        radius: 0.6 + Math.random() * 1.3,
        alpha: 0.2 + Math.random() * 0.5,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < MOUSE_RADIUS * MOUSE_RADIUS) {
          const dist = Math.sqrt(distSq) || 1;
          const force = (1 - dist / MOUSE_RADIUS) * 0.9;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
        }

        // Wrap around so the field never empties
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.alpha})`;
        ctx.fill();
      }

      // Faint links between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > LINK_DISTANCE * LINK_DISTANCE) continue;
          const alpha = (1 - Math.sqrt(distSq) / LINK_DISTANCE) * 0.12;
          ctx.strokeStyle = `rgba(${rgb},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    };

    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handlePointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    // Re-read the color when the theme class on <html> changes
    const themeObserver = new MutationObserver(() => {
      rgb = readPrimaryRgb();
      if (reduceMotion) draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw();
    });
    resizeObserver.observe(canvas);

    resize();
    if (reduceMotion) {
      draw();
    } else {
      window.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerleave", handlePointerLeave);
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none size-full",
        "[mask-image:radial-gradient(ellipse_75%_65%_at_50%_40%,black,transparent)]",
        className
      )}
    />
  );
};
