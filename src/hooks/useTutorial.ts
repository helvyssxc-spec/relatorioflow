import { useState, useEffect } from 'react';

export const STEPS = [
  {
    emoji: '🏗️',
    title: 'Bem-vindo ao RelatorioFlow',
    description: 'A plataforma definitiva para engenheiros que desejam transformar dados de campo em relatórios institucionais de alto nível.',
    tip: 'Seus dados são salvos automaticamente mesmo sem internet.'
  },
  {
    emoji: '📁',
    title: 'Cadastre suas Obras',
    description: 'Tudo começa com um Projeto. Cadastre sua obra uma única vez para organizar todos os seus Diários e Relatórios Técnicos.',
    tip: 'Você pode subir a logo do cliente para aparecer nos relatórios.'
  },
  {
    emoji: '📋',
    title: 'Diários de Obra (RDO)',
    description: 'Registre o efetivo, clima, atividades e fotos diariamente. O sistema calcula o progresso acumulado automaticamente.',
    tip: 'O clima é capturado via GPS, economizando seu tempo.'
  },
  {
    emoji: '🔬',
    title: 'Relatórios Técnicos',
    description: 'Para vistorias, perícias ou laudos técnicos. Utilize o fluxo Wizard para preencher cada seção com diagnóstico e fotos.',
    tip: 'Use o Assistente IA para refinar seus textos técnicos conforme a ABNT.'
  },
  {
    emoji: '🎨',
    title: 'Sua Marca, Sua Grife',
    description: 'Vá em Configurações e suba sua logo e dados profissionais. Seus PDFs sairão com design institucional premium.',
    tip: 'PDFs são otimizados para envio rápido via WhatsApp.'
  },
  {
    emoji: '🚀',
    title: 'Tudo Pronto!',
    description: 'Agora você está pronto para elevar o nível da sua documentação de engenharia. Comece criando seu primeiro relatório.',
    tip: 'Dúvidas? Acesse o canal de suporte no menu lateral.'
  }
];

export function useTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('relatorioflow-onboarding-v1');
    if (!hasSeenTutorial) {
      setIsOpen(true);
    }
  }, []);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const finish = () => {
    localStorage.setItem('relatorioflow-onboarding-v1', 'true');
    setIsOpen(false);
  };

  const restart = () => {
    setStep(0);
    setIsOpen(true);
  };

  return {
    isOpen,
    step,
    total: STEPS.length,
    next,
    prev,
    finish,
    restart
  };
}
