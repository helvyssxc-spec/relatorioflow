import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import type { PlanConfig, PlanId } from "@/config/plans";

interface Props {
  plan: PlanConfig;
  currentPlanId: PlanId;
  billingCycle: "monthly" | "yearly";
  onSelect: (plan: PlanConfig) => void;
}

export default function BillingPlanCard({ plan, currentPlanId, billingCycle, onSelect }: Props) {
  const isCurrentPlan = plan.id === currentPlanId;
  const displayPrice = billingCycle === "yearly" ? plan.yearlyPrice : plan.price;

  return (
    <Card className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}>
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className={`px-3 flex items-center gap-1 ${plan.popular ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"}`}>
            <Star className="h-3 w-3" /> {plan.highlight}
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <plan.icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-center">
        <div className="mb-2">
          <span className="text-4xl font-bold text-foreground">
            {displayPrice === 0 ? "Grátis" : `R$${displayPrice}`}
          </span>
          {displayPrice > 0 && (
            <span className="text-muted-foreground text-sm">/{billingCycle === "monthly" ? "mês" : "ano"}</span>
          )}
        </div>
        {billingCycle === "yearly" && displayPrice > 0 && (
          <p className="text-xs text-emerald-600 font-medium mb-4">
            equivale a R${Math.round(displayPrice / 10)}/mês
          </p>
        )}
        <ul className="space-y-3 text-left text-sm">
          {plan.featureList.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "outline"}
          disabled={isCurrentPlan}
          onClick={() => onSelect(plan)}
        >
          {isCurrentPlan ? "Plano Atual" : plan.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}
