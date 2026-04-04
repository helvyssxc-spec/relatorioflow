import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, Building2, Save, Lock, Upload, PenTool, Users, Trash2, Plus, Crown, Mail, Clock, CheckCircle2, XCircle, Copy, Key, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getPlanConfig } from "@/config/plans";

export default function Settings() {
  const { user } = useAuth();
  const profileQuery = useOrgProfile();
  const orgId = profileQuery.data?.org_id;
  const queryClient = useQueryClient();
  const limits = usePlanLimits();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [professionalRole, setProfessionalRole] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Signature state
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState("");
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureLoaded, setSignatureLoaded] = useState(false);

  // Team invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // API key state (Business only)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Company extra fields
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgRegNum, setOrgRegNum] = useState("");

  // Logo state
  const [_orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(null);
  const orgLogoInputRef = useRef<HTMLInputElement>(null);

  // Watermark state
  const [wmEnabled, setWmEnabled] = useState(false);
  const [wmText, setWmText] = useState("");

  // PDF branding (Pro+)
  const [pdfFont, setPdfFont] = useState("helvetica");
  const [pdfFooter, setPdfFooter] = useState("");

  useQuery({
    queryKey: ["profile-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      if (!profileLoaded) {
        setFullName(data.full_name || "");
        setProfessionalRole((data as any).professional_role || "");
        setProfileLoaded(true);
      }
      return data;
    },
    enabled: !!user,
  });

  // Org state
  const [orgName, setOrgName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1A56DB");
  const [orgLoaded, setOrgLoaded] = useState(false);

  const { data: org } = useQuery({
    queryKey: ["org-settings", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId!)
        .single();
      if (error) throw error;
      if (!orgLoaded) {
        setOrgName(data.name || "");
        setPrimaryColor(data.primary_color || "#1A56DB");
        setOrgLogoUrl(data.logo_url || null);
        setOrgLogoPreview(data.logo_url || null);
        const brandConfig = (data as any)?.brand_config || {};
        const contact = brandConfig?.contact || {};
        setTaxId(contact.taxId || "");
        setPhone(contact.phone || "");
        setOrgAddress(contact.address || "");
        setOrgRegNum(contact.regNum || "");
        setWmEnabled(brandConfig?.watermark?.enabled ?? false);
        setWmText(brandConfig?.watermark?.text ?? "");
        setPdfFont(brandConfig?.pdf?.font ?? "helvetica");
        setPdfFooter(brandConfig?.pdf?.footer ?? "");
        setOrgLoaded(true);
      }
      if (!signatureLoaded) {
        const brandConfig = (data as any)?.brand_config || {};
        const sig = brandConfig?.signature || {};
        setSignatureEnabled(sig.enabled ?? false);
        setSignerName(sig.signer_name ?? "");
        setSignerRole(sig.signer_role ?? "");
        setSignatureImageUrl(sig.image_url ?? null);
        setSignatureLoaded(true);
      }
      return data;
    },
    enabled: !!orgId,
  });

  // Team members query
  const { data: teamMembers } = useQuery({
    queryKey: ["team-members", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .eq("org_id", orgId!);
      if (error) throw error;
      return data || [];
    },
  });

  // Pending invitations query
  const { data: invitations } = useQuery({
    queryKey: ["team-invitations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations" as any)
        .select("*")
        .eq("org_id", orgId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const planConfig = getPlanConfig(org?.plan || "starter");
  const maxTeamMembers = planConfig.limits.maxTeamMembers;
  const currentTeamCount = (teamMembers?.length || 0) + (invitations?.length || 0);
  const canAddMore = maxTeamMembers === -1 || currentTeamCount < maxTeamMembers;

  // API Keys (Business only)
  const { data: apiKeys } = useQuery({
    queryKey: ["api-keys", orgId],
    enabled: !!orgId && limits.plan.id === "business",
    queryFn: async () => {
      const { data } = await supabase
        .from("api_keys" as any)
        .select("id, name, key_preview, last_used, created_at")
        .eq("org_id", orgId!)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const generateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const array = new Uint8Array(20);
      crypto.getRandomValues(array);
      const rawKey = "rf_" + Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      const { error } = await supabase.from("api_keys" as any).insert({
        org_id: orgId!, created_by: user!.id, name: "Chave principal",
        key_hash: keyHash, key_preview: rawKey.slice(0, 12),
      } as any);
      if (error) throw error;
      setNewKeyValue(rawKey);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Chave gerada! Copie antes de fechar.");
    } catch { toast.error("Erro ao gerar chave."); }
    finally { setGeneratingKey(false); }
  };

  const revokeApiKey = async (id: string) => {
    await supabase.from("api_keys" as any)
      .update({ is_active: false, revoked_at: new Date().toISOString() } as any)
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    toast.success("Chave revogada.");
  };

  // Bug 1 fix: save professional_role
  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, professional_role: professionalRole } as any)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar perfil."),
  });

  const updateOrg = useMutation({
    mutationFn: async () => {
      const currentBrand = (org as any)?.brand_config || {};
      const { error } = await supabase
        .from("organizations")
        .update({
          name: orgName,
          primary_color: primaryColor,
          brand_config: {
            ...currentBrand,
            contact: { taxId, phone, address: orgAddress, regNum: orgRegNum },
            watermark: { enabled: wmEnabled, text: wmText },
            pdf: { font: pdfFont, footer: pdfFooter },
          },
        } as any)
        .eq("id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      toast.success("Empresa atualizada com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar empresa."),
  });

  const saveSignature = useMutation({
    mutationFn: async () => {
      const currentBrandConfig = (org as any)?.brand_config || {};
      const { error } = await supabase
        .from("organizations")
        .update({
          brand_config: {
            ...currentBrandConfig,
            signature: {
              enabled: signatureEnabled,
              signer_name: signerName,
              signer_role: signerRole,
              image_url: signatureImageUrl,
            },
          },
        } as any)
        .eq("id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      toast.success("Assinatura salva com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar assinatura."),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const trimmedEmail = inviteEmail.trim().toLowerCase();
      if (!trimmedEmail) throw new Error("E-mail é obrigatório");
      const existingMember = teamMembers?.find(m => m.email?.toLowerCase() === trimmedEmail);
      if (existingMember) throw new Error("Este e-mail já é membro da equipe");
      const existingInvite = invitations?.find((i: any) => i.email?.toLowerCase() === trimmedEmail);
      if (existingInvite) throw new Error("Este e-mail já possui um convite pendente");
      const { data, error } = await supabase
        .from("team_invitations" as any)
        .insert({ org_id: orgId!, email: trimmedEmail, role: inviteRole, invited_by: user!.id } as any)
        .select().single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      setInviteEmail(""); setInviteRole("member");
      const inviteLink = `${window.location.origin}/register?invite=${data.token}`;
      navigator.clipboard.writeText(inviteLink).then(() => {
        toast.success("Convite criado! Link copiado para a área de transferência.", { description: "Compartilhe o link com o novo membro.", duration: 5000 });
      }).catch(() => { toast.success("Convite criado com sucesso!"); });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao enviar convite."),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_invitations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team-invitations"] }); toast.success("Convite cancelado."); },
    onError: () => toast.error("Erro ao cancelar convite."),
  });

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(link).then(() => { toast.success("Link copiado!"); });
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) {
      if (!orgId) toast.error("Organização não encontrada. Tente recarregar a página.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) { toast.error("Use PNG ou JPG para a assinatura."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo 2MB."); return; }
    setUploadingSignature(true);
    try {
      const ext = file.name.split(".").pop();
      // O RLS exige que o orgId seja o PRIMEIRO segmento do path
      const path = `${orgId}/signatures/assinatura.${ext}`;
      
      let uploadRes = await supabase.storage.from("org-assets").upload(path, file, { upsert: true });
      let currentBucket = "org-assets";

      if (uploadRes.error && uploadRes.error.message.includes("not found")) {
        console.log("org-assets not found for signature, trying logos...");
        uploadRes = await supabase.storage.from("logos").upload(path, file, { upsert: true });
        currentBucket = "logos";
      }

      if (uploadRes.error) throw uploadRes.error;
      const { data: urlData } = supabase.storage.from(currentBucket).getPublicUrl(path);
      setSignatureImageUrl(urlData.publicUrl + `?t=${Date.now()}`);
      toast.success("Assinatura enviada com sucesso!");
    } catch (err: any) { 
      toast.error("Erro no upload: " + err.message, {
        description: "Verifique se os buckets 'org-assets' ou 'logos' existem no seu Supabase."
      }); 
    }
    finally { setUploadingSignature(false); }
  };

  // Bug 2: Logo upload for company
  const handleOrgLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) {
      if (!orgId) toast.error("Organização não encontrada. Tente recarregar a página.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo deve ter no máximo 2MB.");
      return;
    }
    try {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/logo-${Date.now()}.${ext}`;
      
      let uploadRes = await supabase.storage.from("org-assets").upload(path, file, { upsert: true });
      let currentBucket = "org-assets";

      if (uploadRes.error && uploadRes.error.message.includes("not found")) {
        console.log("org-assets not found for logo, trying logos...");
        uploadRes = await supabase.storage.from("logos").upload(path, file, { upsert: true });
        currentBucket = "logos";
      }

      if (uploadRes.error) {
        if (uploadRes.error.message.includes("not found")) {
          throw new Error("❌ Buckets 'org-assets' ou 'logos' não encontrados no Storage do Supabase.");
        }
        throw uploadRes.error;
      }

      const { data } = supabase.storage.from(currentBucket).getPublicUrl(path);
      setOrgLogoUrl(data.publicUrl);
      setOrgLogoPreview(data.publicUrl);
      
      await supabase.from("organizations")
        .update({ logo_url: data.publicUrl } as any)
        .eq("id", orgId);
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      toast.success("Logo da empresa salva com sucesso!");
    } catch (err: any) {
      toast.error(err.message.includes("❌") ? err.message : "Erro ao enviar logo: " + err.message, {
        duration: 8000,
        description: "Certifique-se de que os buckets existam e sejam públicos no painel do Supabase."
      });
    }
  };

  const removeOrgLogo = async () => {
    setOrgLogoUrl(null);
    setOrgLogoPreview(null);
    if (orgId) {
      await supabase.from("organizations")
        .update({ logo_url: null } as any)
        .eq("id", orgId);
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      toast.success("Logo removida.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await supabase.from("generated_reports" as any).delete().eq("org_id", orgId!);
      await supabase.from("organizations").delete().eq("id", orgId!);
      await supabase.auth.signOut();
      window.location.href = "/";
      toast.success("Conta excluída com sucesso.");
    } catch { toast.error("Erro ao excluir conta."); }
  };

  const initials = (fullName || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <AppLayout title="Configurações">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua conta, empresa e equipe</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className={`grid w-full ${limits.plan.id === "business" ? "grid-cols-5" : "grid-cols-4"}`}>
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Conta</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="assinatura" className="gap-2">
              <PenTool className="h-4 w-4" />
              <span className="hidden sm:inline">Assinatura</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Equipe</span>
            </TabsTrigger>
            {limits.plan.id === "business" && (
              <TabsTrigger value="api" className="gap-2">
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">API</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>Atualize seu nome e dados pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{fullName || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input value={user?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">
                      Para alterar o e-mail, entre em contato com o suporte.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo profissional</Label>
                    <Input
                      value={professionalRole}
                      onChange={(e) => setProfessionalRole(e.target.value)}
                      placeholder="Ex: Engenheiro Civil, Técnico de TI..."
                    />
                    <p className="text-xs text-muted-foreground">Aparece nos relatórios gerados.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await supabase.auth.resetPasswordForEmail(user!.email!);
                      toast.success("E-mail de redefinição de senha enviado!");
                    }}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Alterar senha
                  </Button>
                </div>

                {/* Danger zone */}
                <Separator />
                <div className="rounded-lg border border-destructive/30 p-4 space-y-3">
                  <p className="text-sm font-semibold text-destructive">Zona de risco</p>
                  <p className="text-xs text-muted-foreground">Esta ação é permanente e não pode ser desfeita.</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir minha conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Configure a identidade visual e informações da sua organização</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo upload */}
                <div className="space-y-3">
                  <Label>Logo da empresa</Label>
                  {orgLogoPreview ? (
                    <div className="flex items-center gap-4">
                      <div className="border rounded-lg p-3 bg-muted/30">
                        <img src={orgLogoPreview} alt="Logo" className="max-h-16 max-w-[160px] object-contain" />
                      </div>
                      <Button variant="outline" size="sm" onClick={removeOrgLogo}>
                        <X className="mr-1 h-3 w-3" /> Remover
                      </Button>
                    </div>
                  ) : null}
                  <input ref={orgLogoInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleOrgLogoUpload} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => orgLogoInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {orgLogoPreview ? "Trocar logo" : "Fazer upload"}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou SVG · Max 2MB. Aparece no cabeçalho dos PDFs gerados.</p>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome da Empresa</Label>
                    <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Nome da empresa" />
                  </div>
                  <div className="space-y-2">
                    <Label>Plano Atual</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Badge variant="secondary" className="capitalize">{org?.plan || "starter"}</Badge>
                      <Badge variant="outline" className="text-success border-success/30">
                        {org?.plan_status || "active"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Principal</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-10 rounded cursor-pointer border border-border"
                      />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {["#1A56DB","#0F172A","#16A34A","#DC2626","#9333EA","#EA580C"].map(c => (
                        <button
                          key={c}
                          onClick={() => setPrimaryColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${primaryColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ / CPF</Label>
                    <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="00.000.000/0001-00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço da empresa</Label>
                    <Input
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000 — São Paulo/SP"
                    />
                    <p className="text-xs text-muted-foreground">Aparece no cabeçalho da folha de rosto e rodapé dos documentos.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Nº de registro profissional</Label>
                    <Input
                      value={orgRegNum}
                      onChange={(e) => setOrgRegNum(e.target.value)}
                      placeholder="Ex: CREA-SP 123456 / CRM 54321 / CAU A12345"
                    />
                    <p className="text-xs text-muted-foreground">Aparece ao lado do nome do responsável na assinatura e folha de rosto.</p>
                  </div>
                </div>

                {/* Watermark (Pro+) */}
                {limits.canUseWatermark && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Switch checked={wmEnabled} onCheckedChange={setWmEnabled} id="wm-toggle" />
                        <Label htmlFor="wm-toggle" className="font-medium">Exibir marca d'água nos PDFs</Label>
                      </div>
                      {wmEnabled && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Texto da marca d'água</Label>
                            <span className="text-xs text-muted-foreground">{wmText.length}/30</span>
                          </div>
                          <Input
                            value={wmText}
                            onChange={(e) => setWmText(e.target.value)}
                            placeholder={orgName || "CONFIDENCIAL"}
                            maxLength={30}
                          />
                          <p className="text-xs text-muted-foreground">
                            Aparece em diagonal no fundo de cada página do PDF. Deixe vazio para usar o nome da empresa.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* PDF Font + Footer (Pro+) */}
                {limits.canUsePDFProfessional && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">Tipografia do PDF</h4>
                        <p className="text-xs text-muted-foreground mb-3">Fonte usada no corpo e cabeçalhos dos relatórios exportados.</p>
                        <Select value={pdfFont} onValueChange={setPdfFont}>
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="helvetica">Helvetica (padrão)</SelectItem>
                            <SelectItem value="georgia">Georgia (elegante)</SelectItem>
                            <SelectItem value="calibri">Calibri (corporativo)</SelectItem>
                            <SelectItem value="courier">Courier (técnico)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Rodapé personalizado</Label>
                          <span className="text-xs text-muted-foreground">{pdfFooter.length}/100</span>
                        </div>
                        <Input
                          value={pdfFooter}
                          onChange={(e) => setPdfFooter(e.target.value.slice(0, 100))}
                          placeholder="Ex: Documento gerado por RelatórioFlow — Todos os direitos reservados"
                          maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground">Aparece no rodapé de todas as páginas do PDF. Deixe vazio para o rodapé padrão.</p>
                      </div>
                    </div>
                  </>
                )}

                <Button onClick={() => updateOrg.mutate()} disabled={updateOrg.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateOrg.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signature Tab */}
          <TabsContent value="assinatura" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assinatura do Responsável</CardTitle>
                <CardDescription>Configure a assinatura que aparecerá ao final dos relatórios gerados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!limits.canUseSignatureText && (
                  <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                    <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="font-medium text-foreground">Recurso disponível no plano Pro ou superior</p>
                    <p className="text-sm text-muted-foreground">Faça upgrade para adicionar assinatura nos seus relatórios.</p>
                    <Button asChild size="sm" className="mt-2"><Link to="/billing">Ver planos</Link></Button>
                  </div>
                )}
                {limits.canUseSignatureText && (
                  <>
                    <div className="flex items-center gap-3">
                      <Switch checked={signatureEnabled} onCheckedChange={setSignatureEnabled} id="sig-toggle" />
                      <Label htmlFor="sig-toggle" className="font-medium">Exibir assinatura nos relatórios</Label>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do responsável</Label>
                        <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Ex: João Silva" disabled={!signatureEnabled} />
                      </div>
                      <div className="space-y-2">
                        <Label>Cargo</Label>
                        <Input value={signerRole} onChange={(e) => setSignerRole(e.target.value)} placeholder="Ex: Diretor Financeiro" disabled={!signatureEnabled} />
                      </div>
                    </div>
                    {limits.canUseSignatureImage ? (
                      <div className="space-y-3">
                        <Label>Imagem da assinatura</Label>
                        <p className="text-xs text-muted-foreground">Faça upload de uma foto da sua assinatura manuscrita. Use PNG com fundo transparente para melhor resultado.</p>
                        {signatureImageUrl ? (
                          <div className="space-y-3">
                            <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center min-h-[100px]">
                              <img src={signatureImageUrl} alt="Preview da assinatura" className="max-h-24 max-w-xs object-contain" />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSignatureImageUrl(null)}>Remover imagem</Button>
                          </div>
                        ) : (
                          <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors ${!signatureEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              {uploadingSignature ? <span className="text-sm">Carregando...</span> : (
                                <><Upload className="h-6 w-6" /><span className="text-sm">Clique para fazer upload da assinatura</span><span className="text-xs">PNG ou JPG, máx. 2MB</span></>
                              )}
                            </div>
                            <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleSignatureUpload} className="hidden" disabled={uploadingSignature || !signatureEnabled} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 flex items-center gap-3">
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Assinatura com imagem — plano Business</p>
                          <p className="text-xs text-muted-foreground">Upgrade para Business para adicionar sua assinatura manuscrita.</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="ml-auto shrink-0"><Link to="/billing">Upgrade</Link></Button>
                      </div>
                    )}
                    {signatureEnabled && (signerName || signerRole || signatureImageUrl) && (
                      <div className="space-y-2">
                        <Label>Preview da assinatura no relatório</Label>
                        <div className="border rounded-lg p-6 bg-white dark:bg-card">
                          <div className="flex flex-col items-end gap-1 max-w-xs ml-auto">
                            <div className="w-full h-px bg-border mb-2" />
                            {signatureImageUrl && <img src={signatureImageUrl} alt="Assinatura" className="max-h-16 max-w-full object-contain mb-1" />}
                            {signerName && <p className="text-sm font-semibold text-foreground">{signerName}</p>}
                            {signerRole && <p className="text-xs text-muted-foreground">{signerRole}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                    <Button onClick={() => saveSignature.mutate()} disabled={saveSignature.isPending}>
                      <Save className="mr-2 h-4 w-4" />
                      {saveSignature.isPending ? "Salvando..." : "Salvar assinatura"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Equipe</CardTitle>
                <CardDescription>
                  Gerencie os membros da sua organização.
                  {maxTeamMembers !== -1 && <span className="ml-1 font-medium">({currentTeamCount}/{maxTeamMembers} no plano {planConfig.name})</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {maxTeamMembers !== -1 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Membros + convites pendentes</span>
                      <span className="font-medium text-foreground">{currentTeamCount} de {maxTeamMembers}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min((currentTeamCount / maxTeamMembers) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
                {canAddMore ? (
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /><p className="text-sm font-medium text-foreground">Convidar novo membro</p></div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input type="email" placeholder="email@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1" onKeyDown={(e) => { if (e.key === "Enter") inviteMutation.mutate(); }} />
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !inviteEmail.trim()} className="gap-2">
                        <Plus className="h-4 w-4" /> {inviteMutation.isPending ? "Enviando..." : "Convidar"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Um link de convite será gerado. Compartilhe com o novo membro para que ele se cadastre diretamente na sua equipe.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                    <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="font-medium text-foreground">Limite de membros atingido</p>
                    <p className="text-sm text-muted-foreground">Seu plano {planConfig.name} permite até {maxTeamMembers} membros. Faça upgrade para adicionar mais pessoas.</p>
                    <Button asChild size="sm" className="mt-2"><Link to="/billing">Ver planos</Link></Button>
                  </div>
                )}
                <Separator />
                {invitations && invitations.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Convites pendentes ({invitations.length})</p>
                    {invitations.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold"><Mail className="h-3.5 w-3.5" /></AvatarFallback></Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{inv.email}</p>
                            <p className="text-xs text-muted-foreground">Convidado em {new Date(inv.created_at).toLocaleDateString("pt-BR")} • Expira em {new Date(inv.expires_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="capitalize text-xs">{inv.role}</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyInviteLink(inv.token)} title="Copiar link"><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => cancelInviteMutation.mutate(inv.id)} title="Cancelar convite"><XCircle className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Membros ativos ({teamMembers?.length || 0})</p>
                  {teamMembers?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{(member.full_name || member.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant={member.role === "owner" ? "default" : "secondary"} className="capitalize">
                        {member.role === "owner" ? <span className="flex items-center gap-1"><Crown className="h-3 w-3" /> Proprietário</span> : member.role === "admin" ? "Admin" : "Membro"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab — Business only */}
          {limits.plan.id === "business" && (
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> API de Integração</CardTitle>
                  <CardDescription>Conecte o RelatórioFlow com n8n, Make, Zapier ou qualquer sistema via API REST.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Chaves de API</p>
                      <Button size="sm" onClick={generateApiKey} disabled={generatingKey} className="gap-2">
                        <Plus className="h-4 w-4" /> {generatingKey ? "Gerando..." : "Nova chave"}
                      </Button>
                    </div>
                    {newKeyValue && (
                      <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">✅ Chave gerada! Copie agora — não será exibida novamente.</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-background border rounded p-2 font-mono break-all">{newKeyValue}</code>
                          <Button size="icon" variant="outline" className="shrink-0" onClick={() => { navigator.clipboard.writeText(newKeyValue); toast.success("Copiada!"); }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setNewKeyValue(null)}>Entendi, já copiei</Button>
                      </div>
                    )}
                    {apiKeys?.map((k: any) => (
                      <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">{k.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{k.key_preview}••••••••••••</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Criada em {new Date(k.created_at).toLocaleDateString("pt-BR")}
                            {k.last_used && ` · Último uso: ${new Date(k.last_used).toLocaleDateString("pt-BR")}`}
                          </p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => revokeApiKey(k.id)}>Revogar</Button>
                      </div>
                    ))}
                    {(!apiKeys || apiKeys.length === 0) && !newKeyValue && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma chave criada ainda.</p>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <p className="text-sm font-semibold">Como usar a API</p>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Endpoint base</p>
                      <code className="block text-xs bg-muted rounded p-2 font-mono break-all">{`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-generate-report`}</code>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Gerar relatório — POST</p>
                      <pre className="text-xs bg-muted rounded p-3 font-mono overflow-x-auto whitespace-pre">{`curl -X POST \\
  [ENDPOINT] \\
  -H "Authorization: Bearer rf_sua_chave" \\
  -H "Content-Type: application/json" \\
  -d '{"notes": "Realizei vistoria...", "report_type": "vistoria"}'`}</pre>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Listar relatórios — GET</p>
                      <pre className="text-xs bg-muted rounded p-3 font-mono overflow-x-auto whitespace-pre">{`curl -X GET "[ENDPOINT]?limit=10" \\
  -H "Authorization: Bearer rf_sua_chave"`}</pre>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Tipos de relatório disponíveis (report_type)
                      </p>
                      <div className="bg-muted rounded p-3 space-y-1">
                        {[
                          ["relatorio_tecnico", "Relatório Técnico"],
                          ["vistoria", "Vistoria"],
                          ["laudo_tecnico", "Laudo Técnico"],
                          ["diario_de_obra", "Diário de Obra (RDO)"],
                          ["proposta_comercial", "Proposta Comercial"],
                          ["orcamento", "Orçamento"],
                          ["ata_reuniao", "Ata de Reunião"],
                          ["parecer_tecnico", "Parecer Técnico"],
                          ["inspecao", "Inspeção"],
                          ["manutencao", "Rel. de Manutenção"],
                          ["auditoria", "Auditoria"],
                          ["outro", "Outro"],
                        ].map(([val, label]) => (
                          <div key={val} className="flex items-center gap-2 text-xs font-mono">
                            <code className="bg-background border rounded px-1.5 py-0.5 text-primary">
                              {val}
                            </code>
                            <span className="text-muted-foreground">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Exemplo completo — Proposta Comercial com valores
                      </p>
                      <pre className="text-xs bg-muted rounded p-3 font-mono overflow-x-auto whitespace-pre">{`curl -X POST [ENDPOINT] \\
  -H "Authorization: Bearer rf_sua_chave" \\
  -H "Content-Type: application/json" \\
  -d '{
    "notes": "Proposta para vistoria predial completa",
    "report_type": "proposta_comercial",
    "client_name": "Condomínio Solar",
    "report_number": "PC-2026-001",
    "responsible_name": "João Silva",
    "responsible_role": "Eng. Civil CREA-SP 123456",
    "payment_terms": "50% na assinatura, 50% na entrega",
    "proposal_validity": "30",
    "execution_days": "15",
    "materials": [
      {
        "item": "Vistoria técnica completa",
        "qty": "1",
        "unit": "Vb",
        "price": "3200.00"
      },
      {
        "item": "Relatório técnico NBR",
        "qty": "1",
        "unit": "Vb",
        "price": "1800.00"
      }
    ]
  }'`}</pre>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Exemplo — Diário de Obra (RDO)
                      </p>
                      <pre className="text-xs bg-muted rounded p-3 font-mono overflow-x-auto whitespace-pre">{`curl -X POST [ENDPOINT] \\
  -H "Authorization: Bearer rf_sua_chave" \\
  -H "Content-Type: application/json" \\
  -d '{
    "notes": "Concretagem da laje do 8o pavimento, 48m3",
    "report_type": "diario_de_obra",
    "client_name": "Edifício Park Avenue",
    "report_number": "RDO-089",
    "report_location": "Av. Paulista, 1500 - SP",
    "weather_condition": "Parcialmente nublado",
    "access_condition": "Livre",
    "team_members": [
      { "name": "Carlos Lima", "role": "Eng. Civil", "hours": "8" }
    ],
    "materials": [
      { "item": "Concreto fck=25MPa", "qty": "48", "unit": "m3" }
    ],
    "occurrences": "Chuva leve interrompeu por 45min"
  }'`}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Delete account dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setDeleteConfirmText(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os seus relatórios e dados serão excluídos para sempre.
              Esta ação não pode ser desfeita. Digite EXCLUIR para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Digite EXCLUIR para confirmar"
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== "EXCLUIR"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
            >
              Excluir minha conta permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
