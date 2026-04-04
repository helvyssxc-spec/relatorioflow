import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Crown, ArrowUpCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  limit: number;
  usage: number;
}

export function QuotaModal({ isOpen, onClose, planName, limit, usage }: QuotaModalProps) {
  const isStarter = planName.toLowerCase().includes("starter") || planName.toLowerCase().includes("free");
  const isUnlimited = limit === -1;
  
  const percentage = isUnlimited ? 0 : Math.min(Math.round((usage / limit) * 100), 100);
  
  const nextPlan = isStarter ? "Pro" : "Business";
  const nextPlanIcon = isStarter ? <Crown className="h-5 w-5 text-yellow-500" /> : <Zap className="h-5 w-5 text-purple-500" />;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowUpCircle size={120} />
          </div>
          
          <Badge variant="secondary" className="mb-4 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
            {isUnlimited ? "Gerenciamento de Cota" : "Limite Atingido"}
          </Badge>
          
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl md:text-3xl font-bold text-white mb-2">
              {isUnlimited ? "Você tem poder ilimitado! 🚀" : "Hora de dar o próximo passo! 🚀"}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-base leading-relaxed">
              {isUnlimited 
                ? `Você está no plano ${planName} e pode gerar quantos relatórios precisar.`
                : `Você atingiu sua cota mensal de ${limit} relatórios no plano ${planName}. Não pare seu ritmo agora!`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6 bg-background">
          <div className="space-y-3">
            <div className="flex justify-between items-end text-sm">
              <span className="font-medium text-muted-foreground">Uso do mês atual</span>
              <span className="font-bold text-foreground">
                {isUnlimited ? usage : `${usage} / ${limit}`}
              </span>
            </div>
            <Progress value={percentage} className="h-3 bg-secondary" />
            {!isUnlimited && percentage >= 100 && (
              <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                <AlertCircle className="h-3 w-3" /> Limite de geração mensal 100% consumido.
              </p>
            )}
            {isUnlimited && (
              <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Sua cota é ilimitada neste plano.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {nextPlanIcon}
              </div>
              <div>
                <h4 className="font-bold text-foreground">O que o plano {nextPlan} oferece:</h4>
                <p className="text-xs text-muted-foreground">Desbloqueie agora e eleve seu patamar.</p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {[
                isStarter ? "Até 50 relatórios mensais" : "Relatórios Ilimitados",
                "Personalização completa de logo e cores",
                "Exportação para DOCX (Word) e Excel",
                "IA avançada com prompts especializados"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter className="sm:justify-start gap-3 flex-col sm:flex-row pt-2">
            <Button asChild className="flex-1 h-12 text-base font-bold shadow-lg shadow-primary/20">
              <Link to="/billing">
                Quero o plano {nextPlan}
              </Link>
            </Button>
            <Button variant="ghost" className="flex-1 h-12" onClick={onClose}>
              Continuar avaliando
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
