import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  FileText, Sparkles, Copy, Download, Wand2, Clock, Loader2, Check,
  Upload, X, Lock, FileSpreadsheet, FileType, Plus, Trash2,
  MapPin, Calendar, User, Briefcase, CloudSun, Users, Wrench, Mail,
  AlertTriangle, Package, Image as ImageIcon, Hash, ChevronDown,
  ArrowRight, PartyPopper
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { RetentionWarningBanner } from "@/components/RetentionWarningBanner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { buildTemplate } from "@/lib/pdfTemplates";
import { exportAsWord } from "@/lib/exportWord";
import { exportAsExcel as exportExcelStructured } from "@/lib/exportExcel";
import { QuotaModal } from "@/components/billing/QuotaModal";
import { useOfflineDrafts } from "@/hooks/use-offline-drafts";

const REPORT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`;

/* ── TIPOS DE RELATÓRIO ── */
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

const OBRA_TYPES = ["diario_de_obra", "vistoria", "laudo_tecnico", "inspecao", "manutencao"];
const COMMERCIAL_TYPES = ["proposta_comercial", "orcamento"];

const WEATHER_OPTIONS = [
  "Ensolarado", "Parcialmente nublado", "Nublado", "Chuvoso",
  "Garoa", "Tempestade", "Vento forte", "Neblina",
];

const ACCESS_OPTIONS = [
  "Livre", "Restrito — chave necessária", "Restrito — acompanhamento",
  "Obstruído", "Parcialmente obstruído",
];

/* ── HELPERS DE EXPORT (Word/Excel agora em módulos separados) ── */

/* ── STREAM DA IA ── */
const USAGE_SENTINEL = "__RF_USAGE__:";

async function streamReport(
  payload: Record<string, any>,
  onDelta: (t: string) => void,
  onDone: (tokens: { i: number; o: number }) => void
) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const resp = await fetch(REPORT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro do servidor (${resp.status}) ao gerar relatório.`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("Não foi possível ler a resposta do servidor.");

  const dec = new TextDecoder();
  let buffer = "";
  let tokens = { i: 0, o: 0 };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value);
    buffer += chunk;

    // Check if sentinel arrived (may span multiple chunks)
    const sentinelIdx = buffer.indexOf(USAGE_SENTINEL);
    if (sentinelIdx !== -1) {
      // Emit only the text before the sentinel
      const textPart = buffer.slice(0, sentinelIdx);
      if (textPart) onDelta(textPart);
      try {
        tokens = JSON.parse(buffer.slice(sentinelIdx + USAGE_SENTINEL.length));
      } catch { /* ignore parse error */ }
      buffer = "";
    } else {
      // Safe to emit everything except the last potential partial sentinel
      const safe = buffer.length > USAGE_SENTINEL.length
        ? buffer.slice(0, buffer.length - USAGE_SENTINEL.length)
        : "";
      if (safe) {
        onDelta(safe);
        buffer = buffer.slice(safe.length);
      }
    }
  }
  // Flush any remaining buffer (no sentinel found)
  if (buffer) onDelta(buffer);

  onDone(tokens);
}

/* ── COLLAPSIBLE SECTION (memoized, outside component) ── */
const CollapsibleSection = memo(({
  name, icon: Icon, iconColor, title, right, hasFilled,
  openSections, onToggle, children,
}: {
  name: string;
  icon: any;
  iconColor: string;
  title: string;
  right?: React.ReactNode;
  hasFilled?: boolean;
  openSections: string[];
  onToggle: (name: string) => void;
  children: React.ReactNode;
}) => (
  <Collapsible
    open={openSections.includes(name)}
    onOpenChange={() => onToggle(name)}
  >
    <CollapsibleTrigger className="w-full">
      <div className="flex items-center justify-between px-4 py-3.5
        rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white mb-4
        cursor-pointer hover:scale-[1.005] active:scale-[0.995] transition-all duration-300
        shadow-lg shadow-slate-950/20 group border border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors shrink-0", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight uppercase truncate">
             {title}
          </span>
          {hasFilled && (
            <div className="hidden sm:flex gap-1 items-center ml-1 shrink-0">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
               <span className="text-[10px] text-emerald-400/80 font-bold uppercase">Preenchido</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {right && <span className="hidden sm:block text-[10px] font-bold opacity-60 uppercase tracking-widest">{right}</span>}
          <div className="bg-white/10 p-1.5 rounded-full group-hover:bg-white/20 transition-all">
            <ChevronDown className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              openSections.includes(name) && "rotate-180"
            )} />
          </div>
        </div>
      </div>
    </CollapsibleTrigger>
    <CollapsibleContent className="px-1">{children}</CollapsibleContent>
  </Collapsible>
));
CollapsibleSection.displayName = "CollapsibleSection";

