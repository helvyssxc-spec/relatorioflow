import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Copy, Download, Eye, Search, Check, Clock, FileSpreadsheet, FileType, Lock, Folder, FolderOpen, Plus, Trash2, MoreVertical, FolderInput, Crown, Info, ChevronDown, Calendar, MapPin, Hash, Users, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RetentionWarningBanner } from "@/components/RetentionWarningBanner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { buildTemplate, TemplateParams } from "@/lib/pdfTemplates";
import { exportAsExcel } from "@/lib/exportExcel";
import { exportAsWord } from "@/lib/exportWord";

const REPORT_TYPES = [
  { value: "relatorio_tecnico",  label: "Relatório Técnico"    },
  { value: "vistoria",           label: "Vistoria"             },
  { value: "laudo_tecnico",      label: "Laudo Técnico"        },
  { value: "diario_de_obra",     label: "Diário de Obra"       },
  { value: "proposta_comercial", label: "Proposta Comercial"   },
  { value: "orcamento",          label: "Orçamento"            },
  { value: "ata_reuniao",        label: "Ata de Reunião"       },
  { value: "parecer_tecnico",    label: "Parecer Técnico"      },
  { value: "inspecao",           label: "Inspeção"             },
  { value: "manutencao",         label: "Rel. de Manutenção"   },
  { value: "auditoria",          label: "Auditoria"            },
  { value: "outro",              label: "Outro"                },
];

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  relatorio_tecnico:  { bg: "bg-blue-50 dark:bg-blue-950/30",   text: "text-blue-700 dark:text-blue-400",   border: "border-blue-200 dark:border-blue-800" },
  vistoria:           { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
  laudo_tecnico:      { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  diario_de_obra:     { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
  proposta_comercial: { bg: "bg-cyan-50 dark:bg-cyan-950/30",   text: "text-cyan-700 dark:text-cyan-400",   border: "border-cyan-200 dark:border-cyan-800" },
  orcamento:          { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800" },
  manutencao:         { bg: "bg-red-50 dark:bg-red-950/30",     text: "text-red-700 dark:text-red-400",     border: "border-red-200 dark:border-red-800" },
};
const DEFAULT_COLOR = { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border" };

// Standardize export params creation to avoid dry violations
const buildExportParams = (report: any, orgData: any, limits: any): TemplateParams => {
  const brandConfig = (orgData?.brand_config as any) || {};
  const primaryColor = orgData?.primary_color || "#1A56DB";
  const orgName = orgData?.name || "Empresa";
  const logoUrl = orgData?.logo_url || report.logo_url;
  const signature = brandConfig?.signature || {};

  const typeLabel = REPORT_TYPES.find(t => t.value === report.report_type)?.label || "Relatório";
  const dateFormatted = report.report_date
    ? new Date(report.report_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : new Date(report.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  
  const yearLabel = report.report_date 
    ? new Date(report.report_date + "T12:00:00").getFullYear()
    : new Date(report.created_at).getFullYear();

  return {
    report: report.report_content || "",
    reportType: report.report_type,
    reportNumber: report.report_number || "",
    reportDate: report.report_date || report.created_at,
    reportLocation: report.report_location || "",
    clientName: report.client_name || "",
    clientCompany: report.client_company || "",
    responsibleName: report.responsible_name || "",
    responsibleRole: report.responsible_role || "",
    notes: report.report_content || "",
    occurrences: report.occurrences || "",
    weatherCondition: report.weather_condition || "",
    accessCondition: report.access_condition || "",
    siteCondition: report.site_condition || "",
    teamMembers: report.team_members || [],
    materials: report.materials || [],
    reportImages: (report.images || []).map((img: any) => ({
      url: img.url,
      name: img.caption || "Imagem",
      caption: img.caption || ""
    })),
    orgName: orgName,
    primary: primaryColor,
    finalLogo: logoUrl!,
    isPro: limits.plan.id === "pro" || limits.plan.id === "business",
    isBiz: limits.plan.id === "business",
    dateLabel: dateFormatted,
    yearLabel: yearLabel,
    typeLabel: typeLabel,
    authorName: report.responsible_name || "",
    authorRole: report.responsible_role || "",
    showSig: signature?.enabled && !!(signature?.signer_name || signature?.image_url),
    signature: signature,
    limits: limits.plan.limits,
    wm: limits.canUseWatermark && brandConfig?.watermark?.enabled
      ? `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:72px;font-weight:900;color:${primaryColor};opacity:0.06;pointer-events:none;z-index:0;white-space:nowrap;font-family:Arial,sans-serif;">${brandConfig.watermark.text || orgName}</div>`
      : ""
  };
};

const Reports = () => {
  const { data: profile, isLoading: isProfileLoading } = useOrgProfile();
  const orgId = profile?.org_id;
  const limits = usePlanLimits();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [viewReport, setViewReport] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [moveReportId, setMoveReportId] = useState<string | null>(null);
  const [moveToFolderId, setMoveToFolderId] = useState<string>("none");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);

  const { data: reports, isLoading: isReportsLoading, isPlaceholderData } = useQuery({
    queryKey: ["generated-reports-list", orgId, limit],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_reports" as any)
        .select("id, org_id, client_name, client_company, report_type, report_number, report_date, report_location, responsible_name, responsible_role, weather_condition, access_condition, site_condition, logo_url, images, team_members, materials, folder_id, created_at, occurrences")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const { data: folders } = useQuery({
    queryKey: ["folders", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("report_folders" as any)
        .select("*").eq("org_id", orgId!).order("name");
      return (data as any[]) || [];
    },
  });

  // Lazy load full report content for modal
  const { data: fullReport } = useQuery({
    queryKey: ["report-full", viewReport?.id],
    enabled: !!viewReport?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("generated_reports" as any)
        .select("report_content, input_text")
        .eq("id", viewReport!.id)
        .single();
      return data as any;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("generated_reports" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-reports-list"] });
      toast.success("Relatório excluído com sucesso.");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao excluir relatório."),
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      if (!newFolderName.trim()) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("report_folders" as any).insert({
        org_id: orgId!, name: newFolderName.trim(), created_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setNewFolderName(""); setShowCreateFolder(false);
      toast.success("Pasta criada!");
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: unlinkErr } = await supabase
        .from("generated_reports" as any)
        .update({ folder_id: null } as any)
        .eq("folder_id", id);
      if (unlinkErr) throw unlinkErr;
      const { error } = await supabase
        .from("report_folders" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["generated-reports-list"] });
      if (selectedFolder === deleteFolderId) setSelectedFolder(null);
      setDeleteFolderId(null);
      toast.success("Pasta excluída com sucesso.");
    },
    onError: () => toast.error("Erro ao excluir pasta."),
  });

  const moveReportMutation = useMutation({
    mutationFn: async ({ reportId, folderId }: { reportId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from("generated_reports" as any)
        .update({ folder_id: folderId } as any)
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-reports-list"] });
      setMoveReportId(null);
      setMoveToFolderId("none");
      toast.success("Relatório movido com sucesso!");
    },
    onError: () => toast.error("Erro ao mover relatório."),
  });

  const isLoading = isProfileLoading || isReportsLoading;

  const filtered = reports?.filter((r: any) => {
    const matchFolder = selectedFolder === null || r.folder_id === selectedFolder;
    const matchType = !typeFilter || r.report_type === typeFilter;
    if (!matchFolder || !matchType) return false;
    if (!debouncedSearch.trim()) return true;
    const q = debouncedSearch.toLowerCase();
    return r.client_name?.toLowerCase().includes(q) || r.report_location?.toLowerCase().includes(q) || r.report_number?.toLowerCase().includes(q);
  });

  // Group by month
  const grouped = (filtered || []).reduce((acc: Record<string, any[]>, r: any) => {
    const key = new Date(r.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true); toast.success("Relatório copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async (report: any) => {
    const { data: orgData } = await supabase.from("organizations").select("*").eq("id", orgId!).single();
    
    // Ensure report_content is loaded
    if (!report.report_content) {
      const { data: full } = await supabase.from("generated_reports" as any).select("report_content").eq("id", report.id).single();
      report.report_content = (full as any)?.report_content || "";
    }

    const params = buildExportParams(report, orgData, limits);
    const fullHtml = buildTemplate(params);
    
    // Audit log — fire and forget, never block the download
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      supabase.from("audit_logs" as any).insert({
        org_id: orgId,
        user_id: currentUser?.id ?? null,
        action: "report.pdf_downloaded",
        metadata: {
          report_id: report.id,
          report_type: report.report_type,
          client_name: report.client_name || null,
          report_number: report.report_number || null,
        },
      }).then(({ error }) => { if (error) console.warn("audit_log insert failed:", error.message); });
    });

    const win = window.open("", "_blank");
    if (!win) { toast.error("Permita pop-ups."); return; }
    win.document.write(fullHtml);
    win.document.close();
  };

  const handleExportExcel = async (report: any) => {
    const { data: orgData } = await supabase.from("organizations").select("*").eq("id", orgId!).single();
    if (!report.report_content) {
      const { data: full } = await supabase.from("generated_reports" as any).select("report_content").eq("id", report.id).single();
      report.report_content = (full as any)?.report_content || "";
    }
    const params = buildExportParams(report, orgData, limits);
    exportAsExcel(params);
  };

  const handleExportWord = async (report: any) => {
    const { data: orgData } = await supabase.from("organizations").select("*").eq("id", orgId!).single();
    if (!report.report_content) {
      const { data: full } = await supabase.from("generated_reports" as any).select("report_content").eq("id", report.id).single();
      report.report_content = (full as any)?.report_content || "";
    }
    const params = buildExportParams(report, orgData, limits);
    exportAsWord(params);
  };

  return (
    <AppLayout title="Histórico de Relatórios">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico de Relatórios</h1>
          <p className="text-muted-foreground mt-1">Todos os relatórios gerados pela sua equipe</p>
        </div>

        {/* Alerta de retenção */}
        <RetentionWarningBanner onExportPDF={(id) => {
          const report = reports?.find((r: any) => r.id === id);
          if (report) handleExportPDF(report);
        }} />

        {/* Plan retention info */}
        {limits.plan.id !== "business" && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">Plano {limits.plan.name}:</span>{" "}
                relatórios guardados por{" "}
                <span className="font-medium">{limits.plan.id === "pro" ? "6 meses" : "30 dias"}</span>.
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Link to="/billing"><Crown className="h-3 w-3" /> Fazer upgrade</Link>
            </Button>
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, local, número..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter(null)}
            className={cn("text-xs px-3 py-1 rounded-full border transition-all",
              !typeFilter ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
          >
            Todos
          </button>
          {REPORT_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(typeFilter === t.value ? null : t.value)}
              className={cn("text-xs px-3 py-1 rounded-full border transition-all",
                typeFilter === t.value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Painel de pastas */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedFolder === null ? "default" : "outline"}
            size="sm" onClick={() => setSelectedFolder(null)} className="gap-2">
            <FolderOpen className="h-4 w-4" /> Todos
          </Button>
          {folders?.map((f: any) => (
            <div key={f.id} className="flex items-center gap-0">
              <Button
                variant={selectedFolder === f.id ? "default" : "outline"}
                size="sm" onClick={() => setSelectedFolder(f.id)} className="gap-2 rounded-r-none">
                <Folder className="h-4 w-4" /> {f.name}
              </Button>
              <Button
                variant={selectedFolder === f.id ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 rounded-l-none border-l-0"
                onClick={() => setDeleteFolderId(f.id)}
                title="Excluir pasta"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="gap-2"
            onClick={() => setShowCreateFolder(true)}>
            <Plus className="h-4 w-4" /> Nova pasta
          </Button>
        </div>

        {showCreateFolder && (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
            <Input placeholder="Nome da pasta" value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") createFolderMutation.mutate(); }}
              className="flex-1" autoFocus />
            <Button size="sm" onClick={() => createFolderMutation.mutate()}
              disabled={createFolderMutation.isPending || !newFolderName.trim()}>
              Criar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreateFolder(false)}>
              Cancelar
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden border-muted/60 bg-card/60">
                <div className="flex">
                  <div className="w-1 shrink-0 bg-muted/50" />
                  <CardContent className="p-4 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-5 w-1/3 rounded" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-24 rounded-full" />
                          <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                        <div className="flex gap-3">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([month, items]) => (
              <div key={month}>
                <p className="text-sm font-semibold text-muted-foreground mb-3 capitalize">
                  {month} <span className="font-normal">· {(items as any[]).length} relatório{(items as any[]).length > 1 ? "s" : ""}</span>
                </p>
                <div className="space-y-3">
                  {(items as any[]).map((r: any) => {
                    const typeLabel = REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type || "Relatório";
                    const currentFolder = folders?.find((f: any) => f.id === r.folder_id);
                    const colors = TYPE_COLORS[r.report_type] || DEFAULT_COLOR;
                    const images = (r.images as any[]) || [];
                    const team = (r.team_members as any[]) || [];
                    return (
                      <Card key={r.id} className="hover:shadow-md transition-shadow overflow-hidden group">
                        <div className="flex">
                          <div className={`w-1 shrink-0 ${colors.text.replace("text-", "bg-").replace("dark:text-", "dark:bg-")}`} />
                          <CardContent className="p-4 flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground truncate">{r.client_name || "Relatório sem cliente"}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <Badge variant="secondary" className={`text-xs ${colors.bg} ${colors.text} ${colors.border} border`}>
                                    {typeLabel}
                                  </Badge>
                                  {r.report_date && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(r.report_date + "T12:00:00").toLocaleDateString("pt-BR")}
                                    </span>
                                  )}
                                  {r.report_location && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {r.report_location.length > 30 ? r.report_location.slice(0, 30) + "..." : r.report_location}
                                    </span>
                                  )}
                                  {currentFolder && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Folder className="h-3 w-3" /> {currentFolder.name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  {r.report_number && (
                                    <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {r.report_number}</span>
                                  )}
                                  {images.length > 0 && (
                                    <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> {images.length}</span>
                                  )}
                                  {team.filter((m: any) => m.name).length > 0 && (
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {team.filter((m: any) => m.name).length}</span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(r.created_at).toLocaleDateString("pt-BR")} às{" "}
                                    {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setViewReport(r)}>
                                    <Eye className="h-4 w-4 mr-2" /> Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => {
                                    const { data } = await supabase.from("generated_reports" as any).select("report_content").eq("id", r.id).single();
                                    if (data) handleCopy((data as any).report_content);
                                  }}>
                                    <Copy className="h-4 w-4 mr-2" /> Copiar texto
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleExportPDF(r)}>
                                    <Download className="h-4 w-4 mr-2" /> Baixar PDF
                                  </DropdownMenuItem>
                                  {limits.canExportExcel && (
                                    <DropdownMenuItem onClick={() => handleExportExcel(r)}>
                                      <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                                    </DropdownMenuItem>
                                  )}
                                  {limits.canExportDOCX && (
                                    <DropdownMenuItem onClick={() => handleExportWord(r)}>
                                      <FileType className="h-4 w-4 mr-2" /> DOCX
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setMoveReportId(r.id); setMoveToFolderId(r.folder_id || "none"); }}>
                                    <FolderInput className="h-4 w-4 mr-2" /> Mover para pasta
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(r.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load more */}
            {reports && reports.length >= limit && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => setLimit(prev => prev + 20)} className="gap-2">
                  <ChevronDown className="h-4 w-4" /> Carregar mais relatórios
                </Button>
              </div>
            )}
          </div>
        ) : reports !== undefined ? (
          <Card className="p-16 flex flex-col items-center text-center space-y-6 border-dashed border-2 bg-gradient-to-b from-card to-muted/20">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{debouncedSearch || typeFilter ? "Nenhum resultado encontrado" : "Ainda não há relatórios aqui"}</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                {debouncedSearch || typeFilter ? "Tente remover os filtros ou buscar com outras palavras." : "Quando você gerar laudos, vistorias e diários de obra, eles ficarão salvos nesta lista com segurança."}
              </p>
            </div>
            {(!debouncedSearch && !typeFilter) && (
              <Button asChild size="lg" className="rounded-xl shadow-lg shadow-primary/20">
                <Link to="/dashboard">Criar relatório em 30s</Link>
              </Button>
            )}
            {limits.plan.id !== "business" && !debouncedSearch && !typeFilter && (
              <p className="text-xs text-muted-foreground">
                <Info className="inline h-3 w-3 mr-1" />
                Plano {limits.plan.name}: relatórios guardados por {limits.plan.id === "pro" ? "6 meses" : "30 dias"}.{" "}
                <Link to="/billing" className="text-primary underline">Fazer upgrade</Link>
              </p>
            )}
          </Card>
        ) : null}

        <p className="text-xs text-muted-foreground">{filtered?.length ?? 0} relatório{(filtered?.length ?? 0) !== 1 ? "s" : ""}</p>
      </div>

      {/* View report dialog - structured */}
      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> {viewReport?.client_name || "Relatório"}
            </DialogTitle>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-4">
              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-muted/30">
                {viewReport.report_type && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tipo</p>
                    <p className="text-sm font-medium">{REPORT_TYPES.find(t => t.value === viewReport.report_type)?.label || viewReport.report_type}</p>
                  </div>
                )}
                {viewReport.report_date && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Data</p>
                    <p className="text-sm">{new Date(viewReport.report_date + "T12:00:00").toLocaleDateString("pt-BR", { dateStyle: "long" })}</p>
                  </div>
                )}
                {viewReport.report_location && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Local</p>
                    <p className="text-sm">{viewReport.report_location}</p>
                  </div>
                )}
                {viewReport.responsible_name && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Responsável</p>
                    <p className="text-sm">{viewReport.responsible_name}{viewReport.responsible_role && ` · ${viewReport.responsible_role}`}</p>
                  </div>
                )}
                {viewReport.report_number && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Nº documento</p>
                    <p className="text-sm">{viewReport.report_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Gerado em</p>
                  <p className="text-sm">{new Date(viewReport.created_at).toLocaleDateString("pt-BR", { dateStyle: "long" })}</p>
                </div>
              </div>

              {/* Photos thumbnails */}
              {(viewReport.images as any[])?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Fotos ({(viewReport.images as any[]).length})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(viewReport.images as any[]).map((img: any, i: number) => (
                      <div key={i} className="rounded-lg overflow-hidden border">
                        <img src={img.url} alt={`Foto ${i + 1}`} className="w-full h-20 object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logo */}
              {viewReport.logo_url && (
                <div className="flex justify-center py-2">
                  <img src={viewReport.logo_url} alt="Logo" className="h-14 max-w-[160px] object-contain" loading="lazy" />
                </div>
              )}

              {/* Report content */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Conteúdo</p>
                <div className="bg-muted rounded-lg p-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {fullReport?.report_content || "Carregando..."}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => handleExportPDF(viewReport)} className="gap-1 font-bold">
                  <Download className="h-4 w-4" /> Baixar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => fullReport?.report_content && handleCopy(fullReport.report_content)} className="gap-1">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copiado" : "Copiar"}
                </Button>
                {limits.canExportExcel && (
                  <Button variant="outline" size="sm" onClick={() => handleExportExcel(viewReport)} className="gap-1">
                    <FileSpreadsheet className="h-4 w-4" /> Excel
                  </Button>
                )}
                {limits.canExportDOCX && (
                  <Button variant="outline" size="sm" onClick={() => handleExportWord(viewReport)} className="gap-1">
                    <FileType className="h-4 w-4" /> DOCX
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete report dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir relatório?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O relatório será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete folder dialog */}
      <AlertDialog open={!!deleteFolderId} onOpenChange={() => setDeleteFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pasta?</AlertDialogTitle>
            <AlertDialogDescription>
              A pasta será excluída. Os relatórios dentro dela não serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteFolderId && deleteFolderMutation.mutate(deleteFolderId)}
              disabled={deleteFolderMutation.isPending}>
              {deleteFolderMutation.isPending ? "Excluindo..." : "Sim, excluir pasta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move report to folder dialog */}
      <Dialog open={!!moveReportId} onOpenChange={() => { setMoveReportId(null); setMoveToFolderId("none"); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderInput className="h-5 w-5" /> Mover para pasta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={moveToFolderId} onValueChange={setMoveToFolderId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma pasta" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem pasta</SelectItem>
                {folders?.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setMoveReportId(null); setMoveToFolderId("none"); }}>Cancelar</Button>
              <Button
                onClick={() => { if (moveReportId) moveReportMutation.mutate({ reportId: moveReportId, folderId: moveToFolderId === "none" ? null : moveToFolderId }); }}
                disabled={moveReportMutation.isPending}>
                {moveReportMutation.isPending ? "Movendo..." : "Mover"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Reports;
