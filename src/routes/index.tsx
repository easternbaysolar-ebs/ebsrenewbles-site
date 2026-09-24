import { db } from "@/lib/db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Factory, Home, ShieldCheck, Wrench, Zap } from "lucide-react";

import { ImagePlaceholder } from "@/components/site/Placeholder";
import { ProjectGallery } from "@/components/site/ProjectGallery";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Section, SectionHeading } from "@/components/site/Section";
import { StatsBand } from "@/components/site/StatsBand";
import { LoadingBlock } from "@/components/site/StateBlocks";
import { Button } from "@/components/ui/button";
import { productsQuery, schemesQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Easternbay Renewables — Rooftop & Ground-Mount Solar EPC" },
      {
        name: "description",
        content:
          "Rooftop and ground-mount solar EPC for homes, businesses and industry: design, supply, installation, net metering and Government of India subsidy support.",
      },
      { property: "og:title", content: "Easternbay Renewables — Solar EPC" },
      {
        property: "og:description",
        content:
          "End-to-end solar EPC: system design, supply, installation, commissioning and subsidy assistance.",
      },
    ],
  }),
  component: HomePage,
});

const SOLUTIONS = [
  {
    to: "/solutions/residential" as const,
    icon: Home,
    title: "Residential",
    copy: "Rooftop systems for homes, villas and apartment societies, with PM Surya Ghar subsidy assistance and net metering.",
  },
  {
    to: "/solutions/commercial" as const,
    icon: Building2,
    title: "Commercial",
    copy: "Offices, showrooms, schools, hospitals and hotels — capacity sized to your load profile and tariff slab.",
  },
  {
    to: "/solutions/industrial" as const,
    icon: Factory,
    title: "Industrial",
    copy: "Large tin-shed rooftops and ground-mount plants, engineered for high wind zones and continuous operation.",
  },
];

const WHY = [
  {
    icon: Wrench,
    title: "Single accountable EPC team",
    copy: "Design, procurement, structure fabrication, installation, testing and commissioning handled by one team — no hand-offs between vendors.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance and paperwork handled",
    copy: "DISCOM application, net-metering, inspection coordination and subsidy documentation are managed alongside the installation.",
  },
  {
    icon: Zap,
    title: "Engineered for your load, not a template",
    copy: "Capacity, string design and structure type are chosen from your consumption, roof condition, shading and wind zone.",
  },
];

function HomePage() {
  const products = useQuery(productsQuery);
  const schemes = useQuery(schemesQuery);
  const hero = useQuery({
    queryKey: ["site-content", "homepage.hero"],
    queryFn: async () => {
      const { data, error } = await db
        .from("site_content")
        .select("value")
        .eq("key", "homepage.hero")
        .maybeSingle();
      if (error) throw error;
      return data?.value as { heading?: string; description?: string } | undefined;
    },
  });

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 dark:hidden"
          style={{ containerType: "size" }}
        >
          {/* Keep the photograph's horizon at 70% of the hero on every screen. */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-cover"
            style={{
              backgroundImage: "url('/brand/solar-sky-light.jpg')",
              width: "max(100cqw, 106.1cqh)",
              height: "max(141.42cqw, 150cqh)",
              top: "calc(70cqh - max(114.55cqw, 121.5cqh))",
            }}
          />
        </div>
        <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 hidden opacity-70 dark:block" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-32">
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="rise-in">
              <p className="eyebrow">Solar EPC · India</p>
              <h1 className="display-1 mt-5 text-balance">
                {hero.data?.heading ?? "Your roof. A new source of power."}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                {hero.data?.description ??
                  "Easternbay Renewables designs, supplies, installs and commissions solar systems for homes, businesses and industry, with support through net metering and applicable subsidy processes."}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/quote">
                    Get a Solar Quote
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/calculator">Calculate Your System</Link>
                </Button>
              </div>
              <dl className="mt-12 grid max-w-lg grid-cols-1 sm:grid-cols-3 gap-6 border-t border-border pt-8 text-sm">
                {[
                  ["Design", "Load-based sizing"],
                  ["Supply", "Tier-1 equipment"],
                  ["Commissioning", "Net metering support"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="eyebrow">{k}</dt>
                    <dd className="mt-2 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <figure className="relative hidden overflow-hidden dark:block">
              <img
                src="https://images.unsplash.com/photo-1552197892-f2ad2f75e7c8?auto=format&fit=crop&w=1400&q=85"
                alt="Aerial view of rooftop solar panels"
                className="aspect-[4/5] w-full object-cover grayscale"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-black/65 p-4 text-sm text-white">
                Solar installation illustration · CHUTTERSNAP / Unsplash
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      {/* Products */}
      <Section bordered={false}>
        <SectionHeading
          eyebrow="Products"
          title="Equipment we design around"
          description="Modules, inverters, storage, mounting structures and balance-of-system components specified per site. Brands are confirmed at quotation stage."
          actions={
            <Button asChild variant="outline">
              <Link to="/products">View all products</Link>
            </Button>
          }
        />
        <div className="mt-12">
          {products.isLoading ? (
            <LoadingBlock label="Loading products…" />
          ) : (
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {(products.data ?? []).slice(0, 6).map((p) => (
                <div key={p.id} className="bg-card p-6">
                  <p className="eyebrow">{p.category}</p>
                  <h3 className="mt-3 text-[15px] font-semibold">{p.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Schemes */}
      <Section>
        <SectionHeading
          eyebrow="Government of India"
          title="Subsidy and scheme support"
          description="We help you apply under the applicable central and state programmes, and confirm the exact benefit for your connection before quoting."
          actions={
            <Button asChild variant="outline">
              <Link to="/schemes">All schemes</Link>
            </Button>
          }
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {(schemes.data ?? []).map((s) => (
            <div key={s.id} className="panel p-7">
              <p className="eyebrow">{s.authority}</p>
              <h3 className="mt-3 text-lg font-semibold">{s.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {s.short_description}
              </p>
              <Link
                to="/schemes"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                Scheme details <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Solutions */}
      <Section>
        <SectionHeading
          eyebrow="Solutions"
          title="Built for three very different roofs"
          description="Residential, commercial and industrial installations differ in structure, tariff logic and approvals. Each is engineered separately."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="panel group flex flex-col p-7 transition-shadow hover:shadow-elevate"
            >
              <s.icon className="size-5" aria-hidden />
              <h3 className="mt-5 text-lg font-semibold">{s.title} solar</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.copy}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                Explore
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Gallery */}
      <Section>
        <SectionHeading
          eyebrow="Project gallery"
          title="Installations by segment"
          description="Explore published installations for homes, businesses and industry."
          actions={
            <Button asChild variant="outline">
              <Link to="/projects">Open full gallery</Link>
            </Button>
          }
        />
        <div className="mt-12">
          <ProjectGallery />
        </div>
      </Section>

      {/* Why */}
      <Section>
        <SectionHeading
          eyebrow="Why Easternbay"
          title="Accountability from survey to commissioning"
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {WHY.map((w) => (
            <div key={w.title} className="bg-card p-7">
              <w.icon className="size-5" aria-hidden />
              <h3 className="mt-5 text-[15px] font-semibold">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.copy}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Statistics */}
      <Section>
        <SectionHeading eyebrow="Statistics" title="Project record" />
        <div className="mt-10">
          <StatsBand />
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="panel flex flex-col items-start gap-6 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="display-2">Ready for an indicative proposal?</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Share your monthly consumption and location. We will size a system, outline applicable
              subsidy and schedule a site assessment.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/quote">Get a Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </Section>
    </PublicLayout>
  );
}
