import { usePlanSimulation } from "@/hooks/usePlanSimulation";
import { getPlanConfig } from "@/config/plans";
import { Button } from "@/components/ui/button";
import { FlaskConical, X } from "lucide-react";

export default function PlanSimulationBanner() {
  const { simulatedPlan, setSimulatedPlan, isSimulating } = usePlanSimulation();

  if (!isSimulating || !simulatedPlan) return null;

  const plan = getPlanConfig(simulatedPlan);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
      <FlaskConical className="h-4 w-4" />
      <span>
        Modo simulação ativo — Visualizando como plano <strong className="uppercase">{plan.name}</strong>
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-amber-950 hover:bg-amber-600 hover:text-amber-950"
        onClick={() => setSimulatedPlan(null)}
      >
        <X className="h-3.5 w-3.5 mr-1" /> Sair
      </Button>
    </div>
  );
}
