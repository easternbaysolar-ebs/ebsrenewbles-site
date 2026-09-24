import { cn } from "@/lib/utils";

/**
 * Placeholder wordmark. Replace the mark block with the official
 * Easternbay Renewables logo file when it is available.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-sm bg-foreground text-[11px] font-semibold tracking-tight text-background"
      >
        EB
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">Easternbay</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Renewables
          </span>
        </span>
      )}
    </span>
  );
}

