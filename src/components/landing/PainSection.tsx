import { Clock, PenOff, RotateCcw, BrainCog } from "lucide-react";

const pains = [
  { icon: Clock, text: "Perde tempo escrevendo relatórios" },
  { icon: PenOff, text: "Não sabe como deixar o texto profissional" },
  { icon: RotateCcw, text: "Precisa refazer várias vezes" },
  { icon: BrainCog, text: "Esquece informações importantes" },
];

const PainSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
          Você ainda faz isso <span className="text-destructive">manualmente?</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-left">
          {pains.map((p, i) => (
            <div key={i} className="flex items-center gap-4 p-5 rounded-xl border border-destructive/20 bg-destructive/5">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <p.icon className="h-5 w-5 text-destructive" />
              </div>
              <span className="text-foreground font-medium">{p.text}</span>
            </div>
          ))}
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <p className="text-lg font-bold text-primary">
            💡 Seu tempo está sendo desperdiçado com algo que poderia ser feito em segundos.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default PainSection;
