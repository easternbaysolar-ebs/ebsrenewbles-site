import { queryOptions } from "@tanstack/react-query";

import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const productsQuery = queryOptions({
  queryKey: ["products", "public"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const schemesQuery = queryOptions({
  queryKey: ["schemes", "public"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("schemes")
      .select("*")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const publishedProjectsQuery = queryOptions({
  queryKey: ["projects", "public"],
  queryFn: async () => {
    const { data, error } = await db.from("public_projects").select("*").order("sort_order");
    if (error) throw error;
    const media = await supabase
      .from("project_media")
      .select("id,project_id,url,caption,sort_order,is_placeholder");
    if (media.error) throw media.error;
    return (data ?? []).map((p) => ({
      ...p,
      project_media: (media.data ?? []).filter((m) => m.project_id === p.id),
    })) as PublicProject[];
  },
});

export const calculatorAssumptionsQuery = queryOptions({
  queryKey: ["site-content", "calculator.assumptions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("site_content")
      .select("value")
      .eq("key", "calculator.assumptions")
      .maybeSingle();
    if (error) throw error;
    return (data?.value ?? null) as Record<string, number> | null;
  },
});

type Tables = Database["public"]["Tables"];
export type PublicProduct = Tables["products"]["Row"];
export type PublicScheme = Tables["schemes"]["Row"];
export type PublicProject = Tables["projects"]["Row"] & {
  project_media: Pick<
    Tables["project_media"]["Row"],
    "id" | "url" | "caption" | "sort_order" | "is_placeholder"
  >[];
};
