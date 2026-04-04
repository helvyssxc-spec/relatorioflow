import { Button } from "@/components/ui/button";
import { Check, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PLANS_LIST, type PlanId } from "@/config/plans";
import { useState } from "react";

const retentionBadges: Record<PlanId, { label: string; className: string }> = {
  starter: { label: "Relatórios guardados por 30 dias", className: "bg-muted text-muted-foreground" },
  pro: { label: "Relatórios guardados por 6 meses", className: "bg-blue-500/10 text-blue-600" },
  business: { label: "Relatórios guardados para sempre", className: "bg-emerald-500/10 text-emerald-600" },
};

const PricingSection = () => {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <section id="precos" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Escolha seu plano
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece grátis. Faça upgrade quando precisar.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setCycle("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                cycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                cycle === "yearly"
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Anual{" "}
              <span className="text-xs font-bold ml-1 text-emerald-500">
                2 meses grátis
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS_LIST.map((p) => {
            const price = cycle === "yearly" ? p.yearlyPrice : p.price;
            return (
              <div
                key={p.id}
                className={cn(
                  "relative rounded-2xl border p-8 flex flex-col bg-card",
                  p.popular
                    ? "border-primary shadow-2xl shadow-primary/10 scale-[1.03]"
                    : "border-border"
                )}
              >
                {p.highlight && (
                  <span
                    className={cn(
                      "absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1",
                      p.popular
                        ? "bg-primary text-primary-foreground"
                        : "bg-emerald-500 text-white"
                    )}
                  >
                    <Star className="h-3 w-3" /> {p.highlight}
                  </span>
                )}

                <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {p.description}
                </p>

                <div className="mt-6 mb-1">
                  <span className="text-5xl font-extrabold text-foreground">
                    {price === 0 ? "Grátis" : `R$${price}`}
                  </span>
                  {price > 0 && (
                    <span className="text-muted-foreground text-sm">
                      /{cycle === "monthly" ? "mês" : "ano"}
                    </span>
                  )}
                </div>
                {cycle === "yearly" && price > 0 && (
                  <p className="text-xs text-emerald-600 font-medium mb-4">
                    equivale a R${Math.round(price / 10)}/mês
                  </p>
                )}

                <div className={cn("flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-4 w-fit", retentionBadges[p.id].className)}>
                  <Clock className="h-3 w-3" />
                  {retentionBadges[p.id].label}
                </div>

                <ul className="space-y-3 flex-1 mt-4">
                  {p.featureList.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    "mt-8 w-full h-12 text-base font-bold",
                    p.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                      : ""
                  )}
                  variant={p.popular ? "default" : "outline"}
                >
                  <Link to="/register">{p.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          ✅ Garantia de 7 dias — não gostou, devolvemos 100% · ✅ Cancele quando quiser, sem multa
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
