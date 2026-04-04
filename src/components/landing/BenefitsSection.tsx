import { Clock, BarChart3, Mail, Palette, Shield, Smartphone } from "lucide-react";

const benefits = [
  { icon: Clock, title: "Economize horas toda semana", desc: "Automatize relatórios que levavam horas para preparar manualmente." },
  { icon: BarChart3, title: "Relatórios sempre no padrão", desc: "Templates profissionais garantem consistência visual em todos os relatórios." },
  { icon: Mail, title: "Envio automático por e-mail", desc: "Destinatários recebem os relatórios no dia e hora programados." },
  { icon: Palette, title: "Com a cara da sua empresa", desc: "Personalize com logo, cores e fontes da sua marca." },
  { icon: Shield, title: "Dados seguros e protegidos", desc: "Seus dados ficam criptografados e protegidos com as melhores práticas." },
  { icon: Smartphone, title: "Acesse de qualquer lugar", desc: "Interface responsiva para desktop, tablet e celular." },
];

const BenefitsSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Por que usar o RelatórioFlow?</h2>
        <p className="mt-4 text-lg text-muted-foreground">Tudo que você precisa para relatórios profissionais</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {benefits.map((b, i) => (
          <div key={i} className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <b.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
            <p className="text-muted-foreground text-sm">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
