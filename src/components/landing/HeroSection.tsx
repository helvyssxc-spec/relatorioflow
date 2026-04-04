import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => (
  <section className="relative overflow-hidden pt-24 pb-8 md:pt-36 md:pb-16 bg-primary">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(213,94%,52%,0.15),transparent_50%)]" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-1.5 text-sm font-medium text-accent animate-pulse">
          <Sparkles className="h-4 w-4" /> Powered by IA
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-[1.1]">
          Gere seu{" "}
          <span className="text-accent">relatório técnico</span>
          {" "}com IA em 30 segundos
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
          Diário de Obra, Laudo, Vistoria, Proposta Comercial — PDF profissional
          no padrão ABNT. Sem perder tempo no Word.
        </p>
        <p className="text-sm md:text-base text-primary-foreground/50 max-w-xl mx-auto">
          Ideal para técnicos, consultores e profissionais que querem ganhar tempo e parecer mais profissional.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Button asChild size="lg" className="h-14 px-10 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/30 text-lg font-bold">
            <Link to="/register">
              Gerar meu primeiro relatório grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" className="h-14 px-10 rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg font-bold">
            <Link to="/register">
              Testar grátis agora
            </Link>
          </Button>
        </div>
        <p className="text-sm text-primary-foreground/40">
          Sem cartão de crédito • Resultado em segundos • Personalização com logo
        </p>
      </div>

      {/* Before / After — realistic PDF demo */}
      <div className="max-w-5xl mx-auto mt-16 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-2 md:p-4 animate-fade-in">
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-0 items-stretch">
          {/* ANTES */}
          <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 backdrop-blur-sm p-6 md:p-8 space-y-3">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-destructive bg-destructive/20 px-3 py-1 rounded-full">
              ❌ Antes
            </span>
            <p className="text-primary-foreground/60 text-sm">Sua anotação rápida:</p>
            <p className="text-primary-foreground font-mono text-base leading-relaxed italic">
              "fiz manutenção no sistema, câmera com problema, troquei cabo"
            </p>
          </div>
          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center px-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
                <Sparkles className="h-6 w-6 text-accent-foreground" />
              </div>
              <span className="text-xs font-bold text-accent">IA</span>
            </div>
          </div>
          <div className="flex md:hidden items-center justify-center">
            <ArrowDown className="h-8 w-8 text-accent" />
          </div>
          {/* DEPOIS — simulated PDF */}
          <div className="rounded-xl border-2 border-accent overflow-hidden shadow-2xl shadow-accent/20">
            <div className="bg-[#1A56DB] h-2 w-full" />
            <div className="bg-white p-4 md:p-5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <span className="text-[11px] font-extrabold text-[#1A56DB] tracking-wide">CONSTRUTORA SILVA</span>
                <div className="text-right">
                  <span className="text-[8px] text-gray-400 uppercase tracking-widest block">Documento</span>
                  <span className="text-[10px] font-bold text-gray-700">Nº RT-2026-0042</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1A56DB]" />
                  <span className="text-[8px] font-bold text-[#1A56DB] uppercase tracking-[0.12em]">Relatório Técnico</span>
                </div>
                <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight tracking-tight">
                  Manutenção Corretiva — Sistema CFTV
                </h3>
                <p className="text-[10px] text-gray-500 mt-1">Condomínio Parque das Águas Ltda.</p>
              </div>
              <div className="grid grid-cols-3 border border-gray-200 rounded-lg overflow-hidden mb-4 text-[9px]">
                <div className="p-2 border-r border-gray-200">
                  <p className="text-gray-400 uppercase text-[7px] tracking-wide">Data</p>
                  <p className="font-semibold text-gray-800">27 de março de 2026</p>
                </div>
                <div className="p-2 border-r border-gray-200">
                  <p className="text-gray-400 uppercase text-[7px] tracking-wide">Local</p>
                  <p className="font-semibold text-gray-800">São Paulo, SP</p>
                </div>
                <div className="p-2">
                  <p className="text-gray-400 uppercase text-[7px] tracking-wide">Responsável</p>
                  <p className="font-semibold text-gray-800">Carlos Henrique</p>
                </div>
              </div>
              <div className="space-y-3 text-[9px] leading-relaxed text-gray-700">
                <div>
                  <p className="font-bold text-[#1A56DB] text-[8px] uppercase tracking-wide mb-1">1. Objetivo</p>
                  <p>Manutenção corretiva do sistema de circuito fechado de televisão (CFTV) do Condomínio Parque das Águas, com foco na identificação e correção de falha na Câmera 03 — Estacionamento B2.</p>
                </div>
                <div>
                  <p className="font-bold text-[#1A56DB] text-[8px] uppercase tracking-wide mb-1">2. Atividades Realizadas</p>
                  <p>• Inspeção visual em todos os 12 pontos do sistema CFTV<br />
                  • Identificação de perda de sinal na Câmera 03 (modelo Intelbras VHD 1420 B)<br />
                  • Teste de continuidade no cabeamento coaxial — falha detectada a 14m do DVR<br />
                  • Substituição de 18m de cabo coaxial RG-59 com conectores BNC<br />
                  • Realinhamento da câmera e ajuste do ângulo de cobertura</p>
                </div>
                <div>
                  <p className="font-bold text-[#1A56DB] text-[8px] uppercase tracking-wide mb-1">3. Análise Técnica</p>
                  <p>A falha foi causada por desgaste natural do cabo coaxial exposto a intempéries na passagem externa entre os blocos B e C. O rompimento parcial da malha de blindagem causou atenuação do sinal de vídeo.</p>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-2.5">
                  <p className="font-bold text-[#1A56DB] text-[7px] uppercase tracking-wide mb-2">Equipe Envolvida</p>
                  <table className="w-full text-[8px]">
                    <thead>
                      <tr className="bg-blue-50/80">
                        <th className="text-left py-1 px-2 font-semibold text-gray-600">Profissional</th>
                        <th className="text-left py-1 px-2 font-semibold text-gray-600">Função</th>
                        <th className="text-right py-1 px-2 font-semibold text-gray-600">Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="py-1 px-2">Carlos Henrique</td><td className="py-1 px-2 text-gray-500">Técnico CFTV</td><td className="py-1 px-2 text-right">4h</td></tr>
                      <tr className="bg-gray-50"><td className="py-1 px-2">Rafael Souza</td><td className="py-1 px-2 text-gray-500">Aux. Técnico</td><td className="py-1 px-2 text-right">4h</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="font-bold text-[#1A56DB] text-[8px] uppercase tracking-wide mb-1">4. Conclusão</p>
                  <p>Manutenção corretiva concluída com sucesso. Sistema CFTV operando normalmente com 100% dos pontos ativos. Recomenda-se inspeção preventiva trimestral nos cabos externos.</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex flex-col items-end max-w-[180px] ml-auto">
                  <div className="w-full h-px bg-gray-500 mb-1.5" />
                  <p className="text-[9px] font-bold text-gray-900">Carlos Henrique da Silva</p>
                  <p className="text-[7px] text-gray-500">Técnico de Segurança Eletrônica</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-[7px] text-gray-400">
                <span>Construtora Silva</span>
                <span>Relatório Técnico · Nº RT-2026-0042</span>
                <span>RelatórioFlow</span>
              </div>
            </div>
            <div className="bg-[#1A56DB] h-1 w-full" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
