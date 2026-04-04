import { useState } from "react";
import { FileText, ClipboardList, Users, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const docs = [
  {
    id: "tecnico", icon: FileText, label: "Relatório Técnico", color: "hsl(var(--primary))",
    badge: "ABNT NBR 10719", header: "TechServ Engenharia Ltda.",
    title: "RELATÓRIO TÉCNICO DE VISTORIA", number: "RT-2026-047",
    date: "28 de março de 2026", client: "Condomínio Solar das Palmeiras",
    sections: [
      { title: "1 INTRODUÇÃO", lines: [100, 85, 92] },
      { title: "2 DESENVOLVIMENTO", lines: [100, 88, 75, 95] },
      { title: "3 CONSIDERAÇÕES FINAIS", lines: [100, 70] },
    ],
    sig: "João Silva · Eng. Civil CREA-SP 123456",
  },
  {
    id: "rdo", icon: ClipboardList, label: "Diário de Obra", color: "hsl(var(--foreground))",
    badge: "Res. CONFEA", header: "ConstPark Ltda.",
    title: "RELATÓRIO DIÁRIO DE OBRA", number: "RDO-2026-089",
    date: "28 de março de 2026", client: "Edifício Park Avenue · Torre A",
    sections: [
      { title: "EFETIVO EM CAMPO", lines: [100, 85, 75] },
      { title: "SERVIÇOS EXECUTADOS", lines: [100, 90, 80, 70] },
      { title: "OCORRÊNCIAS", lines: [100, 65] },
    ],
    sig: "Carlos Lima · CREA-SP 654321 + Contratante",
  },
  {
    id: "ata", icon: Users, label: "Ata de Reunião", color: "#7C3AED",
    badge: "Padrão jurídico", header: "TechServ Engenharia Ltda.",
    title: "ATA DE REUNIÃO Nº 2026-012", number: "12/2026",
    date: "28 de março de 2026", client: "Análise de Projeto · Park Avenue",
    sections: [
      { title: "PARTICIPANTES", lines: [100, 85, 75, 90, 80] },
      { title: "DELIBERAÇÕES", lines: [100, 95, 100, 88, 76, 95] },
      { title: "ENCAMINHAMENTOS", lines: [100, 80, 70] },
    ],
    sig: "Coordenador + 4 participantes",
  },
  {
    id: "proposta", icon: ShoppingCart, label: "Proposta Comercial", color: "#059669",
    badge: "Com planilha", header: "TechServ Engenharia Ltda.",
    title: "PROPOSTA COMERCIAL", number: "PC-2026-034",
    date: "28 de março de 2026", client: "Condomínio Solar das Palmeiras",
    sections: [
      { title: "ESCOPO DOS SERVIÇOS", lines: [100, 85, 70] },
      { title: "COMPOSIÇÃO DE PREÇOS", lines: [100, 100, 100, 100, 100] },
      { title: "CONDIÇÕES COMERCIAIS", lines: [100, 80] },
    ],
    sig: "Campo de aceite + assinatura do cliente",
  },
];

const PDFShowcaseSection = () => {
  const [active, setActive] = useState("tecnico");
  const doc = docs.find((d) => d.id === active)!;

  return (
    <section id="documentos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">
            Documentos gerados
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Veja como fica o PDF real
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Cada tipo tem seu padrão profissional — ABNT, CONFEA ou comercial
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => setActive(d.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                active === d.id
                  ? "bg-primary text-primary-foreground border-primary shadow-lg"
                  : "bg-background border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <d.icon className="h-4 w-4" />
              {d.label}
            </button>
          ))}
        </div>

        {/* PDF Preview */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-border overflow-hidden">
            <div className="border-l-4 border-primary" />
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{doc.header}</p>
                  <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                    {doc.badge}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Documento</p>
                  <p className="text-xs font-bold text-foreground">{doc.number}</p>
                </div>
              </div>

              <h3 className="text-sm font-bold text-foreground text-center mb-1">{doc.title}</h3>
              <p className="text-[10px] text-muted-foreground text-center mb-1">{doc.client}</p>
              <p className="text-[10px] text-muted-foreground text-center mb-4">{doc.date}</p>

              {/* Sections */}
              <div className="space-y-3">
                {doc.sections.map((sec, si) => (
                  <div key={si}>
                    <p className="text-[10px] font-bold text-foreground mb-1">{sec.title}</p>
                    <div className="space-y-1">
                      {sec.lines.map((w, li) => (
                        <div
                          key={li}
                          className="h-1.5 bg-muted rounded"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Signature */}
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground">{doc.sig}</p>
                  <div className="h-px bg-foreground/20 w-32 mt-2" />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-2 border-t border-border">
                <p className="text-[8px] text-muted-foreground text-center">
                  Gerado por RelatórioFlow
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg">
              <Link to="/register">Gerar meu primeiro relatório grátis →</Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Sem cartão de crédito · Resultado em 30 segundos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PDFShowcaseSection;
