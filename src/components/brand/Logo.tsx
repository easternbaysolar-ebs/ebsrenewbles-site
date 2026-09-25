import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={compact ? "Easternbay Renewables" : undefined}
    >
      <span aria-hidden className="relative size-20 sm:size-[5.5rem] shrink-0 overflow-hidden rounded-sm">
        <img
          src="/brand/easternbay-logo-transparent.png"
          alt=""
          className="absolute inset-0 size-full translate-y-px scale-125 object-contain"
        />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[18px] font-semibold tracking-tight sm:text-[22px]">Easternbay</span>
          <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[14px]">
            Renewables
          </span>
        </span>
      )}
    </span>
  );
}
