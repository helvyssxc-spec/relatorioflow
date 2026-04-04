import { ArrowRight } from "lucide-react";

const DemoSection = () => (
  <section id="demonstracao" className="py-20 bg-card">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Antes vs Depois</h2>
        <p className="mt-4 text-lg text-muted-foreground">Veja a transformação em tempo real</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
        {/* ANTES */}
        <div className="rounded-xl border border-border bg-background p-8 space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-3 py-1 rounded-full">
            Antes
          </span>
          <h3 className="text-lg font-semibold text-foreground">Sua anotação rápida</h3>
          <div className="bg-muted rounded-lg p-6 text-muted-foreground italic text-sm leading-relaxed font-mono">
            "verifiquei sistema, problema na câmera 3, troquei cabo e funcionou"
          </div>
        </div>

        {/* DEPOIS */}
        <div className="rounded-xl border-2 border-accent bg-background p-8 space-y-4 shadow-lg shadow-accent/5">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full">
            Depois — gerado pela IA
          </span>
          <h3 className="text-lg font-semibold text-foreground">Relatório profissional</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">📋 Objetivo</p>
              <p className="text-muted-foreground">Verificação e manutenção do sistema de câmeras de segurança.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">🔧 Atividades Realizadas</p>
              <p className="text-muted-foreground">Inspeção geral do sistema de monitoramento. Identificação de falha na Câmera 03. Substituição do cabo de conexão da unidade afetada.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">📊 Análise Técnica</p>
              <p className="text-muted-foreground">A falha foi causada por desgaste no cabo de transmissão de dados, resultando em perda de sinal. A substituição restabeleceu o funcionamento normal.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">✅ Conclusão</p>
              <p className="text-muted-foreground">Manutenção corretiva realizada com sucesso. Recomenda-se inspeção periódica dos cabos para prevenir recorrências.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <div className="inline-flex items-center gap-2 text-accent font-medium">
          <ArrowRight className="h-5 w-5" /> Tudo isso em menos de 30 segundos
        </div>
      </div>
    </div>
  </section>
);

export default DemoSection;
