import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  collapsed?: boolean;
  className?: string;
}

// Logo + wordmark, styled like the "Google AI Studio" header wordmark
export const BrandMark = ({ collapsed = false, className }: BrandMarkProps) => {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 min-w-0", className)}
      aria-label="Telemetry Studio home"
    >
      <span className="relative size-7 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
        <Image
          src="/blue2.png"
          alt=""
          fill
          sizes="28px"
          className="object-cover scale-125"
        />
      </span>
      {!collapsed && (
        <span className="text-[17px] tracking-tight truncate text-foreground">
          <span className="font-medium">Telemetry</span>
          <span className="font-normal text-muted-foreground"> Studio</span>
        </span>
      )}
    </Link>
  );
};
