import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { getPlanConfig, type PlanConfig } from "@/config/plans";
import { usePlanSimulation } from "@/hooks/usePlanSimulation";

export interface PlanLimits {
  plan: PlanConfig;
  reportsThisMonth: number;
  templatesCount: number;
  dataSourcesCount: number;
  canGenerateReport: boolean;
  canCreateTemplate: boolean;
  canCreateDataSource: boolean;
  canUseLogo: boolean;
  canImproveText: boolean;
  canUseSchedules: boolean;
  canExportExcel: boolean;
  canExportDOCX: boolean;
  canUsePDFProfessional: boolean;
  canUseWatermark: boolean;
  canUseSignatureText: boolean;
  canUseSignatureImage: boolean;
  canUseWhiteLabel: boolean;
  reportsRemaining: number | null;
  maxImages: number;
  maxTeamMembers: number;
  maxMaterials: number;
  isLoading: boolean;
}

export function usePlanLimits(): PlanLimits {
  const { data: profile } = useOrgProfile();
  const orgId = profile?.org_id;

  const { data: org, isLoading: loadingOrg } = useQuery({
    queryKey: ["org-plan", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("plan").eq("id", orgId!).single();
      return data;
    },
    enabled: !!orgId,
  });

  const { simulatedPlan } = usePlanSimulation();
  const plan = getPlanConfig(simulatedPlan || org?.plan || "starter");

  const { data: reportsThisMonth = 0, isLoading: loadingReports } = useQuery({
    queryKey: ["reports-count-month", orgId],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("generated_reports" as any)
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId!)
        .gte("created_at", startOfMonth);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: templatesCount = 0, isLoading: loadingTemplates } = useQuery({
    queryKey: ["templates-count", orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from("report_templates")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId!);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: dataSourcesCount = 0, isLoading: loadingDS } = useQuery({
    queryKey: ["datasources-count", orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from("data_sources")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId!);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const limits = plan.limits;
  const isUnlimitedReports = limits.reportsPerMonth === -1;
  const canGenerateReport = isUnlimitedReports || reportsThisMonth < limits.reportsPerMonth;
  const canCreateTemplate = limits.templates === -1 || templatesCount < limits.templates;
  const canCreateDataSource = limits.dataSources === -1 || dataSourcesCount < limits.dataSources;
  
  const reportsRemaining = isUnlimitedReports ? null : Math.max(0, limits.reportsPerMonth - reportsThisMonth);

  return {
    plan,
    reportsThisMonth,
    templatesCount,
    dataSourcesCount,
    canGenerateReport,
    canCreateTemplate,
    canCreateDataSource,
    canUseLogo: plan.features.logoCustomization,
    canImproveText: plan.features.aiImproveText,
    canUseSchedules: plan.features.schedules,
    canExportExcel: plan.features.exportExcel,
    canExportDOCX: plan.features.exportDOCX,
    canUsePDFProfessional: plan.features.exportPDFProfessional,
    canUseWatermark: plan.features.watermark,
    canUseSignatureText: plan.features.signatureText,
    canUseSignatureImage: plan.features.signatureImage,
    canUseWhiteLabel: plan.features.whiteLabelPDF,
    reportsRemaining,
    maxImages: plan.limits.maxImages,
    maxTeamMembers: plan.limits.maxTeamMembers,
    maxMaterials: plan.limits.maxMaterials,
    isLoading: loadingOrg || loadingReports || loadingTemplates || loadingDS || !orgId,
  };
}
