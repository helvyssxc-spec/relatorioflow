import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, AlertTriangle, Brain, CheckCircle2, CreditCard,
  ExternalLink, TrendingUp, Users, Zap, BellRing,
} from "lucide-react";
import { format, subDays, startOfMonth, startOfDay } from "date-fns";

// ── Limits reference ──────────────────────────────────────────────────────────
const LIMITS = {
  supabase: {
    dbMb: 500,
    storageMb: 1024,
    mau: 50000,
    edgeFnInvocations: 500000,
  },
  gemini: {
    requestsPerDay: 1_500,   // Flash 2.0 free tier RPD
    tokensPerDay: 1_000_000, // Flash 2.0 free tier TPD
    rpm: 15,
  },
  groq: {
    requestsPerDay: 14_400,  // llama-3.3-70b-versatile free tier
    tokensPerDay: 500_000,   // ~500k tokens/day free
  },
};

// Gemini 2.0 Flash pricing (USD per 1M tokens)
const GEMINI_PRICE_INPUT  = 0.10;
const GEMINI_PRICE_OUTPUT = 0.40;
const USD_TO_BRL = 5.75;

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  const usd = (inputTokens / 1_000_000) * GEMINI_PRICE_INPUT
            + (outputTokens / 1_000_000) * GEMINI_PRICE_OUTPUT;
  return usd * USD_TO_BRL;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MonitoringTab() {
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  const startMonth     = startOfMonth(new Date()).toISOString();
  const todayStart     = startOfDay(new Date()).toISOString();

  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: orgs = [] } = useQuery({
    queryKey: ["mon-orgs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations").select("id, plan, created_at, plan_status");
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["mon-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles").select("id, created_at");
      return data || [];
    },
  });

  const { data: subs = [] } = useQuery({
    queryKey: ["mon-subs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions").select("amount, billing_cycle, status, plan, created_at, canceled_at");
      return data || [];
    },
  });

  const { data: reports30d = [] } = useQuery({
    queryKey: ["mon-reports-30d"],
    queryFn: async () => {
      const { data } = await supabase
        .from("generated_reports" as any)
        .select("id, created_at, tokens_input, tokens_output")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });
      return (data as any[]) || [];
    },
  });

  const { data: umamiStats = [] } = useQuery({
    queryKey: ["mon-umami"],
    queryFn: async () => {
      const { data } = await supabase
        .from("umami_daily_stats" as any)
        .select("date, pageviews, visitors, visits")
        .gte("date", format(subDays(new Date(), 30), "yyyy-MM-dd"))
        .order("date", { ascending: true });
      return (data as any[]) || [];
    },
  });

  const { data: waitlistCount = 0 } = useQuery({
    queryKey: ["mon-waitlist"],
    queryFn: async () => {
      const { count } = await supabase
        .from("waitlist" as any).select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: reportsThisMonth = 0 } = useQuery({
    queryKey: ["mon-reports-month"],
    queryFn: async () => {
      const { count } = await supabase
        .from("generated_reports" as any)
        .select("*", { count: "exact", head: true })
        .gte("created_at", startMonth);
      return count || 0;
    },
  });

  // ── Quota: today's usage from audit_logs ────────────────────────────────────
  const { data: auditToday = [] } = useQuery({
    queryKey: ["mon-audit-today"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs" as any)
        .select("action, tokens_input, tokens_output, metadata")
        .gte("created_at", todayStart)
        .in("action", ["report.generated", "report.improved", "report.quota_exceeded"]);
      return (data as any[]) || [];
    },
    refetchInterval: 60_000, // auto-refresh every 60s
  });

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const activeSubs  = subs.filter(s => s.status === "active");
  const canceledThisMonth = subs.filter(s =>
    s.canceled_at && s.canceled_at >= startMonth
  ).length;

  const mrr = activeSubs.reduce((sum, s) => {
    const amt = Number(s.amount);
    return sum + (s.billing_cycle === "annual" ? amt / 12 : amt);
  }, 0);
  const arr = mrr * 12;

  const paidOrgs  = orgs.filter(o => o.plan !== "starter").length;
  const totalOrgs = orgs.length;
  const convRate  = totalOrgs > 0 ? (paidOrgs / totalOrgs) * 100 : 0;

  const churnRate = activeSubs.length > 0
    ? (canceledThisMonth / (activeSubs.length + canceledThisMonth)) * 100
    : 0;

  const totalInputTokens  = reports30d.reduce((s: number, r: any) => s + (r.tokens_input  || 0), 0);
  const totalOutputTokens = reports30d.reduce((s: number, r: any) => s + (r.tokens_output || 0), 0);
  const totalTokens       = totalInputTokens + totalOutputTokens;
  const estimatedCost     = estimateCost(totalInputTokens, totalOutputTokens);
  const avgTokensPerReport = reports30d.length > 0
    ? Math.round(totalTokens / reports30d.length) : 0;

  // Gemini daily token budget usage (estimated from last 30d average per day)
  const avgDailyTokens = reports30d.length > 0
    ? Math.round(totalTokens / 30) : 0;
  const geminiDailyUsagePct = Math.min((avgDailyTokens / LIMITS.gemini.tokensPerDay) * 100, 100);

  // ── Today's real quota usage ─────────────────────────────────────────────────
  const todayGemini    = auditToday.filter((l: any) => l.metadata?.provider === "gemini" && l.action !== "report.quota_exceeded");
  const todayGroq      = auditToday.filter((l: any) => l.metadata?.provider === "groq"   && l.action !== "report.quota_exceeded");
  const todayQuotaHits = auditToday.filter((l: any) => l.action === "report.quota_exceeded").length;

  const geminiReqToday       = todayGemini.length;
  const groqReqToday         = todayGroq.length;
  const geminiTokensToday    = todayGemini.reduce((s: number, l: any) => s + (l.tokens_input || 0) + (l.tokens_output || 0), 0);
  const groqTokensToday      = todayGroq.reduce((s: number, l: any)   => s + (l.tokens_input || 0) + (l.tokens_output || 0), 0);

  const geminiReqPct     = Math.min((geminiReqToday    / LIMITS.gemini.requestsPerDay) * 100, 100);
  const geminiTokenPct   = Math.min((geminiTokensToday / LIMITS.gemini.tokensPerDay)   * 100, 100);
  const groqReqPct       = Math.min((groqReqToday      / LIMITS.groq.requestsPerDay)   * 100, 100);
  const groqTokenPct     = Math.min((groqTokensToday   / LIMITS.groq.tokensPerDay)     * 100, 100);

  // Reports per day (last 30d)
  const reportsByDay = reports30d.reduce((acc: Record<string, number>, r: any) => {
    const day = format(new Date(r.created_at), "dd/MM");
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const reportsChartData = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const label = format(d, "dd/MM");
    return { label, relatórios: reportsByDay[label] || 0 };
  });

  // Visitors chart (last 14 days from Umami)
  const visitorsChartData = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const label   = format(d, "dd/MM");
    const stat = umamiStats.find((s: any) => s.date?.startsWith(dateStr));
    return { label, visitantes: stat?.visitors || 0, pageviews: stat?.pageviews || 0 };
  });

  const totalVisitors30d = umamiStats.reduce((s: number, r: any) => s + (r.visitors || 0), 0);

  // ── Alert helpers ────────────────────────────────────────────────────────────
  type AlertLevel = "ok" | "warn" | "danger";
  function alertLevel(pct: number): AlertLevel {
    if (pct >= 90) return "danger";
    if (pct >= 70) return "warn";
    return "ok";
  }
  const alertColors: Record<AlertLevel, string> = {
    ok:     "text-emerald-600",
    warn:   "text-amber-500",
    danger: "text-red-500",
  };
  const alertBg: Record<AlertLevel, string> = {
    ok:     "bg-emerald-500",
    warn:   "bg-amber-500",
    danger: "bg-red-500",
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Section 1: KPIs financeiros ─────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Financeiro
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="MRR" value={formatBRL(mrr)} sub="receita mensal recorrente" />
          <KpiCard label="ARR" value={formatBRL(arr)} sub="receita anual recorrente" />
          <KpiCard label="Conversão" value={`${convRate.toFixed(1)}%`} sub={`${paidOrgs} de ${totalOrgs} orgs pagantes`} />
          <KpiCard label="Churn (mês)" value={`${churnRate.toFixed(1)}%`} sub={`${canceledThisMonth} cancelamento(s)`} />
        </div>
      </div>

      {/* ── Section 2: Usuários ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Usuários & Leads
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total usuários" value={String(profiles.length)} sub="cadastros" />
          <KpiCard label="Visitantes (30d)" value={String(totalVisitors30d)} sub="via Umami Analytics" />
          <KpiCard label="Lista de espera" value={String(waitlistCount)} sub="e-mails coletados" />
          <KpiCard label="Relatórios (mês)" value={String(reportsThisMonth)} sub="gerados este mês" />
        </div>
      </div>

      {/* ── Section 3: Consumo Gemini ────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4" /> Consumo Gemini (últimos 30 dias)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <KpiCard label="Tokens entrada" value={totalInputTokens.toLocaleString("pt-BR")} sub="prompt tokens" />
          <KpiCard label="Tokens saída" value={totalOutputTokens.toLocaleString("pt-BR")} sub="completion tokens" />
          <KpiCard label="Custo estimado" value={formatBRL(estimatedCost)} sub="30 dias · Flash 2.0 (se pago)" />
          <KpiCard label="Média/relatório" value={avgTokensPerReport.toLocaleString("pt-BR")} sub="tokens totais" />
        </div>

        {totalTokens === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Nenhum token rastreado ainda — os próximos relatórios gerados aparecerão aqui.
          </p>
        )}
      </div>

      {/* ── Section 4: Quota Hoje (tempo real) ──────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <BellRing className="h-4 w-4" /> Quota de IA — Hoje
          <span className="text-[10px] normal-case font-normal text-muted-foreground">(atualiza a cada 60s)</span>
        </h3>

        {todayQuotaHits > 0 && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{todayQuotaHits} requisição(ões) bloqueada(s) hoje por quota esgotada — considere ativar o plano pago.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LimitCard
            label="Gemini 2.0 Flash — Requisições hoje"
            used={geminiReqToday}
            limit={LIMITS.gemini.requestsPerDay}
            unit="req"
            level={alertLevel(geminiReqPct)}
            pct={geminiReqPct}
            note={`Limite free: 1.500 req/dia · 15 RPM · Tokens hoje: ${geminiTokensToday.toLocaleString("pt-BR")}`}
            alertBg={alertBg}
            alertColors={alertColors}
          />
          <LimitCard
            label="Groq (llama-3.3-70b) — Requisições hoje"
            used={groqReqToday}
            limit={LIMITS.groq.requestsPerDay}
            unit="req"
            level={alertLevel(groqReqPct)}
            pct={groqReqPct}
            note={`Limite free: 14.400 req/dia · Tokens hoje: ${groqTokensToday.toLocaleString("pt-BR")}`}
            alertBg={alertBg}
            alertColors={alertColors}
          />
          <LimitCard
            label="Gemini — Tokens hoje"
            used={geminiTokensToday}
            limit={LIMITS.gemini.tokensPerDay}
            unit="tokens"
            level={alertLevel(geminiTokenPct)}
            pct={geminiTokenPct}
            note="Limite free: 1.000.000 tokens/dia"
            alertBg={alertBg}
            alertColors={alertColors}
          />
          <LimitCard
            label="Groq — Tokens hoje"
            used={groqTokensToday}
            limit={LIMITS.groq.tokensPerDay}
            unit="tokens"
            level={alertLevel(groqTokenPct)}
            pct={groqTokenPct}
            note="Limite free estimado: ~500.000 tokens/dia"
            alertBg={alertBg}
            alertColors={alertColors}
          />
        </div>
      </div>

      {/* ── Section 5: Alertas de limite (infraestrutura) ────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Alertas de Limite — Infraestrutura
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Gemini daily tokens */}
          <LimitCard
            label="Gemini — Tokens/dia (média)"
            used={avgDailyTokens}
            limit={LIMITS.gemini.tokensPerDay}
            unit="tokens"
            level={alertLevel(geminiDailyUsagePct)}
            pct={geminiDailyUsagePct}
            note="Limite free: 1M tokens/dia · 15 RPM"
            alertBg={alertBg}
            alertColors={alertColors}
          />

          {/* Supabase MAU (approximate from profiles) */}
          <LimitCard
            label="Supabase — Usuários ativos (MAU)"
            used={profiles.length}
            limit={LIMITS.supabase.mau}
            unit="usuários"
            level={alertLevel((profiles.length / LIMITS.supabase.mau) * 100)}
            pct={(profiles.length / LIMITS.supabase.mau) * 100}
            note="Limite free: 50.000 MAU"
            alertBg={alertBg}
            alertColors={alertColors}
          />

          {/* Edge function invocations (estimated: reports × 2 calls avg) */}
          <LimitCard
            label="Supabase Edge Functions — Invocações/mês (est.)"
            used={reportsThisMonth * 3}
            limit={LIMITS.supabase.edgeFnInvocations}
            unit="invocações"
            level={alertLevel(((reportsThisMonth * 3) / LIMITS.supabase.edgeFnInvocations) * 100)}
            pct={((reportsThisMonth * 3) / LIMITS.supabase.edgeFnInvocations) * 100}
            note="Limite free: 500k invocações/mês · ~3 calls por relatório"
            alertBg={alertBg}
            alertColors={alertColors}
          />

          {/* Vercel bandwidth (can't measure — link to dashboard) */}
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4 flex items-start gap-3">
              <Activity className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Vercel — Bandwidth & Build</p>
                <p className="text-xs text-muted-foreground">Não mensurável internamente. Verifique no painel.</p>
                <a
                  href="https://vercel.com/helvyssxc-8178s-projects/relatorioflow"
                  target="_blank" rel="noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  Abrir Vercel <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Section 5: Gráficos ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visitors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Visitantes (últimos 14 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visitorsChartData.some(d => d.visitantes > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={visitorsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitantes" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Nenhum dado de visitantes. Configure o Umami Analytics." />
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" /> Relatórios gerados (últimos 14 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportsChartData.some(d => d.relatórios > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={reportsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="relatórios" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Nenhum relatório gerado nos últimos 14 dias." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Section 6: Links externos ────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <ExternalLink className="h-4 w-4" /> Painéis Externos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ExternalLinkCard
            label="Supabase"
            desc="DB, storage, Edge Functions, logs"
            href="https://supabase.com/dashboard/project/lmydxgmiytiwgfmjjxdb"
          />
          <ExternalLinkCard
            label="Vercel"
            desc="Deploy, bandwidth, logs"
            href="https://vercel.com/helvyssxc-8178s-projects/relatorioflow"
          />
          <ExternalLinkCard
            label="Google AI Studio"
            desc="Quota Gemini, billing"
            href="https://aistudio.google.com/app/apikey"
          />
          <ExternalLinkCard
            label="Groq Console"
            desc="Quota llama-3.3, usage, API keys"
            href="https://console.groq.com/usage"
          />
          <ExternalLinkCard
            label="PagBank"
            desc="Assinaturas, cobranças, webhooks"
            href="https://minha.conta.pagseguro.com.br"
          />
        </div>
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function LimitCard({
  label, used, limit, unit, level, pct, note, alertBg, alertColors,
}: {
  label: string; used: number; limit: number; unit: string;
  level: "ok" | "warn" | "danger"; pct: number; note: string;
  alertBg: Record<string, string>; alertColors: Record<string, string>;
}) {
  const Icon = level === "ok" ? CheckCircle2 : AlertTriangle;
  return (
    <Card className={level === "danger" ? "border-red-400" : level === "warn" ? "border-amber-400" : ""}>
      <CardContent className="pt-4 pb-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <Icon className={`h-4 w-4 ${alertColors[level]}`} />
        </div>
        <ProgressPrimitive.Root className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <ProgressPrimitive.Indicator
            className={cn("h-full w-full flex-1 transition-all", alertBg[level])}
            style={{ transform: `translateX(-${100 - Math.min(pct, 100)}%)` }}
          />
        </ProgressPrimitive.Root>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{used.toLocaleString("pt-BR")} {unit}</span>
          <span>limite: {limit.toLocaleString("pt-BR")}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function ExternalLinkCard({ label, desc, href }: { label: string; desc: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="block border rounded-lg p-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">{label}</p>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </a>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground text-center px-4">
      {label}
    </div>
  );
}
