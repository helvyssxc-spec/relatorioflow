import { Zap, FileText, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  { icon: Zap, title: "Geração automática", desc: "Digite e receba o relatório completo em segundos." },
  { icon: FileText, title: "Texto profissional", desc: "Linguagem técnica e formal, pronta para enviar." },
  { icon: CheckCircle2, title: "Estrutura padronizada", desc: "Objetivo, atividades, análise e conclusão." },
  { icon: Send, title: "Pronto para enviar", desc: "Copie ou exporte em PDF — sem ajustes." },
];

const SolutionSection = () => (
  <section className="py-20 bg-card">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Automatize seus relatórios em segundos
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Digite uma anotação simples e receba um relatório completo, técnico e pronto para envio.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-4 p-6 rounded-xl border border-border bg-background hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <b.icon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button asChild size="lg" className="h-13 px-10 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25 text-base font-bold">
            <Link to="/register">
              Testar grátis agora <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default SolutionSection;
