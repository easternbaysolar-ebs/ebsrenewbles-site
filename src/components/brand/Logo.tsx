import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label={compact ? "Eastern Bay Renewables" : undefined}
    >
      <span aria-hidden className="relative size-8 shrink-0 overflow-hidden rounded-sm">
        <img
          src="/brand/easternbay-icon-light.jpeg"
          alt=""
          className="absolute left-[-9px] top-[-9px] size-12 max-w-none object-cover dark:hidden"
        />
        <img
          src="/brand/easternbay-icon-dark.jpeg"
          alt=""
          className="absolute left-[-9px] top-[-9px] hidden size-12 max-w-none object-cover dark:block"
        />
      </span>
      {!compact && (
        <span className="relative h-8 w-[8.5rem] overflow-hidden" aria-hidden>
          <img
            src="/brand/easternbay-wordmark.jpeg"
            alt="Eastern Bay Renewables"
            className="absolute left-[-31px] top-[-36px] h-auto w-[194px] max-w-none object-contain dark:invert"
          />
        </span>
      )}
    </span>
  );
}