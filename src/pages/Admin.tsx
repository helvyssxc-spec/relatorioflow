import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Users2, TrendingUp, CreditCard, FileText, Building2, ShieldCheck, FlaskConical, Check, X, LifeBuoy, Send, BarChart2 } from "lucide-react";
import MonitoringTab from "@/components/admin/MonitoringTab";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PLANS_LIST } from "@/config/plans";
import { usePlanSimulation } from "@/hooks/usePlanSimulation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allOrgs = [] } = useQuery({
    queryKey: ["admin-orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const { data: allReports = [] } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("generated_reports").select("id, org_id, created_at").order("created_at", { ascending: false }).limit(1000);
      return data || [];
    },
  });

  const { data: allPaymentEvents = [] } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_events").select("*").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  // Support tab data
  const { data: allTickets = [] } = useQuery({
    queryKey: ["admin-all-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets" as any)
        .select("*, profiles(full_name, email)")
        .order("updated_at", { ascending: false })
        .limit(200);
      return (data as any[]) || [];
    },
  });

  const [adminOpenTicket, setAdminOpenTicket] = useState<any>(null);
  const [adminReply, setAdminReply] = useState("");

  const { data: adminMessages = [] } = useQuery({
    queryKey: ["admin-ticket-messages", adminOpenTicket?.id],
    enabled: !!adminOpenTicket?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_messages" as any)
        .select("*")
        .eq("ticket_id", adminOpenTicket.id)
        .order("created_at", { ascending: true });
      return (data as any[]) || [];
    },
    refetchInterval: 10000,
  });

  const handleAdminReply = async () => {
    if (!adminReply.trim() || !adminOpenTicket || !user) return;
    await supabase.from("support_messages" as any).insert({
      ticket_id: adminOpenTicket.id,
      sender_id: user.id,
      sender_role: "admin",
      content: adminReply.trim(),
    } as any);
    if (adminOpenTicket.status === "aberto") {
      await supabase.from("support_tickets" as any)
        .update({ status: "em_andamento" } as any).eq("id", adminOpenTicket.id);
      setAdminOpenTicket((t: any) => ({ ...t, status: "em_andamento" }));
    }
    queryClient.invalidateQueries({ queryKey: ["admin-ticket-messages", adminOpenTicket.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-all-tickets"] });
    setAdminReply("");
    toast.success("Resposta enviada!");
  };

  const updateTicketStatus = async (status: string) => {
    if (!adminOpenTicket) return;
    await supabase.from("support_tickets" as any)
      .update({
        status,
        ...(status === "resolvido" ? { resolved_at: new Date().toISOString() } : {}),
      } as any)
      .eq("id", adminOpenTicket.id);
    setAdminOpenTicket((t: any) => ({ ...t, status }));
    queryClient.invalidateQueries({ queryKey: ["admin-all-tickets"] });
    toast.success("Status atualizado!");
  };

  const activeSubscriptions = allSubscriptions.filter((s) => s.status === "active");
  const totalRevenue = activeSubscriptions.reduce((sum, s) => sum + Number(s.amount), 0);
  const planCounts = allOrgs.reduce((acc, org) => {
    const plan = org.plan || "starter";
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleChangePlan = async (orgId: string, newPlan: string) => {
    const { error } = await supabase.from("organizations").update({ plan: newPlan, plan_status: "active" }).eq("id", orgId);
    if (error) toast.error("Erro ao alterar plano");
    else { toast.success(`Plano alterado para ${newPlan}`); queryClient.invalidateQueries({ queryKey: ["admin-orgs"] }); }
  };

  const handleCancelSubscription = async (subId: string, orgId: string) => {
    const { error: subError } = await supabase.from("subscriptions").update({ status: "canceled", canceled_at: new Date().toISOString() }).eq("id", subId);
    if (!subError) {
      await supabase.from("organizations").update({ plan: "starter", plan_status: "active" }).eq("id", orgId);
      toast.success("Assinatura cancelada");
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orgs"] });
    } else toast.error("Erro ao cancelar assinatura");
  };

  const getOrgName = (orgId: string) => allOrgs.find((o) => o.id === orgId)?.name || orgId.slice(0, 8);

  const statusColors: Record<string, string> = {
    aberto: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    em_andamento: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
    resolvido: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    fechado: "bg-muted text-muted-foreground",
  };

  return (
    <AppLayout title="Admin">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground text-sm">Visão completa da plataforma RelatórioFlow</p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{allOrgs.length}</p><p className="text-xs text-muted-foreground">Organizações</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users2 className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{allProfiles.length}</p><p className="text-xs text-muted-foreground">Usuários</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CreditCard className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue)}</p><p className="text-xs text-muted-foreground">Receita Ativa/mês</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{allReports.length}</p><p className="text-xs text-muted-foreground">Relatórios Gerados</p></div></div></CardContent></Card>
        </div>

        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Distribuição de Planos</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {Object.entries(planCounts).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2"><Badge variant="secondary" className="capitalize">{plan}</Badge><span className="text-lg font-bold">{count}</span></div>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="orgs">
          <TabsList>
            <TabsTrigger value="orgs">Organizações</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="support" className="gap-1.5"><LifeBuoy className="h-3.5 w-3.5" /> Suporte</TabsTrigger>
            <TabsTrigger value="simulate" className="gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Simular Plano</TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-1.5"><BarChart2 className="h-3.5 w-3.5" /> Monitoramento</TabsTrigger>
          </TabsList>

          <TabsContent value="orgs" className="mt-4">
            <Card><CardContent className="pt-4 overflow-auto">
              <Table><TableHeader><TableRow><TableHead>Organização</TableHead><TableHead>Slug</TableHead><TableHead>Plano</TableHead><TableHead>Status</TableHead><TableHead>Criado em</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>{allOrgs.map((org) => (
                  <TableRow key={org.id}><TableCell className="font-medium">{org.name}</TableCell><TableCell className="text-muted-foreground text-xs">{org.slug}</TableCell><TableCell><Badge variant="secondary" className="capitalize">{org.plan}</Badge></TableCell><TableCell><Badge variant={org.plan_status === "active" ? "default" : "destructive"} className="capitalize">{org.plan_status}</Badge></TableCell><TableCell className="text-xs">{format(new Date(org.created_at), "dd/MM/yy", { locale: ptBR })}</TableCell><TableCell><Select value={org.plan} onValueChange={(val) => handleChangePlan(org.id, val)}><SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="starter">Starter</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="business">Business</SelectItem></SelectContent></Select></TableCell></TableRow>
                ))}</TableBody></Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card><CardContent className="pt-4 overflow-auto">
              <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Organização</TableHead><TableHead>Role</TableHead><TableHead>Onboarding</TableHead><TableHead>Criado em</TableHead></TableRow></TableHeader>
                <TableBody>{allProfiles.map((profile) => (
                  <TableRow key={profile.id}><TableCell className="font-medium">{profile.full_name || "—"}</TableCell><TableCell className="text-xs">{profile.email || "—"}</TableCell><TableCell className="text-xs">{getOrgName(profile.org_id || "")}</TableCell><TableCell><Badge variant="outline" className="capitalize">{profile.role}</Badge></TableCell><TableCell><Badge variant={profile.onboarding_completed ? "default" : "secondary"}>{profile.onboarding_completed ? "Sim" : "Não"}</Badge></TableCell><TableCell className="text-xs">{format(new Date(profile.created_at), "dd/MM/yy", { locale: ptBR })}</TableCell></TableRow>
                ))}</TableBody></Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            <Card><CardContent className="pt-4 overflow-auto">
              <Table><TableHeader><TableRow><TableHead>Organização</TableHead><TableHead>Plano</TableHead><TableHead>Valor</TableHead><TableHead>Ciclo</TableHead><TableHead>Status</TableHead><TableHead>Cartão</TableHead><TableHead>Próx. Cobrança</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>{allSubscriptions.map((sub) => (
                  <TableRow key={sub.id}><TableCell className="font-medium text-xs">{getOrgName(sub.org_id)}</TableCell><TableCell><Badge variant="secondary" className="capitalize">{sub.plan}</Badge></TableCell><TableCell>R${Number(sub.amount).toFixed(2)}</TableCell><TableCell className="text-xs capitalize">{sub.billing_cycle}</TableCell><TableCell><Badge variant={sub.status === "active" ? "default" : "destructive"} className="capitalize">{sub.status}</Badge></TableCell><TableCell className="text-xs capitalize">{(sub as any).card_brand && (sub as any).card_last_digits ? `${(sub as any).card_brand} ••${(sub as any).card_last_digits}` : "—"}</TableCell><TableCell className="text-xs">{sub.current_period_end ? format(new Date(sub.current_period_end), "dd/MM/yy", { locale: ptBR }) : "—"}</TableCell><TableCell>{sub.status === "active" && <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleCancelSubscription(sub.id, sub.org_id)}>Cancelar</Button>}</TableCell></TableRow>
                ))}{allSubscriptions.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhuma assinatura</TableCell></TableRow>}</TableBody></Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card><CardContent className="pt-4 overflow-auto">
              <Table><TableHeader><TableRow><TableHead>Organização</TableHead><TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead>Detalhes</TableHead></TableRow></TableHeader>
                <TableBody>{allPaymentEvents.map((evt) => (
                  <TableRow key={evt.id}><TableCell className="font-medium text-xs">{getOrgName(evt.org_id)}</TableCell><TableCell><Badge variant="outline">{evt.event_type}</Badge></TableCell><TableCell className="text-xs">{format(new Date(evt.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell><TableCell className="text-xs max-w-xs truncate">{JSON.stringify(evt.payload).slice(0, 100)}...</TableCell></TableRow>
                ))}{allPaymentEvents.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum evento</TableCell></TableRow>}</TableBody></Table>
            </CardContent></Card>
          </TabsContent>

          {/* Support tab */}
          <TabsContent value="support" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 min-h-[500px]">
              {/* Ticket list */}
              <div className="border rounded-lg overflow-hidden">
                <div className="p-3 border-b bg-muted/30">
                  <p className="text-sm font-semibold">Chamados ({allTickets.length})</p>
                </div>
                <ScrollArea className="h-[460px]">
                  {allTickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      onClick={() => setAdminOpenTicket(ticket)}
                      className={cn(
                        "p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                        adminOpenTicket?.id === ticket.id && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      <p className="text-sm font-medium truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.profiles?.full_name || ticket.profiles?.email || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">#{ticket.ticket_number}</span>
                        <Badge className={cn("text-[10px] px-1.5 py-0", statusColors[ticket.status] || "")}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {allTickets.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">Nenhum chamado</div>
                  )}
                </ScrollArea>
              </div>

              {/* Ticket conversation */}
              {adminOpenTicket ? (
                <div className="border rounded-lg flex flex-col">
                  {/* Header */}
                  <div className="p-3 border-b space-y-2">
                    <p className="font-semibold text-sm">{adminOpenTicket.subject}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">#{adminOpenTicket.ticket_number}</span>
                      <Badge className={cn("text-xs", statusColors[adminOpenTicket.status] || "")}>
                        {adminOpenTicket.status.replace("_", " ")}
                      </Badge>
                      <div className="flex gap-1 ml-auto">
                        {adminOpenTicket.status !== "em_andamento" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateTicketStatus("em_andamento")}>
                            Em andamento
                          </Button>
                        )}
                        {adminOpenTicket.status !== "resolvido" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateTicketStatus("resolvido")}>
                            Marcar resolvido
                          </Button>
                        )}
                        {adminOpenTicket.status !== "fechado" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateTicketStatus("fechado")}>
                            Fechar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {adminMessages.map((msg: any) => (
                        <div key={msg.id} className={cn("flex", msg.sender_role === "admin" ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[80%] rounded-lg px-3 py-2",
                            msg.sender_role === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted border")}>
                            {msg.sender_role === "user" && (
                              <p className="text-[10px] font-medium text-muted-foreground mb-1">Usuário</p>
                            )}
                            <p className="text-sm">{msg.content}</p>
                            <p className={cn("text-[10px] mt-1", msg.sender_role === "admin" ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
                              {new Date(msg.created_at).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Reply input */}
                  {!["resolvido", "fechado"].includes(adminOpenTicket.status) && (
                    <div className="p-3 border-t flex gap-2">
                      <Textarea
                        placeholder="Responder como admin..."
                        value={adminReply}
                        onChange={e => setAdminReply(e.target.value)}
                        className="min-h-[60px] max-h-[120px] resize-none flex-1"
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (adminReply.trim()) handleAdminReply();
                          }
                        }}
                      />
                      <Button size="icon" className="self-end" onClick={handleAdminReply} disabled={!adminReply.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  Selecione um chamado para responder
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="simulate" className="mt-4">
            <PlanSimulatorTab />
          </TabsContent>

          <TabsContent value="monitoring" className="mt-4">
            <MonitoringTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function PlanSimulatorTab() {
  const { simulatedPlan, setSimulatedPlan, isSimulating } = usePlanSimulation();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Simulador de Planos</CardTitle>
          <CardDescription>Ative a simulação para navegar pelo app como se estivesse em outro plano.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSimulating && (
            <div className="mb-4 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 flex items-center justify-between">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Simulando plano <strong className="uppercase">{simulatedPlan}</strong></span>
              <Button size="sm" variant="outline" onClick={() => setSimulatedPlan(null)} className="gap-1"><X className="h-3.5 w-3.5" /> Parar simulação</Button>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS_LIST.map((plan) => {
              const isActive = simulatedPlan === plan.id;
              const Icon = plan.icon;
              return (
                <Card key={plan.id} className={`relative p-5 space-y-3 transition-all ${isActive ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"}`}>
                  {isActive && <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">Ativo</Badge>}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
                    <div><p className="font-bold text-foreground">{plan.name}</p><p className="text-xs text-muted-foreground">{plan.price === 0 ? "Grátis" : `R$${plan.price}/mês`}</p></div>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <p className="font-medium text-muted-foreground">Limites:</p>
                    <p>Relatórios: {plan.limits.reportsPerMonth === -1 ? "∞" : plan.limits.reportsPerMonth}/mês</p>
                    <p>Templates: {plan.limits.templates === -1 ? "∞" : plan.limits.templates}</p>
                    <p>Fontes: {plan.limits.dataSources === -1 ? "∞" : plan.limits.dataSources}</p>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-muted-foreground">Features:</p>
                    {Object.entries(plan.features).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        {val ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3 text-muted-foreground/40" />}
                        <span className={val ? "text-foreground" : "text-muted-foreground/60"}>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="w-full" variant={isActive ? "destructive" : "default"} onClick={() => setSimulatedPlan(isActive ? null : plan.id)}>
                    {isActive ? "Parar simulação" : `Simular ${plan.name}`}
                  </Button>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
