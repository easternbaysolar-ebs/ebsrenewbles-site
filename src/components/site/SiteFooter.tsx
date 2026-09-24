import { Link } from "@tanstack/react-router";

import { ContactDetails } from "./ContactDetails";
import { Logo } from "@/components/brand/Logo";

const COLUMNS = [
  {
    title: "Company",
    links: [
      { to: "/", label: "Home" },
      { to: "/solutions", label: "Solutions" },
      { to: "/projects", label: "Projects" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Offering",
    links: [
      { to: "/products", label: "Products" },
      { to: "/solutions/residential", label: "Residential solar" },
      { to: "/solutions/commercial", label: "Commercial solar" },
      { to: "/solutions/industrial", label: "Industrial solar" },
    ],
  },
  {
    title: "Resources",
    links: [
      { to: "/schemes", label: "Government schemes" },
      { to: "/calculator", label: "Solar calculator" },
      { to: "/quote", label: "Get a quote" },
      { to: "/auth", label: "Team login" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Easternbay Renewables designs, supplies, installs and commissions grid-connected
              rooftop and ground-mount solar systems, and supports customers through Government of
              India subsidy and net-metering processes.
            </p>
            <div className="mt-6 text-sm"><ContactDetails/></div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="eyebrow mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.to + l.label}>
                      <Link
                        to={l.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Easternbay Renewables. All rights reserved.</p>
          <p className="max-w-xl">
            Savings, generation and subsidy figures shown on this website are indicative estimates
            based on stated assumptions, not guarantees. Scheme benefits are governed by the
            applicable Government of India and state notifications.
          </p>
        </div>
      </div>
    </footer>
  );
}


