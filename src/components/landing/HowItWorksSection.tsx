import { PenLine, Sparkles, Download } from "lucide-react";

const HowItWorksSection = () => (
  <section id="como-funciona" className="py-20 bg-card">
    <div className="container mx-auto px-4">
      <div className="text-center mb-14">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
          Como funciona
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
          Três passos. Trinta segundos.
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Do rascunho ao PDF profissional sem esforço
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-7 max-w-5xl mx-auto">
        <div className="bg-background border border-border rounded-2xl p-6 space-y-3
          hover:border-primary/30 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PenLine className="h-5 w-5 text-primary" />
            </div>
            <span className="text-4xl font-black text-primary/10">1</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Escreva como no WhatsApp
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sem preocupação com formatação. Descreva o que foi feito
            do jeito que você faria no celular.
          </p>
          <div className="bg-muted border border-border rounded-xl p-3 font-mono
            text-xs text-muted-foreground italic leading-relaxed">
            "fiz manutenção no ar-condicionado, limpei filtro,
            verifiquei gás, tá funcionando normal"
          </div>
        </div>

        <div className="bg-background border border-border rounded-2xl p-6 space-y-3
          hover:border-primary/30 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-4xl font-black text-primary/10">2</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            A IA transforma em 30 segundos
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O texto vira documento técnico formal com linguagem profissional
            e todas as seções obrigatórias.
          </p>
          <div className="flex items-center justify-center gap-3 bg-primary/5
            border border-primary/20 rounded-xl p-4">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">
              Gerando relatório técnico...
            </span>
            <span className="text-xs text-muted-foreground">30s</span>
          </div>
        </div>

        <div className="bg-background border border-border rounded-2xl p-6 space-y-3
          hover:border-primary/30 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <span className="text-4xl font-black text-primary/10">3</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Baixe o PDF profissional
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Com capa, logo da empresa, fotos numeradas e assinatura.
            Pronto para enviar ao cliente.
          </p>
          <div className="bg-white border border-border rounded-xl overflow-hidden
            shadow-md max-w-[200px] mx-auto">
            <div className="h-1.5 bg-primary" />
            <div className="p-3">
              <div className="text-[8px] font-extrabold text-primary border-b
                border-gray-100 pb-1.5 mb-2 uppercase">
                Sua Empresa · Nº 2026-001
              </div>
              <div className="text-[8px] font-black text-gray-800 mb-2">
                RELATÓRIO DE MANUTENÇÃO
              </div>
              <div className="space-y-1">
                <div className="text-[6px] font-bold text-primary">1. OBJETIVO</div>
                <div className="h-1 bg-gray-100 rounded w-full" />
                <div className="h-1 bg-gray-100 rounded w-5/6" />
                <div className="text-[6px] font-bold text-primary mt-1">
                  2. ATIVIDADES
                </div>
                <div className="h-1 bg-gray-100 rounded w-full" />
                <div className="h-1 bg-gray-100 rounded w-4/5" />
              </div>
              <div className="mt-2 pt-1.5 border-t border-gray-100 flex justify-end">
                <div className="text-[7px] text-gray-400">CREA 123456</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
