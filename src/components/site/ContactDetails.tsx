import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
export function ContactDetails() {
  const q = useQuery({
    queryKey: ["contact"],
    queryFn: async () => {
      const { data, error } = await db
        .from("site_content")
        .select("value")
        .eq("key", "contact.details")
        .maybeSingle();
      if (error) throw error;
      return data?.value as Record<string, string> | undefined;
    },
  });
  const v = q.data;
  return (
    <div className="space-y-3">
      <a className="underline" href="/quote">
        Send an enquiry
      </a>
      {v &&
        Object.entries(v)
          .filter(
            ([k, val]) =>
              ["phone", "email", "address"].includes(k) &&
              val &&
              !/placeholder/i.test(val),
          )
          .map(([k, val]) => (
            <p key={k}>
              <span className="mr-2 capitalize text-muted-foreground">{k}</span>
              {val}
            </p>
          ))}
    </div>
  );
}

