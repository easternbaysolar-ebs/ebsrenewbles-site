import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ImagePlaceholder, PlaceholderTag } from "@/components/site/Placeholder";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/site/StateBlocks";
import { Button } from "@/components/ui/button";
import { num } from "@/lib/format";
import { publishedProjectsQuery, type PublicProject } from "@/lib/queries";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "industrial", label: "Industrial" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ProjectGallery() {
  const [tab, setTab] = useState<TabKey>("residential");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const galleryId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const { data, isLoading, error, refetch } = useQuery(publishedProjectsQuery);

  const projects = (data ?? []).filter((p) => p.category === tab);
  useEffect(() => {
    if (
      !playing ||
      paused ||
      projects.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(() => {
      const el = scroller.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + Math.min(el.clientWidth * 0.8, 520),
        behavior: "smooth",
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [playing, paused, projects.length, tab]);

  function scrollBy(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.8, 520), behavior: "smooth" });
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Project categories"
          className="inline-flex rounded-md border border-border p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              id={galleryId + "-" + t.key}
              aria-controls={galleryId + "-panel"}
              tabIndex={tab === t.key ? 0 : -1}
              aria-selected={tab === t.key}
              onClick={() => {
                setTab(t.key);
                scroller.current?.scrollTo({ left: 0 });
              }}
              onKeyDown={(e) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
                e.preventDefault();
                const current = TABS.findIndex((item) => item.key === tab);
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 2
                      : (current + (e.key === "ArrowRight" ? 1 : -1) + 3) % 3;
                setTab(TABS[next]!.key);
                const buttons =
                  e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                    '[role="tab"]',
                  );
                buttons?.[next]?.focus();
                scroller.current?.scrollTo({ left: 0 });
              }}
              className={cn(
                "rounded-[5px] px-4 py-1.5 text-[13px] font-medium transition-colors",
                tab === t.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {projects.length > 1 && (
            <Button variant="outline" aria-pressed={playing} onClick={() => setPlaying(!playing)}>
              {playing ? "Pause slideshow" : "Play slideshow"}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        className="mt-8"
        role="tabpanel"
        id={galleryId + "-panel"}
        aria-labelledby={galleryId + "-" + tab}
      >
        {isLoading ? (
          <LoadingBlock label="Loading projects…" />
        ) : error ? (
          <ErrorBlock error={error as Error} onRetry={() => refetch()} />
        ) : projects.length === 0 ? (
          <EmptyBlock
            title={`No ${tab} projects published yet`}
            description="Our project collection is being updated. Contact us to discuss a similar installation."
          />
        ) : (
          <div
            ref={scroller}
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: PublicProject }) {
  const media = [...(project.project_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const image =
    media.find((m) => m.url && !m.is_placeholder) ??
    (project.cover_image_url
      ? { url: project.cover_image_url, caption: project.title }
      : undefined);

  return (
    <article className="panel w-[min(86vw,20rem)] shrink-0 snap-start overflow-hidden transition-shadow hover:shadow-elevate">
      {image?.url ? (
        <img
          src={image.url}
          alt={image.caption ?? project.title}
          className="aspect-[4/3] w-full object-cover"
          loading="lazy"
        />
      ) : (
        <ImagePlaceholder
          label="Project photo placeholder"
          note="Awaiting site photographs"
          className="rounded-none border-0 border-b border-border"
        />
      )}
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-snug">{project.title}</h3>
          {project.is_placeholder && <PlaceholderTag>Placeholder</PlaceholderTag>}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Capacity</dt>
            <dd className="mt-0.5 font-medium">
              {project.capacity_kw ? `${num(project.capacity_kw)} kW` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="mt-0.5 font-medium">{project.location ?? "—"}</dd>
          </div>
        </dl>
        {project.description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>
    </article>
  );
}
