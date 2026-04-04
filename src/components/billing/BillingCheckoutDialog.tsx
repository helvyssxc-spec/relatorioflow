import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PlanConfig } from "@/config/plans";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: PlanConfig | null;
  billingCycle: "monthly" | "yearly";
  userEmail: string;
  onSuccess: () => void;
}

export default function BillingCheckoutDialog({
  open,
  onOpenChange,
  selectedPlan,
  billingCycle,
  userEmail,
  onSuccess,
}: Props) {
  const [processing, setProcessing] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [form, setForm] = useState({
    holderName: "",
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvv: "",
    taxId: "",
    phone: "",
  });

  useEffect(() => {
    // Fetch public key from edge function
    const fetchKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('pagbank-public-key');
        if (error) throw error;
        if (data?.public_key) setPublicKey(data.public_key);
      } catch {
        // public key fetch failed silently — user will see error on submit
      }
    };
    if (open) fetchKey();
  }, [open]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatTaxId = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4").replace(/-$/, "");
    }
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5").replace(/-$/, "");
  };

  const handleCheckout = async () => {
    if (!selectedPlan || !publicKey) {
      toast.error("Erro na configuração. Tente novamente.");
      return;
    }

    const cardDigits = form.cardNumber.replace(/\D/g, "");
    if (cardDigits.length < 13 || !form.holderName || !form.cvv || !form.expMonth || !form.expYear || !form.taxId) {
      toast.error("Preencha todos os campos do cartão.");
      return;
    }

    setProcessing(true);

    try {
      // Encrypt card using PagBank SDK
      if (!window.PagSeguro) {
        toast.error("SDK de pagamento não carregou. Recarregue a página.");
        setProcessing(false);
        return;
      }

      let yearValue = form.expYear.replace(/\D/g, "");
      if (yearValue.length === 2) {
        yearValue = `20${yearValue}`;
      }
      if (yearValue.length !== 4 || parseInt(yearValue) < 1900 || parseInt(yearValue) > 2099) {
        toast.error("Ano de validade inválido. Use 4 dígitos (ex: 2030).");
        setProcessing(false);
        return;
      }

      const card = window.PagSeguro.encryptCard({
        publicKey,
        holder: form.holderName,
        number: cardDigits,
        expMonth: form.expMonth.padStart(2, "0"),
        expYear: yearValue,
        securityCode: form.cvv,
      });

      if (card.hasErrors) {
        const errorMessages = card.errors.map((e) => e.message).join(", ");
        toast.error(`Erro no cartão: ${errorMessages}`);
        setProcessing(false);
        return;
      }

      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error("Sessão expirada. Faça login novamente.");
        setProcessing(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/pagbank-checkout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: selectedPlan.id,
            billing_cycle: billingCycle === "yearly" ? "annual" : "monthly",
            encrypted_card: card.encryptedCard,
            security_code: form.cvv,
            holder_name: form.holderName,
            holder_tax_id: form.taxId.replace(/\D/g, ""),
            customer_name: form.holderName,
            customer_email: userEmail,
            customer_tax_id: form.taxId.replace(/\D/g, ""),
            customer_phone: form.phone.replace(/\D/g, ""),
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Erro no pagamento.");
        setProcessing(false);
        return;
      }

      onSuccess();
    } catch {
      toast.error("Erro inesperado no pagamento.");
    } finally {
      setProcessing(false);
    }
  };

  if (!selectedPlan) return null;

  const displayPrice = billingCycle === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout — {selectedPlan.name}</DialogTitle>
          <DialogDescription>Preencha os dados do cartão para ativar o plano</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Plano {selectedPlan.name} ({billingCycle === "monthly" ? "Mensal" : "Anual"})</span>
              <span className="font-medium">R${displayPrice}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>R${displayPrice}</span>
            </div>
          </div>

          {/* Card form */}
          <div className="space-y-3">
            <div>
              <Label>Nome no Cartão</Label>
              <Input
                placeholder="NOME COMO NO CARTÃO"
                className="mt-1 uppercase"
                value={form.holderName}
                onChange={(e) => updateField("holderName", e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <Label>Número do Cartão</Label>
              <Input
                placeholder="0000 0000 0000 0000"
                className="mt-1"
                value={form.cardNumber}
                onChange={(e) => updateField("cardNumber", formatCardNumber(e.target.value))}
                maxLength={23}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Mês</Label>
                <Input
                  placeholder="MM"
                  className="mt-1"
                  value={form.expMonth}
                  onChange={(e) => updateField("expMonth", e.target.value.replace(/\D/g, "").slice(0, 2))}
                  maxLength={2}
                />
              </div>
              <div>
                <Label>Ano</Label>
                <Input
                  placeholder="AAAA"
                  className="mt-1"
                  value={form.expYear}
                  onChange={(e) => updateField("expYear", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                />
              </div>
              <div>
                <Label>CVV</Label>
                <Input
                  placeholder="123"
                  className="mt-1"
                  type="password"
                  value={form.cvv}
                  onChange={(e) => updateField("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>

            <div>
              <Label>CPF/CNPJ</Label>
              <Input
                placeholder="000.000.000-00"
                className="mt-1"
                value={form.taxId}
                onChange={(e) => updateField("taxId", formatTaxId(e.target.value))}
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                placeholder="(11) 99999-9999"
                className="mt-1"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Pagamento processado com segurança pelo PagBank</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={handleCheckout} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar R${displayPrice}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
