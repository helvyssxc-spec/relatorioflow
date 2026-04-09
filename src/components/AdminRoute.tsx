import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    supabase.rpc("is_admin").then(({ data }) => {
      setIsAdmin(!!data);
      setLoading(false);
    });
  }, [user, authLoading]);

  return { isAdmin, loading };
}

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
