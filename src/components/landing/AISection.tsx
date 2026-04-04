import { Sparkles, Brain, Lightbulb, SpellCheck } from "lucide-react";

const features = [
  { icon: Sparkles, title: "Organiza automaticamente", desc: "Estrutura suas anotações em seções profissionais." },
  { icon: Brain, title: "Gera conclusão profissional", desc: "Cria conclusões e análises técnicas baseadas nos seus dados." },
  { icon: Lightbulb, title: "Sugere melhorias", desc: "Recomenda próximos passos e ações relevantes." },
  { icon: SpellCheck, title: "Corrige linguagem", desc: "Transforma texto informal em linguagem técnica." },
];

const AISection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-1.5 text-sm font-medium text-accent mb-4">
            <Sparkles className="h-4 w-4" /> Inteligência Artificial
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Inteligência artificial trabalhando por você
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <f.icon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <div className="inline-block bg-accent/10 border border-accent/20 rounded-xl px-8 py-4">
            <p className="text-lg font-bold text-accent">
              ✨ Você escreve simples. A IA entrega profissional.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AISection;
