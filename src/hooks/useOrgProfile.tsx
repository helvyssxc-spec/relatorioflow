import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOrgProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["org-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("org_id, role, full_name")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
