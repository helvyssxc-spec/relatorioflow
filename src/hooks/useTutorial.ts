import { useState, useEffect } from "react";

const TUTORIAL_KEY = "rf-tutorial-done";

export const STEPS = [
  {
    title: "Bem-vindo ao RelatórioFlow! 👋",
    emoji: "🚀",
    description:
      "Em menos de 2 minutos você vai aprender a transformar suas anotações " +
      "em relatórios profissionais com IA. Vamos começar?",
    tip: null,
  },
  {
    title: "Passo 1 — Escolha o tipo de relatório",
    emoji: "📋",
    description:
      "No Dashboard, selecione o tipo: Relatório Técnico, Vistoria, Laudo, " +
      "Diário de Obra, Proposta Comercial, Ata de Reunião e mais 6 opções. " +
      "O formulário se adapta automaticamente ao tipo escolhido.",
    tip: "💡 Para obras e vistorias, campos de Clima e Condições de acesso aparecem automaticamente. Para Proposta e Orçamento, aparecem campos de preço e condições comerciais.",
  },
  {
    title: "Passo 2 — Preencha os dados",
    emoji: "✍️",
    description:
      "Informe cliente, responsável e data. Em 'Atividades realizadas', " +
      "escreva suas anotações como se fosse um WhatsApp — sem se preocupar " +
      "com formatação. Para Proposta Comercial, preencha os itens com valor " +
      "unitário — o total é calculado automaticamente.",
    tip: "💡 Quanto mais detalhes você der, mais completo e preciso sai o relatório gerado pela IA.",
  },
  {
    title: "Passo 3 — Gere o relatório com IA",
    emoji: "✨",
    description:
      "Clique em 'Gerar relatório profissional'. Em 30 segundos o texto aparece " +
      "completo, estruturado e pronto. Use 'Melhorar texto' (Pro+) para refinar " +
      "partes específicas se precisar de ajustes.",
    tip: "💡 A IA usa uma estrutura específica para cada tipo: Ata segue padrão jurídico, RDO segue a Resolução CONFEA, Relatório Técnico segue a ABNT NBR 10719.",
  },
  {
    title: "Passo 4 — Exporte em PDF, Word ou Excel",
    emoji: "📄",
    description:
      "Clique em 'Baixar PDF' para o documento pronto com capa, logo e assinatura. " +
      "Prefere editar? 'Word' abre o mesmo documento editável no Word/LibreOffice. " +
      "'Excel' gera uma planilha estruturada — ideal para Proposta Comercial com " +
      "fórmulas de total automáticas.",
    tip: "💡 Configure logo, CNPJ e assinatura em Configurações → Empresa antes de gerar para relatórios ainda mais profissionais.",
  },
  {
    title: "Você está pronto! 🎉",
    emoji: "🎯",
    description:
      "Seus relatórios ficam salvos no Histórico para consultar, reutilizar " +
      "e organizar em pastas. Clique em qualquer relatório para 'Usar como base' " +
      "e gerar uma nova versão com dados atualizados. Dúvidas? Fale com o Suporte.",
    tip: "💡 Dica: preencha Configurações → Empresa com CNPJ, endereço e número de registro (CREA, CRM, etc.) — aparecem automaticamente em todos os relatórios.",
  },
];

export function useTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(TUTORIAL_KEY);
    if (!done) {
      const t = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    localStorage.setItem(TUTORIAL_KEY, "true");
    setIsOpen(false);
    setStep(0);
  };

  const restart = () => {
    setStep(0);
    setIsOpen(true);
  };

  return { isOpen, step, next, prev, finish, restart, total: STEPS.length };
}
