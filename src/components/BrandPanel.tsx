import { CheckCircle2, FileDown, Camera, Rocket, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-1 flex-col justify-between p-12 text-white relative overflow-hidden bg-[#0A0B14]">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 rotate-3">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">RelatórioFlow</span>
        </div>

        <div className="space-y-6 max-w-lg">
          <h2 className="text-4xl font-extrabold leading-[1.2] tracking-tight">
            Relatórios profissionais <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-600">
              em 30 segundos com IA.
            </span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed font-medium">
            A ferramenta definitiva para engenheiros, peritos e consultores que buscam excelência técnica e agilidade.
          </p>
        </div>

        <div className="space-y-6">
          {[
            { 
               icon: <Zap className="h-5 w-5 text-blue-500" />, 
               title: "IA Pericial Integrada", 
               desc: "Laudos estruturados automaticamente por nossa IA técnica." 
            },
            { 
               icon: <ShieldCheck className="h-5 w-5 text-indigo-500" />, 
               title: "Segurança de Dados", 
               desc: "Seus relatórios protegidos em ambiente isolado e criptografado." 
            },
            { 
               icon: <FileDown className="h-5 w-5 text-blue-400" />, 
               title: "DOCX & PDF Profissionais", 
               desc: "Baixe documentos prontos com sua marca e logo." 
            },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-4 group">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-blue-500/50 transition-colors">
                {f.icon}
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-gray-200">{f.title}</p>
                <p className="text-xs text-gray-500 max-w-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-8 pt-8 border-t border-white/5 max-w-md">
        <blockquote className="italic text-sm text-gray-400 leading-relaxed">
          "O RelatórioFlow cortou meu tempo de elaboração em 90%. É o padrão ouro para quem trabalha em campo hoje."
        </blockquote>
        <div className="flex items-center gap-3 mt-4">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg">
            EG
          </div>
          <div>
            <p className="text-sm font-bold">Eduardo Goulart</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Engenheiro Civil · Goulart Engenharia</p>
          </div>
        </div>
      </div>

      {/* Animation Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_2px_rgba(59,130,246,0.3)]" />
        <div className="absolute bottom-[40%] left-[10%] w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
      </div>
    </div>
  );
}