import { ArrowDown } from "lucide-react";

const ExampleSection = () => (
  <section className="py-20 bg-card">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Veja um exemplo real</h2>
        <p className="mt-4 text-lg text-muted-foreground">De uma anotação simples a um relatório completo</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Input */}
        <div className="rounded-xl border border-border bg-background p-8">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-3 py-1 rounded-full mb-4">
            Entrada — sua anotação
          </span>
          <p className="text-foreground font-mono text-lg italic leading-relaxed">
            "fiz manutenção no sistema, câmera com falha"
          </p>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-8 w-8 text-accent animate-bounce" />
        </div>

        {/* Output */}
        <div className="rounded-xl border-2 border-accent bg-background p-8 shadow-lg shadow-accent/5">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full mb-6">
            Saída — relatório gerado pela IA
          </span>
          <div className="space-y-5 text-sm">
            <div>
              <h4 className="font-bold text-foreground text-base mb-1">📋 Objetivo</h4>
              <p className="text-muted-foreground">Realizar manutenção preventiva e corretiva no sistema de monitoramento por câmeras de segurança, assegurando o pleno funcionamento de todos os equipamentos.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground text-base mb-1">🔧 Atividades Realizadas</h4>
              <p className="text-muted-foreground">Inspeção geral do sistema de monitoramento composto por 8 câmeras. Identificação de falha operacional na Câmera 03, localizada no setor de acesso principal. Diagnóstico técnico indicou rompimento parcial do cabo de transmissão de dados. Substituição do cabo defeituoso por novo cabo categoria 6. Teste de funcionamento pós-reparo com verificação de imagem e transmissão.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground text-base mb-1">📊 Análise Técnica</h4>
              <p className="text-muted-foreground">A falha foi causada por desgaste natural do cabo de transmissão, possivelmente agravado por exposição a condições climáticas adversas. A substituição restabeleceu integralmente a operação da câmera, sem necessidade de intervenção adicional no sistema.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground text-base mb-1">✅ Conclusão</h4>
              <p className="text-muted-foreground">Manutenção corretiva realizada com sucesso. Recomenda-se implementar cronograma de inspeção trimestral dos cabos de todas as câmeras para prevenir ocorrências similares. Não foram identificadas outras anomalias no sistema.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ExampleSection;
