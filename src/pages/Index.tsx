import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  HardHat,
  FileText,
  ClipboardList,
  Cloud,
  Download,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  WifiOff,
  Sparkles,
  MousePointer2,
} from 'lucide-react'

export default function Index() {
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-gray-900 text-xl tracking-tighter">RelatorioFlow<span className="text-blue-600">.</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-bold text-gray-600 hover:text-blue-600">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6 font-bold rounded-xl transition-all hover:scale-105 active:scale-95">
                Começar grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] -z-10" />

        <div className="max-w-6xl mx-auto px-6 text-center">
          <Badge className="mb-8 border-none bg-blue-600/10 text-blue-700 px-4 py-1.5 text-sm font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Sparkles className="w-3.5 h-3.5 mr-2" /> Engenharia de Elite
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.05] mb-8 tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Relatórios que <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">impressionam clientes</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto mb-12 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
            Gere Diários de Obra e Relatórios Técnicos com design institucional premium. PDFs que transmitem autoridade e profissionalismo.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Link to="/cadastro">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-10 h-16 shadow-2xl shadow-blue-600/30 font-black rounded-2xl group transition-all hover:scale-105 active:scale-95">
                Experimentar agora
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="flex flex-col items-center sm:items-start text-sm text-gray-400 font-bold uppercase tracking-widest gap-1">
              <span>Sem cartão de crédito</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
              </div>
            </div>
          </div>

          {/* Luxury Mock Preview */}
          <div className="mt-24 relative animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <div className="absolute inset-0 bg-blue-600/5 blur-[100px] -z-10 rounded-full max-w-3xl mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto p-4 md:p-8 bg-white/40 backdrop-blur-md rounded-[40px] border border-white/60 shadow-2xl overflow-hidden group">
              
              {/* RDO Mock */}
              <div className="bg-white rounded-3xl p-8 text-left shadow-xl border border-gray-100 transition-transform group-hover:rotate-1 group-hover:-translate-y-2">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-blue-600 rounded-full" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Documento Oficial</p>
                      <p className="font-black text-gray-900 text-lg tracking-tight">Diário de Obra</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none">● Ativo</Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                    <span className="text-[11px] font-black text-gray-400 uppercase">Empreendimento</span>
                    <span className="font-bold text-gray-800 text-sm">Residencial Orion</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                    <span className="text-[11px] font-black text-gray-400 uppercase">Clima / Local</span>
                    <span className="font-bold text-gray-800 text-sm">☀ 31°C · Céu Limpo</span>
                  </div>
                  <div className="pt-4 grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Efetivo</p>
                      <p className="text-xl font-black text-blue-700">14 <span className="text-[10px] font-bold opacity-70">Profiss.</span></p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Horas</p>
                      <p className="text-xl font-black text-indigo-700">112<span className="text-[10px] font-bold opacity-70">h</span></p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-900 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-white/50 uppercase">Progresso da Obra</span>
                      <span className="text-xs font-black text-blue-400">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[92%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* RT Mock */}
              <div className="bg-white rounded-3xl p-8 text-left shadow-xl border border-gray-100 transition-transform group-hover:-rotate-1 group-hover:-translate-y-2">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-indigo-600 rounded-full" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Laudo Técnico</p>
                      <p className="font-black text-gray-900 text-lg tracking-tight">Vistoria Cautelar</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-900 rounded-2xl text-white">
                    <p className="text-[10px] font-black text-white/50 uppercase mb-2 leading-none">Parecer Executivo</p>
                    <p className="text-xs font-medium leading-relaxed">"O sistema estrutural apresenta conformidade total com a NBR 6118, sem patologias críticas..."</p>
                  </div>
                  <div className="space-y-2 pt-2">
                    {['Diagnóstico Geotécnico', 'Análise Prova Carga', 'Recomendações'].map((s, i) => (
                      <div key={s} className="flex items-center justify-between p-2 rounded-xl border border-gray-50 bg-gray-50/50">
                        <span className="text-[11px] font-bold text-gray-600">3.{i+1} {s}</span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" /></div>
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-[10px] font-black">+24</div>
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase">PDF Premium Ativado</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Float Badge */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10">
              <div className="flex items-center gap-2">
                <MousePointer2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold tracking-tight">Gere seu primeiro PDF em <span className="text-blue-400">3 minutos</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="py-32 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-6">Em conformidade com <br /><span className="text-blue-600">quem manda na obra.</span></h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed mb-8">
                Esqueça editores de texto genéricos. O RelatorioFlow foi construído sobre os pilares das normas técnicas brasileiras, garantindo segurança jurídica e técnica.
              </p>
              <div className="space-y-4">
                {[
                  { t: 'Padrão SINDUSCON', d: 'Diários de Obra com histórico acumulado e clima automático.' },
                  { t: 'ABNT NBR 10719', d: 'Relatórios técnicos estruturados, numerados e assinados.' },
                  { t: 'Identidade Profissional', d: 'Sua logo, CREA/CAU e ART/RRT em destaque institucional.' }
                ].map(item => (
                  <div key={item.t} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm uppercase tracking-widest">{item.t}</h4>
                      <p className="text-sm text-gray-500 font-medium">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Cloud className="w-6 h-6" />
                </div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-sm">Clima via GPS</h3>
                <p className="text-xs text-gray-400 font-medium">Capture as condições de tempo automaticamente pela localização da sua obra.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 space-y-4 mt-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <WifiOff className="w-6 h-6" />
                </div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-sm">Trabalhe Offline</h3>
                <p className="text-xs text-gray-400 font-medium">Sem sinal na obra? Tudo certo. O rascunho fica no seu bolso e sincroniza depois.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-sm">IA Assistente</h3>
                <p className="text-xs text-gray-400 font-medium">Refine seus pareceres técnicos com auxílio de inteligência artificial especializada.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 space-y-4 mt-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-sm">PDF Prestige</h3>
                <p className="text-xs text-gray-400 font-medium">Exportação instantânea com design de grife, pronto para o cliente final.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Elite */}
      <section className="py-32 max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">Investimento Único. <br /><span className="text-blue-600">Retorno em cada obra.</span></h2>
        <p className="text-lg text-gray-500 font-medium mb-16">Transparência total. Sem letras miúdas ou taxas por usuário.</p>
        
        <Card className="max-w-2xl mx-auto border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[40px] overflow-hidden bg-gradient-to-b from-gray-900 to-black text-white">
          <CardContent className="p-12 md:p-16">
            <Badge className="bg-blue-600 text-white mb-8 border-none px-4 py-1 font-black">ACESSO ILIMITADO</Badge>
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-2xl text-white/50 font-black">R$</span>
              <span className="text-8xl font-black tracking-tighter">97</span>
              <div className="text-left font-black leading-none">
                <p className="text-white/50 uppercase text-[10px] tracking-widest">por</p>
                <p className="text-2xl">MÊS</p>
              </div>
            </div>
            <p className="text-white/40 text-sm font-bold mb-12 uppercase tracking-widest">Cancele quando quiser · Sem fidelidade</p>
            
            <div className="grid sm:grid-cols-2 gap-6 text-left mb-12">
              {[
                'Diários e Relatórios ilimitados',
                'Exportação PDF Prestige (Elite)',
                'Clima Automático via Localização',
                'IA Especialista em Engenharia',
                'Modo Offline Híbrido',
                'Sub-domínio personalizado',
                'Suporte Prioritário por E-mail',
                'Backup em Tempo Real'
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-white/80">{item}</span>
                </div>
              ))}
            </div>

            <Link to="/cadastro">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-20 text-xl font-black rounded-3xl shadow-2xl shadow-blue-600/40 transition-all hover:scale-105">
                Começar agora com 7 dias grátis
              </Button>
            </Link>
            <p className="mt-6 text-white/30 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Pagamento Seguro via PagBank
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-gray-900 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <HardHat className="w-16 h-16 text-blue-500 mx-auto mb-8 animate-bounce" />
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-tight">Chega de perder noites formatando Word.</h2>
          <p className="text-xl text-white/50 mb-12 font-medium">Junte-se à nova geração de engenheiros brasileiros que valorizam o tempo e a própria marca.</p>
          <Link to="/cadastro">
            <Button size="lg" variant="outline" className="h-16 px-12 text-lg font-black rounded-2xl border-white/10 hover:bg-white/5 text-white transition-all hover:scale-105 active:scale-95">
              Criar minha conta gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900 text-sm tracking-tighter">RelatorioFlow</span>
          </div>
          <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-gray-400">
            <a href="#" className="hover:text-blue-600">Termos</a>
            <a href="#" className="hover:text-blue-600">Privacidade</a>
            <a href="#" className="hover:text-blue-600">Suporte</a>
          </div>
          <p className="text-xs font-bold text-gray-300">
            © {new Date().getFullYear()} RelatorioFlow. Software for Heavy Engineering.
          </p>
        </div>
      </footer>
    </div>
  )
}
