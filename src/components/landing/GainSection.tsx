import { Clock, TrendingUp, Award } from "lucide-react";

const gains = [
  { icon: Clock, value: "5h", label: "economizadas por semana" },
  { icon: TrendingUp, value: "10x", label: "mais rápido que manual" },
  { icon: Award, value: "100%", label: "padrão profissional" },
];

const GainSection = () => (
  <section className="py-20 bg-primary text-primary-foreground">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Economize até 5 horas por semana</h2>
        <p className="mt-4 text-lg text-primary-foreground/70">Tempo que você pode investir no que realmente importa</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
        {gains.map((g, i) => (
          <div key={i} className="text-center space-y-2">
            <g.icon className="h-8 w-8 mx-auto text-accent" />
            <p className="text-5xl font-extrabold text-accent">{g.value}</p>
            <p className="text-primary-foreground/70">{g.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default GainSection;
