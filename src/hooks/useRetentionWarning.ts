import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { usePlanLimits } from "@/hooks/usePlanLimits";

export interface ExpiringReport {
  id: string;
  client_name: string | null;
  report_type: string | null;
  created_at: string;
  daysRemaining: number;
  daysOld: number;
}

export interface RetentionWarning {
  hasWarning: boolean;
  retentionDays: number;
  warningThresholdDays: number;
  expiringReports: ExpiringReport[];
  oldestDaysRemaining: number | null;
}

const RETENTION_CONFIG: Record<string, { days: number; warnAt: number }> = {
  starter: { days: 30, warnAt: 5 },
  pro: { days: 180, warnAt: 14 },
  business: { days: -1, warnAt: -1 },
};

export function useRetentionWarning(): RetentionWarning {
  const { data: profile } = useOrgProfile();
  const orgId = profile?.org_id;
  const limits = usePlanLimits();
  const planId = limits.plan.id;

  const config = RETENTION_CONFIG[planId] || RETENTION_CONFIG.starter;
  const shouldCheck = config.days > 0;

  const { data: expiringReports = [] } = useQuery({
    queryKey: ["retention-warning", orgId, planId],
    enabled: !!orgId && shouldCheck,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!shouldCheck) return [];

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (config.days - config.warnAt));

      const { data, error } = await supabase
        .from("generated_reports" as any)
        .select("id, client_name, report_type, created_at")
        .eq("org_id", orgId!)
        .lte("created_at", cutoffDate.toISOString())
        .order("created_at", { ascending: true });

      if (error || !data) return [];

      const now = new Date();
      return (data as any[]).map((r) => {
        const createdAt = new Date(r.created_at);
        const daysOld = Math.floor(
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysRemaining = Math.max(0, config.days - daysOld);
        return { ...r, daysOld, daysRemaining };
      }) as ExpiringReport[];
    },
  });

  const oldestDaysRemaining =
    expiringReports.length > 0
      ? Math.min(...expiringReports.map((r) => r.daysRemaining))
      : null;

  return {
    hasWarning: expiringReports.length > 0,
    retentionDays: config.days,
    warningThresholdDays: config.warnAt,
    expiringReports,
    oldestDaysRemaining,
  };
}
