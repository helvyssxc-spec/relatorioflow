import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CalendarClock, Play, Trash2, Lock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast as sonnerToast } from "sonner";
import { Link } from "react-router-dom";

const FREQ_LABELS: Record<string, string> = {
  daily: "Diário", weekly: "Semanal", monthly: "Mensal", manual: "Manual",
};

const REPORT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`;

const Schedules = () => {
  const { user } = useAuth();
  const { data: profile } = useOrgProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const limits = usePlanLimits();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newTemplateId, setNewTemplateId] = useState("");
  const [newFrequency, setNewFrequency] = useState("weekly");
  const [newRecipients, setNewRecipients] = useState("");
  const [newActive, setNewActive] = useState(true);

  const orgId = profile?.org_id;

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["schedules", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("schedules").select("*, report_templates(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["templates-for-schedule", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("report_templates").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const recipients = newRecipients.split(",").map((e) => e.trim()).filter(Boolean).map((email) => ({ email }));
      const { error } = await supabase.from("schedules").insert({
        name: newName, template_id: newTemplateId, frequency: newFrequency,
        recipients, is_active: newActive, org_id: orgId!, created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({ title: "Agendamento criado!" }); resetForm();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("schedules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({ title: "Agendamento excluído." }); setDeleteId(null);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleExecuteNow = async (schedule: any) => {
    setExecutingId(schedule.id);
    try {
      const templateName = (schedule as any).report_templates?.name || "Relatório";

      // get user JWT session token (PUBLISHABLE_KEY would cause 401)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");

      const resp = await fetch(REPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ notes: `Gerar relatório automático para o template "${templateName}" (agendamento: ${schedule.name})`, action: "generate", userName: profile?.full_name }),
      });
      if (!resp.ok) throw new Error("Erro ao gerar relatório");

      // generate-report streams raw text (not SSE) — read chunks directly
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";
      const SENTINEL = "__RF_USAGE__:";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          // strip sentinel line (token usage metadata) from content
          const sentinelIdx = text.indexOf(SENTINEL);
          full += sentinelIdx !== -1 ? text.slice(0, text.lastIndexOf("\n", sentinelIdx)) : text;
        }
      }

      // Save execution record
      await supabase.from("report_executions").insert({
        org_id: orgId!, template_id: schedule.template_id,
        schedule_id: schedule.id, executed_by: user!.id,
        status: "completed", completed_at: new Date().toISOString(),
      });

      // Save generated report
      if (full.trim()) {
        await supabase.from("generated_reports" as any).insert({
          org_id: orgId!, user_id: user!.id,
          input_text: `Execução automática: ${schedule.name}`,
          report_content: full, client_name: templateName,
        } as any);
      }

      // Update last_run_at
      await supabase.from("schedules").update({ last_run_at: new Date().toISOString() }).eq("id", schedule.id);

      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["generated-reports"] });
      sonnerToast.success("Relatório executado com sucesso!");
    } catch (err: any) {
      sonnerToast.error("Erro ao executar: " + err.message);
      await supabase.from("report_executions").insert({
        org_id: orgId!, template_id: schedule.template_id,
        schedule_id: schedule.id, executed_by: user!.id,
        status: "failed", error_message: err.message,
      });
    } finally {
      setExecutingId(null);
    }
  };

  const resetForm = () => {
    setShowCreate(false); setNewName(""); setNewTemplateId("");
    setNewFrequency("weekly"); setNewRecipients(""); setNewActive(true);
  };

  return (
    <AppLayout title="Agendamentos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Automatize a geração e envio dos seus relatórios.</p>
            {!limits.canUseSchedules && (
              <p className="text-xs text-destructive mt-1">
                <Lock className="inline h-3 w-3 mr-1" />Agendamentos disponíveis a partir do plano Básico.{" "}
                <Link to="/billing" className="underline">Fazer upgrade</Link>
              </p>
            )}
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2" disabled={!limits.canUseSchedules}>
            {!limits.canUseSchedules && <Lock className="h-4 w-4" />}
            <Plus className="h-4 w-4" /> Novo agendamento
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
        ) : schedules && schedules.length > 0 ? (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Template</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead className="hidden md:table-cell">Última execução</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => {
                  const templateName = (s as any).report_templates?.name || "—";
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{templateName}</TableCell>
                      <TableCell><Badge variant="outline">{FREQ_LABELS[s.frequency || "manual"]}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {s.last_run_at ? formatDistanceToNow(new Date(s.last_run_at), { addSuffix: true, locale: ptBR }) : "Nunca"}
                      </TableCell>
                      <TableCell>
                        <Switch checked={s.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: s.id, is_active: checked })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Executar agora"
                            onClick={() => handleExecuteNow(s)} disabled={executingId === s.id}>
                            {executingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-12 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center"><CalendarClock className="h-8 w-8 text-muted-foreground" /></div>
            <div>
              <p className="font-semibold text-foreground">Nenhum agendamento</p>
              <p className="text-sm text-muted-foreground mt-1">Automatize a geração de relatórios definindo horários e destinatários.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2" disabled={!limits.canUseSchedules}>
              <Plus className="h-4 w-4" /> Criar agendamento
            </Button>
          </Card>
        )}
      </div>

      <Sheet open={showCreate} onOpenChange={(o) => !o && resetForm()}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Novo agendamento</SheetTitle></SheetHeader>
          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label>Nome do agendamento</Label>
              <Input placeholder="Ex: Financeiro Mensal" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={newTemplateId} onValueChange={setNewTemplateId}>
                <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                <SelectContent>{templates?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={newFrequency} onValueChange={setNewFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destinatários (e-mails separados por vírgula)</Label>
              <Input placeholder="joao@empresa.com, maria@empresa.com" value={newRecipients} onChange={(e) => setNewRecipients(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={newActive} onCheckedChange={setNewActive} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!newName.trim() || !newTemplateId || createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar agendamento"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Schedules;
