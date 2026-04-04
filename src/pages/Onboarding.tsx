import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Rocket,
  CheckCircle2,
  Building2,
} from "lucide-react";

// Templates alinhados aos 12 tipos de relatório da plataforma
const TEMPLATES = [
  { id: "relatorio_tecnico",  name: "Relatório Técnico",        report_type: "relatorio_tecnico",  category: "técnico",    description: "Relatório técnico geral para documentar atividades e serviços" },
  { id: "diario_de_obra",     name: "Diário de Obra (RDO)",     report_type: "diario_de_obra",     category: "obra",       description: "Registro diário de obras conforme CONFEA / NBR 12.722" },
  { id: "laudo_tecnico",      name: "Laudo Técnico",            report_type: "laudo_tecnico",      category: "técnico",    description: "Laudo pericial com análise e diagnóstico técnico (ABNT NBR 10719)" },
  { id: "vistoria",           name: "Vistoria",                 report_type: "vistoria",           category: "inspeção",   description: "Relatório de vistoria técnica com registro de anomalias" },
  { id: "proposta_comercial", name: "Proposta Comercial",       report_type: "proposta_comercial", category: "comercial",  description: "Proposta com escopo, cronograma e condições comerciais" },
  { id: "ata_reuniao",        name: "Ata de Reunião",           report_type: "ata_reuniao",        category: "reunião",    description: "Registro formal com deliberações e encaminhamentos" },
  { id: "manutencao",         name: "Relatório de Manutenção",  report_type: "manutencao",         category: "manutenção", description: "Registro de serviços de manutenção preventiva ou corretiva" },
  { id: "parecer_tecnico",    name: "Parecer Técnico",          report_type: "parecer_tecnico",    category: "técnico",    description: "Análise técnica conclusiva sobre uma questão específica" },
];

