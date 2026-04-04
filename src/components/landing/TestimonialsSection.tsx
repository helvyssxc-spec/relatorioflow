const testimonials = [
  { name: "Carlos Mendes", role: "Técnico de TI", company: "InfoTech", text: "Eu levava 40 minutos para escrever cada relatório. Agora faço em 30 segundos. Mudou minha rotina completamente." },
  { name: "Ana Paula Silva", role: "Engenheira Civil", company: "ConstrutoraBR", text: "A qualidade dos relatórios gerados é impressionante. Meus clientes elogiam a profissionalidade dos textos." },
  { name: "Ricardo Santos", role: "Supervisor de Manutenção", company: "GrowthUp", text: "Parei de ter retrabalho com relatórios. A IA já entrega tudo formatado e pronto para enviar ao gestor." },
];

const TestimonialsSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">O que nossos usuários dizem</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <div key={i} className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, j) => (
                <span key={j} className="text-warning">★</span>
              ))}
            </div>
            <p className="text-foreground mb-6 leading-relaxed">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                {t.name[0]}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
