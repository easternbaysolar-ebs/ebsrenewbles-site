import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useMyRoles } from "@/lib/auth";
import { contactFields, contactText, useContact, validateContact } from "@/lib/contact";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ContactSettings() {
  const roles = useMyRoles();
  const query = useContact();
  const cache = useQueryClient();
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!roles.isAdmin) return <p>Administrator access required.</p>;
  if (query.isPending) return <p>Loading contact settings…</p>;
  if (query.error) return <p role="alert">Could not load contact settings. Please try again.</p>;
  const saved = query.data?.value ?? {};
  const values = draft ?? {
    ...saved,
    ...Object.fromEntries(contactFields.map(([key]) => [key, contactText(saved[key])])),
  };
  return (
    <form
      className="panel max-w-3xl space-y-6 p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          validateContact(values);
          const value = { ...values };
          for (const [key] of contactFields) value[key] = contactText(values[key]);
          const payload = {
            key: "contact.details",
            section: "contact",
            label: "Contact details",
            value,
          };
          const result = query.data
            ? await db
                .from("site_content")
                .update({ value })
                .eq("id", query.data.id)
                .select("id")
                .single()
            : await db.from("site_content").insert(payload).select("id").single();
          if (result.error) throw result.error;
          await cache.invalidateQueries();
          setDraft(null);
          setMessage("Contact and social links updated.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Unable to save settings.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm text-muted-foreground">
        These details appear on the contact page and footer. Leave a link blank to hide it. Only
        administrators can save changes.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {contactFields.map(([key, label]) => (
          <label key={key} className="space-y-2 text-sm">
            <span>{label}</span>
            <Input
              value={typeof values[key] === "string" ? String(values[key]) : ""}
              maxLength={500}
              disabled={busy}
              type={label.endsWith("URL") ? "url" : key === "email" ? "email" : "text"}
              placeholder={label.endsWith("URL") ? "https://…" : undefined}
              onChange={(event) => setDraft({ ...values, [key]: event.target.value })}
            />
          </label>
        ))}
      </div>
      <Button disabled={busy}>{busy ? "Saving…" : "Save contact links"}</Button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

