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
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Upload, FileSpreadsheet, Table2, Trash2, Eye, Lock, FolderOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  csv_upload: { icon: Upload, label: "CSV / Excel", color: "bg-emerald-100 text-emerald-700" },
  google_sheets: { icon: FileSpreadsheet, label: "Google Sheets", color: "bg-blue-100 text-blue-700" },
  manual: { icon: Table2, label: "Entrada manual", color: "bg-purple-100 text-purple-700" },
};

const DataSources = () => {
  const { user } = useAuth();
  const { data: profile } = useOrgProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const limits = usePlanLimits();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("csv_upload");

  const orgId = profile?.org_id;

  const { data: sources, isLoading } = useQuery({
    queryKey: ["data-sources", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("data_sources").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("data_sources").insert({
        name: newName, type: newType, org_id: orgId!, created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-sources"] });
      queryClient.invalidateQueries({ queryKey: ["datasources-count"] });
      toast({ title: "Fonte criada com sucesso!" });
      setShowCreate(false); setNewName("");
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("data_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-sources"] });
      queryClient.invalidateQueries({ queryKey: ["datasources-count"] });
      toast({ title: "Fonte excluída." }); setDeleteId(null);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    if (!limits.canCreateDataSource) {
      toast({ title: "Limite atingido", description: `Seu plano permite até ${limits.plan.limits.dataSources} fonte(s) de dados. Faça upgrade.`, variant: "destructive" });
      return;
    }
    setNewName(""); setNewType("csv_upload"); setShowCreate(true);
  };

  return (
    <AppLayout title="Fontes de Dados">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Gerencie as fontes de dados dos seus relatórios.</p>
            <p className="text-xs text-muted-foreground mt-1">
              {limits.plan.limits.dataSources === -1
                ? `${limits.dataSourcesCount} fontes criadas (ilimitado)`
                : `${limits.dataSourcesCount}/${limits.plan.limits.dataSources} fontes usadas`}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2" disabled={!limits.canCreateDataSource}>
            {!limits.canCreateDataSource && <Lock className="h-4 w-4" />}
            <Plus className="h-4 w-4" /> Nova fonte
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : sources && sources.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((src) => {
              const meta = TYPE_META[src.type] || TYPE_META.csv_upload;
              const Icon = meta.icon;
              return (
                <Card key={src.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.color}`}><Icon className="h-5 w-5" /></div>
                      <div>
                        <p className="font-medium text-foreground">{src.name}</p>
                        <Badge variant="secondary" className={`text-xs mt-1 ${meta.color}`}>{meta.label}</Badge>
                      </div>
                    </div>
                    <Badge variant={src.status === "active" ? "default" : "secondary"} className="text-xs">
                      {src.status === "active" ? "Ativo" : src.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Criado {formatDistanceToNow(new Date(src.created_at), { addSuffix: true, locale: ptBR })}</p>
                    {src.last_sync_at && <p>Último sync: {formatDistanceToNow(new Date(src.last_sync_at), { addSuffix: true, locale: ptBR })}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1 flex-1"><Eye className="h-3.5 w-3.5" /> Ver dados</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(src.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center"><FolderOpen className="h-8 w-8 text-muted-foreground" /></div>
            <div>
              <p className="font-semibold text-foreground">Nenhuma fonte de dados</p>
              <p className="text-sm text-muted-foreground mt-1">Conecte seus dados para começar a gerar relatórios.</p>
            </div>
            <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Adicionar fonte</Button>
          </Card>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova fonte de dados</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Ex: Vendas Q1 2026" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv_upload">Upload CSV / Excel</SelectItem>
                  <SelectItem value="google_sheets">Google Sheets</SelectItem>
                  <SelectItem value="manual">Entrada manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!newName.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar fonte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fonte de dados?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default DataSources;
