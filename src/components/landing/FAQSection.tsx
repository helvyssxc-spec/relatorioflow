import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Como funciona o plano grátis?", a: "O plano Free permite gerar até 3 relatórios por mês, sem cartão de crédito. Ideal para testar a plataforma." },
  { q: "A IA realmente melhora meu texto?", a: "Sim! Nossa IA transforma anotações informais em textos técnicos e profissionais, com estrutura padronizada." },
  { q: "Posso exportar em PDF?", a: "Sim! Você pode copiar o texto ou exportar diretamente em PDF, pronto para enviar." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim! Cancele quando quiser, sem burocracia. O acesso continua até o final do período pago." },
  { q: "Meus dados ficam seguros?", a: "Todos os dados são criptografados e protegidos. Seguimos as melhores práticas de segurança e LGPD." },
  { q: "Funciona no celular?", a: "Sim! A plataforma é 100% responsiva e funciona em qualquer dispositivo." },
];

const FAQSection = () => (
  <section id="faq" className="py-20 bg-card">
    <div className="container mx-auto px-4 max-w-3xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Perguntas frequentes</h2>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-6">
            <AccordionTrigger className="text-foreground font-medium hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
