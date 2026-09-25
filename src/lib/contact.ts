import { useQuery } from "@tanstack/react-query";
import { db, safeUrl } from "./db";

export const contactFields = [
  ["phone", "Phone"],
  ["email", "Email"],
  ["address", "Address"],
  ["hours", "Opening hours"],
  ["maps", "Directions URL"],
  ["whatsapp", "WhatsApp URL"],
  ["instagram", "Instagram URL"],
  ["facebook", "Facebook URL"],
  ["linkedin", "LinkedIn URL"],
  ["youtube", "YouTube URL"],
] as const;
export function contactText(value: unknown): string {
  return typeof value === "string" && !/placeholder/i.test(value) ? value.trim() : "";
}
export function validateContact(value: Record<string, unknown>) {
  for (const [key, label] of contactFields) {
    const text = contactText(value[key]);
    if (label.endsWith("URL") && text && !safeUrl(text))
      throw new Error(`${label} must start with https:// or http://`);
    if (key === "email" && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
      throw new Error("Enter a valid email address.");
    if (key === "phone" && text && !/^\+?[\d\s().-]{7,25}$/.test(text))
      throw new Error("Enter a valid phone number.");
  }
}
export function useContact() {
  return useQuery({
    queryKey: ["contact"],
    queryFn: async () => {
      const { data, error } = await db
        .from("site_content")
        .select("id,value")
        .eq("key", "contact.details")
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; value: Record<string, unknown> } | null;
    },
  });
}
