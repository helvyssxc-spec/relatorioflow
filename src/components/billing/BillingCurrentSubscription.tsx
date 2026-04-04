import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  subscription: {
    plan: string;
    amount: number;
    currency: string;
    billing_cycle: string;
    current_period_end: string | null;
    card_brand?: string | null;
    card_last_digits?: string | null;
  };
}

export default function BillingCurrentSubscription({ subscription }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Assinatura Ativa</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Plano</span>
          <p className="font-medium capitalize">{subscription.plan}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Valor</span>
          <p className="font-medium">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: subscription.currency }).format(Number(subscription.amount))}
            /{subscription.billing_cycle === "monthly" ? "mês" : "ano"}
          </p>
        </div>
        {subscription.current_period_end && (
          <div>
            <span className="text-muted-foreground">Próxima cobrança</span>
            <p className="font-medium">{format(new Date(subscription.current_period_end), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
        )}
        {subscription.card_brand && subscription.card_last_digits && (
          <div>
            <span className="text-muted-foreground">Cartão</span>
            <p className="font-medium capitalize">{subscription.card_brand} •••• {subscription.card_last_digits}</p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Status</span>
          <Badge variant="secondary" className="ml-1 bg-emerald-500/10 text-emerald-600">Ativo</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
