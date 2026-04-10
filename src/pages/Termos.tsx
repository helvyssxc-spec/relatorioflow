import { Link } from 'react-router-dom'
import { HardHat, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Termos() {
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
        <h1 className="text-4xl font-black text-foreground mb-8 tracking-tighter">Termos de Uso</h1>
        <div className="prose prose-sm dark:prose-invert prose-orange max-w-none space-y-6 text-muted-foreground">
          <p>
            Estes Termos de Uso regulam o uso do software RelatórioFlow, plataforma focada em geração de Relatórios Diários de Obra.
          </p>
          <h2 className="text-xl font-bold text-foreground">1. Aceitação</h2>
          <p>
            Ao acessar o RelatórioFlow, você concorda em cumprir estes termos de serviço.
            Se você não concordar, não deverá utilizar a plataforma.
          </p>
          <h2 className="text-xl font-bold text-foreground">2. Uso do Serviço</h2>
          <p>
            O serviço deve ser utilizado estritamente para propósitos de rotina laboratorial e de engenharia conforme os planos assinados.
            O usuário é responsável pela veracidade dos dados inseridos.
          </p>
          <h2 className="text-xl font-bold text-foreground">3. Limitação de Responsabilidade</h2>
          <p>
            O RelatórioFlow atua como facilitador tecnológico. A assinatura, validação e averiguação técnica das informações em laudos ou relatórios é de inteira responsabilidade do Responsável Técnico do projeto.
          </p>
        </div>
      </main>
    </div>
  )
}
