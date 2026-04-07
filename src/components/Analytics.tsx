import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

export function Analytics() {
  // Busca as configurações globais do primeiro administrador encontrado
  const { data: config } = useQuery({
    queryKey: ['global-analytics'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('analytics_umami_id, analytics_ga_id')
        .eq('is_admin', true)
        .limit(1)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hora de cache (IDs não mudam com frequência)
  });

  useEffect(() => {
    if (!config) return;

    // 1. Injeção Umami
    if (config.analytics_umami_id && !document.getElementById('umami-script')) {
      const script = document.createElement('script');
      script.id = 'umami-script';
      script.async = true;
      script.defer = true;
      script.src = 'https://cloud.umami.is/script.js';
      script.setAttribute('data-website-id', config.analytics_umami_id);
      document.head.appendChild(script);
      console.log('📊 Analytics: Umami injetado.');
    }

    // 2. Injeção Google Analytics (gtag.js)
    if (config.analytics_ga_id && !document.getElementById('ga-script')) {
      const script = document.createElement('script');
      script.id = 'ga-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${config.analytics_ga_id}`;
      document.head.appendChild(script);

      const inlineScript = document.createElement('script');
      inlineScript.id = 'ga-inline-script';
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.analytics_ga_id}');
      `;
      document.head.appendChild(inlineScript);
      console.log('📊 Analytics: Google Analytics injetado.');
    }
  }, [config]);

  return null; // Componente silencioso
}
