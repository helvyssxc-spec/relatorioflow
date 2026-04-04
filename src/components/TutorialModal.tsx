import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { STEPS } from "@/hooks/useTutorial";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  step: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
}

export function TutorialModal({ isOpen, step, total, onNext, onPrev, onFinish }: Props) {
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === total - 1;
  const progress = ((step + 1) / total) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onFinish(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="px-6 pt-5">
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 space-y-5">
          {/* Emoji + title */}
          <div className="text-center space-y-2">
            <p className="text-4xl">{current.emoji}</p>
            <h3 className="text-lg font-bold text-foreground">{current.title}</h3>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {current.description}
          </p>

          {/* Tip */}
          {current.tip && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-3 text-xs text-primary">
              {current.tip}
            </div>
          )}

          {/* Dots */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            {!isFirst ? (
              <Button variant="ghost" size="sm" onClick={onPrev}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
            ) : (
              <div />
            )}
            <Button onClick={onNext} size="sm">
              {isLast ? (
                <>Começar a usar 🚀</>
              ) : (
                <>Próximo <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={onFinish}
              className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular tutorial
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="bg-muted/30 px-6 py-2 text-center border-t border-border">
          <span className="text-[11px] text-muted-foreground">
            {step + 1} de {total}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
