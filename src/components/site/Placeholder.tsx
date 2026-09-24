import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Explicit placeholder for imagery we do not have yet.
 * Never presented as a real Easternbay photograph.
 */
export function ImagePlaceholder({
  label = "Image placeholder",
  note,
  className,
  ratio = "aspect-[4/3]",
}: {
  label?: string;
  note?: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${label}${note ? ` — ${note}` : ""}`}
      className={cn(
        "placeholder-surface relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-border px-6 text-center",
        ratio,
        className,
      )}
    >
      <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
      <span className="text-xs font-medium text-surface-foreground">{label}</span>
      {note && <span className="max-w-[24ch] text-[11px] text-muted-foreground">{note}</span>}
    </div>
  );
}

export function PlaceholderTag({ children = "Placeholder content" }: { children?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}

