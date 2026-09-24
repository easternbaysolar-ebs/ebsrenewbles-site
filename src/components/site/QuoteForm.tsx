import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,15}$/, "Enter a valid mobile number"),
  email: z.union([z.string().trim().email("Enter a valid email").max(255), z.literal("")]),
  location: z.string().trim().min(2, "Enter your city or area").max(160),
  customer_type: z.enum(["residential", "commercial", "industrial", "agriculture"]),
  monthly_units: z.string().trim().max(10),
  monthly_bill: z.string().trim().max(12),
  desired_kw: z.string().trim().max(10),
  notes: z.string().trim().max(1000),
});

type FormState = z.infer<typeof schema>;

const EMPTY: FormState = {
  name: "",
  mobile: "",
  email: "",
  location: "",
  customer_type: "residential",
  monthly_units: "",
  monthly_bill: "",
  desired_kw: "",
  notes: "",
};

function toNumber(value: string) {
  const n = Number(value);
  return value.trim() === "" || Number.isNaN(n) ? null : n;
}

export function QuoteForm({
  prefill,
  source = "website_quote_form",
  compact = false,
}: {
  prefill?: Partial<FormState>;
  source?: string;
  compact?: boolean;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY, ...prefill });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async (values: FormState) => {
      const { error } = await db.rpc("submit_enquiry", { payload: {
        name: values.name,
        mobile: values.mobile,
        email: values.email || null,
        location: values.location,
        customer_type: values.customer_type,
        monthly_units: toNumber(values.monthly_units),
        monthly_bill: toNumber(values.monthly_bill),
        desired_kw: toNumber(values.desired_kw),
        notes: values.notes || null,
        source,
      } });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      setForm({ ...EMPTY });
      toast.success("Enquiry received. Our team will get in touch.");
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit. Please try again."),
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof FormState] = issue.message;
      }
      setErrors(next);
      toast.error("Please check the highlighted fields.");
      return;
    }
    mutation.mutate(parsed.data);
  }

  if (submitted) {
    return (
      <div className="panel flex flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 className="size-6" aria-hidden />
        <h3 className="text-lg font-semibold">Thank you — your enquiry is logged</h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Your request has been created as a lead in our system. An Easternbay advisor will review
          your consumption details and contact you about a site assessment.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Submit another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-5 p-6 sm:p-8" noValidate>
      <div className={compact ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field label="Full name" required error={errors.name} htmlFor="q-name">
          <Input
            id="q-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </Field>
        <Field label="Mobile number" required error={errors.mobile} htmlFor="q-mobile">
          <Input
            id="q-mobile"
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            placeholder="10-digit mobile"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
        <Field label="Email (optional)" error={errors.email} htmlFor="q-email">
          <Input
            id="q-email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            inputMode="email"
            autoComplete="email"
          />
        </Field>
        <Field label="Location" required error={errors.location} htmlFor="q-location">
          <Input
            id="q-location"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="City / district"
          />
        </Field>
        <Field label="Customer type" htmlFor="q-type">
          <Select
            value={form.customer_type}
            onValueChange={(v) => set("customer_type", v as FormState["customer_type"])}
          >
            <SelectTrigger id="q-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="agriculture">Agriculture</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Desired capacity in kW (if known)" error={errors.desired_kw} htmlFor="q-kw">
          <Input
            id="q-kw"
            value={form.desired_kw}
            onChange={(e) => set("desired_kw", e.target.value)}
            placeholder="e.g. 5"
            inputMode="decimal"
          />
        </Field>
        <Field label="Monthly consumption (units)" error={errors.monthly_units} htmlFor="q-units">
          <Input
            id="q-units"
            value={form.monthly_units}
            onChange={(e) => set("monthly_units", e.target.value)}
            placeholder="e.g. 450"
            inputMode="numeric"
          />
        </Field>
        <Field label="Monthly electricity bill (₹)" error={errors.monthly_bill} htmlFor="q-bill">
          <Input
            id="q-bill"
            value={form.monthly_bill}
            onChange={(e) => set("monthly_bill", e.target.value)}
            placeholder="e.g. 3600"
            inputMode="numeric"
          />
        </Field>
      </div>

      <Field label="Notes (optional)" error={errors.notes} htmlFor="q-notes">
        <Textarea
          id="q-notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Roof type, backup requirement, preferred timeline…"
          rows={4}
        />
      </Field>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Share either monthly units or your bill amount — either is enough for us to size an
          indicative system.
        </p>
        <Button type="submit" disabled={mutation.isPending} className="shrink-0">
          {mutation.isPending ? "Submitting…" : "Submit enquiry"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-[13px]">
        {label}
        {required && <span aria-hidden className="text-muted-foreground"> *</span>}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

