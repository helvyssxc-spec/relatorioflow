export type ReportType = 'diario_obra' | 'relatorio_tecnico'

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  address?: string
  client_name?: string
  art_rrt?: string
  created_at: string
  updated_at: string
}

export interface WeatherData {
  condition: string
  temperature: number
  humidity: number
  wind_speed: number
  description: string
}

export interface EquipeItem {
  id: string
  nome: string
  funcao: string
  horas: number
}

export interface AtividadeItem {
  id: string
  descricao: string
  disciplina: string
  percentual_concluido: number
  observacao?: string
}

export interface EquipamentoItem {
  id: string
  nome: string
  quantidade: number
  status: 'operando' | 'parado' | 'manutencao'
}

export interface MediaItem {
  id: string
  url: string
  caption?: string
  type: 'photo' | 'document'
}

export interface DiarioObraData {
  id?: string
  project_id: string
  data: string
  clima: WeatherData | null
  temperatura: string
  condicao_tempo: string
  responsavel: string
  equipe: EquipeItem[]
  atividades: AtividadeItem[]
  equipamentos: EquipamentoItem[]
  ocorrencias: string
  fotos: MediaItem[]
  status: 'draft' | 'finalizado'
  created_at?: string
  updated_at?: string
}

export interface SecaoTecnica {
  id: string
  titulo: string
  conteudo: string
  fotos: MediaItem[]
}

export interface RelatorioTecnicoData {
  id?: string
  project_id: string
  numero_relatorio: string
  data: string
  responsavel_tecnico: string
  crea_cau?: string
  objetivo: string
  metodologia: string
  diagnostico: SecaoTecnica[]
  conclusao: string
  recomendacoes: string[]
  fotos_gerais: MediaItem[]
  status: 'draft' | 'finalizado'
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  id: string
  full_name: string
  company_name?: string
  crea_cau?: string
  logo_url?: string
  phone?: string
  email: string
  has_access: boolean
  is_admin?: boolean
  analytics_umami_id?: string
  analytics_ga_id?: string
  ai_token_quota?: number
  storage_quota_mb?: number
  created_at: string
}
