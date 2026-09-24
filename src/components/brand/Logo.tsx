import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label={compact ? "Easternbay Renewables" : undefined}
    >
      <span aria-hidden className="relative size-8 shrink-0 overflow-hidden rounded-sm">
        <img
          src="/brand/easternbay-logo-transparent.png"
          alt=""
          className="absolute inset-0 size-full translate-y-px scale-150 object-contain"
        />
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