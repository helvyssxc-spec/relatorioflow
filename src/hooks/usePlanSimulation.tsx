import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useIsAdmin } from "@/components/AdminRoute";
import type { PlanId } from "@/config/plans";

interface PlanSimulationContextType {
  simulatedPlan: PlanId | null;
  setSimulatedPlan: (plan: PlanId | null) => void;
  isSimulating: boolean;
}

const PlanSimulationContext = createContext<PlanSimulationContextType>({
  simulatedPlan: null,
  setSimulatedPlan: () => {},
  isSimulating: false,
});

export function PlanSimulationProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useIsAdmin();
  const [simulatedPlan, setSimulatedPlan] = useState<PlanId | null>(() => {
    const stored = localStorage.getItem("admin_simulated_plan");
    return stored as PlanId | null;
  });

  useEffect(() => {
    if (simulatedPlan) {
      localStorage.setItem("admin_simulated_plan", simulatedPlan);
    } else {
      localStorage.removeItem("admin_simulated_plan");
    }
  }, [simulatedPlan]);

  // Only admins can simulate
  const effectivePlan = isAdmin ? simulatedPlan : null;

  return (
    <PlanSimulationContext.Provider
      value={{
        simulatedPlan: effectivePlan,
        setSimulatedPlan: isAdmin ? setSimulatedPlan : () => {},
        isSimulating: !!effectivePlan,
      }}
    >
      {children}
    </PlanSimulationContext.Provider>
  );
}

export function usePlanSimulation() {
  return useContext(PlanSimulationContext);
}
