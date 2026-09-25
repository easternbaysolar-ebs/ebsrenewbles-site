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
  const [bill, setBill] = useState(0);
  const [roofArea, setRoofArea] = useState("");
  const [location, setLocation] = useState("andhra");
  const [usage, setUsage] = useState("medium");
  const [sector, setSector] = useState<PropertyType>("residential");
  const [tariff, setTariff] = useState(8);
  const [cost, setCost] = useState(60000);
  const settings = useQuery(calculatorAssumptionsQuery);
  const locations = {
    andhra: { name: "Andhra Pradesh", sunshine: 5.2, yield: 5.2 },
    telangana: { name: "Telangana", sunshine: 5.1, yield: 5.1 },
    tamilnadu: { name: "Tamil Nadu", sunshine: 4.9, yield: 4.9 },
    karnataka: { name: "Karnataka", sunshine: 5, yield: 5 },
  } as const;
  const usageLevels = {
    low: { label: "Low", detail: "Lights, fans and basic appliances", factor: 0.8 },
    medium: { label: "Medium", detail: "Refrigerator, washing machine or one AC", factor: 1 },
    high: { label: "High", detail: "Multiple ACs, geyser or heavier daily use", factor: 1.3 },
  } as const;
  const selectedLocation = locations[location as keyof typeof locations];
  const selectedUsage = usageLevels[usage as keyof typeof usageLevels];
  const assumptions = {
    ...DEFAULT_ASSUMPTIONS[sector],
    tariffPerUnit: tariff,
    unitsPerKwPerDay: selectedLocation.yield,
    costPerKw: cost,
  };
  const monthlyUnits = (bill / tariff) * selectedUsage.factor;
  const roofSqft = roofArea.trim() ? Number(roofArea) * 10.7639 : null;
  const valid =
    [tariff, cost, bill, selectedLocation.yield].every((n) => Number.isFinite(n) && n > 0) &&
    bill >= 500 &&
    (!roofArea.trim() || (Number.isFinite(Number(roofArea)) && Number(roofArea) > 0));
  const result = valid
    ? calculateSystem({
        propertyType: sector,
        monthlyUnits,
        roofAreaSqft: roofSqft,
        assumptions,
      })
    : null;
  const money = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  const monthlySavings = result ? Math.min(result.indicativeMonthlySaving, bill) : 0;
  const annualSavings = monthlySavings * 12;
  const paybackYears =
    result && annualSavings > 0 ? result.indicativeSystemCost / annualSavings : null;
  function number(label: string, value: number, set: (n: number) => void, min = 0, hint?: string) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor={label.replace(/[^a-z0-9]/gi, "-")}>
          {label}
        </label>
        <Input
          id={label.replace(/[^a-z0-9]/gi, "-")}
          type="number"
          min={min}
          step="any"
          value={value || ""}
          onChange={(e) => set(Number(e.target.value))}
        />
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
  return (
    <Page
      title="Solar Energy Calculator"
      subtitle={`Explore a solar system estimate for ${selectedLocation.name}. Enter your average bill and roof details to see a starting point for your project.`}
    >
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section
          className="panel space-y-7 p-6 sm:p-8"
          aria-labelledby="calculator-details-heading"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Personalised estimate
            </p>
            <h2 id="calculator-details-heading" className="mt-2 text-2xl font-semibold">
              Enter your details
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A few details help us size a system for your property. Appliance use adjusts the
              sizing estimate; savings stay within your current bill.
            </p>
          </div>
          {number(
            "Average monthly electricity bill (₹)",
            bill,
            setBill,
            500,
            "Enter the amount from a typical electricity bill.",
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="roof-area">
              Available roof area (sq metres){" "}
              <span className="font-normal text-muted-foreground">Optional</span>
            </label>
            <Input
              id="roof-area"
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 50"
              value={roofArea}
              onChange={(e) => setRoofArea(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We’ll account for roof space when suggesting your system size.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="solar-location">
              Select location / state
            </label>
            <select
              id="solar-location"
              className="w-full rounded border bg-background p-3"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {Object.entries(locations).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Typical sunshine: {selectedLocation.sunshine.toFixed(1)} hours per day.
            </p>
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Appliance usage level</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(usageLevels).map(([key, item]) => (
                <label
                  key={key}
                  className={`cursor-pointer rounded border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring ${usage === key ? "border-foreground bg-muted" : "hover:bg-muted/50"}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="appliance-usage"
                    value={key}
                    checked={usage === key}
                    onChange={() => setUsage(key)}
                  />
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-5 border-t pt-5">
            <h3 className="text-sm font-semibold">System preferences</h3>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="block space-y-2 text-sm">
                Property type
                <select
                  className="w-full rounded border bg-background p-3"
                  value={sector}
                  onChange={(e) => setSector(e.target.value as PropertyType)}
                >
                  {Object.keys(DEFAULT_ASSUMPTIONS).map((x) => (
                    <option key={x} value={x}>
                      {x.slice(0, 1).toUpperCase() + x.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              {number("Electricity tariff (₹/unit)", tariff, setTariff, 0.1)}
              {number("Indicative system cost (₹/kW)", cost, setCost, 1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cost assumptions can be updated by Easternbay. Estimates exclude applicable subsidies,
              financing, maintenance and export-tariff differences.
            </p>
            {settings.data && (
              <Button
                variant="outline"
                onClick={() => {
                  setCost(settings.data!["cost_per_kw"] ?? 60000);
                  setTariff(settings.data!["tariff_per_unit"] ?? 8);
                }}
              >
                Use company assumptions
              </Button>
            )}
          </div>
        </section>
        <section
          className="bg-foreground p-6 text-background sm:p-8"
          aria-live="polite"
          aria-label="Solar estimate results"
        >
          <p className="text-xs uppercase tracking-[0.18em] opacity-70">Your solar solution</p>
          <h2 className="mt-2 text-2xl font-semibold">Recommended system</h2>
          {result ? (
            <>
              <p className="my-6 text-6xl font-medium tracking-tight sm:text-7xl">
                {result.recommendedKw}
                <span className="ml-3 text-2xl">kW</span>
              </p>
              <p className="mb-8 text-sm opacity-70">
                Based on your bill and {selectedLocation.name} sunshine estimate.
              </p>
              <h3 className="border-b border-background/20 pb-3 text-sm font-semibold">
                Investment & generation
              </h3>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6">
                {[
                  ["Estimated system cost", money(result.indicativeSystemCost)],
                  [
                    "Estimated monthly generation",
                    `${result.monthlyGenerationUnits.toLocaleString("en-IN")} units`,
                  ],
                  ["Estimated annual bill savings", money(annualSavings)],
                  [
                    "Simple payback estimate",
                    paybackYears ? `${(Math.round(paybackYears * 10) / 10).toFixed(1)} years` : "—",
                  ],
                  ["Approximate panels", result.panelCount],
                  ["Roof area needed", `${(result.areaNeededSqft / 10.7639).toFixed(1)} sq metres`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs opacity-65">{k}</dt>
                    <dd className="mt-2 text-lg font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              {result.areaLimited && (
                <p className="mt-6 rounded border border-background/30 p-3 text-sm">
                  Your available roof area limits the system size; a site survey can confirm usable
                  space.
                </p>
              )}
              <p className="mt-7 border-t border-background/20 pt-5 text-xs leading-relaxed opacity-70">
                Subsidy eligibility and amounts depend on the current scheme, system type and
                approval. This estimate does not include a subsidy. Final design, pricing and
                savings are confirmed after assessment.
              </p>
              <a
                href="/quote"
                className="mt-7 inline-block border border-current px-6 py-3 text-sm font-medium hover:bg-background hover:text-foreground"
              >
                Request a detailed quote ↗
              </a>
            </>
          ) : (
            <p className="mt-8">
              Enter a monthly bill of at least ₹500 and valid assumptions to see your estimate.
            </p>
          )}
        </section>
      </div>
    </Page>
  );
}