const CATEGORY_COLORS: Record<string, string> = {
  técnico:    "bg-blue-100 text-blue-700",
  obra:       "bg-orange-100 text-orange-700",
  inspeção:   "bg-green-100 text-green-700",
  comercial:  "bg-cyan-100 text-cyan-700",
  reunião:    "bg-purple-100 text-purple-700",
  manutenção: "bg-red-100 text-red-700",
};

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { data: orgProfile } = useOrgProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleFinish = async () => {
    setSaving(true);
    try {
      // 1. Marcar onboarding como concluído
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user?.id);

      if (profileErr) throw profileErr;

      // 2. Salvar nome da empresa do step 0 (se preenchido e não salvo no step 1)
      if (companyName.trim() && orgProfile?.org_id) {
        await supabase
          .from("organizations")
          .update({ name: companyName.trim() } as any)
          .eq("id", orgProfile.org_id);
      }

      // 3. Criar template selecionado (com report_type correto)
      if (selectedTemplate && orgProfile?.org_id) {
        const tpl = TEMPLATES.find((t) => t.id === selectedTemplate);
        if (tpl) {
          await supabase.from("report_templates").insert({
            name: tpl.name,
            description: tpl.description,
            category: tpl.category,
            report_type: tpl.report_type,
            org_id: orgProfile.org_id,
            created_by: user?.id,
            blocks: [],
            brand_config: {},
          } as any);
        }
      }

      // 4. Invalidar cache do ProtectedRoute para evitar loop de redirecionamento
      await queryClient.invalidateQueries({ queryKey: ["onboarding-check", user?.id] });

      toast({ title: "Tudo pronto!", description: "Seu ambiente está configurado." });
      navigate("/dashboard");
    } catch {
      toast({ title: "Erro", description: "Não foi possível finalizar. Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--hero-gradient-subtle)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 p-6">
        <BarChart3 className="h-7 w-7 text-primary" />
        <span className="font-bold text-lg text-foreground">RelatórioFlow</span>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-6">
        <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
          <span>Etapa {step + 1} de {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {step === 0 && (
            <StepWelcome
              companyName={companyName}
              setCompanyName={setCompanyName}
              userName={user?.user_metadata?.full_name || ""}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <StepConfigEmpresa
              initialCompanyName={companyName}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepChooseTemplate
              selected={selectedTemplate}
              onSelect={setSelectedTemplate}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepDone
              companyName={companyName}
              selectedTemplate={selectedTemplate}
              saving={saving}
              onFinish={handleFinish}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Step 1: Welcome ─── */
function StepWelcome({
  companyName,
  setCompanyName,
  userName,
  onNext,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  userName: string;
  onNext: () => void;
}) {
  return (
    <div className="text-center space-y-8 animate-fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2">
        <Sparkles className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Bem-vindo{userName ? `, ${userName.split(" ")[0]}` : ""}! 🎉
        </h1>
        <p className="text-muted-foreground text-lg">
          Vamos configurar sua conta em <strong>3 minutos</strong>. Você pode pular qualquer etapa.
        </p>
      </div>

      <Card className="p-6 text-left space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="company">Nome da sua empresa</Label>
          <Input
            id="company"
            placeholder="Ex: Acme Engenharia Ltda"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">Será usado no cabeçalho dos seus relatórios</p>
        </div>
      </Card>

      <Button size="lg" onClick={onNext} className="gap-2">
        Próximo <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ─── Step 2: Configurar Empresa ─── */
function StepConfigEmpresa({
  initialCompanyName,
  onNext,
  onBack,
}: {
  initialCompanyName: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { data: orgProfile } = useOrgProfile();
  const [orgName, setOrgName] = useState(initialCompanyName || (orgProfile as any)?.name || "");
  const [professionalRole, setProfessionalRole] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (orgName.trim() && orgProfile?.org_id) {
        await supabase.from("organizations")
          .update({ name: orgName.trim() } as any)
          .eq("id", orgProfile.org_id);
      }
      if (professionalRole.trim() && user?.id) {
        await supabase.from("profiles")
          .update({ professional_role: professionalRole.trim() } as any)
          .eq("id", user.id);
      }
    } catch {
      // silent — não bloqueia onboarding
    }
    setSaving(false);
    onNext();
  };

  return (
    <div className="text-center space-y-8 animate-fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2">
        <Building2 className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Configure sua empresa</h2>
        <p className="text-muted-foreground">Essas informações aparecem em todos os seus relatórios.</p>
      </div>

      <Card className="p-6 text-left space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label>Nome da empresa ou nome profissional</Label>
          <Input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Ex: TechServ Engenharia Ltda."
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Seu cargo profissional</Label>
          <Input
            value={professionalRole}
            onChange={(e) => setProfessionalRole(e.target.value)}
            placeholder="Ex: Engenheiro Civil, Técnico de TI..."
            className="h-11"
          />
        </div>
      </Card>

      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button size="lg" onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? "Salvando..." : "Próximo"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 3: Choose Template ─── */
function StepChooseTemplate({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: string | null;
  onSelect: (v: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="text-center space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Escolha seu primeiro template</h2>
        <p className="text-muted-foreground">
          Selecione o tipo de relatório que você mais usa. Você pode criar outros depois.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEMPLATES.map((t) => (
          <Card
            key={t.id}
            className={`p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md text-left ${
              selected === t.id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""
            }`}
            onClick={() => onSelect(selected === t.id ? null : t.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <Badge variant="secondary" className={`text-xs ${CATEGORY_COLORS[t.category] || ""}`}>
                  {t.category}
                </Badge>
                <p className="font-medium text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              {selected === t.id && <Check className="h-5 w-5 text-primary shrink-0 mt-1" />}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button size="lg" onClick={onNext} className="gap-2">
          {selected ? "Próximo" : "Pular"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 4: Done ─── */
function StepDone({
  companyName,
  selectedTemplate,
  saving,
  onFinish,
  onBack,
}: {
  companyName: string;
  selectedTemplate: string | null;
  saving: boolean;
  onFinish: () => void;
  onBack: () => void;
}) {
  const template = TEMPLATES.find((t) => t.id === selectedTemplate);

  const items = [
    { label: "Conta criada", done: true },
    { label: companyName ? `Empresa: ${companyName}` : "Empresa configurada", done: !!companyName },
    { label: "Dados profissionais preenchidos", done: true },
    { label: template ? `Template: ${template.name}` : "Template escolhido", done: !!selectedTemplate },
  ];

  return (
    <div className="text-center space-y-8 animate-fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-green-600 mb-2">
        <Rocket className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Tudo pronto! 🚀</h2>
        <p className="text-muted-foreground">Aqui está um resumo do que configuramos:</p>
      </div>

      <Card className="p-6 max-w-md mx-auto text-left space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <CheckCircle2
              className={`h-5 w-5 shrink-0 ${item.done ? "text-green-500" : "text-muted-foreground/40"}`}
            />
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
            </span>
          </div>
        ))}
      </Card>

      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button size="lg" onClick={onFinish} disabled={saving} className="gap-2">
          {saving ? "Finalizando..." : "Ir para o Dashboard"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default Onboarding;
