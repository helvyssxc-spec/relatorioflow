import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Rocket, ShieldCheck, Zap, Mail, Lock, ArrowRight, CheckCircle2, 
  MessageSquare, Layout, FileText, Cpu, ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ── MODO DE EXIBIÇÃO ─────────────────────────────────────────────────────────
const LAUNCHED = false;

export default function Maintenance() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error: insertError } = await supabase.from("waitlist").insert([{ email }]);

      if (insertError?.code === "23505") {
        toast.success("Você já está na lista! Avisaremos quando abrirmos. 🚀");
        setEmail("");
        return;
      }

      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: "https://relatorioflow.com.br/dashboard",
        },
      });

      toast.success("Confirmado! Verifique seu e-mail para garantir sua vaga prioritária. 💎");
      setEmail("");
    } catch {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white selection:bg-blue-500/30">
      
      {/* ── NAVBAR ── */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        scrolled ? "bg-[#0A0B14]/80 backdrop-blur-md border-white/10 py-3" : "bg-transparent border-transparent py-6"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">RelatórioFlow</span>
            <div className="hidden sm:flex items-center gap-1.5 ml-4 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Sistemas Online
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link to="/login" className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
              <Lock className="w-3.5 h-3.5" /> Acesso Analista
            </Link>
          </div>

          <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10" asChild>
            <a href="#waitlist">Garantir Vaga</a>
          </Button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest animate-fade-in">
            <Cpu className="w-3 h-3" /> IA Pericial para Engenharia
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Transforme suas notas de campo em <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-600">
              Relatórios ABNT em segundos.
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            O fim da burocracia técnica. Do canteiro de obras ao PDF final com IA treinada em normas NBR 10719. Junte-se à revolução dos laudos inteligentes.
          </p>

          <div id="waitlist" className="max-w-lg mx-auto pt-4">
            <form onSubmit={handleWaitlist} className="relative group">
              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all shadow-2xl">
                <div className="flex-1 flex items-center px-4 gap-3">
                  <Mail className="w-5 h-5 text-gray-500 group-focus-within:text-blue-400" />
                  <Input
                    type="email"
                    placeholder="Engenheiro, digite seu e-mail..."
                    className="bg-transparent border-none focus-visible:ring-0 placeholder:text-gray-600 text-white w-full h-12 text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
                  disabled={loading}
                >
                  {loading ? "Reservando..." : "Entrar na Lista VIP"}
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 mt-4 flex items-center justify-center gap-1.5 uppercase tracking-widest font-semibold">
                <ShieldCheck className="w-3 h-3" /> Acesso gratuito concedido por ordem de chegada.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ── */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-12">
            CONFIANÇA E PADRÃO TÉCNICO POR
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            {/* Placeholder logos for authority */}
            <span className="text-xl font-bold tracking-tighter italic">ENGENHARIA 360</span>
            <span className="text-xl font-bold tracking-tighter italic">LAUDOS PRO</span>
            <span className="text-xl font-bold tracking-tighter italic">VISTORIA.IA</span>
            <span className="text-xl font-bold tracking-tighter italic">SISTEMA ABNT</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Velocidade Extrema",
              desc: "Gere em 30 segundos o que levava 4 horas de digitação.",
              icon: Zap,
              color: "text-yellow-500"
            },
            {
              title: "Conformidade ABNT",
              desc: "Estrutura automática seguindo a NBR 10719 e normas do CREA.",
              icon: FileText,
              color: "text-blue-500"
            },
            {
              title: "Design Premium",
              desc: "Seus clientes receberão PDFs elegantes com sua marca.",
              icon: Layout,
              color: "text-indigo-500"
            },
            {
              title: "Motor IA Híbrido",
              desc: "Zero indisponibilidade. Backup automático entre Google Gemini e Llama-3 (Groq).",
              icon: Cpu,
              color: "text-emerald-500"
            }
          ].map((item, i) => (
            <div key={i} className={cn(
              "p-8 bg-white/5 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-all group",
              i === 3 ? "md:col-span-1 md:bg-gradient-to-br md:from-white/5 md:to-emerald-500/5" : ""
            )}>
              <item.icon className={cn("w-10 h-10 mb-6 group-hover:scale-110 transition-transform", item.color)} />
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" className="py-32 px-6 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">Dúvidas Frequentes</h2>
            <p className="text-gray-400 italic">Respondendo o que os engenheiros querem saber.</p>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border-white/10 px-6 bg-white/5 rounded-2xl overflow-hidden">
              <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                O PDF é editável?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed pb-6">
                Sim! Você pode baixar em PDF pronto para assinatura ou em DOCX/Excel nos planos superiores para fazer ajustes finos.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-white/10 px-6 bg-white/5 rounded-2xl overflow-hidden">
              <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                A IA entende termos técnicos brasileiros?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed pb-6">
                Com certeza. Nossa IA foi treinada especificamente com terminologias da engenharia civil, elétrica e segurança do trabalho do mercado brasileiro.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-white/10 px-6 bg-white/5 rounded-2xl overflow-hidden">
              <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                É seguro enviar fotos de obras?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed pb-6">
                Totalmente. Utilizamos criptografia de ponta a ponta e seus dados são isolados por organização. Não usamos suas imagens para treinar modelos públicos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-white/10 px-6 bg-white/5 rounded-2xl overflow-hidden">
              <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                O sistema pode ficar fora do ar por limite de uso da IA?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed pb-6">
                Não com a nossa arquitetura 2.0. O RelatórioFlow utiliza um motor híbrido (Dual Engine). Se uma IA atingir o limite, o sistema alterna automaticamente para o motor reserva em milissegundos, garantindo que você nunca fique na mão.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Rocket className="w-5 h-5" />
            <span className="font-bold">RelatórioFlow 2026</span>
          </div>
          
          <div className="flex gap-10 text-sm text-gray-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <Link to="/login" className="hover:text-blue-400 transition-colors">Portal do Analista</Link>
          </div>

          <p className="text-[10px] text-gray-700 tracking-widest font-mono">
            BUILD_VERSION: 2.0.4-STABLE
          </p>
        </div>
      </footer>

      {/* Floating Sparkles for Vibe */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_2px_rgba(59,130,246,0.5)]" />
        <div className="absolute bottom-[30%] right-[10%] w-0.5 h-0.5 bg-indigo-400 rounded-full animate-ping shadow-[0_0_8px_1px_rgba(129,140,248,0.5)]" />
      </div>
    </div>
  );
}
