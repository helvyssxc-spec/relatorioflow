import { Zap, Crown, Building2 } from "lucide-react";

export type PlanId = "starter" | "pro" | "business";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  icon: typeof Zap;
  limits: {
    reportsPerMonth: number;
    templates: number;
    dataSources: number;
    maxImages: number;
    maxTeamMembers: number;
    maxMaterials: number;
  };
  features: {
    exportPDF: boolean;
    exportPDFProfessional: boolean;
    exportExcel: boolean;
    exportDOCX: boolean;
    logoCustomization: boolean;
    watermark: boolean;
    signatureText: boolean;
    signatureImage: boolean;
    aiImproveText: boolean;
    schedules: boolean;
    prioritySupport: boolean;
    history: boolean;
    whiteLabelPDF: boolean;
  };
  featureList: string[];
  cta: string;
  popular: boolean;
  highlight?: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 0,
    yearlyPrice: 0,
    description: "Para começar a automatizar relatórios",
    icon: Zap,
    limits: {
      reportsPerMonth: 5,
      templates: 3,
      dataSources: 1,
      maxImages: 1,
      maxTeamMembers: 3,
      maxMaterials: 5,
    },
    features: {
      exportPDF: true,
      exportPDFProfessional: false,
      exportExcel: false,
      exportDOCX: false,
      logoCustomization: false,
      watermark: false,
      signatureText: false,
      signatureImage: false,
      aiImproveText: false,
      schedules: false,
      prioritySupport: false,
      history: true,
      whiteLabelPDF: false,
    },
    featureList: [
      "5 relatórios por mês",
      "Todos os 12 tipos de relatório",
      "PDF básico gerado por IA",
      "Histórico por 30 dias",
      "1 foto por relatório",
      "Até 3 profissionais por relatório",
      "Suporte via app",
    ],
    cta: "Começar grátis",
    popular: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 97,
    yearlyPrice: 970,
    description: "Para profissionais e equipes em crescimento",
    icon: Crown,
    limits: {
      reportsPerMonth: 50,
      templates: -1,
      dataSources: 5,
      maxImages: 8,
      maxTeamMembers: 15,
      maxMaterials: 30,
    },
    features: {
      exportPDF: true,
      exportPDFProfessional: true,
      exportExcel: true,
      exportDOCX: true,
      logoCustomization: false,
      watermark: true,
      signatureText: true,
      signatureImage: false,
      aiImproveText: true,
      schedules: true,
      prioritySupport: false,
      history: true,
      whiteLabelPDF: false,
    },
    featureList: [
      "50 relatórios por mês",
      "PDF profissional: capa, logo e assinatura",
      "Padrão ABNT NBR 10719 completo",
      "Exportação em PDF, Word e Excel",
      "Melhorar texto com IA",
      "IA com prompt específico por tipo",
      "Histórico por 6 meses",
      "Até 8 fotos por relatório com legenda",
      "Até 15 profissionais por relatório",
      "Campos de preço e condições comerciais",
      "Marca d'água personalizada",
      "Suporte por e-mail",
    ],
    cta: "Assinar Pro",
    popular: true,
    highlight: "Mais popular",
  },
  business: {
    id: "business",
    name: "Business",
    price: 247,
    yearlyPrice: 2470,
    description: "Para empresas que precisam do máximo de credibilidade",
    icon: Building2,
    limits: {
      reportsPerMonth: -1,
      templates: -1,
      dataSources: -1,
      maxImages: 20,
      maxTeamMembers: -1,
      maxMaterials: -1,
    },
    features: {
      exportPDF: true,
      exportPDFProfessional: true,
      exportExcel: true,
      exportDOCX: true,
      logoCustomization: true,
      watermark: true,
      signatureText: true,
      signatureImage: true,
      aiImproveText: true,
      schedules: true,
      prioritySupport: true,
      history: true,
      whiteLabelPDF: true,
    },
    featureList: [
      "Relatórios ilimitados",
      "PDF completo: capa, logo e marca d'água",
      "Assinatura com imagem digitalizada",
      "Exportação PDF, Word e Excel (sem limite)",
      "White label: sem marca RelatórioFlow",
      "API pública para integração (n8n, Make)",
      "IA completa para melhorar texto",
      "Histórico ilimitado",
      "Até 20 fotos por relatório com legenda",
      "Equipe e materiais ilimitados por relatório",
      "Suporte prioritário",
      "Até 20 usuários na equipe",
    ],
    cta: "Assinar Business",
    popular: false,
    highlight: "Melhor custo-benefício",
  },
};

export const PLANS_LIST = [PLANS.starter, PLANS.pro, PLANS.business];

export function getPlanConfig(planId: string): PlanConfig {
  const mapping: Record<string, PlanId> = {
    free: "starter",
    basico: "pro",
    pro: "pro",
    starter: "starter",
    business: "business",
  };
  const normalized = mapping[planId] || "starter";
  return PLANS[normalized];
}
