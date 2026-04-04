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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, LayoutTemplate, Copy, Trash2, Pencil, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const CATEGORIES = [
  { value: "all",        label: "Todos" },
  { value: "técnico",    label: "Técnico" },
  { value: "obra",       label: "Obra" },
  { value: "inspeção",   label: "Inspeção" },
  { value: "comercial",  label: "Comercial" },
  { value: "reunião",    label: "Reunião" },
  { value: "manutenção", label: "Manutenção" },
  { value: "custom",     label: "Personalizado" },
];

const CAT_COLORS: Record<string, string> = {
  técnico:    "bg-blue-100 text-blue-700",
  obra:       "bg-orange-100 text-orange-700",
  inspeção:   "bg-green-100 text-green-700",
  comercial:  "bg-cyan-100 text-cyan-700",
  reunião:    "bg-purple-100 text-purple-700",
  manutenção: "bg-red-100 text-red-700",
  custom:     "bg-gray-100 text-gray-700",
};

const Templates = () => {
  const { user } = useAuth();
  const { data: profile } = useOrgProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const limits = usePlanLimits();

  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("custom");

  const orgId = profile?.org_id;

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("report_templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = templates?.filter((t) => filter === "all" || t.category === filter);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("report_templates").insert({
        name: newName, description: newDesc || null, category: newCategory,
        org_id: orgId!, created_by: user!.id, blocks: [], brand_config: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["templates-count"] });
      toast({ title: "Template criado!" });
      setShowCreate(false); setNewName(""); setNewDesc("");
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingTemplate) return;
      const { error } = await supabase.from("report_templates").update({
        name: newName, description: newDesc || null, category: newCategory,
      }).eq("id", editingTemplate.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Template atualizado!" });
      setEditingTemplate(null); setNewName(""); setNewDesc("");
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const orig = templates?.find((t) => t.id === templateId);
      if (!orig) throw new Error("Template não encontrado");
      const { error } = await supabase.from("report_templates").insert({
        name: `${orig.name} (cópia)`, description: orig.description, category: orig.category,
        org_id: orgId!, created_by: user!.id, blocks: orig.blocks, brand_config: orig.brand_config,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["templates-count"] });
      toast({ title: "Template duplicado!" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("report_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["templates-count"] });
      toast({ title: "Template excluído." });
      setDeleteId(null);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    if (!limits.canCreateTemplate) {
      toast({ title: "Limite atingido", description: `Seu plano permite até ${limits.plan.limits.templates} templates. Faça upgrade para criar mais.`, variant: "destructive" });
      return;
    }
    setNewName(""); setNewDesc(""); setNewCategory("técnico");
    setEditingTemplate(null);
    setShowCreate(true);
  };

  const openEdit = (t: any) => {
    setNewName(t.name); setNewDesc(t.description || ""); setNewCategory(t.category || "técnico");
    setEditingTemplate(t);
    setShowCreate(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <AppLayout title="Templates">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground">Modelos de relatório prontos para usar e personalizar.</p>
            <p className="text-xs text-muted-foreground mt-1">
              {limits.plan.limits.templates === -1
                ? `${limits.templatesCount} templates criados (ilimitado)`
                : `${limits.templatesCount}/${limits.plan.limits.templates} templates usados`}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0" disabled={!limits.canCreateTemplate}>
            {!limits.canCreateTemplate && <Lock className="h-4 w-4" />}
            <Plus className="h-4 w-4" /> Criar template
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button key={cat.value} variant={filter === cat.value ? "default" : "outline"} size="sm" onClick={() => setFilter(cat.value)}>
              {cat.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <Card key={t.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary" className={`text-xs ${CAT_COLORS[t.category || "custom"] || CAT_COLORS.custom}`}>
                      {t.category || "custom"}
                    </Badge>
                    {t.is_public && <Badge variant="outline" className="text-xs">Público</Badge>}
                  </div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    Criado {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="gap-1 flex-1" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => duplicateMutation.mutate(t.id)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{filter !== "all" ? "Nenhum template nesta categoria" : "Nenhum template criado"}</p>
              <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro modelo de relatório profissional.</p>
            </div>
            <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Criar template</Button>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar template" : "Novo template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Ex: Relatório Financeiro Mensal" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea placeholder="Descreva o propósito deste template..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="técnico">Técnico</SelectItem>
                  <SelectItem value="obra">Obra</SelectItem>
                  <SelectItem value="inspeção">Inspeção</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="reunião">Reunião</SelectItem>
                  <SelectItem value="manutenção">Manutenção</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!newName.trim() || createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingTemplate ? "Salvar alterações" : "Criar template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
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

export default Templates;
