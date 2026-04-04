import { ShieldCheck, Lock, Eye, Server, Trash2, FileCheck } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Conformidade com LGPD", desc: "Seus dados e os de seus clientes são tratados conforme a Lei Geral de Proteção de Dados." },
  { icon: Lock, title: "Dados criptografados", desc: "Toda comunicação protegida com SSL/TLS. Relatórios armazenados com segurança na nuvem." },
  { icon: Eye, title: "Privacidade garantida", desc: "Nunca vendemos ou compartilhamos seus dados. Suas informações são exclusivamente suas." },
  { icon: Server, title: "Infraestrutura confiável", desc: "Hospedado com backups automáticos e disponibilidade de 99,9%." },
  { icon: Trash2, title: "Direito ao esquecimento", desc: "Exclua sua conta e todos os dados a qualquer momento, sem burocracia." },
  { icon: FileCheck, title: "Seus relatórios são seus", desc: "Todo documento gerado pertence exclusivamente a você. Nunca usamos seu conteúdo." },
];

const SecuritySection = () => (
  <section className="py-20 bg-card">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">
          🔒 Segurança e privacidade
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Seus dados protegidos.
          <br />
          Seus documentos, seus.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Técnicos e engenheiros confiam em nós com dados de clientes e projetos. Levamos isso a sério.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {items.map((item, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default SecuritySection;
