import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { PLANS_LIST, getPlanConfig, type PlanConfig } from "@/config/plans";
import { toast } from "sonner";
import BillingCurrentSubscription from "@/components/billing/BillingCurrentSubscription";
import BillingCycleToggle from "@/components/billing/BillingCycleToggle";
import BillingPlanCard from "@/components/billing/BillingPlanCard";
import BillingCheckoutDialog from "@/components/billing/BillingCheckoutDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

export default function Billing() {
  const profileQuery = useOrgProfile();
  const orgId = profileQuery.data?.org_id;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase.from("organizations").select("*").eq("id", orgId).single();
      return data;
    },
    enabled: !!orgId,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("org_id", orgId)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const currentPlan = getPlanConfig(org?.plan || "starter");

  const handleSelectPlan = (plan: PlanConfig) => {
    if (plan.id === currentPlan.id) return;
    setSelectedPlan(plan);
    setCheckoutOpen(true);
    window.umami?.track("clique_assinar", { plano: plan.id });
  };

  const handleCheckoutSuccess = () => {
    setCheckoutOpen(false);
    queryClient.invalidateQueries({ queryKey: ["org"] });
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    toast.success(`Upgrade para ${selectedPlan?.name} realizado com sucesso!`);
  };

  const handleCancelSubscription = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/pagbank-cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Erro ao cancelar assinatura.");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["org"] });
      queryClient.invalidateQueries({ queryKey: ["org-plan"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });

      const accessUntil = result.access_until
        ? new Date(result.access_until).toLocaleDateString("pt-BR")
        : null;

      toast.success(
        accessUntil
          ? `Assinatura cancelada. Acesso mantido até ${accessUntil}.`
          : "Assinatura cancelada. Acesso mantido até o fim do período."
      );
    } catch {
      toast.error("Erro inesperado ao cancelar assinatura.");
    } finally {
      setShowCancelDialog(false);
    }
  };

  return (
    <AppLayout title="Planos & Cobrança">
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos & Cobrança</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu plano e informações de pagamento</p>
        </div>

        {subscription && <BillingCurrentSubscription subscription={subscription} />}

        <BillingCycleToggle billingCycle={billingCycle} onToggle={setBillingCycle} />

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS_LIST.map((plan) => (
            <BillingPlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={currentPlan.id}
              billingCycle={billingCycle}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>

        {/* Cancel subscription */}
        {currentPlan.id !== "starter" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Cancelar assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Você mantém acesso ao plano atual até o fim do período já pago.
                Após isso, sua conta vai para o plano Starter gratuito.
                Seus relatórios e dados são mantidos.
              </p>
              <Button variant="destructive" size="sm" onClick={() => setShowCancelDialog(true)}>
                Cancelar assinatura
              </Button>
            </CardContent>
          </Card>
        )}

        <BillingCheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          selectedPlan={selectedPlan}
          billingCycle={billingCycle}
          userEmail={user?.email || ""}
          onSuccess={handleCheckoutSuccess}
        />

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
              <AlertDialogDescription>
                Você continuará com acesso ao plano {currentPlan.name} até o fim do
                período atual. Depois, sua conta será rebaixada para o plano Starter
                gratuito. Seus relatórios e dados são mantidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleCancelSubscription}
              >
                Sim, cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
