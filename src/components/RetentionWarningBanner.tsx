import { useState } from "react";
import { AlertTriangle, Download, ChevronDown, ChevronUp, X, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRetentionWarning } from "@/hooks/useRetentionWarning";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  onExportPDF?: (reportId: string) => void;
}

export function RetentionWarningBanner({ onExportPDF }: Props) {
  const warning = useRetentionWarning();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!warning.hasWarning || dismissed) return null;

  const isUrgent = (warning.oldestDaysRemaining ?? 999) <= 2;
  const isMedium = (warning.oldestDaysRemaining ?? 999) <= 5;

  const urgencyColor = isUrgent
    ? "bg-destructive/10 border-destructive/30 text-destructive"
    : isMedium
    ? "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300"
    : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300";

  const iconColor = isUrgent
    ? "text-destructive"
    : isMedium
    ? "text-orange-500"
    : "text-amber-500";

  const count = warning.expiringReports.length;

  return (
    <div className={cn("rounded-lg border p-4 space-y-3", urgencyColor)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className={cn("h-5 w-5 mt-0.5 shrink-0", iconColor)} />
          <div>
            <p className="text-sm font-semibold">
              {isUrgent
                ? `Atenção! ${count} relatório${count > 1 ? "s serão excluídos" : " será excluído"} em breve`
                : `${count} relatório${count > 1 ? "s próximos" : " próximo"} de expirar`}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              Seu plano mantém relatórios por {warning.retentionDays} dias.{" "}
              {warning.oldestDaysRemaining === 0
                ? "O mais antigo expira hoje!"
                : warning.oldestDaysRemaining === 1
                ? "O mais antigo expira amanhã!"
                : `O mais antigo expira em ${warning.oldestDaysRemaining} dias.`}
              {" "}Baixe os arquivos antes que sejam removidos.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm" className="h-7 text-xs">
          <Link to="/reports">
            <Download className="h-3 w-3 mr-1" />
            Ver relatórios
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-7 text-xs">
          <Link to="/billing">
            <ExternalLink className="h-3 w-3 mr-1" />
            Fazer upgrade
          </Link>
        </Button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 ml-auto"
        >
          {expanded ? "Ocultar" : `Ver ${count} relatório${count > 1 ? "s" : ""}`}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Expanded list */}
      {expanded && (
        <div className="space-y-1.5 pt-2 border-t border-current/10">
          {warning.expiringReports.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 text-xs py-1">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.client_name || "Sem cliente"}</p>
                <p className="opacity-60 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {r.daysRemaining === 0
                    ? "Expira hoje"
                    : r.daysRemaining === 1
                    ? "Expira amanhã"
                    : `Expira em ${r.daysRemaining} dias`}
                  {" · "}
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Badge
                variant={r.daysRemaining <= 2 ? "destructive" : "secondary"}
                className="shrink-0 text-[10px]"
              >
                {r.daysRemaining === 0 ? "Hoje!" : r.daysRemaining === 1 ? "Amanhã!" : `${r.daysRemaining}d`}
              </Badge>
              {onExportPDF && (
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => onExportPDF(r.id)}>
                  <Download className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              )}
            </div>
          ))}
          <p className="text-[10px] opacity-60 pt-1">
            Faça upgrade para Pro ou Business para guardar por mais tempo.
          </p>
        </div>
      )}
    </div>
  );
}
