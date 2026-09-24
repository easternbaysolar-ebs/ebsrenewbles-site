import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const APP_ROLES = [
  "super_admin",
  "admin",
  "sales_manager",
  "sales_employee",
  "site_engineer",
  "installation_team",
  "accountant",
  "view_only",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  sales_manager: "Sales manager",
  sales_employee: "Sales employee",
  site_engineer: "Site engineer",
  installation_team: "Installation team",
  accountant: "Accountant",
  view_only: "View only",
};

export const ADMIN_ROLES: AppRole[] = ["super_admin", "admin"];

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useMyRoles() {
  const { user, loading } = useSession();
  const query = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const profile = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", user!.id)
        .maybeSingle();
      if (profile.error) throw profile.error;
      if (!profile.data?.is_active) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const roles = query.data ?? [];
  return {
    roles,
    isAdmin: roles.some((r) => ADMIN_ROLES.includes(r)),
    isStaff: roles.length > 0,
    primaryRole: roles[0] ?? null,
    loading: loading || query.isLoading,
    error: query.error as Error | null,
  };
}

export function useMyProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  };
}
