import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowUpRight,
  Menu,
  X,
  Download,
  Sun,
  Trash2,
  MapPin,
  ArrowUp,
  ArrowDown,
  ImagePlus,
  Share2,
  Eye,
} from "lucide-react";
import { useMyRoles, useSession, APP_ROLES, ROLE_LABELS } from "@/lib/auth";
import { db, safeUrl } from "@/lib/db";
import { modules, type Field } from "@/lib/modules";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ContactSettings } from "./ContactSettings";
import { ProfileMenu } from "./ProfileMenu";
import { validateContact } from "@/lib/contact";
type Row = Record<string, any>;
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
export function Workspace({ admin }: { admin: boolean }) {
  const roles = useMyRoles(),
    { user, loading } = useSession();
  const [section, setSection] = useState("overview"),
    [menu, setMenu] = useState(false);
  if (loading || roles.loading) return <div className="p-12">Checking access…</div>;
  if (!user || !roles.isStaff || (admin && !roles.isAdmin))
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <Logo />
        <h1 className="my-8 text-4xl font-semibold">This workspace is protected.</h1>
        <p className="mb-8 text-muted-foreground">
          {!user
            ? "Sign in with your Easternbay account to continue."
            : "Your account does not have access to this area. Contact your administrator."}
        </p>
        <Button asChild>
          <a href="/auth">Go to login</a>
        </Button>{" "}
        <a className="ml-4 underline" href="/">
          Back to website
        </a>
      </main>
    );
  const keys = admin
    ? Object.keys(modules)
    : ["leads", "customers", "projects", "tasks", "quotations", "history"];
  return (
    <div className="min-h-screen bg-surface/40">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b bg-background px-3 py-3 sm:px-5">
        <div className="flex items-center gap-5">
          <Button
            size="icon"
            variant="outline"
            aria-label="Toggle workspace menu"
            className="lg:hidden"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </Button>
          <a href="/">
            <Logo />
          </a>
          <span className="hidden border-l pl-5 text-sm text-muted-foreground sm:block">
            {admin ? "Admin" : "Employee"} workspace
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ProfileMenu admin={admin} />
        </div>
      </header>
      <div className="flex">
        <aside
          className={
            (menu ? "block" : "hidden") + " w-60 shrink-0 border-r bg-background p-5 lg:block"
          }
        >
          <p className="eyebrow mb-5">Work & operations</p>
          {["overview", ...keys, ...(admin ? ["contact_links", "reports"] : []), "uploads"].map(
            (k) => (
              <button
                key={k}
                onClick={() => {
                  setSection(k);
                  setMenu(false);
                }}
                className={
                  "mb-1 block w-full rounded px-3 py-3 text-left text-sm " +
                  (section === k ? "bg-foreground text-background" : "hover:bg-muted")
                }
              >
                {modules[k]?.["title"] ??
                  (k === "overview"
                    ? "Overview"
                    : k === "reports"
                      ? "Reports"
                      : k === "contact_links"
                        ? "Contact & social links"
                        : "Project uploads")}
              </button>
            ),
          )}
          <a className="mt-8 flex items-center gap-2 px-3 text-sm text-muted-foreground" href="/">
            View website <ArrowUpRight size={14} />
          </a>
        </aside>
        <main className="min-w-0 flex-1 p-5 md:p-10">
          <p className="eyebrow mb-3">{admin ? "Company operations" : "My workspace"}</p>
          <h1 className="mb-8 text-3xl font-semibold">
            {modules[section]?.["title"] ??
              (section === "overview"
                ? "A clear view of your day."
                : section === "reports"
                  ? "Business reports"
                  : section === "contact_links"
                    ? "Contact & social links"
                    : "Project documents")}
          </h1>
          {section === "contact_links" && admin ? (
            <ContactSettings />
          ) : section === "overview" || section === "reports" ? (
            <Overview admin={admin} reports={section === "reports"} />
          ) : section === "uploads" ? (
            <Uploads userId={user["id"]} />
          ) : (
            <Records
              key={section}
              section={section}
              admin={admin}
              userId={user["id"]}
              canWrite={!roles.roles.every((r) => ["view_only", "accountant"].includes(r))}
            />
          )}
        </main>
      </div>
    </div>
  );
}
function useRows(table: string) {
  return useQuery({
    queryKey: ["work", table],
    queryFn: async () => {
      const { data, error } = await db
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
}
function Overview({ admin, reports }: { admin: boolean; reports: boolean }) {
  const leads = useRows("leads"),
    projects = useRows("projects"),
    tasks = useRows("tasks"),
    quotes = useRows("quotations");
  const error = leads.error || projects.error || tasks.error || quotes.error;
  const counts = [
    [
      "Open leads",
      leads.data?.filter((r) => !["completed", "lost"].includes(r["status"])).length ?? 0,
    ],
    [
      "Active projects",
      projects.data?.filter((r) => r["status"] !== "completed" && !r["is_placeholder"]).length ?? 0,
    ],
    [
      "Tasks to complete",
      tasks.data?.filter((r) => !["completed", "cancelled"].includes(r["status"])).length ?? 0,
    ],
    ["Quoted value", money(quotes.data?.reduce((s, r) => s + Number(r["total_amount"]), 0) ?? 0)],
  ];
  return (
    <>
      {error && (
        <p role="alert" className="mb-6">
          Some records could not load. Please refresh.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map(([k, v]) => (
          <div key={k} className="panel p-6">
            <p className="text-sm text-muted-foreground">{k}</p>
            <p className="mt-5 text-4xl tracking-tight">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section className="panel p-7">
          <h2 className="mb-6 text-xl font-semibold">Lead pipeline</h2>
          {[
            "new",
            "contacted",
            "site_visit",
            "quote_sent",
            "negotiation",
            "confirmed",
            "installation",
            "completed",
          ].map((stage) => {
            const count = leads.data?.filter((r) => r["status"] === stage).length ?? 0;
            return (
              <div className="mb-4" key={stage}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="capitalize">{stage.replaceAll("_", " ")}</span>
                  <span>{count}</span>
                </div>
                <div className="h-1.5 bg-muted">
                  <div
                    className="h-full bg-foreground"
                    style={{ width: (count / (leads.data?.length || 1)) * 100 + "%" }}
                  />
                </div>
              </div>
            );
          })}
        </section>
        <section className="panel p-7">
          <h2 className="mb-6 text-xl font-semibold">Upcoming work</h2>
          {tasks.data
            ?.filter((r) => !["completed", "cancelled"].includes(r["status"]))
            .slice(0, 8)
            .map((r) => (
              <div className="border-b py-4" key={r["id"]}>
                <p className="font-medium">{r["title"]}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r["task_type"].replaceAll("_", " ")} · {r["due_date"] ?? "No due date"} ·{" "}
                  {r["status"]}
                </p>
              </div>
            ))}
          {!tasks.data?.length && (
            <p className="text-muted-foreground">
              {admin
                ? "Create a task or site visit and assign it to your team."
                : "Your assigned tasks and site visits will appear here."}
            </p>
          )}
        </section>
      </div>
      {reports && (
        <div className="panel mt-8 p-7">
          <h2 className="mb-4 text-xl font-semibold">Export report</h2>
          <p className="mb-5 text-muted-foreground">
            Download the records currently loaded (up to 1,000 per module).
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              ["Leads", leads.data],
              ["Projects", projects.data],
              ["Quotations", quotes.data],
            ].map(([name, rows]) => (
              <Button
                variant="outline"
                key={String(name)}
                onClick={() => downloadCsv(String(name), (rows as Row[]) ?? [])}
              >
                <Download size={16} />
                {String(name)} CSV
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
function downloadCsv(name: string, rows: Row[]) {
  const keys = Object.keys(rows[0] ?? {});
  const escape = (v: unknown) => {
    let s = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    if (/^[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const blob = new Blob(
    [
      "\uFEFF" +
        [
          keys.map(escape).join(","),
          ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
        ].join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}
function Records({
  section,
  admin,
  userId,
  canWrite,
}: {
  section: string;
  admin: boolean;
  userId: string;
  canWrite: boolean;
}) {
  const config = modules[section]!,
    q = useRows(config.table),
    cache = useQueryClient(),
    [search, setSearch] = useState(""),
    [record, setRecord] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [role, setRole] = useState(""),
    [note, setNote] = useState(""),
    [busyFile, setBusyFile] = useState<File | null>(null);
  const refs = useQuery({
    queryKey: ["work", "references"],
    queryFn: async () => {
      const out: Record<string, Row[]> = {};
      await Promise.all(
        ["profiles", "leads", "projects", "customers", "material_prices"].map(async (table) => {
          const { data, error } = await db.from(table).select("*").limit(1000);
          if (!error) out[table] = data ?? [];
        }),
      );
      return out;
    },
  });
  const activities = useQuery({
    queryKey: ["work", "activities", record?.["id"]],
    enabled: section === "leads" && !!record?.["id"],
    queryFn: async () => {
      const { data, error } = await db
        .from("lead_activities")
        .select("*")
        .eq("lead_id", record!["id"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const editable = admin
    ? config.fields
    : section === "leads" && record && !record["id"]
      ? config.fields.filter((f) => f.key !== "assigned_to")
      : config.fields.filter((f) =>
          section === "leads"
            ? ["status", "notes", "next_follow_up"].includes(f.key)
            : ["projects", "tasks"].includes(section)
              ? f.key === "status"
              : false,
        );
  const readonly = section === "history" || (!admin && (!canWrite || !editable.length));
  const rows = (q.data ?? []).filter((r) =>
    config.columns.some((k) =>
      String(r[k] ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );
  async function removeRow(row: Row) {
    const label = row[config.label] || row["id"];
    if (
      !window.confirm(
        `Permanently remove ${config.title.slice(0, -1).toLowerCase()} “${label}”? This cannot be undone.`,
      )
    )
      return;
    const { error } = await db.from(config.table).delete().eq("id", row["id"]);
    if (error) {
      toast.error(
        error.message.includes("foreign key")
          ? "This record is linked to other records. Remove or reassign those links first."
          : error.message,
      );
      return;
    }
    await cache.invalidateQueries();
    if (record?.["id"] === row["id"]) setRecord(null);
    toast.success(`${config.title.slice(0, -1)} removed`);
  }
  async function moveProduct(row: Row, direction: -1 | 1) {
    const ordered = [...rows].sort(
      (a, b) => Number(a["sort_order"] ?? 0) - Number(b["sort_order"] ?? 0),
    );
    const index = ordered.findIndex((item) => item["id"] === row["id"]);
    const other = ordered[index + direction];
    if (!other) return;
    const currentOrder = Number(row["sort_order"] ?? index);
    const otherOrder = Number(other["sort_order"] ?? index + direction);
    const [first, second] = await Promise.all([
      db.from("products").update({ sort_order: otherOrder }).eq("id", row["id"]),
      db.from("products").update({ sort_order: currentOrder }).eq("id", other["id"]),
    ]);
    if (first.error || second.error) toast.error(first.error?.message || second.error?.message);
    else await cache.invalidateQueries({ queryKey: ["work", "products"] });
  }
  const label = (table: string, id: unknown) => {
    const r = refs.data?.[table]?.find((x) => x["id"] === id);
    return r?.["full_name"] || r?.["email"] || r?.["name"] || r?.["title"] || id || "—";
  };
  function value(k: string, v: unknown) {
    if (["assigned_to", "site_engineer", "account_manager", "actor_id"].includes(k))
      return label("profiles", v);
    if (k === "project_id") return label("projects", v);
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (k === "total_amount") return money(Number(v));
    return String(v ?? "—");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!record) return;
    setBusy(true);
    setError("");
    try {
      const payload: Row = {};
      for (const f of editable) {
        let v = record[f.key];
        if (v === undefined || v === "") {
          if (f.required) throw Error(f.label + " is required");
          if (!record["id"] && !["boolean", "json", "lines"].includes(f.type ?? "")) continue;
          v =
            f.type === "boolean" ? false : f.type === "json" ? {} : f.type === "lines" ? [] : null;
        }
        if (["benefits", "eligibility", "applies_to"].includes(f.key) && v == null) v = [];
        if (["benefits", "eligibility", "applies_to"].includes(f.key) && typeof v === "string")
          v = v
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);
        if (f.type === "number" && v !== null) {
          v = Number(v);
          if (!Number.isFinite(v) || v < 0) throw Error(f.label + " must be a positive number");
        }
        if ((f.key.endsWith("_url") || f.key === "url") && v && !safeUrl(v))
          throw Error("Enter a valid http or https URL");
        payload[f.key] = v;
      }
      if (config.table === "site_content" && payload["key"] === "contact.details")
        validateContact(payload["value"]);
      if (config.table === "tasks" && payload["status"] === "completed")
        payload["completed_at"] = new Date().toISOString();
      if (config.table === "leads" && !record["id"] && !admin) {
        payload["assigned_to"] = userId;
        payload["source"] = "employee";
        payload["status"] = "new";
      }
      if (config.table === "tasks" && record["task_type"] === "site_visit") {
        if (busyFile) {
          const path = `${record["id"]}/${userId}/${crypto.randomUUID()}-${busyFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const uploaded = await db.storage.from("site-visit-evidence").upload(path, busyFile);
          if (uploaded.error) throw uploaded.error;
          payload["visit_photo_path"] = path;
        }
        for (const key of ["visit_note", "visit_latitude", "visit_longitude"])
          if (record[key] !== undefined) payload[key] = record[key];
        if (
          payload["status"] === "completed" &&
          (!(payload["visit_photo_path"] || record["visit_photo_path"]) ||
            !record["visit_note"]?.trim() ||
            record["visit_latitude"] == null ||
            record["visit_longitude"] == null)
        )
          throw Error(
            "Add a visit photo, location, and short note before completing this site visit.",
          );
      }
      if (!record["id"] && ["tasks", "quotations"].includes(config.table))
        payload["created_by"] = userId;
      if (!record["id"] && config.table === "quotations")
        payload["quote_number"] = payload["quote_number"] || "EBR-" + Date.now();
      const result = record["id"]
        ? await db.from(config.table).update(payload).eq("id", record["id"]).select()
        : await db.from(config.table).insert(payload).select();
      if (result.error) throw result.error;
      if (!result.data?.length) throw Error("No record was saved. Check your access.");
      if (section === "employees" && role) {
        const result = await db.rpc("set_employee_role", {
          employee: record["id"],
          new_role: role,
        });
        if (result.error) throw result.error;
      }
      setBusyFile(null);
      await cache.invalidateQueries();
      setRecord(null);
      toast.success("Saved successfully");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  function create() {
    const initial: Row = {};
    for (const f of config.fields) {
      if (f.type === "boolean") initial[f.key] = ["is_active"].includes(f.key);
      if (f.type === "json") initial[f.key] = {};
      if (f.type === "lines") initial[f.key] = [];
      if (f.options) initial[f.key] = f.options[0];
    }
    if (section === "quotations") {
      initial["quote_number"] = "EBR-" + Date.now();
      initial["company_gst_number"] = "37EXFPR0556E1ZC";
      initial["company_address"] =
        "1-128/11, Near Hanuman Statue, Rajugari Beedu, Payakaraopeta, Anakapalli, Andhra Pradesh, 531126";
      initial["bank_details"] =
        "Bank: State Bank of India\nAccount Holder: EASTERNBAY SOLAR\nAccount #: 45338592498\nIFSC Code: SBIN0003064\nBranch: ADB TUNI";
    }
    if (section === "leads" && !admin) {
      initial["assigned_to"] = userId;
      initial["status"] = "new";
      initial["customer_type"] = "residential";
    }
    setError("");
    setRole("");
    setRecord(initial);
  }
  return (
    <>
      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <Input
          aria-label="Search records"
          placeholder="Search records…"
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {((admin && section !== "history" && section !== "employees") ||
          (!admin && section === "leads")) && (
          <Button onClick={create}>
            <Plus size={16} />
            Add {config["title"].toLowerCase()}
          </Button>
        )}
      </div>
      {section === "employees" && (
        <p className="mb-6 text-sm text-muted-foreground">
          To add a team member, have them register through Team login → Request staff access and
          confirm their email, then approve them here by assigning a role. Remove access here when
          they leave; their work history is retained.
        </p>
      )}
      {q.isPending ? (
        <p>Loading records…</p>
      ) : q.error ? (
        <p role="alert">{q.error.message}</p>
      ) : rows.length ? (
        <div className="overflow-x-auto panel">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {config.columns.map((k) => (
                  <th key={k} className="whitespace-nowrap p-4 font-medium">
                    {config.fields.find((f) => f.key === k)?.label ?? k.replaceAll("_", " ")}
                  </th>
                ))}
                <th className="p-4">Details</th>
                {admin && ["leads", "customers", "products", "quotations"].includes(section) && (
                  <th className="p-4">Manage</th>
                )}
                {section === "employees" && admin && <th className="p-4">Access</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="border-t" key={r["id"]}>
                  {config.columns.map((k) => (
                    <td className="max-w-xs p-4 break-words" key={k}>
                      {value(k, r[k])}
                    </td>
                  ))}
                  <td className="p-4">
                    <button
                      className="underline"
                      onClick={() => {
                        setRecord({ ...r });
                        setBusyFile(null);
                        setError("");
                        setRole("");
                      }}
                    >
                      Open
                    </button>
                  </td>
                  {admin && ["leads", "customers", "products", "quotations"].includes(section) && (
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {section === "products" && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Move ${r["name"]} up`}
                              disabled={
                                rows
                                  .sort(
                                    (a, b) =>
                                      Number(a["sort_order"] ?? 0) - Number(b["sort_order"] ?? 0),
                                  )
                                  .findIndex((x) => x["id"] === r["id"]) === 0
                              }
                              onClick={() => moveProduct(r, -1)}
                            >
                              <ArrowUp size={14} />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Move ${r["name"]} down`}
                              disabled={
                                rows
                                  .sort(
                                    (a, b) =>
                                      Number(a["sort_order"] ?? 0) - Number(b["sort_order"] ?? 0),
                                  )
                                  .findIndex((x) => x["id"] === r["id"]) ===
                                rows.length - 1
                              }
                              onClick={() => moveProduct(r, 1)}
                            >
                              <ArrowDown size={14} />
                            </Button>
                          </>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeRow(r)}
                        >
                          <Trash2 size={14} /> Delete
                        </Button>
                      </div>
                    </td>
                  )}
                  {section === "employees" && admin && (
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={r["id"] === userId || !r["is_active"]}
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Remove workspace access for ${r["full_name"] || r["email"]}? Existing work records will be retained.`,
                            )
                          )
                            return;
                          const { error } = await db.rpc("remove_employee_access", {
                            employee: r["id"],
                          });
                          if (error) toast.error(error.message);
                          else {
                            await cache.invalidateQueries();
                            toast.success("Employee access removed");
                          }
                        }}
                      >
                        <Trash2 size={14} /> Remove
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel py-16 text-center">
          <Sun className="mx-auto mb-5 size-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No records here yet</h2>
          <p className="mt-3 text-muted-foreground">
            {admin
              ? "Add your first record to get started."
              : "Your assigned records will appear here."}
          </p>
        </div>
      )}
      <p className="mt-4 text-sm text-muted-foreground">
        {rows.length} records · showing up to 1,000 recent entries
      </p>
      <Dialog
        open={!!record}
        onOpenChange={(open) => {
          if (!open) setRecord(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {record?.[config.label] || "New " + config["title"].toLowerCase()}
            </DialogTitle>
            <DialogDescription>
              {readonly ? "Record details" : "Update the information below and save your changes."}
            </DialogDescription>
          </DialogHeader>
          {record && (
            <form onSubmit={save} className="space-y-6">
              {!admin && !readonly && (
                <dl className="grid gap-4 border-b pb-5 sm:grid-cols-2">
                  {config.fields
                    .filter((f) => !editable.some((x) => x.key === f.key))
                    .map((f) => (
                      <div key={f.key}>
                        <dt className="text-sm text-muted-foreground">{f.label}</dt>
                        <dd>{value(f.key, record[f.key])}</dd>
                      </div>
                    ))}
                </dl>
              )}
              {(readonly ? config.fields : editable).map((f) => (
                <Editor
                  key={f.key}
                  field={f}
                  value={record[f.key]}
                  disabled={readonly}
                  references={refs.data ?? {}}
                  onChange={(v) => setRecord({ ...record, [f.key]: v })}
                />
              ))}
              {section === "products" && admin && !readonly && (
                <ProductImageEditor
                  userId={userId}
                  value={record["image_url"] || ""}
                  onChange={(url) => setRecord({ ...record, image_url: url })}
                />
              )}
              {section === "tasks" && record["task_type"] === "site_visit" && record["id"] && (
                <VisitEvidence
                  record={record}
                  readonly={readonly}
                  onChange={setRecord}
                  onFile={setBusyFile}
                />
              )}
              {section === "history" && (
                <dl>
                  {config.columns.map((k) => (
                    <div key={k} className="mb-3">
                      <dt className="text-sm text-muted-foreground">{k.replaceAll("_", " ")}</dt>
                      <dd>{value(k, record[k])}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {section === "employees" && admin && record["id"] !== userId && (
                <label className="block space-y-2 text-sm">
                  Assign role
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full rounded border bg-background p-3"
                  >
                    <option value="">Keep current role</option>
                    {APP_ROLES.filter((r) => r !== "super_admin").map((r) => (
                      <option value={r} key={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {section === "employees" &&
                admin &&
                record["id"] !== userId &&
                record["is_active"] && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Remove workspace access for ${record["full_name"] || record["email"]}? Existing work records will be retained.`,
                        )
                      )
                        return;
                      setBusy(true);
                      const { error } = await db.rpc("remove_employee_access", {
                        employee: record["id"],
                      });
                      setBusy(false);
                      if (error) setError(error.message);
                      else {
                        await cache.invalidateQueries();
                        setRecord(null);
                        toast.success("Employee access removed");
                      }
                    }}
                  >
                    <Trash2 size={16} /> Remove access
                  </Button>
                )}
              {error && <p role="alert">{error}</p>}
              {!readonly && <Button disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>}
              {section === "quotations" && record["id"] && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => printQuote(record, refs.data ?? {}, false)}
                  >
                    <Eye size={16} /> Preview
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => printQuote(record, refs.data ?? {}, true)}
                  >
                    <Download size={16} /> Download PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shareQuote(record, refs.data ?? {}, "whatsapp")}
                  >
                    <Share2 size={16} /> WhatsApp
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shareQuote(record, refs.data ?? {}, "email")}
                  >
                    <Share2 size={16} /> Email
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shareQuote(record, refs.data ?? {}, "copy")}
                  >
                    <Share2 size={16} /> Copy details
                  </Button>
                  {admin && (
                    <Button type="button" variant="destructive" onClick={() => removeRow(record)}>
                      <Trash2 size={16} /> Delete quotation
                    </Button>
                  )}
                </div>
              )}
              {section === "leads" && record["id"] && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold">Activity notes</h3>
                  {activities.data?.map((a) => (
                    <div className="my-3 border-b pb-3" key={a["id"]}>
                      <p>{a["note"]}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(a["created_at"]).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {canWrite && (
                    <>
                      <Textarea
                        aria-label="New activity note"
                        className="mt-4"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={2000}
                      />
                      <Button
                        className="mt-3"
                        type="button"
                        variant="outline"
                        disabled={!note.trim()}
                        onClick={async () => {
                          const { error } = await db.from("lead_activities").insert({
                            lead_id: record["id"],
                            created_by: userId,
                            note: note.trim(),
                          });
                          if (error) toast.error(error.message);
                          else {
                            setNote("");
                            activities.refetch();
                          }
                        }}
                      >
                        Add note
                      </Button>
                    </>
                  )}
                  <ApplicationFiles leadId={record["id"]} userId={userId} canWrite={canWrite} />
                </div>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function VisitEvidence({
  record,
  readonly,
  onChange,
  onFile,
}: {
  record: Row;
  readonly: boolean;
  onChange: (r: Row) => void;
  onFile: (f: File | null) => void;
}) {
  const [locating, setLocating] = useState(false);
  const photo = record["visit_photo_path"] as string | undefined;
  return (
    <section className="space-y-4 border-t pt-6">
      <h3 className="font-semibold">Site visit evidence</h3>
      <p className="text-sm text-muted-foreground">
        Capture a site photo, use this device’s location, and add a short reason or outcome.
        Evidence stays private with this task.
      </p>
      <label className="block space-y-2 text-sm">
        Visit photo
        <input
          className="block w-full rounded border bg-background p-3"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={readonly}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {photo && (
        <p className="text-xs text-muted-foreground">
          Photo saved ·{" "}
          <button
            type="button"
            className="underline"
            onClick={async () => {
              const r = await db.storage.from("site-visit-evidence").createSignedUrl(photo, 60);
              if (r.error) toast.error(r.error.message);
              else if (r.data) window.open(r.data.signedUrl, "_blank", "noopener");
            }}
          >
            View private photo
          </button>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="outline"
          disabled={readonly || locating}
          onClick={() => {
            if (!navigator.geolocation) {
              toast.error("Location is unavailable in this browser.");
              return;
            }
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
              (p) => {
                onChange({
                  ...record,
                  visit_latitude: p.coords.latitude,
                  visit_longitude: p.coords.longitude,
                });
                setLocating(false);
              },
              () => {
                toast.error("Could not get location. Allow location access and try again.");
                setLocating(false);
              },
              { enableHighAccuracy: true, timeout: 15000 },
            );
          }}
        >
          <MapPin size={16} />
          {locating ? "Getting location…" : "Capture current location"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {record["visit_latitude"] != null && record["visit_longitude"] != null
            ? `${Number(record["visit_latitude"]).toFixed(5)}, ${Number(record["visit_longitude"]).toFixed(5)}`
            : "Location not captured"}
        </span>
      </div>
      <label className="block space-y-2 text-sm">
        Short reason / visit note
        <Textarea
          maxLength={500}
          disabled={readonly}
          value={record["visit_note"] ?? ""}
          onChange={(e) => onChange({ ...record, visit_note: e.target.value })}
          placeholder="Purpose of visit, site condition, or next action"
        />
      </label>
    </section>
  );
}
function ApplicationFiles({
  leadId,
  userId,
  canWrite,
}: {
  leadId: string;
  userId: string;
  canWrite: boolean;
}) {
  const [details, setDetails] = useState({ consumer: "", state: "", discom: "", ref: "" });
  const [docType, setDocType] = useState("electricity_bill"),
    [typed, setTyped] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [saving, setSaving] = useState(false);
  const cache = useQueryClient();
  const app = useQuery({
    queryKey: ["application", leadId],
    queryFn: async () => {
      const { data, error } = await db
        .from("scheme_applications")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const files = useQuery({
    queryKey: ["application-files", app.data?.id],
    enabled: !!app.data?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from("application_documents")
        .select("*")
        .eq("application_id", app.data!.id)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  async function saveDetails() {
    setSaving(true);
    const { error } = await db.rpc("attach_solar_application", {
      target_lead: leadId,
      consumer: details.consumer,
      state_name: details.state,
      utility: details.discom,
      portal_ref: details.ref || null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      await cache.invalidateQueries({ queryKey: ["application", leadId] });
      toast.success("PM Surya Ghar checklist added");
    }
  }
  async function uploadDoc() {
    if (!app.data || (!file && !typed.trim())) {
      toast.error("Add typed details or choose a photo/PDF.");
      return;
    }
    setSaving(true);
    let path: string | null = null;
    try {
      if (file) {
        if (
          file.size > 10 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)
        )
          throw Error("Choose a JPG, PNG, WebP or PDF under 10 MB.");
        path = `${app.data.id}/${docType}/${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const uploaded = await db.storage.from("customer-documents").upload(path, file);
        if (uploaded.error) throw uploaded.error;
      }
      const { error } = await db.from("application_documents").insert({
        application_id: app.data.id,
        document_type: docType,
        storage_path: path,
        file_name: file?.name ?? null,
        typed_details: typed.trim() || null,
        uploaded_by: userId,
      });
      if (error) {
        if (path) await db.storage.from("customer-documents").remove([path]);
        throw error;
      }
      setFile(null);
      setTyped("");
      await files.refetch();
      toast.success("Application document saved securely");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="mt-6 rounded border p-4">
      <h3 className="font-semibold">PM Surya Ghar documents</h3>
      {!app.data ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Add the electricity connection details to start a checklist for this lead.
          </p>
          {canWrite && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                aria-label="Electricity consumer number"
                placeholder="Consumer / account number"
                value={details.consumer}
                onChange={(e) => setDetails({ ...details, consumer: e.target.value })}
              />
              <Input
                aria-label="State"
                placeholder="State / Union Territory"
                value={details.state}
                onChange={(e) => setDetails({ ...details, state: e.target.value })}
              />
              <Input
                aria-label="DISCOM"
                placeholder="Electricity provider (DISCOM)"
                value={details.discom}
                onChange={(e) => setDetails({ ...details, discom: e.target.value })}
              />
              <Input
                aria-label="Portal application number"
                placeholder="Portal application number (optional)"
                value={details.ref}
                onChange={(e) => setDetails({ ...details, ref: e.target.value })}
              />
              <Button type="button" disabled={saving} onClick={saveDetails}>
                Create PM Surya Ghar checklist
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Consumer number {app.data.consumer_number} · {app.data.discom}, {app.data.state}
            {app.data.application_reference
              ? ` · Portal ref ${app.data.application_reference}`
              : ""}
          </p>
          {canWrite && (
            <div className="mt-4 space-y-3 rounded bg-muted/50 p-3">
              <label className="block space-y-2 text-sm">
                Document
                <select
                  className="block w-full rounded border bg-background p-3"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="electricity_bill">Latest electricity bill</option>
                  <option value="identity">Identity proof</option>
                  <option value="roof_authorization">Roof ownership / owner consent</option>
                  <option value="other">Other supporting information</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm">
                Photo or PDF (optional if adding typed details)
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="block space-y-2 text-sm">
                Or enter details
                <Textarea
                  maxLength={1500}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={saving || (!typed.trim() && !file)}
                onClick={uploadDoc}
              >
                {saving ? "Saving…" : "Save document details"}
              </Button>
            </div>
          )}
          {files.data?.map((f) => (
            <div
              key={f.id}
              className="mt-3 flex flex-wrap justify-between gap-3 border-t pt-3 text-sm"
            >
              <span className="capitalize">
                {f.document_type.replaceAll("_", " ")} · {f.file_name || "Typed details"}
              </span>
              {f.typed_details && <p className="w-full text-muted-foreground">{f.typed_details}</p>}
              {f.storage_path && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const r = await db.storage
                      .from("customer-documents")
                      .createSignedUrl(f.storage_path!, 60);
                    if (r.error) toast.error(r.error.message);
                    else if (r.data) window.open(r.data.signedUrl, "_blank", "noopener");
                  }}
                >
                  Open secure file
                </Button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
function Editor({
  field: f,
  value,
  disabled,
  references,
  onChange,
}: {
  field: Field;
  value: any;
  disabled: boolean;
  references: Record<string, Row[]>;
  onChange: (value: any) => void;
}) {
  if (f.type === "boolean")
    return (
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={!!value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        {f.label}
      </label>
    );
  if (f.type === "lines")
    return (
      <LineItems
        value={value ?? []}
        disabled={disabled}
        prices={references["material_prices"] ?? []}
        onChange={onChange}
      />
    );
  if (f.type === "json")
    return (
      <div>
        <p className="mb-3 font-medium">{f.label}</p>
        {Object.entries(value ?? {}).map(([k, v]) => (
          <label key={k} className="mb-3 block text-sm">
            <Input
              aria-label="Field name"
              disabled={disabled}
              defaultValue={k}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next && next !== k && !Object.hasOwn(value, next)) {
                  const copy = { ...value };
                  delete copy[k];
                  copy[next] = v;
                  onChange(copy);
                }
              }}
            />
            <Input
              disabled={disabled}
              value={typeof v === "object" ? JSON.stringify(v) : String(v)}
              onChange={(e) =>
                onChange({
                  ...value,
                  [k]: typeof v === "number" ? Number(e.target.value) : e.target.value,
                })
              }
            />
          </label>
        ))}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({ ...value, ["New field " + (Object.keys(value ?? {}).length + 1)]: "" })
            }
          >
            Add value
          </Button>
        )}
      </div>
    );
  const id = "edit-" + f.key;
  return (
    <label htmlFor={id} className="block space-y-2 text-sm">
      {f.label}
      {f.required ? " *" : ""}
      {f.type === "select" ? (
        <select
          id={id}
          disabled={disabled}
          required={f.required}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded border bg-background p-3"
        >
          <option value="">Select…</option>
          {f.relation
            ? (references[f.relation] ?? []).map((r) => (
                <option key={r["id"]} value={r["id"]}>
                  {r["full_name"] || r["name"] || r["title"] || r["email"]}
                </option>
              ))
            : f.options?.map((v) => <option key={v}>{v}</option>)}
        </select>
      ) : f.type === "textarea" ? (
        <Textarea
          id={id}
          disabled={disabled}
          required={f.required}
          value={Array.isArray(value) ? value.join("\n") : (value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          disabled={disabled}
          required={f.required}
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
          min={f.type === "number" ? 0 : undefined}
          step="any"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function LineItems({
  value,
  disabled,
  prices,
  onChange,
}: {
  value: Row[];
  disabled: boolean;
  prices: Row[];
  onChange: (v: Row[]) => void;
}) {
  const total = value.reduce(
    (s, l) =>
      s + Number(l["quantity"] || 0) * Number(l["rate"] || 0) * (1 + Number(l["gst"] || 0) / 100),
    0,
  );
  return (
    <div>
      <h3 className="mb-3 font-semibold">Quotation line items</h3>
      {value.map((l, i) => (
        <div className="mb-4 grid gap-3 rounded border p-4 sm:grid-cols-4" key={i}>
          {(
            [
              ["description", "Item"],
              ["quantity", "Quantity"],
              ["rate", "Unit price (₹)"],
              ["gst", "GST (%)"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="text-sm">
              {label}
              <Input
                disabled={disabled}
                required
                type={k === "description" ? "text" : "number"}
                min="0"
                step="any"
                value={l[k] ?? ""}
                onChange={(e) =>
                  onChange(
                    value.map((x, n) =>
                      n === i
                        ? {
                            ...x,
                            [k]: k === "description" ? e.target.value : Number(e.target.value),
                          }
                        : x,
                    ),
                  )
                }
              />
            </label>
          ))}
          {!disabled && (
            <button
              type="button"
              className="text-left text-sm underline"
              onClick={() => onChange(value.filter((_, n) => n !== i))}
            >
              Remove line
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange([...value, { description: "", quantity: 1, rate: 0, gst: 0 }])}
          >
            Add line
          </Button>
          <select
            aria-label="Add material price"
            className="rounded border bg-background p-2"
            value=""
            onChange={(e) => {
              const p = prices.find((p) => p["id"] === e.target.value);
              if (p)
                onChange([
                  ...value,
                  {
                    description: p["item_name"] + " (" + p["unit"] + ")",
                    quantity: 1,
                    rate: p["price"],
                    gst: p["gst_percent"],
                  },
                ]);
            }}
          >
            <option value="">Add from material prices…</option>
            {prices
              .filter((p) => p["is_active"])
              .map((p) => (
                <option value={p["id"]} key={p["id"]}>
                  {p["item_name"]}
                </option>
              ))}
          </select>
        </div>
      )}
      <p className="mt-4 font-semibold">Total before subsidy: {money(total)}</p>
    </div>
  );
}
function quoteDetails(row: Row, refs: Record<string, Row[]>) {
  const customer =
    refs["customers"]?.find((x) => x["id"] === row["customer_id"]) ||
    refs["leads"]?.find((x) => x["id"] === row["lead_id"]);
  return {
    customer,
    message: `Easternbay Solar quotation ${row["quote_number"]} for ${customer?.["name"] || "customer"}: total ${money(Number(row["total_amount"]))}. Valid until ${row["valid_until"] || "as stated"}.`,
  };
}
function quoteAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}
function amountInWords(value: number) {
  const small = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const underThousand = (n: number): string => {
    if (n < 20) return small[n]!;
    if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${small[n % 10]}` : ""}`;
    return `${small[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${underThousand(n % 100)}` : ""}`;
  };
  let n = Math.max(0, Math.floor(value));
  if (!n) return "Zero Rupees Only";
  const parts: string[] = [];
  for (const [unit, size] of [
    ["Crore", 10000000],
    ["Lakh", 100000],
    ["Thousand", 1000],
    ["", 1],
  ] as const) {
    const count = Math.floor(n / size);
    if (count) parts.push(`${underThousand(count)}${unit ? ` ${unit}` : ""}`);
    n %= size;
  }
  return `${parts.join(" ")} Rupees Only`;
}
function shareQuote(row: Row, refs: Record<string, Row[]>, method: "whatsapp" | "email" | "copy") {
  const { customer, message } = quoteDetails(row, refs);
  if (method === "whatsapp") {
    const phone = String(customer?.["mobile"] || "").replace(/\D/g, "");
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  } else if (method === "email") {
    window.location.href = `mailto:${encodeURIComponent(customer?.["email"] || "")}?subject=${encodeURIComponent(`Quotation ${row["quote_number"]} - Easternbay Solar`)}&body=${encodeURIComponent(message)}`;
  } else {
    void navigator.clipboard.writeText(message).then(
      () => toast.success("Quotation details copied"),
      () => toast.error("Could not copy quotation details"),
    );
  }
}
function printQuote(row: Row, refs: Record<string, Row[]>, autoPrint: boolean) {
  const w = window.open("", "_blank");
  if (!w) return;
  const e = (s: unknown) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    );
  const { customer } = quoteDetails(row, refs);
  const lines: Row[] = row["line_items"] ?? [];
  const taxable = lines.reduce(
    (sum, l) => sum + Number(l["quantity"] || 0) * Number(l["rate"] || 0),
    0,
  );
  const taxes = [...new Set(lines.map((l) => Number(l["gst"] || 0)))]
    .sort((a, b) => a - b)
    .map((rate) => ({
      rate,
      amount:
        lines
          .filter((l) => Number(l["gst"] || 0) === rate)
          .reduce(
            (sum, l) => sum + (Number(l["quantity"] || 0) * Number(l["rate"] || 0) * rate) / 100,
            0,
          ) / 2,
    }));
  const date = row["created_at"]
    ? new Date(row["created_at"]).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");
  const logo = `${window.location.origin}/brand/easternbay-logo-transparent.png`;
  w.document.write(
    "<html><head><title>" +
      e(row["quote_number"]) +
      "</title><style>*{box-sizing:border-box}body{font:13px Arial,sans-serif;color:#222;margin:36px auto;max-width:900px}.top{display:flex;justify-content:space-between;align-items:flex-start}.brand h1{font-size:24px;margin:5px 0}.brand p{margin:3px 0}.logo{width:82px;height:82px;object-fit:contain}.eyebrow{text-transform:uppercase;letter-spacing:3px;color:#db8b00;font-weight:bold}.meta{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:18px 0}.customer{padding:12px 0}.quote-table{border-collapse:collapse;width:100%;margin-top:16px}.quote-table td,.quote-table th{text-align:left;border-top:1px solid #b9d7e8;padding:9px 7px}.quote-table th{border-top:2px solid #e89400;border-bottom:2px solid #e89400;background:#f7f8f8}.num{text-align:right!important;white-space:nowrap}.summary{margin:6px 0 18px auto;width:min(360px,100%)}.summary div{display:flex;justify-content:space-between;padding:3px 0}.total{font-size:19px;font-weight:bold;border-top:1px solid #555;padding-top:7px!important}.bank{border-top:2px solid #e89400;margin-top:10px;padding-top:16px}.bankgrid{display:grid;grid-template-columns:180px 1fr;gap:7px}.actions{padding:12px 0}@media print{body{margin:0 auto}.actions{display:none}}@page{size:A4;margin:15mm}</style></head><body><div class='top'><div class='brand'><div class='eyebrow'>Quotation</div><h1>Easternbay Solar</h1><p><b>GSTIN</b> " +
      e(row["company_gst_number"] || "37EXFPR0556E1ZC") +
      "</p><p>" +
      e(
        row["company_address"] ||
          "1-128/11, Near Hanuman Statue, Rajugari Beedu, Payakaraopeta, Anakapalli, Andhra Pradesh, 531126",
      ).replaceAll("\n", "<br>") +
      "</p><p><b>Mobile</b> +91 93468 28227</p></div><div style='text-align:right'><div class='eyebrow' style='color:#333'>Original for recipient</div><img class='logo' src='" +
      e(logo) +
      "'></div></div><div class='meta'><span><b>Quotation #:</b> " +
      e(row["quote_number"]) +
      "</span><span><b>Quotation Date:</b> " +
      e(date) +
      "</span><span><b>Validity:</b> " +
      e(row["valid_until"] || "-") +
      "</span></div><div class='customer'><b>Customer Details:</b><p><b>" +
      e(customer?.["name"]) +
      "</b> · " +
      e(customer?.["mobile"]) +
      "</p><p>Place of Supply: " +
      e(customer?.["state"] || customer?.["city"] || customer?.["location"] || "-") +
      "</p></div><table class='quote-table'><thead><tr><th>#</th><th>Item</th><th class='num'>Rate / Item</th><th class='num'>Qty</th><th class='num'>Taxable Value</th><th class='num'>Tax Amount</th><th class='num'>Amount</th></tr></thead><tbody>" +
      lines
        .map((l, i) => {
          const base = Number(l["quantity"] || 0) * Number(l["rate"] || 0);
          const tax = (base * Number(l["gst"] || 0)) / 100;
          return (
            "<tr><td>" +
            (i + 1) +
            "</td><td>" +
            e(l["description"]) +
            "</td><td class='num'>" +
            e(quoteAmount(Number(l["rate"]))) +
            "</td><td class='num'>" +
            e(l["quantity"]) +
            "</td><td class='num'>" +
            e(quoteAmount(base)) +
            "</td><td class='num'>" +
            e(quoteAmount(tax)) +
            " (" +
            e(l["gst"]) +
            "%)</td><td class='num'>" +
            e(quoteAmount(base + tax)) +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table><div class='summary'><div><b>Taxable Amount</b><b>" +
      "₹" +
      e(quoteAmount(taxable)) +
      "</b></div>" +
      taxes
        .map(
          (t) =>
            "<div><span>CGST " +
            t.rate / 2 +
            "%</span><span>" +
            "₹" +
            e(quoteAmount(t.amount)) +
            "</span></div><div><span>SGST " +
            t.rate / 2 +
            "%</span><span>" +
            "₹" +
            e(quoteAmount(t.amount)) +
            "</span></div>",
        )
        .join("") +
      (Number(row["subsidy_amount"] || 0) > 0
        ? "<div><span>Confirmed subsidy</span><span>-" +
          "₹" +
          e(quoteAmount(Number(row["subsidy_amount"]))) +
          "</span></div>"
        : "") +
      "<div class='total'><span>Total</span><span>" +
      "₹" +
      e(quoteAmount(Number(row["total_amount"]))) +
      "</span></div></div><p>Total Items / Qty: " +
      lines.length +
      " / " +
      lines.reduce((n, l) => n + Number(l["quantity"] || 0), 0) +
      "</p><p><b>Total amount (in words):</b> INR " +
      e(amountInWords(Number(row["total_amount"]))) +
      ".</p><p><b>Terms and notes</b><br>" +
      e(row["notes"] || "").replaceAll("\n", "<br>") +
      "</p><div class='bank'><b>Bank Details</b><div class='bankgrid'>" +
      e(
        row["bank_details"] ||
          "Bank: State Bank of India\nAccount Holder: EASTERNBAY SOLAR\nAccount #: 45338592498\nIFSC Code: SBIN0003064\nBranch: ADB TUNI",
      )
        .split("\n")
        .map(
          (line) =>
            "<span>" +
            e(line.split(":")[0]) +
            "</span><b>" +
            e(line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : "") +
            "</b>",
        )
        .join("") +
      "</div></div><div style='text-align:right;margin-top:28px'>For Easternbay Solar<br><br><br>Authorized Signatory</div><div class='actions'><button onclick='window.print()'>Print / Save as PDF</button></div><footer style='border-top:1px solid #ddd;padding-top:10px'>This is a digitally generated quotation.</footer></body></html>",
  );
  w.document.close();
  if (autoPrint) w.addEventListener("load", () => w.print(), { once: true });
}

function ProductImageEditor({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium">
        <ImagePlus size={16} /> Product image
      </label>
      {value && (
        <img src={value} alt="Product preview" className="h-32 w-40 rounded border object-cover" />
      )}
      <Input
        type="file"
        aria-label="Upload product image"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (
            file.size > 5 * 1024 * 1024 ||
            !["image/jpeg", "image/png", "image/webp"].includes(file.type)
          ) {
            toast.error("Choose a JPG, PNG or WebP image under 5 MB.");
            e.target.value = "";
            return;
          }
          setUploading(true);
          try {
            const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
            const result = await db.storage
              .from("product-images")
              .upload(path, file, { upsert: false });
            if (result.error) toast.error(result.error.message);
            else {
              const { data } = db.storage.from("product-images").getPublicUrl(path);
              onChange(data.publicUrl);
              toast.success("Product image uploaded");
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to upload the image");
          } finally {
            setUploading(false);
            e.target.value = "";
          }
        }}
      />
      {uploading && (
        <p role="status" className="text-sm">
          Uploading image…
        </p>
      )}
    </div>
  );
}
function Uploads({ userId }: { userId: string }) {
  const projects = useRows("projects"),
    docs = useRows("documents"),
    [project, setProject] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="panel space-y-6 p-8">
      <p>Private site photographs and PDFs. Up to 10 MB per file.</p>
      <label className="block">
        Project
        <select
          className="mt-2 block w-full rounded border bg-background p-3"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        >
          <option value="">Choose an assigned project</option>
          {projects.data?.map((p) => (
            <option key={p["id"]} value={p["id"]}>
              {p["title"]}
            </option>
          ))}
        </select>
      </label>
      <input
        aria-label="Upload project document"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        disabled={!project || busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (
            file.size > 10485760 ||
            !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)
          ) {
            toast.error("Choose a JPG, PNG, WebP or PDF under 10 MB.");
            return;
          }
          setBusy(true);
          const path =
            project +
            "/" +
            userId +
            "/" +
            crypto.randomUUID() +
            "-" +
            file["name"].replace(/[^a-zA-Z0-9._-]/g, "_");
          try {
            const upload = await db.storage.from("project-documents").upload(path, file);
            if (upload.error) throw upload.error;
            const insert = await db.from("documents").insert({
              project_id: project,
              uploaded_by: userId,
              file_name: file["name"],
              storage_path: path,
            });
            if (insert.error) {
              await db.storage.from("project-documents").remove([path]);
              throw insert.error;
            }
            await docs.refetch();
            toast.success("Document uploaded");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      {busy && <p role="status">Uploading…</p>}
      {docs.error && <p role="alert">{docs.error.message}</p>}
      {docs.data
        ?.filter((d) => !project || d["project_id"] === project)
        .map((d) => (
          <div className="flex items-center justify-between gap-5 border-t py-4" key={d["id"]}>
            <div>
              <p>{d["file_name"]}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(d["created_at"]).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                const r = await db.storage
                  .from("project-documents")
                  .createSignedUrl(d["storage_path"], 60);
                if (r.error) toast.error(r.error.message);
                else if (r.data) window.open(r.data.signedUrl, "_blank", "noopener");
              }}
            >
              Open
            </Button>
          </div>
        ))}
    </div>
  );
}
