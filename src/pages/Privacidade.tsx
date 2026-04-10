import { Link } from 'react-router-dom'
import { HardHat, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background selection:bg-orange-500/20 selection:text-orange-900 overflow-x-hidden">
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-700 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-foreground text-xl tracking-tighter">RelatorioFlow<span className="text-orange-600">.</span></span>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="font-bold text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-foreground mb-8 tracking-tighter">Política de Privacidade</h1>
        <div className="prose prose-sm dark:prose-invert prose-orange max-w-none space-y-6 text-muted-foreground">
          <p>
            A sua privacidade é importante para nós. É política do RelatórioFlow respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar em nosso site.
          </p>
          <h2 className="text-xl font-bold text-foreground">Coleta e Uso de Informações</h2>
          <p>
            Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço, como ao gerar formulários de cadastro ou exportações de relatórios.
          </p>
          <p>
            Os anexos fotográficos e dados dos Relatórios Diários de Obra são protegidos por criptografia RLS (Row Level Security) nos bancos de dados do Supabase. Apenas você e os perfis vinculados ao seu projeto têm acesso.
          </p>
          <h2 className="text-xl font-bold text-foreground">Compartilhamento de Informações</h2>
          <p>
            Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
          </p>
        </div>
      </main>
    </div>
  )
}
