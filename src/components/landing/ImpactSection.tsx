import { Clock, TrendingUp, Award } from "lucide-react";

const stats = [
  { icon: Clock, value: "5h", label: "economizadas por semana" },
  { icon: TrendingUp, value: "30s", label: "para gerar um relatório" },
  { icon: Award, value: "100%", label: "profissional e padronizado" },
];

const ImpactSection = () => (
  <section className="py-16 bg-accent text-accent-foreground">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-2xl md:text-4xl font-extrabold mb-10">
        Economize até 5 horas por semana com relatórios automáticos
      </h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
        {stats.map((s, i) => (
          <div key={i} className="space-y-1">
            <s.icon className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <p className="text-5xl font-extrabold">{s.value}</p>
            <p className="text-accent-foreground/70 text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ImpactSection;
