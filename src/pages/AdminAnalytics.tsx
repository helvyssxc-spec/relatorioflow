import React, { useState } from 'react'
import { Activity, Database, Zap, AlertTriangle, CheckCircle2, ChevronRight, PieChart, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default function AdminAnalytics() {
  const [groqUsage] = useState(72) // 72% - Warning
  const [geminiUsage] = useState(45) // 45% - Normal
  const [supabaseDB] = useState(85) // 85% - Danger (500MB free tier)
  const [supabaseStorage] = useState(12) // 12% - Normal (1GB free tier)

  const getStatusColor = (percent: number) => {
    if (percent >= 80) return 'text-red-500 bg-red-50 border-red-200'
    if (percent >= 70) return 'text-amber-500 bg-amber-50 border-amber-200'
    return 'text-emerald-500 bg-emerald-50 border-emerald-200'
  }

  const getProgressBarColor = (percent: number) => {
    if (percent >= 80) return 'bg-red-500'
    if (percent >= 70) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Analytics & Quotas</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">Monitoramento unificado de limites (Groq, Gemini, Supabase).</p>
      </div>

      {/* Alertas Ativos */}
      <div className="space-y-3">
        {supabaseDB >= 70 && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-4 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] pointer-events-none" />
             <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-5 h-5 text-red-600" />
             </div>
             <div>
               <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">Alerta Crítico: Limite de Banco de Dados</h3>
               <p className="text-sm text-red-700 mt-1">O seu limite do plano <b>Supabase Free (500 MB)</b> ultrapassou {supabaseDB}%. Considere fazer o upgrade para o plano Pro ($25/mês) para evitar bloqueio de inserções e interrupção do sistema.</p>
               <button className="mt-3 text-xs font-bold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Fazer Upgrade Supabase</button>
             </div>
          </div>
        )}
        
        {groqUsage >= 70 && groqUsage < 80 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
             <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
               <Zap className="w-5 h-5 text-amber-600" />
             </div>
             <div>
               <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Aviso: Consumo de Tokens Groq em {groqUsage}%</h3>
               <p className="text-sm text-amber-700 mt-1">Sua cota mensal da API Groq está se esgotando. Adicione créditos para evitar fallback forçado para o Gemini em todos os relatórios.</p>
               <button className="mt-3 text-xs font-bold bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition">Comprar Tokens Extas</button>
             </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Supabase Database */}
        <Card className="glass border-slate-200/60 shadow-sm relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
               Database Supabase
               <Database className="w-4 h-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex justify-between items-end mb-2">
                <div>
                   <p className="text-3xl font-black text-slate-800">425 <span className="text-sm text-slate-500 font-bold">MB</span></p>
                </div>
                <Badge variant="outline" className={getStatusColor(supabaseDB)}>
                  {supabaseDB}% do Free
                </Badge>
             </div>
             <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className={`h-full transition-all duration-1000 ${getProgressBarColor(supabaseDB)}`} style={{ width: `${supabaseDB}%` }} />
             </div>
             <p className="text-xs text-slate-400 font-medium">Limite: 500 MB (Plano Free)</p>
          </CardContent>
        </Card>

        {/* Supabase Storage */}
        <Card className="glass border-slate-200/60 shadow-sm relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
               Storage (Fotos PDF)
               <Database className="w-4 h-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex justify-between items-end mb-2">
                <div>
                   <p className="text-3xl font-black text-slate-800">120 <span className="text-sm text-slate-500 font-bold">MB</span></p>
                </div>
                <Badge variant="outline" className={getStatusColor(supabaseStorage)}>
                  {supabaseStorage}% do Free
                </Badge>
             </div>
             <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className={`h-full transition-all duration-1000 ${getProgressBarColor(supabaseStorage)}`} style={{ width: `${supabaseStorage}%` }} />
             </div>
             <p className="text-xs text-slate-400 font-medium">Limite: 1 GB (Plano Free)</p>
          </CardContent>
        </Card>

        {/* API Groq */}
        <Card className="glass border-slate-200/60 shadow-sm relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
               API LLaMA 3 (Groq)
               <Activity className="w-4 h-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex justify-between items-end mb-2">
                <div>
                   <p className="text-3xl font-black text-slate-800">3.6M <span className="text-sm text-slate-500 font-bold">tokens</span></p>
                </div>
                <Badge variant="outline" className={getStatusColor(groqUsage)}>
                  {groqUsage}% Consumido
                </Badge>
             </div>
             <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className={`h-full transition-all duration-1000 ${getProgressBarColor(groqUsage)}`} style={{ width: `${groqUsage}%` }} />
             </div>
             <p className="text-xs text-slate-400 font-medium">Limite atual: 5 Milhões de tokens</p>
          </CardContent>
        </Card>

        {/* API Gemini */}
        <Card className="glass border-slate-200/60 shadow-sm relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
               API Gemini Flash
               <Sparkles className="w-4 h-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex justify-between items-end mb-2">
                <div>
                   <p className="text-3xl font-black text-slate-800">4.5M <span className="text-sm text-slate-500 font-bold">tokens</span></p>
                </div>
                <Badge variant="outline" className={getStatusColor(geminiUsage)}>
                  {geminiUsage}% Consumido
                </Badge>
             </div>
             <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className={`h-full transition-all duration-1000 ${getProgressBarColor(geminiUsage)}`} style={{ width: `${geminiUsage}%` }} />
             </div>
             <p className="text-xs text-slate-400 font-medium">Limite gratuito (Google): 10M / mês</p>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
