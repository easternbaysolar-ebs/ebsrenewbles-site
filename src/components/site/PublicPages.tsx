import { ContactDetails } from "./ContactDetails";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "./PublicLayout";
import { Section, SectionHeading } from "./Section";
import { ProjectGallery } from "./ProjectGallery";
import { QuoteForm } from "./QuoteForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productsQuery, schemesQuery, calculatorAssumptionsQuery } from "@/lib/queries";
import { db, safeUrl } from "@/lib/db";
import { calculateSystem, DEFAULT_ASSUMPTIONS, type PropertyType } from "@/lib/calculator";
import { ArrowUpRight, Sun, Zap, Battery, Layers } from "lucide-react";
export function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <PublicLayout>
      <Section bordered={false}>
        <p className="eyebrow mb-4">Easternbay Renewables</p>
        <h1 className="display-2 max-w-3xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground">{subtitle}</p>
        <div className="mt-12">{children}</div>
      </Section>
    </PublicLayout>
  );
}
export function ProductsPage() {
  const q = useQuery(productsQuery);
  const [filter, setFilter] = useState("all");
  return (
    <Page
      title="The right equipment. A better system."
      subtitle="Explore the building blocks of a dependable solar installation. Final specifications and pricing are confirmed in your proposal."
    >
      <div className="mb-8 flex flex-wrap gap-2">
        {["all", "modules", "inverters", "batteries", "mounting", "bos"].map((c) => (
          <Button
            key={c}
            variant={filter === c ? "default" : "outline"}
            onClick={() => setFilter(c)}
          >
            {c === "bos" ? "Accessories" : c}
          </Button>
        ))}
      </div>
      {q.isPending ? (
        <p>Loading products…</p>
      ) : q.error ? (
        <p role="alert">
          Unable to load products. <button onClick={() => q.refetch()}>Retry</button>
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {q.data
            ?.filter((p) => filter === "all" || p.category === filter)
            .map((p, i) => {
              const Icon = [Sun, Zap, Battery, Layers][i % 4]!;
              return (
                <article className="panel p-8" key={p.id}>
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="mb-6 aspect-[16/10] w-full rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Icon className="mb-8 size-8" />
                  )}
                  <p className="eyebrow">{p.category}</p>
                  <h2 className="mt-3 text-xl font-semibold">{p.name}</h2>
                  <p className="my-4 text-muted-foreground">{p.description}</p>
                  <dl className="space-y-2 text-sm">
                    {Object.entries(p.specs as Record<string, string>).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <a className="mt-6 inline-flex items-center gap-2 font-medium" href="/quote">
                    Request specification <ArrowUpRight size={16} />
                  </a>
                </article>
              );
            })}
        </div>
      )}
    </Page>
  );
}
export function SchemesPage() {
  const q = useQuery(schemesQuery);
  return (
    <Page
      title="A clearer path to solar support."
      subtitle="Explore government programmes and check the official portal for current eligibility, application windows and benefits. Approval is decided by the relevant authority."
    >
      {q.isPending ? (
        <p>Loading schemes…</p>
      ) : q.error ? (
        <p role="alert">Schemes could not be loaded.</p>
      ) : (
        <div className="space-y-8">
          {q.data?.map((s) => (
            <article className="panel grid gap-8 p-8 md:grid-cols-2" key={s.id}>
              <div>
                <p className="eyebrow">{s.authority}</p>
                <h2 className="my-4 text-3xl font-semibold">{s.name}</h2>
                <p className="text-muted-foreground">{s.short_description}</p>
                <a
                  href={safeUrl(s.official_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex border-b pb-1"
                >
                  Visit official portal ↗
                </a>
              </div>
              <div>
                <p>{s.details}</p>
                <h3 className="mb-2 mt-5 font-semibold">Who can apply</h3>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  {s.eligibility.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        PM-KISAN is a separate agricultural income-support programme; solar pump support is covered
        under PM-KUSUM.{" "}
        <a
          className="underline"
          href="https://pmkusum.mnre.gov.in/"
          target="_blank"
          rel="noreferrer"
        >
          MNRE programme information
        </a>
        .
      </p>
    </Page>
  );
}
export function ProjectsPage() {
  return (
    <Page
      title="Solar, in the real world."
      subtitle="Explore published Easternbay installations by sector."
    >
      <ProjectGallery />
    </Page>
  );
}
export function QuotePage() {
  return (
    <Page
      title="Let’s plan your solar system."
      subtitle="Tell us about your property and electricity use. Our team will review your enquiry and help you take the next step."
    >
      <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="eyebrow">Your solar journey</p>
          {[
            "Share your requirements",
            "Site assessment & system design",
            "A clear, itemised proposal",
            "Installation & commissioning",
          ].map((s, i) => (
            <div key={s} className="border-b py-7">
              <span className="mr-4 font-mono text-muted-foreground">0{i + 1}</span>
              {s}
            </div>
          ))}
          <p className="mt-6 text-sm text-muted-foreground">
            By submitting, you agree to be contacted about this enquiry. Your details are available
            only to authorised Easternbay staff.
          </p>
        </div>
        <QuoteForm />
      </div>
    </Page>
  );
}
export function ContactPage() {
  return (
    <Page
      title="Talk solar with us."
      subtitle="Planning a home installation, a commercial rooftop or an industrial project? Start with your requirements."
    >
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Easternbay Renewables</h2>
          <ContactDetails />
          <p className="mt-6 text-muted-foreground">
            Use the enquiry form to request a site assessment or discuss a solar solution.
          </p>
        </div>
        <QuoteForm compact />
      </div>
    </Page>
  );
}
const sectors: Record<string, { title: string; copy: string; items: string[] }> = {
  residential: {
    title: "Make your roof work for your home.",
    copy: "A rooftop system sized for your household, with support from assessment through net metering.",
    items: [
      "Understand monthly electricity use",
      "Assess roof space and shading",
      "Explore applicable residential support",
      "Plan monitoring and maintenance",
    ],
  },
  commercial: {
    title: "Give your business a brighter balance sheet.",
    copy: "Solar designed around your daytime demand, building and operating schedule.",
    items: [
      "Review load and tariff patterns",
      "Coordinate rooftop access and structure",
      "Compare equipment and investment options",
      "Monitor generation after commissioning",
    ],
  },
  industrial: {
    title: "Power built for the scale of your operation.",
    copy: "Rooftop and ground-mount solutions for energy-intensive facilities.",
    items: [
      "Review demand and electrical infrastructure",
      "Engineer for site and structural conditions",
      "Plan construction around operations",
      "Commission and hand over documentation",
    ],
  },
};
export function SolutionsPage({ sector }: { sector?: string }) {
  const s = sector ? sectors[sector] : undefined;
  return (
    <Page
      title={s?.title ?? "Different spaces. One clean energy source."}
      subtitle={s?.copy ?? "Explore solar for homes, businesses and industrial facilities."}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {(s ? Object.entries(sectors).filter(([k]) => k === sector) : Object.entries(sectors)).map(
          ([k, v]) => (
            <article key={k} className="panel p-8">
              <p className="eyebrow">{k}</p>
              <h2 className="my-5 text-2xl font-semibold">{v.title}</h2>
              <ul className="space-y-4 text-muted-foreground">
                {v.items.map((x) => (
                  <li key={x}>— {x}</li>
                ))}
              </ul>
              <a className="mt-8 inline-block underline" href={s ? "/quote" : "/solutions/" + k}>
                {s ? "Get a tailored quote" : "Explore solution"} ↗
              </a>
            </article>
          ),
        )}
      </div>
    </Page>
  );
}
export function CalculatorPage() {
  const [units, setUnits] = useState(450),
    [bill, setBill] = useState(0),
    [area, setArea] = useState(500),
    [sector, setSector] = useState<PropertyType>("residential"),
    [tariff, setTariff] = useState(8),
    [yieldDay, setYield] = useState(4),
    [cost, setCost] = useState(60000),
    [loan, setLoan] = useState(200000),
    [rate, setRate] = useState(9),
    [years, setYears] = useState(5);
  const settings = useQuery(calculatorAssumptionsQuery);
  const assumptions = {
    ...DEFAULT_ASSUMPTIONS[sector],
    tariffPerUnit: tariff,
    unitsPerKwPerDay: yieldDay,
    costPerKw: cost,
  };
  const valid =
    [tariff, yieldDay, cost, area].every((n) => Number.isFinite(n) && n > 0) &&
    units >= 0 &&
    bill >= 0;
  const result = valid
    ? calculateSystem({
        propertyType: sector,
        monthlyUnits: units,
        monthlyBill: bill,
        roofAreaSqft: area,
        assumptions,
      })
    : null;
  const money = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  const months = years * 12,
    r = rate / 1200;
  const emi =
    loan >= 0 && years > 0 && rate >= 0
      ? r
        ? (loan * r) / (1 - Math.pow(1 + r, -months))
        : loan / months
      : 0;
  function number(label: string, value: number, set: (n: number) => void, min = 0) {
    return (
      <label className="block space-y-2 text-sm">
        {label}
        <Input
          type="number"
          min={min}
          step="any"
          value={value}
          onChange={(e) => set(Number(e.target.value))}
        />
      </label>
    );
  }
  return (
    <Page
      title="What could your roof generate?"
      subtitle="Start with your monthly consumption. Adjust the assumptions to explore an indicative system; a site survey confirms the design."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="panel space-y-6 p-8">
          <label className="block text-sm">
            Property type
            <select
              className="mt-2 w-full rounded border bg-background p-3"
              value={sector}
              onChange={(e) => setSector(e.target.value as PropertyType)}
            >
              {Object.keys(DEFAULT_ASSUMPTIONS).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            {number("Monthly electricity use (kWh)", units, setUnits)}
            {number("Or monthly bill (₹)", bill, setBill)}
            {number("Shade-free roof area (sq ft)", area, setArea, 1)}
            {number("Electricity tariff (₹/kWh)", tariff, setTariff, 0.1)}
            {number("Generation (kWh/kW/day)", yieldDay, setYield, 0.1)}
            {number("Indicative cost (₹/kW)", cost, setCost, 1)}
          </div>
          <p className="text-sm text-muted-foreground">
            Consumption takes priority when both units and bill are entered. Estimates exclude
            subsidies, financing, maintenance and export-tariff differences.
          </p>
          {settings.data && (
            <Button
              variant="outline"
              onClick={() => {
                setYield(settings.data!["units_per_kw_per_day"] ?? 4);
                setCost(settings.data!["cost_per_kw"] ?? 60000);
                setTariff(settings.data!["tariff_per_unit"] ?? 8);
              }}
            >
              Use company assumptions
            </Button>
          )}
        </div>
        <div className="bg-foreground p-8 text-background" aria-live="polite">
          <p className="text-sm uppercase tracking-widest">Your indicative system</p>
          {result ? (
            <>
              <p className="my-8 text-7xl font-medium tracking-tight">
                {result.recommendedKw}
                <span className="ml-3 text-2xl">kW</span>
              </p>
              <dl className="grid grid-cols-2 gap-8">
                {[
                  ["Monthly generation", result.monthlyGenerationUnits + " kWh"],
                  ["Estimated investment", money(result.indicativeSystemCost)],
                  ["Monthly bill offset", money(result.indicativeMonthlySaving)],
                  ["Panels", result.panelCount],
                  ["Roof space", result.areaNeededSqft + " sq ft"],
                  [
                    "Simple payback",
                    result.simplePaybackYears ? result.simplePaybackYears + " years" : "—",
                  ],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm opacity-65">{k}</dt>
                    <dd className="mt-2 text-xl">{v}</dd>
                  </div>
                ))}
              </dl>
              {result.areaLimited && (
                <p className="mt-6">Your available roof limits the system size.</p>
              )}
              <a href="/quote" className="mt-10 inline-block border border-current px-6 py-3">
                Request a detailed quote ↗
              </a>
            </>
          ) : (
            <p className="mt-12">
              Enter positive consumption and valid assumptions to calculate a system.
            </p>
          )}
        </div>
      </div>
      <div className="panel mt-12 p-8">
        <h2 className="text-2xl font-semibold">Explore monthly financing</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-4">
          {number("Loan amount (₹)", loan, setLoan)}
          {number("Annual interest (%)", rate, setRate)}
          {number("Term (years)", years, setYears, 1)}
          <div>
            <p className="text-sm">Illustrative monthly EMI</p>
            <p className="mt-4 text-3xl">{money(emi)}</p>
          </div>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          A mathematical estimate only. Actual lender rates, eligibility, fees and terms vary.
        </p>
      </div>
    </Page>
  );
}
