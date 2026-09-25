import {
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Youtube,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { safeUrl } from "@/lib/db";
import { contactText, useContact } from "@/lib/contact";

const socials = [
  ["facebook", "Facebook", Facebook],
  ["instagram", "Instagram", Instagram],
  ["linkedin", "LinkedIn", Linkedin],
  ["youtube", "YouTube", Youtube],
  ["whatsapp", "WhatsApp", MessageCircle],
  ["maps", "Directions", MapPin],
] as const;
export function ContactDetails() {
  const query = useContact();
  const values = query.data?.value ?? {};
  const phone = contactText(values["phone"]);
  const email = contactText(values["email"]);
  const address = contactText(values["address"]);
  const hours = contactText(values["hours"]);
  return (
    <div className="space-y-4">
      <a className="inline-block underline" href="/quote">
        Send an enquiry
      </a>
      {phone && (
        <a className="flex items-center gap-2" href={"tel:" + phone.replace(/[^+0-9]/g, "")}>
          <Phone size={16} />
          {phone}
        </a>
      )}
      {email && (
        <a
          className="flex items-center gap-2 break-all"
          href={"mailto:" + encodeURIComponent(email)}
        >
          <Mail size={16} />
          {email}
        </a>
      )}
      {address && <p>{address}</p>}
      {hours && <p className="text-sm text-muted-foreground">{hours}</p>}
      <div className="flex flex-wrap gap-2" aria-label="Social media and contact shortcuts">
        {socials.map(([key, label, Icon]) => {
          const href = safeUrl(contactText(values[key]));
          return href ? (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm hover:bg-muted"
              aria-label={label + " (opens in new tab)"}
            >
              <Icon size={15} />
              {label}
            </a>
          ) : null;
        })}
      </div>
      {query.error && (
        <p role="status" className="text-sm">
          Contact details are temporarily unavailable. Please use the enquiry form.
        </p>
      )}
    </div>
  );
}
