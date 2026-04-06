export const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'RelatorioFlow',
    price: 9700,
    interval: 'month' as const,
    features: [
      'Diários de Obra ilimitados',
      'Relatórios Técnicos ilimitados',
      'Exportação PDF premium',
      'Clima automático',
      'Draft offline',
    ],
  },
}
export type PlanId = keyof typeof PLANS
