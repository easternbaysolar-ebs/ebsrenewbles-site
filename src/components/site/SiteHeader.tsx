import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useMyProfile, useMyRoles, useSession } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/solutions", label: "Solutions" },
  { to: "/schemes", label: "Government Schemes" },
  { to: "/projects", label: "Projects" },
  { to: "/calculator", label: "Solar Calculator" },
  { to: "/contact", label: "Contact" },
] as const;

const SOLUTIONS = [
  { to: "/solutions/residential", label: "Residential" },
  { to: "/solutions/commercial", label: "Commercial" },
  { to: "/solutions/industrial", label: "Industrial" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const { isAdmin, isStaff } = useMyRoles();
  const profile = useMyProfile();
  const accountRoute = isAdmin ? "/admin" : isStaff ? "/employee" : "/auth";
  const accountLabel = user ? profile.data?.full_name || "My account" : "Login";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="shrink-0" aria-label="Easternbay Renewables home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {NAV.map((item) =>
            item.to === "/solutions" ? (
              <div key={item.to} className="group relative">
                <Link
                  to={item.to}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
                >
                  {item.label}
                  <ChevronDown className="size-3.5" aria-hidden />
                </Link>
                <div className="invisible absolute left-0 top-full w-52 translate-y-1 opacity-0 transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="panel mt-2 overflow-hidden p-1 shadow-elevate">
                    {SOLUTIONS.map((s) => (
                      <Link
                        key={s.to}
                        to={s.to}
                        className="block rounded-md px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {s.label} solar
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:grid" />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to={accountRoute} className="max-w-32 truncate">
              {accountLabel}
            </Link>
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link to="/quote">Get a Quote</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="xl:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm p-0">
              <SheetTitle className="border-b border-border px-5 py-4 text-left">
                <Logo />
              </SheetTitle>
              <nav className="flex flex-col p-3" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: item.to === "/" }}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-1 border-t border-border pt-2">
                  <p className="eyebrow px-3 py-2">Solutions</p>
                  {SOLUTIONS.map((s) => (
                    <Link
                      key={s.to}
                      to={s.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
                <div className={cn("mt-3 flex flex-col gap-2 border-t border-border p-3")}>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link to="/quote">Get a Quote</Link>
                  </Button>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link to={accountRoute} className="truncate">
                      {accountLabel}
                    </Link>
                  </Button>
                  <div className="pt-1">
                    <ThemeToggle />
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
