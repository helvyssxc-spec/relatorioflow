import { HardHat, Laptop, Search, ClipboardList, Building2, Wrench } from "lucide-react";

const professions = [
  { icon: HardHat, label: "Engenheiros Civis" },
  { icon: Laptop, label: "Técnicos de TI" },
  { icon: Search, label: "Vistoriadores" },
  { icon: ClipboardList, label: "Consultores Técnicos" },
  { icon: Building2, label: "Supervisores de Obra" },
  { icon: Wrench, label: "Téc. de Manutenção" },
];

const stats = [
  { value: "12", label: "tipos de relatório" },
  { value: "30s", label: "para gerar um PDF" },
  { value: "ABNT", label: "NBR 10719 incluso" },
  { value: "Grátis", label: "para começar" },
];

const TrustBarSection = () => (
  <section className="py-12 bg-muted/50 border-y border-border">
    <div className="container mx-auto px-4">
      <p className="text-center text-sm text-muted-foreground font-medium mb-6">
        Usado por profissionais de
      </p>
      <div className="flex flex-wrap justify-center gap-6 mb-10">
        {professions.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-muted-foreground">
            <p.icon className="h-4 w-4" />
            <span className="text-sm">{p.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBarSection;
