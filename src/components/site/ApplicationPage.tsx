import { useState } from "react";
import { PublicLayout } from "./PublicLayout";
import { Section } from "./Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import { toast } from "sonner";

const docs = [
  ["electricity_bill", "Latest electricity bill", true],
  ["identity", "Identity proof (optional at enquiry stage)", false],
  ["roof_authorization", "Roof ownership / owner consent (if applicable)", false],
  ["other", "Other supporting information", false],
] as const;
type Attachment = { file?: File; typed: string };
export function ApplicationPage() {
  const [values, setValues] = useState({ name: "", mobile: "", email: "", address: "", consumer_number: "", state: "", discom: "", application_reference: "", notes: "" });
  const [attachments, setAttachments] = useState<Record<string, Attachment>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const update = (key: string, value: string) => setValues((old) => ({ ...old, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (!attachments["electricity_bill"]?.file && !attachments["electricity_bill"]?.typed?.trim()) throw new Error("Attach your latest electricity bill or type its relevant details.");
      for (const a of Object.values(attachments)) if (a.file && (a.file.size > 10 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(a.file.type))) throw new Error("Each file must be JPG, PNG, WebP or PDF and under 10 MB.");
      const result = await db.rpc("submit_solar_application", { info: values });
      if (result.error) throw result.error;
      const applicationId = String(result.data);
      const { data: authData } = await db.auth.getUser();
      for (const [type, attachment] of Object.entries(attachments)) {
        const typed = attachment.typed.trim();
        let path: string | null = null;
        if (attachment.file) {
          const file = attachment.file;
          path = `${applicationId}/${type}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const uploaded = await db.storage.from("customer-documents").upload(path, file);
          if (uploaded.error) throw uploaded.error;
        }
        if (path || typed) {
          const saved = await db.from("application_documents").insert({ application_id: applicationId, document_type: type, storage_path: path, file_name: attachment.file?.name ?? null, typed_details: typed || null, uploaded_by: authData.user?.id ?? null });
          if (saved.error) throw saved.error;
        }
      }
      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit your application.";
      setError(message); toast.error(message);
    } finally { setBusy(false); }
  }
  return <PublicLayout><Section bordered={false}>
    <p className="eyebrow mb-4">PM Surya Ghar · Customer application</p>
    <h1 className="display-2 max-w-4xl">Start your rooftop solar application.</h1>
    <p className="mt-5 max-w-3xl text-muted-foreground">Share your electricity connection details and the latest bill. You can type the relevant information or attach a clear photo/PDF. Easternbay will help you prepare the next steps for the official portal.</p>
    <p className="mt-4 max-w-3xl rounded border p-4 text-sm text-muted-foreground">This is Easternbay’s document collection form, not the Government application portal. The portal may request additional details depending on your state and DISCOM. Do not upload bank account proofs or other highly sensitive financial documents here; those are handled later if required.</p>
    {done ? <div className="panel mt-10 max-w-3xl p-8"><h2 className="text-2xl font-semibold">Application details received</h2><p className="mt-3 text-muted-foreground">Our team will review your connection details and contact you about any next steps.</p><Button className="mt-6" asChild><a href="/">Back to home</a></Button></div> : <form onSubmit={submit} className="panel mt-10 max-w-4xl space-y-7 p-6 sm:p-9">
      <div><h2 className="text-xl font-semibold">Applicant and connection</h2><p className="mt-2 text-sm text-muted-foreground">Fields marked required are needed to start the review.</p></div>
      <div className="grid gap-5 sm:grid-cols-2">
        {([["name","Applicant full name","text"],["mobile","Mobile number","tel"],["email","Email (optional)","email"],["consumer_number","Electricity consumer / account number","text"],["state","State / Union Territory","text"],["discom","Electricity provider (DISCOM)","text"],["application_reference","Portal application number (if already started)","text"]] as const).map(([key,label,type])=><label key={key} className="space-y-2 text-sm">{label}{!["email","application_reference"].includes(key) && " *"}<Input required={!["email","application_reference"].includes(key)} type={type} value={values[key]} onChange={(e)=>update(key,e.target.value)} maxLength={key==="mobile"?15:254}/></label>)}
        <label className="space-y-2 text-sm sm:col-span-2">Service address<Input value={values.address} onChange={(e)=>update("address",e.target.value)} maxLength={300}/></label>
      </div>
      <div className="border-t pt-6"><h2 className="text-xl font-semibold">Documents and typed details</h2><p className="mt-2 text-sm text-muted-foreground">For each item, add a file or type the relevant details. A recent electricity bill is needed to verify the connection.</p></div>
      {docs.map(([key,label,required])=><div key={key} className="space-y-3 rounded border p-4"><p className="font-medium">{label}{required && " *"}</p><label className="block space-y-2 text-sm">Attach photo or PDF<Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e)=>{const file=e.target.files?.[0];if(file)setAttachments((old)=>({...old,[key]:{file,typed:old[key]?.typed??""}}));}}/></label><label className="block space-y-2 text-sm">Or type identifying details<Textarea maxLength={1500} value={attachments[key]?.typed ?? ""} onChange={(e)=>setAttachments((old)=>({...old,[key]:{...(old[key]?.file?{file:old[key].file}:{}),typed:e.target.value}}))} placeholder={key==="electricity_bill"?"You may enter the bill date, consumer name and connection details":"Relevant details (optional)"}/></label>{attachments[key]?.file && <p className="text-xs text-muted-foreground">Selected: {attachments[key].file?.name}</p>}</div>)}
      <label className="block space-y-2 text-sm">Anything else we should know?<Textarea maxLength={1000} value={values.notes} onChange={(e)=>update("notes",e.target.value)}/></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={busy}>{busy?"Submitting securely…":"Submit application details"}</Button>
      <p className="text-xs text-muted-foreground">Your uploaded files are private and available only to authorised Easternbay staff assigned to your enquiry.</p>
    </form>}
  </Section></PublicLayout>;
}