/* ══════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useOrgProfile();
  const queryClient = useQueryClient();
  const limits = usePlanLimits();
  const orgId = profile?.org_id;
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  /* ── OFFLINE DRAFTS (IndexedDB) ── */
  const { loadDraft, persistDraft, clearDraft, isSaving, lastSaved } = useOfflineDrafts("main-report-draft");

  /* ── ESTADO GERAL ── */
  const [report, setReport] = useState("");
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── SEÇÃO 1: IDENTIFICAÇÃO ── */
  const [reportType, setReportType]     = useState("relatorio_tecnico");
  const [reportNumber, setReportNumber] = useState("");
  const [reportDate, setReportDate]     = useState(new Date().toISOString().slice(0, 10));
  const [reportLocation, setReportLocation] = useState("");

  /* ── SEÇÃO 2: CLIENTE E RESPONSÁVEL ── */
  const [clientName, setClientName]         = useState("");
  const [clientCompany, setClientCompany]   = useState("");
  const [clientContact, setClientContact]   = useState("");
  const [responsibleName, setResponsibleName] = useState(profile?.full_name || "");
  const [responsibleRole, setResponsibleRole] = useState("");

  /* ── SEÇÃO 3: CONDIÇÕES NO LOCAL ── */
  const [weatherCondition, setWeatherCondition] = useState("");
  const [accessCondition, setAccessCondition]   = useState("");
  const [siteCondition, setSiteCondition]       = useState("");
  const showObraFields = OBRA_TYPES.includes(reportType);
  const isCommercial = COMMERCIAL_TYPES.includes(reportType);

  /* ── SEÇÃO 4: EQUIPE ── */
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; role: string; hours: string }>>([]);

  const addTeamMember = () => {
    if (limits.maxTeamMembers !== -1 && teamMembers.length >= limits.maxTeamMembers) {
      toast.error(`Máximo de ${limits.maxTeamMembers} profissionais no seu plano.`);
      return;
    }
    setTeamMembers(prev => [...prev, { name: "", role: "", hours: "" }]);
  };

  const updateTeamMember = useCallback((i: number, field: string, val: string) => {
    setTeamMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  }, []);

  const removeTeamMember = (i: number) => setTeamMembers(prev => prev.filter((_, idx) => idx !== i));

  /* ── SEÇÃO 5: ATIVIDADES ── */
  const [notes, setNotes] = useState("");

  /* ── SEÇÃO 6: OCORRÊNCIAS ── */
  const [occurrences, setOccurrences] = useState("");

  /* ── SEÇÃO 7: MATERIAIS E EQUIPAMENTOS ── */
  const [materials, setMaterials] = useState<Array<{ item: string; qty: string; unit: string; price: string }>>([]);

  const addMaterial = () => {
    if (limits.maxMaterials !== -1 && materials.length >= limits.maxMaterials) {
      toast.error(`Máximo de ${limits.maxMaterials} itens no seu plano.`);
      return;
    }
    setMaterials(prev => [...prev, { item: "", qty: "1", unit: "un", price: "" }]);
  };

  const updateMaterial = useCallback((i: number, field: string, val: string) => {
    setMaterials(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  }, []);

  const removeMaterial = (i: number) => setMaterials(prev => prev.filter((_, idx) => idx !== i));

  /* ── SEÇÃO: CONDIÇÕES COMERCIAIS ── */
  const [paymentTerms, setPaymentTerms] = useState("A definir entre as partes");
  const [proposalValidity, setProposalValidity] = useState("30");
  const [executionDays, setExecutionDays] = useState("");
  const [bdiPercent, setBdiPercent] = useState("");

  /* ── SEÇÃO 8: FOTOS ── */
  const [reportImages, setReportImages] = useState<Array<{ url: string; name: string; caption: string }>>([]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    try {
      setIsUploading(true);
      const newImages = [...reportImages];
      const { compressImage, getMaxImagePx } = await import("@/lib/imageUtils");

      for (const file of files) {
        const currentCount = newImages.length;
        const maxAllowed = limits?.maxImages || 1;
        
        if (currentCount >= maxAllowed) {
          toast.error(`Limite de ${maxAllowed} fotos atingido no plano ${limits?.plan?.name || "atual"}.`, {
            description: "Faça um upgrade para adicionar mais fotos.",
            action: {
              label: "Ver Planos",
              onClick: () => setIsQuotaModalOpen(true)
            }
          });
          break;
        }

        const compressed = await compressImage(file, getMaxImagePx(profile?.role || 'member'), 0.82);
        const fileName = `${crypto.randomUUID()}.jpg`;
        const filePath = `${orgId || 'anon'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("report-images")
          .upload(filePath, compressed);

        if (uploadError) {
          if (uploadError.message.includes("not found")) {
            toast.error("Erro: Pasta de armazenamento 'report-images' não encontrada.");
          } else {
            toast.error(`Falha no upload: ${uploadError.message}`);
          }
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("report-images")
          .getPublicUrl(filePath);

        newImages.push({
          url: publicUrl,
          name: file.name,
          caption: "",
        });
      }

      setReportImages(newImages);
      toast.success(`${files.length} foto(s) adicionada(s) com sucesso.`);
    } catch (error: any) {
      toast.error("Erro ao processar imagens.");
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const updateCaption = (i: number, val: string) =>
    setReportImages(prev => prev.map((img, idx) => idx === i ? { ...img, caption: val } : img));

  const removeImage = (i: number) => setReportImages(prev => prev.filter((_, idx) => idx !== i));

  /* ── LOGO (Business) ── */
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl]         = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!limits.canUseLogo) { toast.error("Logo disponível no plano Business."); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!orgId) {
      toast.error("Organização não carregada. Aguarde um momento.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo deve ter no máximo 2MB."); return; }
    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/logo-${Date.now()}.${ext}`;
      
      // Tentar primeiro org-assets, depois logos
      let uploadRes = await supabase.storage.from("org-assets").upload(path, file, { upsert: true });
      let currentBucket = "org-assets";

      if (uploadRes.error && uploadRes.error.message.includes("not found")) {
        console.log("org-assets not found, trying logos bucket...");
        uploadRes = await supabase.storage.from("logos").upload(path, file, { upsert: true });
        currentBucket = "logos";
      }

      if (uploadRes.error) {
        if (uploadRes.error.message.includes("not found")) {
          throw new Error("❌ Nenhum bucket de armazenamento encontrado ('org-assets' ou 'logos'). Por favor, crie-os no seu painel Supabase (Storage).");
        }
        throw uploadRes.error;
      }

      const { data: urlData } = supabase.storage.from(currentBucket).getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      toast.success(`Logo carregada com sucesso! (Salva em: ${currentBucket})`);
    } catch (err: any) {
      console.error("Erro no upload da logo:", err);
      toast.error(err.message.includes("❌") ? err.message : "Erro ao enviar logo: " + err.message, {
        duration: 8000,
        description: "Certifique-se de que os buckets existam no seu painel do Supabase."
      });
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  /* ── COLLAPSIBLE SECTIONS ── */
  const [openSections, setOpenSections] = useState<string[]>([
    "equipe", "ocorrencias", "materiais", "fotos", "condicoes", "condicoes_comerciais"
  ]);
  const toggleSection = useCallback((name: string) =>
    setOpenSections(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]), []);

  /* ── Reset commercial fields when type changes ── */
  useEffect(() => {
    setPaymentTerms("A definir entre as partes");
    setProposalValidity("30");
    setExecutionDays("");
    setBdiPercent("");
  }, [reportType]);

  /* ── AUTOSAVE: salvar rascunho com debounce ── */
  useEffect(() => {
    const checkSetup = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error && error.code === '42P01') {
        toast.error("⚠️ Tabelas do banco de dados não encontradas. Por favor, execute o script SQL 'init_database.sql' no seu painel Supabase.", {
          duration: 10000,
          position: "top-center"
        });
      }
    };
    checkSetup();
  }, [user]);

  /* ── AUTOSAVE: salvar rascunho com debounce (IndexedDB) ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = {
        reportType, reportNumber, reportDate, reportLocation,
        clientName, clientCompany, clientContact, responsibleName, responsibleRole,
        weatherCondition, accessCondition, siteCondition,
        teamMembers, materials, notes, occurrences,
        reportImages, logoUrl
      };
      persistDraft(draft);
    }, 1000);
    return () => clearTimeout(timer);
  }, [reportType, reportNumber, reportDate, reportLocation,
      clientName, clientCompany, clientContact, responsibleName, responsibleRole,
      weatherCondition, accessCondition, siteCondition,
      teamMembers, materials, notes, occurrences,
      reportImages, logoUrl, persistDraft]);

  /* ── AUTOSAVE: restaurar rascunho ao montar ── */
  useEffect(() => {
    const restore = async () => {
      try {
        const d = await loadDraft();
        if (!d) {
          // Fallback to old localStorage if exists (migration)
          const oldSaved = localStorage.getItem("rf-draft");
          if (oldSaved) {
            const oldD = JSON.parse(oldSaved);
            if (oldD.reportType) setReportType(oldD.reportType);
            if (oldD.notes) setNotes(oldD.notes);
            if (oldD.clientName) setClientName(oldD.clientName);
            if (oldD.clientCompany) setClientCompany(oldD.clientCompany);
            if (oldD.reportDate) setReportDate(oldD.reportDate);
            if (oldD.reportLocation) setReportLocation(oldD.reportLocation);
            if (oldD.responsibleName) setResponsibleName(oldD.responsibleName);
            if (oldD.responsibleRole) setResponsibleRole(oldD.responsibleRole);
            localStorage.removeItem("rf-draft");
            toast.info("Rascunho recuperado do armazenamento antigo.");
          }
          return;
        }

        const hasRealData =
          (d.notes && d.notes.trim().length > 0) ||
          (d.clientName && d.clientName.trim().length > 0) ||
          (d.reportLocation && d.reportLocation.trim().length > 0) ||
          (d.reportImages && d.reportImages.length > 0);

        if (!hasRealData) return;

        if (d.reportType) setReportType(d.reportType);
        if (d.notes) setNotes(d.notes);
        if (d.clientName) setClientName(d.clientName);
        if (d.clientCompany) setClientCompany(d.clientCompany);
        if (d.clientContact) setClientContact(d.clientContact);
        if (d.reportDate) setReportDate(d.reportDate);
        if (d.reportLocation) setReportLocation(d.reportLocation);
        if (d.responsibleName) setResponsibleName(d.responsibleName);
        if (d.responsibleRole) setResponsibleRole(d.responsibleRole);
        if (d.reportNumber) setReportNumber(d.reportNumber);
        if (d.occurrences) setOccurrences(d.occurrences);
        if (d.weatherCondition) setWeatherCondition(d.weatherCondition);
        if (d.accessCondition) setAccessCondition(d.accessCondition);
        if (d.siteCondition) setSiteCondition(d.siteCondition);
        if (d.teamMembers) setTeamMembers(d.teamMembers);
        if (d.materials) setMaterials(d.materials);
        if (d.reportImages) setReportImages(d.reportImages);
        if (d.logoUrl) { setLogoUrl(d.logoUrl); setLogoPreview(d.logoUrl); }
        
        toast.info("Rascunho offline restaurado.", { duration: 2500 });
      } catch (err) {
        console.error("Error restoring draft:", err);
      }
    };
    restore();
  }, [loadDraft]);

  /* ── QUERY DE HISTÓRICO ── */
  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ["generated-reports", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("generated_reports" as any)
        .select("id, client_name, client_company, client_contact, report_type, created_at, logo_url, input_text, report_content, report_date, report_location, report_number, responsible_name, responsible_role, weather_condition, access_condition, site_condition, occurrences, team_members, materials")
        .eq("org_id", orgId!).order("created_at", { ascending: false }).limit(5);
      return (data as any[]) || [];
    },
  });

  const { data: signatureConfig } = useQuery({
    queryKey: ["sig-config", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("organizations")
        .select("brand_config, primary_color, logo_url").eq("id", orgId!).single();
      return ((data as any)?.brand_config as any)?.signature || null;
    },
  });

  /* ── GERAR ── */
  const handleGenerate = async () => {
    if (!notes.trim()) { toast.error("Descreva as atividades realizadas."); return; }
    if (!limits.canGenerateReport) {
      setIsQuotaModalOpen(true);
      return;
    }
    setIsGenerating(true); setReport("");
    let full = "";
    try {
      await streamReport({
        notes: notes.trim(),
        action: "generate",
        orgId: orgId || undefined,
        userName: profile?.full_name || undefined,
        clientName: clientName.trim() || undefined,
        clientCompany: clientCompany.trim() || undefined,
        responsibleName: responsibleName.trim() || undefined,
        responsibleRole: responsibleRole.trim() || undefined,
        reportDate,
        reportLocation: reportLocation.trim() || undefined,
        reportType,
        reportNumber: reportNumber.trim() || undefined,
        weatherCondition: weatherCondition || undefined,
        accessCondition: accessCondition || undefined,
        siteCondition: siteCondition.trim() || undefined,
        teamMembers: teamMembers.filter(m => m.name.trim()),
        occurrences: occurrences.trim() || undefined,
        materials: materials.filter(m => m.item.trim()),
        imagesCount: reportImages.length,
        paymentTerms: isCommercial ? paymentTerms : undefined,
        proposalValidity: isCommercial ? proposalValidity : undefined,
        executionDays: isCommercial ? executionDays : undefined,
        bdiPercent: isCommercial && reportType === "orcamento" ? bdiPercent : undefined,
      }, (chunk) => { full += chunk; setReport(full); }, async (tokens) => {
        if (orgId && user?.id) {
          try {
            const { error: insertError } = await supabase.from("generated_reports" as any).insert({
              org_id: orgId, user_id: user.id,
              input_text: notes.trim(),
              report_content: full,
              client_name: clientName.trim() || null,
              client_company: clientCompany.trim() || null,
              client_contact: clientContact.trim() || null,
              logo_url: logoUrl,
              report_type: reportType,
              report_number: reportNumber.trim() || null,
              report_date: reportDate || null,
              report_location: reportLocation.trim() || null,
              responsible_name: responsibleName.trim() || null,
              responsible_role: responsibleRole.trim() || null,
              weather_condition: weatherCondition || null,
              access_condition: accessCondition || null,
              site_condition: siteCondition.trim() || null,
              team_members: teamMembers.filter(m => m.name.trim()),
              occurrences: occurrences.trim() || null,
              materials: materials.filter(m => m.item.trim()),
              images: reportImages.map(img => ({ url: img.url, name: img.name, caption: img.caption })),
              tokens_input: tokens.i || 0,
              tokens_output: tokens.o || 0,
            } as any);
            if (insertError) {
              console.error("Erro ao salvar relatório:", insertError);
              toast.error(`Relatório gerado, mas não foi salvo: ${insertError.message}`);
            } else {
              refetchHistory();
              queryClient.invalidateQueries({ queryKey: ["reports-count-month"] });
              queryClient.invalidateQueries({ queryKey: ["generated-reports-list"] });
            }
          } catch (saveErr: any) {
            console.error("Erro inesperado ao salvar relatório:", saveErr);
            toast.error("Relatório gerado, mas houve um erro ao salvar no banco.");
          }
        }
      });

      clearDraft();
      toast.success("Relatório gerado com sucesso! 🎉");
      window.umami?.track("relatorio_gerado", { tipo: reportType });

      setTimeout(() => {
        document.getElementById("report-output")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (e: any) { toast.error(e.message); }
    finally { setIsGenerating(false); }
  };

  const handleImprove = async () => {
    if (!limits.canImproveText) { toast.error("Melhorar texto disponível no plano Pro."); return; }
    if (!report.trim()) return;
    setIsGenerating(true); let full = "";
    try {
      await streamReport({ notes: report, action: "improve" },
        (c) => { full += c; setReport(full); }, () => { /* improve doesn't save to DB */ });
      toast.success("Texto melhorado!");
    } catch (e: any) { toast.error(e.message); }
    finally { setIsGenerating(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true); toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── BUILD EXPORT PARAMS ── */
  const buildExportParams = async () => {
    const { data: orgData } = await supabase.from("organizations")
      .select("name, primary_color, brand_config, logo_url").eq("id", orgId!).single();
    const brandConfig = ((orgData as any)?.brand_config as any) || {};
    const signature   = brandConfig?.signature || {};
    const primary     = orgData?.primary_color || "#1A56DB";
    const orgName     = orgData?.name || "Empresa";
    const finalLogo   = orgData?.logo_url || logoUrl;
    const isPro       = limits.canUsePDFProfessional;
    const isBiz       = limits.canUseWhiteLabel;
    const showSig     = signature?.enabled === true && limits.canUseSignatureText && !!(signature?.signer_name?.trim() || signature?.signer_role?.trim());

    const contact = brandConfig?.contact || {};
    const orgRegNum  = contact.regNum  || "";

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, professional_role" as any)
      .eq("id", user!.id)
      .single();

    const typeLabel   = REPORT_TYPES.find(t => t.value === reportType)?.label || "Relatório";
    const dateLabel   = reportDate
      ? new Date(reportDate + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })
      : new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" });
    const yearLabel   = reportDate ? new Date(reportDate + "T12:00:00").getFullYear() : new Date().getFullYear();
    const authorName  = responsibleName || (profileData as any)?.full_name || profile?.full_name || "—";
    const authorRole  = responsibleRole || (
      (profileData as any)?.professional_role
        ? `${(profileData as any).professional_role}${orgRegNum ? ` · ${orgRegNum}` : ""}`
        : orgRegNum || ""
    );

    const wm = limits.canUseWatermark && brandConfig?.watermark?.enabled
      ? `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-38deg);
           font-size:88px;font-weight:900;color:${primary};opacity:0.055;pointer-events:none;
           z-index:0;white-space:nowrap;font-family:Arial,sans-serif;letter-spacing:4px;">
           ${brandConfig.watermark.text || orgName}</div>`
      : "";

    const commercialItems = materials.filter(m => m.item.trim()).map(m => ({
      ...m,
      total: (() => {
        const qty = parseFloat(m.qty) || 0;
        const price = parseFloat(m.price || "0") || 0;
        return qty * price;
      })(),
    }));

    return {
      report, reportType, reportNumber, reportDate, reportLocation,
      clientName, clientCompany, responsibleName, responsibleRole,
      notes, occurrences, weatherCondition, accessCondition, siteCondition,
      teamMembers, materials, reportImages,
      orgName, primary, finalLogo, isPro, isBiz,
      dateLabel, yearLabel, typeLabel, authorName, authorRole,
      showSig, signature, limits, wm,
      commercialItems,
      paymentTerms,
      proposalValidity,
      executionDays,
      bdiPercent,
    };
  };

  /* ── EXPORT PDF ── */
  const handleExportPDF = async () => {
    const params = await buildExportParams();
    const fullHtml = buildTemplate(params);
    const win = window.open("", "_blank");
    if (!win) { toast.error("Permita pop-ups para exportar o PDF."); return; }
    win.document.write(fullHtml);
    win.document.close();
    window.umami?.track("pdf_exportado", { tipo: reportType });
  };

  /* ── LOAD DO HISTÓRICO ── */
  const loadHistory = (r: any) => {
    setReport(r.report_content || "");
    setNotes(r.input_text || "");
    setReportType(r.report_type || "relatorio_tecnico");
    setClientName(r.client_name || "");
    setClientCompany(r.client_company || "");
    setClientContact(r.client_contact || "");
    setReportDate(r.report_date || "");
    setReportLocation(r.report_location || "");
    setReportNumber(r.report_number || "");
    setResponsibleName(r.responsible_name || "");
    setResponsibleRole(r.responsible_role || "");
    setWeatherCondition(r.weather_condition || "");
    setAccessCondition(r.access_condition || "");
    setSiteCondition(r.site_condition || "");
    setOccurrences(r.occurrences || "");
    if (r.team_members?.length) setTeamMembers(r.team_members);
    if (r.materials?.length) setMaterials(
      r.materials.map((m: any) => ({ ...m, price: m.price || "" }))
    );
    if (r.logo_url) { setLogoUrl(r.logo_url); setLogoPreview(r.logo_url); }
    toast.success("Relatório carregado. Ajuste os dados e gere novamente.");
  };

  const usedPct = limits.plan.limits.reportsPerMonth === -1
    ? 0
    : Math.min(100, (limits.reportsThisMonth / limits.plan.limits.reportsPerMonth) * 100);

  /* ── HELPER: Section header component ── */
  const SectionHeader = ({ icon: Icon, iconColor, title, right }: {
    icon: any; iconColor: string; title: string; right?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between px-4 py-3.5
      rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white mb-6
      shadow-xl shadow-slate-950/30 border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-all duration-500" />
      <div className="flex items-center gap-3 relative z-10 min-w-0">
        <div className={cn("p-2 rounded-lg bg-white/5 shrink-0", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold tracking-tight uppercase truncate">{title}</span>
      </div>
      {right && <span className="hidden sm:block text-[10px] font-bold opacity-60 uppercase tracking-widest relative z-10 shrink-0 ml-2">{right}</span>}
    </div>
  );

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <AppLayout title="Novo Relatório" showUpgrade={false}>
      <div className="max-w-3xl mx-auto w-full space-y-6 pb-12">

        {/* Saudação */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Olá, {profile?.full_name?.split(" ")[0] || "usuário"} 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Preencha os campos abaixo e a IA transforma tudo em um relatório profissional.
          </p>
        </div>

        {/* Indicador de Rascunho Offline */}
        {(lastSaved || isSaving) && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit animate-in fade-in slide-in-from-top-2 duration-300">
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
            ) : (
              <Check className="h-3 w-3 text-emerald-500" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isSaving ? "Salvando rascunho..." : `Rascunho salvo offline às ${new Date(lastSaved!).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
        )}

        {/* Barra de uso */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Relatórios este mês</span>
                <Badge variant="outline" className="text-xs capitalize">{limits.plan.name}</Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {limits.reportsRemaining === null
                  ? `${limits.reportsThisMonth} gerados (ilimitado)`
                  : `${limits.reportsThisMonth} / ${limits.plan.limits.reportsPerMonth}`}
              </span>
            </div>
            {limits.reportsRemaining !== null && <Progress value={usedPct} className="h-2" />}
            {limits.reportsRemaining !== null && limits.reportsRemaining <= 1 && (
              <p className="text-xs text-destructive mt-1">
                {limits.reportsRemaining === 0 ? "Limite atingido! " : "Quase no limite! "}
                <Link to="/billing" className="underline font-medium">Fazer upgrade</Link>
              </p>
            )}
            {limits.plan.id !== "business" && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Seus relatórios são guardados por{" "}
                <span className="font-medium">{limits.plan.id === "pro" ? "6 meses" : "30 dias"}</span>
                {" "}no plano {limits.plan.name}.
                {limits.plan.id === "starter" && (
                  <Link to="/billing" className="text-primary underline ml-1">Ver planos →</Link>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alerta de retenção */}
        <RetentionWarningBanner />

        {/* ══════════ FORMULÁRIO PRINCIPAL ══════════ */}
        <Card>
          <CardContent className="pt-5 px-4 sm:px-6 space-y-8">

            {/* ── SEÇÃO 1: IDENTIFICAÇÃO (sempre aberta) ── */}
            <div>
              <SectionHeader
                icon={FileText}
                iconColor="text-blue-400"
                title="Identificação"
                right="Tipo · Número · Data · Local"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo de relatório</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Número do documento
                  </Label>
                  <Input placeholder="Ex: RF-2026-001"
                    value={reportNumber} onChange={e => setReportNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Data
                  </Label>
                  <Input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Local / Endereço
                  </Label>
                  <Input placeholder="Ex: Rua das Flores, 123 — São Paulo, SP"
                    value={reportLocation} onChange={e => setReportLocation(e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* ── SEÇÃO 2: CLIENTE E RESPONSÁVEL (sempre aberta) ── */}
            <div>
              <SectionHeader
                icon={User}
                iconColor="text-purple-400"
                title="Cliente e responsável"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nome do cliente</Label>
                  <Input placeholder="Ex: João da Silva"
                    value={clientName} onChange={e => setClientName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Empresa do cliente</Label>
                  <Input placeholder="Ex: Construtora XYZ Ltda"
                    value={clientCompany} onChange={e => setClientCompany(e.target.value)} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Contato do cliente
                  </Label>
                  <Input placeholder="Ex: joao@empresa.com ou (11) 99999-9999"
                    value={clientContact} onChange={e => setClientContact(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Responsável técnico
                  </Label>
                  <Input placeholder="Nome do responsável"
                    value={responsibleName} onChange={e => setResponsibleName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cargo / função</Label>
                  <Input placeholder="Ex: Engenheiro Civil, CREA 12345"
                    value={responsibleRole} onChange={e => setResponsibleRole(e.target.value)} />
                </div>
              </div>
            </div>

            {/* ── SEÇÃO 3: CONDIÇÕES (colapsável) ── */}
            {showObraFields && (
              <>
                <Separator />
                <CollapsibleSection
                  name="condicoes"
                  icon={CloudSun}
                  iconColor="text-amber-400"
                  title="Condições no local"
                  right="Clima · Acesso · Situação"
                  hasFilled={!!(weatherCondition || accessCondition || siteCondition)}
                  openSections={openSections}
                  onToggle={toggleSection}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Condição climática</Label>
                      <Select value={weatherCondition} onValueChange={setWeatherCondition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar clima" />
                        </SelectTrigger>
                        <SelectContent>
                          {WEATHER_OPTIONS.map(w => (
                            <SelectItem key={w} value={w}>{w}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Condição de acesso</Label>
                      <Select value={accessCondition} onValueChange={setAccessCondition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar acesso" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESS_OPTIONS.map(a => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Situação encontrada no local</Label>
                      <Input placeholder="Ex: Local parcialmente organizado, andaime instalado..."
                        value={siteCondition} onChange={e => setSiteCondition(e.target.value)} />
                    </div>
                  </div>
                </CollapsibleSection>
              </>
            )}

            <Separator />

            {/* ── SEÇÃO 4: EQUIPE (colapsável) ── */}
            <CollapsibleSection
              name="equipe"
              icon={Users}
              iconColor="text-teal-400"
              title="Equipe / profissionais"
              right={`${teamMembers.length}/${limits.maxTeamMembers === -1 ? "∞" : limits.maxTeamMembers}`}
              hasFilled={teamMembers.length > 0}
              openSections={openSections}
              onToggle={toggleSection}
            >
              <div className="space-y-2">
                {teamMembers.map((m, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr] sm:grid-cols-[1fr_1fr_80px_36px] gap-2 items-center">
                    <Input placeholder="Nome" value={m.name}
                      onChange={e => updateTeamMember(i, "name", e.target.value)}
                      className="min-w-0 text-sm" />
                    <Input placeholder="Função / cargo" value={m.role}
                      onChange={e => updateTeamMember(i, "role", e.target.value)}
                      className="min-w-0 text-sm" />
                    <Input placeholder="Horas" value={m.hours} type="number" min="0" step="0.5"
                      onChange={e => updateTeamMember(i, "hours", e.target.value)}
                      className="min-w-0 text-sm" />
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive"
                      aria-label="Remover membro da equipe"
                      onClick={() => removeTeamMember(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-2 mt-1" onClick={addTeamMember}>
                  <Plus className="h-4 w-4" /> Adicionar profissional
                </Button>
              </div>
            </CollapsibleSection>

            <Separator />

            {/* ── SEÇÃO 5: ATIVIDADES (sempre aberta) ── */}
            <div>
              <SectionHeader
                icon={Wrench}
                iconColor="text-blue-300"
                title="Atividades realizadas"
                right="Campo principal — a IA expande aqui"
              />
              <Textarea
                placeholder={
                  reportType === "diario_de_obra"
                    ? "Ex: concretagem da laje do 2º pavimento concluída, armação das vigas do 3º pavimento 60% executada..."
                    : reportType === "vistoria"
                    ? "Ex: vistoriei o imóvel no período da manhã, telhado apresenta infiltração na calha norte..."
                    : reportType === "laudo_tecnico"
                    ? "Ex: analisei a estrutura do imóvel, constatei recalque diferencial na fundação leste..."
                    : isCommercial
                    ? "Ex: serviço de pintura externa do edifício, inclui lavagem, selador e duas demãos de tinta acrílica..."
                    : "Ex: realizei manutenção preventiva no sistema elétrico, substituí disjuntores do quadro principal..."
                }
                className="min-h-[160px] text-base resize-none"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* ── SEÇÃO 6: OCORRÊNCIAS (colapsável) ── */}
            <CollapsibleSection
              name="ocorrencias"
              icon={AlertTriangle}
              iconColor="text-orange-400"
              title="Ocorrências / não conformidades"
              right="Opcional"
              hasFilled={!!occurrences.trim()}
              openSections={openSections}
              onToggle={toggleSection}
            >
              <Textarea
                placeholder="Ex: atraso na entrega de material pelo fornecedor, chuva impediu serviços externos..."
                className="min-h-[80px] text-sm resize-none"
                value={occurrences}
                onChange={e => setOccurrences(e.target.value)}
                disabled={isGenerating}
              />
            </CollapsibleSection>

            <Separator />

            {/* ── SEÇÃO 7: MATERIAIS (colapsável) ── */}
            <CollapsibleSection
              name="materiais"
              icon={Package}
              iconColor="text-slate-300"
              title={isCommercial ? "Itens / Serviços" : "Materiais e equipamentos"}
              right={`${materials.length}/${limits.maxMaterials === -1 ? "∞" : limits.maxMaterials} itens`}
              hasFilled={materials.length > 0}
              openSections={openSections}
              onToggle={toggleSection}
            >
              <div className="space-y-2">
                {materials.map((m, i) => (
                  <div key={i} className="flex flex-wrap gap-2 items-center">
                    <Input
                      placeholder={isCommercial ? "Descrição do serviço / item" : "Descrição do item / equipamento"}
                      value={m.item}
                      onChange={e => updateMaterial(i, "item", e.target.value)}
                      className="flex-1 min-w-[130px] text-sm"
                    />
                    <Input
                      placeholder="Qtd"
                      value={m.qty}
                      onChange={e => updateMaterial(i, "qty", e.target.value)}
                      className="w-16 shrink-0 text-sm"
                    />
                    <Select value={m.unit} onValueChange={v => updateMaterial(i, "unit", v)}>
                      <SelectTrigger className="w-16 shrink-0 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["un","m","m²","m³","kg","L","cx","saco","rolo","par","h","dia","Vb","mês"].map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isCommercial && (
                      <div className="relative w-24 shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2
                          text-xs text-muted-foreground pointer-events-none">
                          R$
                        </span>
                        <Input
                          placeholder="0,00"
                          value={m.price}
                          type="number" min="0" step="0.01"
                          onChange={e => updateMaterial(i, "price", e.target.value)}
                          className="text-sm pl-7"
                        />
                      </div>
                    )}
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive"
                      aria-label="Remover item"
                      onClick={() => removeMaterial(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {isCommercial && materials.some(m => m.price) && (
                  <div className="flex justify-end mt-2 pt-2 border-t border-border">
                    <div className="text-sm font-bold text-foreground">
                      Total: R$ {
                        materials.reduce((acc, m) => {
                          const qty = parseFloat(m.qty) || 0;
                          const price = parseFloat(m.price) || 0;
                          return acc + qty * price;
                        }, 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })
                      }
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" className="gap-2 mt-1" onClick={addMaterial}>
                  <Plus className="h-4 w-4" />
                  {isCommercial ? "Adicionar item / serviço" : "Adicionar item"}
                </Button>
              </div>
            </CollapsibleSection>

            {/* ── SEÇÃO: CONDIÇÕES COMERCIAIS (só para proposta/orçamento) ── */}
            {isCommercial && (
              <>
                <Separator />
                <CollapsibleSection
                  name="condicoes_comerciais"
                  icon={FileText}
                  iconColor="text-emerald-400"
                  title="Condições comerciais"
                  hasFilled={!!(executionDays || paymentTerms !== "A definir entre as partes")}
                  openSections={openSections}
                  onToggle={toggleSection}
                >
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Validade da proposta (dias)
                        </label>
                        <Input
                          placeholder="Ex: 30"
                          value={proposalValidity}
                          type="number" min="1" max="365"
                          onChange={e => setProposalValidity(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Prazo de Execução/Fornecimento (dias úteis)
                        </label>
                        <Input
                          placeholder="Ex: 15"
                          value={executionDays}
                          type="number" min="1" max="3650"
                          onChange={e => setExecutionDays(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    {reportType === "orcamento" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          BDI (%)
                        </label>
                        <Input
                          placeholder="Ex: 25"
                          value={bdiPercent}
                          type="number" min="0" max="100" step="0.01"
                          onChange={e => setBdiPercent(e.target.value)}
                          className="text-sm w-32"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Forma de pagamento
                      </label>
                      <Input
                        placeholder="Ex: 50% na assinatura · 50% na entrega"
                        value={paymentTerms}
                        onChange={e => setPaymentTerms(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </CollapsibleSection>
              </>
            )}

            <Separator />

            {/* ── SEÇÃO 8: FOTOS (colapsável) ── */}
            <CollapsibleSection
              name="fotos"
              icon={ImageIcon}
              iconColor="text-emerald-400"
              title="Fotos do local / serviço"
              right={`${reportImages.length}/${limits.maxImages} · ${limits.plan.name}`}
              hasFilled={reportImages.length > 0}
              openSections={openSections}
              onToggle={toggleSection}
            >
              {reportImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {reportImages.map((img, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                      <img src={img.url} alt={`Foto ${i+1}`}
                        className="w-full h-36 object-cover" loading="lazy" />
                      <Button
                        variant="destructive" size="icon"
                        aria-label={`Remover foto ${i + 1}`}
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="p-2 bg-background">
                        <Input
                          placeholder={`Legenda da foto ${i+1} (opcional)`}
                          value={img.caption}
                          onChange={e => updateCaption(i, e.target.value)}
                          className="text-xs h-7"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {reportImages.length < limits.maxImages && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                  className="group flex flex-col items-center justify-center gap-2 w-full p-6 rounded-xl
                    border-2 border-dashed border-slate-200 hover:border-primary hover:bg-slate-50
                    transition-all cursor-pointer bg-slate-50/50">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                      <span className="text-sm font-medium text-slate-600">Enviando fotos...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-primary"/>
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-semibold text-slate-700">
                          Adicionar fotos
                        </span>
                        <span className="text-xs text-slate-500">
                          PNG, JPG ou JPEG (Máximo {limits.maxImages} fotos)
                        </span>
                      </div>
                    </>
                  )}
                </button>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" multiple
                className="hidden" onChange={handleImageSelect} />
            </CollapsibleSection>

            {/* ── LOGO (Business) ── */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                Logo da empresa no relatório
                {!limits.canUseLogo && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Lock className="h-3 w-3" /> Business
                  </Badge>
                )}
              </Label>
              {limits.canUseLogo ? (
                logoPreview ? (
                  <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                    <img src={logoPreview} alt="Logo" className="h-12 max-w-[120px] object-contain" />
                    {uploadingLogo && <span className="text-xs text-muted-foreground">Enviando...</span>}
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8"
                      onClick={() => { setLogoPreview(null); setLogoUrl(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-3 w-full p-3 rounded-lg border-2 border-dashed
                      border-border hover:border-primary/40 transition-colors bg-muted/20">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Upload da logo (PNG/JPG, até 2MB)
                    </span>
                  </button>
                )
              ) : (
                <div className="p-3 rounded-lg border-2 border-dashed bg-muted/10 text-center">
                  <p className="text-sm text-muted-foreground">
                    <Lock className="inline h-3 w-3 mr-1" />
                    Disponível no plano Business.{" "}
                    <Link to="/billing" className="text-primary underline">Fazer upgrade</Link>
                  </p>
                </div>
              )}
              <input ref={logoInputRef} type="file" accept="image/*"
                className="hidden" onChange={handleLogoSelect} />
            </div>

            {/* ── BOTÃO GERAR ── */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !notes.trim() || !limits.canGenerateReport}
              className="w-full h-14 text-lg font-bold gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] border-0 rounded-xl">
              {isGenerating
                ? <><Loader2 className="h-6 w-6 animate-spin" /> Processando Inteligência Artificial...</>
                : <><Sparkles className="h-6 w-6 text-yellow-300" /> Gerar Relatório Profissional</>}
            </Button>

          </CardContent>
        </Card>

        {/* ══════════ RESULTADO ══════════ */}
        {report && (
          <Card id="report-output" className="animate-fade-in">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {!isGenerating && <PartyPopper className="h-5 w-5 text-primary" />}
                  {isGenerating && <FileText className="h-5 w-5 text-primary" />}
                  <span className="font-semibold">
                    {isGenerating ? "Gerando relatório..." : "✅ Relatório pronto!"}
                  </span>
                  {isGenerating && (
                    <Badge variant="secondary" className="gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Gerando...
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleExportPDF} className="gap-1 font-bold">
                    <Download className="h-4 w-4" /> Baixar PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                  {limits.canExportExcel && (
                    <Button variant="outline" size="sm"
                      onClick={async () => { const p = await buildExportParams(); exportExcelStructured(p); }}
                      className="gap-1">
                      <FileSpreadsheet className="h-4 w-4" /> Excel
                    </Button>
                  )}
                  {limits.canExportDOCX && (
                    <Button variant="outline" size="sm"
                      onClick={async () => { const p = await buildExportParams(); exportAsWord(p); }}
                      className="gap-1">
                      <FileType className="h-4 w-4" /> Word
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleImprove}
                    disabled={isGenerating || !limits.canImproveText} className="gap-1">
                    {!limits.canImproveText && <Lock className="h-3 w-3" />}
                    <Wand2 className="h-4 w-4" /> Melhorar
                  </Button>
                </div>
              </div>

              {limits.canUseSignatureText && !signatureConfig?.enabled && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <AlertTriangle className="h-3 w-3" />
                  Assinatura desativada. Ative em{" "}
                  <Link to="/settings?tab=assinatura" className="text-primary hover:underline">
                    Configurações → Assinatura
                  </Link>
                </p>
              )}
              {limits.canUseSignatureText && signatureConfig?.enabled && !signatureConfig?.signer_name && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                  <AlertTriangle className="h-3 w-3" />
                  Assinatura ativa mas sem nome — preencha em Configurações → Assinatura.
                </p>
              )}

              {limits.canUseSignatureText && signatureConfig?.enabled && (
                <div className="p-3 border rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                    Assinatura incluída no PDF
                  </p>
                  <div className="flex flex-col items-end gap-1 max-w-[200px] ml-auto">
                    {signatureConfig.image_url && limits.canUseSignatureImage && (
                      <img src={signatureConfig.image_url} alt="Assinatura"
                        className="max-h-10 object-contain" />
                    )}
                    <div className="w-full h-px bg-border" />
                    {signatureConfig.signer_name && (
                      <p className="text-xs font-semibold">{signatureConfig.signer_name}</p>
                    )}
                    {signatureConfig.signer_role && (
                      <p className="text-xs text-muted-foreground">{signatureConfig.signer_role}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-muted rounded-lg p-4 sm:p-5 whitespace-pre-wrap text-sm
                leading-relaxed text-foreground font-mono overflow-x-auto break-words">
                {report}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════ HISTÓRICO ══════════ */}
        {history !== undefined && history.length === 0 && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Recentes</span>
              </div>
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum relatório gerado ainda. Comece criando um novo relatório acima.
              </p>
            </CardContent>
          </Card>
        )}
        {history && history.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Recentes</span>
              </div>
              <div className="space-y-2">
                {history.map((r: any) => {
                  const typeLabel = REPORT_TYPES.find(t => t.value === r.report_type)?.label || "Relatório";
                  return (
                    <button key={r.id} onClick={() => loadHistory(r)}
                      className="flex items-center justify-between w-full py-2.5 px-3
                        rounded-lg hover:bg-muted/50 transition-colors text-left border-b
                        border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-xs">
                            {r.client_name || r.input_text?.slice(0, 45) || "Relatório"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("pt-BR")} · {typeLabel}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">Usar como base</Badge>
                    </button>
                  );
                })}
              </div>
              <Link to="/reports" className="flex items-center gap-1 text-sm text-primary mt-4 hover:underline justify-center">
                Ver todos os relatórios <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
      <QuotaModal 
        isOpen={isQuotaModalOpen} 
        onClose={() => setIsQuotaModalOpen(false)}
        planName={limits.plan.name}
        limit={limits.plan.limits.reportsPerMonth}
        usage={limits.reportsThisMonth}
      />
    </AppLayout>
  );
};

export default Dashboard;
