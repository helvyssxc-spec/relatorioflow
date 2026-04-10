import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
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
  Mic,
} from 'lucide-react'
import MascotLogo from '@/components/MascotLogo'

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/20 selection:text-orange-900 overflow-x-hidden relative">
      {/* Architectural Grid Background (Global) */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-orange-500 opacity-[0.15] blur-[100px]" />
      </div>
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <MascotLogo className="w-10 h-10 transform scale-110 group-hover:-translate-y-1 transition-transform duration-300" />
            <span className="font-black text-gray-900 text-xl tracking-tighter ml-1">RelatorioFlow<span className="text-orange-500">.</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-bold text-gray-600 hover:text-orange-600">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 px-6 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 text-white">
                Começar grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <Badge className="mb-8 border-none bg-orange-500/10 text-orange-600 dark:text-orange-400 px-4 py-1.5 text-sm font-black uppercase tracking-widest shadow-lg shadow-orange-500/5">
            <Sparkles className="w-3.5 h-3.5 mr-2" /> Engenharia de Elite
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[1.05] mb-8 tracking-tighter">
            Seu Diário de Obra <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 transition-colors">em 30 segundos</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Gere o RDO (Relatório Diário de Obra) direto do canteiro. Apenas fale o que aconteceu no dia e a IA entrega o PDF profissional formatado na mesma hora.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link to="/cadastro">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-10 h-16 shadow-2xl shadow-orange-600/30 font-black rounded-2xl group transition-all hover:scale-105 active:scale-95 border-none">
                Experimentar agora
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="flex flex-col items-center sm:items-start text-sm text-muted-foreground font-bold uppercase tracking-widest gap-1">
              <span>Sem cartão de crédito</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-orange-400 fill-orange-400" />)}
              </div>
            </div>
          </div>

          {/* Authentic Sequence Mock: Speech to PDF */}
          <div className="mt-16 md:mt-24 relative animate-in fade-in zoom-in-95 duration-1000 delay-500 mb-32 max-w-[1000px] mx-auto">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-4 items-center relative z-10 w-full">
              
              {/* Left Side: Phone Voice Input Mock */}
              <div className="glass bg-white text-slate-800 p-6 md:p-8 rounded-[30px] border border-slate-200/50 shadow-xl shadow-slate-200/50 relative transform transition-transform hover:-translate-y-1 flex flex-col h-full justify-center">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
                       <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Passo 1</p>
                      <p className="font-black text-slate-800 text-lg leading-none">Apenas fale.</p>
                    </div>
                 </div>

                 {/* Simulated transcription */}
                 <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-600 leading-relaxed italic relative text-left">
                       <span className="absolute -left-2 -top-2 text-2xl text-orange-300">"</span>
                       Hoje finalizamos a concretagem da laje. Estavam presentes 5 pedreiros e 8 ajudantes. O clima esteve ensolarado. A carga de aço CA-50 também foi recebida...
                       <span className="inline-block w-1.5 h-4 bg-orange-500 ml-1 animate-pulse align-middle" />
                    </div>
                    {/* Botão gerando */}
                    <div className="h-14 w-full bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold gap-2 shadow-lg shadow-slate-900/30 mt-4">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                      Gerar Relatório Padrão
                    </div>
                 </div>
              </div>

              {/* Middle: Connection Arrow */}
              <div className="hidden md:flex justify-center items-center text-orange-400">
                 <ArrowRight className="w-10 h-10 animate-pulse opacity-50" />
              </div>

              {/* Right Side: The PDF Document */}
              <div className="w-full max-w-[450px] mx-auto aspect-[1/1.414] bg-white text-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] dark:shadow-[0_30px_60px_-15px_rgba(234,88,12,0.15)] rounded-sm relative transform rotate-1 hover:rotate-0 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-700 flex flex-col pt-8 px-8 pb-4 text-left border border-slate-200">
                  
                  {/* Fold Effect Simulator Core Corner */}
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-transparent via-slate-100 to-slate-200 shadow-[-4px_4px_4px_rgba(0,0,0,0.05)] rounded-bl-xl origin-bottom-left transition-all z-20 pointer-events-none opacity-50" />

                  {/* PDF Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 flex items-center justify-center text-white rounded font-black text-sm">
                         RF
                      </div>
                      <div>
                        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Construtora Nova Era</h3>
                        <h2 className="font-black text-lg tracking-tight leading-none mt-0.5">Relatório Diário de Obra</h2>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-orange-600 text-sm">RDO #042</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Emissão Oficial</p>
                    </div>
                  </div>

                  {/* PDF Content grid */}
                  <div className="flex-1 space-y-4">
                    {/* Bloco 1: Identificação */}
                    <div className="border border-slate-200 rounded-sm">
                      <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">1. Identificação Geral & Clima</span>
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-4 text-xs font-medium">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Empreendimento</span>
                          Residencial Infinity - Lote 4
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Data base / Condição</span>
                          10/04/2026 • ☀ Ensolarado / Seco
                        </div>
                      </div>
                    </div>

                    {/* Bloco 2: Efetivo */}
                    <div className="border border-slate-200 rounded-sm">
                      <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">2. Efetivo e Equipamentos</span>
                      </div>
                      <div className="p-3 flex gap-6 text-[11px] font-medium text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900">Pedreiros:</span> 05
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Ajudantes:</span> 08
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Betoneira 400L:</span> 01
                        </div>
                      </div>
                    </div>

                    {/* Bloco 3: Atividades (IA Text) */}
                    <div className="border border-slate-200 rounded-sm">
                      <div className="bg-orange-50/50 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">3. Atividades (Por IA)</span>
                        <Sparkles className="w-3 h-3 text-orange-500" />
                      </div>
                      <div className="p-4 text-[11px] leading-[1.6] font-medium text-slate-700 bg-white">
                        <ul className="list-disc pl-4 space-y-1.5 marker:text-orange-500">
                          <li><b>Concretagem da laje:</b> Operação concluída com sucesso, com volume total de 12m³. Processo realizado sem atrasos logo às 08h da manhã.</li>
                          <li><b>Recebimento de Aço:</b> Carga de 3 toneladas de aço CA-50 conferida com a nota fiscal e projeto estrutural.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Bloco 4: Fotos */}
                    <div className="border border-slate-200 rounded-sm">
                      <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">4. Registro Fotográfico</span>
                      </div>
                      <div className="p-3 flex gap-3">
                        <div className="w-24 h-16 bg-slate-200 rounded border border-slate-300 flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-slate-300/50 animate-pulse" />
                           <span className="text-[8px] font-bold text-slate-500 relative z-10 text-center px-1">Laje 3</span>
                        </div>
                        <div className="w-24 h-16 bg-slate-200 rounded border border-slate-300 flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-slate-300/50 animate-pulse" />
                           <span className="text-[8px] font-bold text-slate-500 relative z-10 text-center px-1">Aço CA-50</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PDF Footer */}
                  <div className="mt-4 pt-4 pb-2 border-t border-slate-200 grid grid-cols-2 gap-4 text-center">
                     <div>
                       <div className="hidden mb-1 font-[Satisfy] italic text-slate-600 text-lg -mt-3 transform -rotate-2">Guilherme S.</div>
                       <div className="w-32 h-px bg-slate-400 mx-auto mb-1" />
                       <p className="text-[9px] font-bold uppercase text-slate-800">Eng. Responsável Técnico</p>
                     </div>
                     <div>
                       <div className="w-32 h-px bg-slate-400 mx-auto mb-1" />
                       <p className="text-[9px] font-bold uppercase text-slate-800">Assinatura Cliente</p>
                     </div>
                  </div>
              </div>

            </div>

            {/* Float Badge Centered Below the Sequence */}
            <Link to="/login" className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-20 bg-gray-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10 hover:bg-slate-800 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-2">
                <MousePointer2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold tracking-tight">Gere seu primeiro PDF em <span className="text-blue-400">3 minutos</span></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="py-32 border-y border-border/50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black text-foreground tracking-tighter mb-6">Em conformidade com <br /><span className="text-orange-500">quem manda na obra.</span></h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-8">
                Esqueça blocos de anotação de papel ou editores de texto demorados. O RelatórioFlow empacota seu registro diário nas normas técnicas governantes.
              </p>
              <div className="space-y-4">
                {[
                  { t: 'Padrão CONFEA / CREA', d: 'Diários de Obra completos com Efetivo, Clima e Ocorrências rigorosas.' },
                  { t: 'PDF Blindado', d: 'Seu documento sairá padronizado e com as logomarcas da sua empresa.' },
                  { t: '100% Auditável', d: 'Dados assegurados para defesas de escopo ou extensões de prazo.' }
                ].map(item => (
                  <div key={item.t} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-foreground text-sm uppercase tracking-widest">{item.t}</h4>
                      <p className="text-sm text-muted-foreground font-medium mt-1">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-8 rounded-3xl shadow-xl border border-border/50 space-y-4 transition-all hover:bg-orange-500/5 hover:border-orange-500/20 group">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                  <Cloud className="w-6 h-6" />
                </div>
                <h3 className="font-black text-foreground uppercase tracking-tighter text-sm">Clima Automático</h3>
                <p className="text-xs text-muted-foreground font-medium">Capture as condições de tempo sem precisar anotar.</p>
              </div>
              <div className="glass p-8 rounded-3xl shadow-xl border border-border/50 space-y-4 mt-8 transition-all hover:bg-orange-500/5 hover:border-orange-500/20 group">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-800/20 group-hover:scale-110 transition-transform">
                  <WifiOff className="w-6 h-6" />
                </div>
                <h3 className="font-black text-foreground uppercase tracking-tighter text-sm">Trabalhe Offline</h3>
                <p className="text-xs text-muted-foreground font-medium">Sem sinal no subsolo da obra? O aplicativo salva tudo no celular e sincroniza depois.</p>
              </div>
              <div className="glass p-8 rounded-3xl shadow-xl border border-border/50 space-y-4 transition-all hover:bg-orange-500/5 hover:border-orange-500/20 group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-black text-foreground uppercase tracking-tighter text-sm">IA Assistente</h3>
                <p className="text-xs text-muted-foreground font-medium">Apenas fale o que rolou no dia e a IA escreve como um engenheiro pleno.</p>
              </div>
              <div className="glass p-8 rounded-3xl shadow-xl border border-border/50 space-y-4 mt-8 transition-all hover:bg-orange-500/5 hover:border-orange-500/20 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="font-black text-foreground uppercase tracking-tighter text-sm">PDF Supremo</h3>
                <p className="text-xs text-muted-foreground font-medium">Exportação em PDF White Label de alta grife, pronto para os diretores.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Elite */}
      <section className="py-32 max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">Investimento Único. <br /><span className="text-orange-500">Retorno em cada obra.</span></h2>
        <p className="text-lg text-gray-500 font-medium mb-16">Transparência total. Sem letras miúdas ou taxas por usuário.</p>
        
        <Card className="max-w-2xl mx-auto border-none shadow-2xl shadow-orange-500/10 rounded-[40px] overflow-hidden glass border-slate-200/50 dark:border-white/5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-black relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
          <CardContent className="p-12 md:p-16 relative z-10">
            <Badge className="bg-orange-500 text-white mb-8 border-none px-4 py-1.5 font-black uppercase tracking-widest shadow-lg shadow-orange-500/30">
               <Zap className="w-3.5 h-3.5 mr-1.5 inline-block -mt-0.5" /> ACESSO ELITE ILIMITADO
            </Badge>
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-2xl text-muted-foreground font-black mt-1">R$</span>
              <span className="text-8xl font-black tracking-tighter text-foreground">97</span>
              <div className="text-left font-black leading-none ml-2">
                <p className="text-muted-foreground uppercase text-[10px] tracking-widest mb-1">por</p>
                <p className="text-2xl text-foreground">MÊS</p>
              </div>
            </div>
            <p className="bg-muted/50 text-muted-foreground text-xs font-bold uppercase tracking-widest inline-block px-4 py-1 rounded-full mb-12">
              Cancele quando quiser · Sem fidelidade
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 text-left mb-12">
              {[
                'Diários e Relatórios Ilimitados',
                'Exportação de PDF Premium (White Label)',
                'Integração de Clima via GPS Automático',
                'Armazenamento em Nuvem (Fotos e Anexos)',
                'Modo Offline Híbrido de Segurança',
                'Suporte Prioritário e Backup Diário',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-foreground leading-tight">{item}</span>
                </div>
              ))}
            </div>

            <Link to="/cadastro">
              <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 h-20 text-xl font-black rounded-3xl shadow-2xl shadow-orange-500/30 transition-all hover:-translate-y-1 hover:shadow-orange-500/40 text-white">
                Assinar Plano Elite
              </Button>
            </Link>
            <p className="mt-6 text-muted-foreground text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> Pagamento Seguro via PagBank
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-gray-900 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <MascotLogo className="w-24 h-24 mx-auto mb-8 animate-bounce hover:pause transition-all" />
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
          <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer group">
            <MascotLogo className="w-8 h-8" />
            <span className="font-black text-gray-900 text-sm tracking-tighter">RelatorioFlow<span className="text-orange-500">.</span></span>
          </div>
          <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            <Link to="/termos" className="hover:text-orange-500 transition-colors">Termos</Link>
            <Link to="/privacidade" className="hover:text-orange-500 transition-colors">Privacidade</Link>
            <Link to="/app/suporte" className="hover:text-orange-500 transition-colors">Suporte</Link>
          </div>
          <p className="text-xs font-bold text-gray-300">
            © {new Date().getFullYear()} RelatorioFlow. Software for Heavy Engineering.
          </p>
        </div>
      </footer>
    </div>
  )
}
