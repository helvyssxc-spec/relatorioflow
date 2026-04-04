/* ══════════════════════════════════════════════════
   PDF Templates — RelatórioFlow
   ABNT NBR 10719 · RDO · Ata · Comercial
══════════════════════════════════════════════════ */

export interface TemplateParams {
  report: string;
  reportType: string;
  reportNumber: string;
  reportDate: string;
  reportLocation: string;
  clientName: string;
  clientCompany: string;
  responsibleName: string;
  responsibleRole: string;
  notes: string;
  occurrences: string;
  weatherCondition: string;
  accessCondition: string;
  siteCondition: string;
  teamMembers: Array<{ name: string; role: string; hours: string }>;
  materials: Array<{ item: string; qty: string; unit: string; price?: string }>;
  reportImages: Array<{ url: string; name: string; caption: string }>;
  orgName: string;
  primary: string;
  finalLogo: string | null;
  isPro: boolean;
  isBiz: boolean;
  dateLabel: string;
  yearLabel: number;
  typeLabel: string;
  authorName: string;
  authorRole: string;
  showSig: boolean;
  signature: Record<string, any>;
  limits: any;
  wm: string;
  commercialItems?: Array<{
    item: string; qty: string; unit: string; price: string; total: number;
  }>;
  paymentTerms?: string;
  proposalValidity?: string;
  executionDays?: string;
  bdiPercent?: string;
}

/* ── Markdown → HTML ── */
function mdToHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/^# (.+)$/gm, `<h1 style="${H1_STYLE}">$1</h1>`)
    .replace(/^## (.+)$/gm, `<h2 style="${H2_STYLE}">$1</h2>`)
    .replace(/^### (.+)$/gm, `<h3 style="${H3_STYLE}">$1</h3>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong>$1</strong>`)
    .replace(/\*(.+?)\*/g, `<em>$1</em>`)
    .replace(/^[-–—•]\s+(.+)$/gm, `<li style="margin:8px 0;padding-left:6px;color:#334155;">$1</li>`)
    .replace(/((?:<li[^>]*>.*<\/li>\s*)+)/gs, (m) => `<ul style="margin:16px 0 16px 24px;padding:0;list-style:disc;">${m}</ul>`)
    .replace(/\n{2,}/g, `</p><p style="${BODY_STYLE}">`)
    .replace(/\n/g, "<br/>");
}

const FONT_BODY = "'Inter', system-ui, -apple-system, sans-serif";
const FONT_TITLE = "'Outfit', 'Inter', sans-serif";
const FONT_SERIF = "'EB Garamond', serif";

const GOOGLE_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');
`;

const BODY_STYLE = `margin:0 0 16pt;text-align:justify;line-height:1.7;font-size:11pt;font-family:${FONT_BODY};color:#334155;`;
const H1_STYLE = `font-size:22pt;font-weight:900;text-transform:uppercase;letter-spacing:0.04em;margin:48px 0 28px;font-family:${FONT_TITLE};color:#0f172a;text-align:center;`;
const H2_STYLE = `font-size:15pt;font-weight:700;margin:32px 0 18px;font-family:${FONT_TITLE};color:#0f172a;border-bottom:2px solid #f1f5f9;padding-bottom:8px;letter-spacing:-0.01em;`;
const H3_STYLE = `font-size:12pt;font-weight:700;margin:24px 0 12px;font-family:${FONT_TITLE};color:#475569;`;

/* ── Routing ── */
const RDO_TYPES = ["diario_de_obra", "inspecao", "vistoria", "manutencao", "auditoria"];
const COMMERCIAL_TYPES = ["proposta_comercial", "orcamento"];
const ATA_TYPES = ["ata_reuniao"];

export function getTemplateGroup(reportType: string): "rdo" | "commercial" | "ata" | "abnt" {
  if (RDO_TYPES.includes(reportType)) return "rdo";
  if (COMMERCIAL_TYPES.includes(reportType)) return "commercial";
  if (ATA_TYPES.includes(reportType)) return "ata";
  return "abnt";
}

export function buildTemplate(p: TemplateParams): string {
  const group = getTemplateGroup(p.reportType);
  switch (group) {
    case "rdo": return buildRDOTemplate(p);
    case "commercial": return buildCommercialTemplate(p);
    case "ata": return buildAtaTemplate(p);
    default: return buildABNTTemplate(p);
  }
}

/* ══════════════════════════════════════════════════
   ABNT NBR 10719:2011
══════════════════════════════════════════════════ */
function buildABNTTemplate(p: TemplateParams): string {
  const { report, orgName, primary, finalLogo, isPro, isBiz, dateLabel, typeLabel,
    reportNumber, reportLocation, authorName, authorRole, clientName, clientCompany,
    weatherCondition, accessCondition, teamMembers, materials, reportImages,
    occurrences, showSig, signature, limits, wm } = p;
  const yearLabel = p.yearLabel;

  const resumoText = report.split("\n\n").slice(0, 2).join(" ").replace(/[#*_`]/g, "").slice(0, 400);

  const sections = [
    { num: "1", title: "INTRODUÇÃO" },
    { num: "2", title: "DESENVOLVIMENTO" },
  ];
  if (teamMembers.filter(m => m.name).length > 0) sections.push({ num: "2.1", title: "Equipe envolvida" });
  if (materials.filter(m => m.item).length > 0) sections.push({ num: "2.2", title: "Materiais e equipamentos utilizados" });
  if (reportImages.length > 0) sections.push({ num: "2.3", title: "Registro fotográfico" });
  sections.push({ num: "3", title: "CONSIDERAÇÕES FINAIS E RECOMENDAÇÕES" });
  if (showSig) sections.push({ num: "4", title: "ASSINATURA TÉCNICA" });

  const paragraphs = report.split("\n\n").filter(s => s.trim());
  const intro = paragraphs.slice(0, 2).join("\n\n");
  const body = paragraphs.slice(2).join("\n\n");

  const folhaDeRosto = `
    <div style="page-break-after:always;min-height:270mm;display:flex;flex-direction:column;
      font-family:${FONT_BODY};padding:2.5cm;position:relative;background:#fff;">
      <div style="text-align:center;margin-bottom:60px;">
        ${finalLogo 
          ? `<img src="${finalLogo}" style="max-height:80px;max-width:320px;object-fit:contain;"/>` 
          : `<p style="font-size:22pt;font-weight:900;color:${primary};margin:0;letter-spacing:-0.03em;">${orgName.toUpperCase()}</p>`}
      </div>
      
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px;">
        <div style="background:${primary}15;color:${primary};padding:8px 16px;border-radius:100px;font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:38px;border:1px solid ${primary}30;">
          ${typeLabel || "Documento Técnico Executivo"}
        </div>
        <h1 style="font-size:46pt;font-weight:900;color:#0f172a;line-height:1.0;margin:0 0 28px;font-family:${FONT_TITLE};text-transform:uppercase;letter-spacing:-0.05em;">
          ${clientName || "Relatório Técnico"}
        </h1>
        <div style="width:60px;height:6px;background:${primary};margin-bottom:32px;border-radius:3px;"></div>
        ${clientCompany ? `<p style="font-size:20pt;color:#475569;font-weight:400;margin:0;font-family:${FONT_TITLE}; opacity:0.8;">${clientCompany}</p>` : ""}
      </div>
      
      <div style="margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;padding-top:60px;border-top:2px solid #f1f5f9;">
        <div>
          <p style="font-size:8.5pt;color:#94a3b8;font-weight:800;text-transform:uppercase;margin-bottom:10px;letter-spacing:0.1em;">Responsável Técnico</p>
          <p style="font-size:12pt;color:#1e293b;font-weight:800;">${authorName}</p>
          ${authorRole ? `<p style="font-size:10pt;color:#64748b;margin-top:4px;">${authorRole}</p>` : ""}
        </div>
        <div style="text-align:right;">
          <p style="font-size:8.5pt;color:#94a3b8;font-weight:800;text-transform:uppercase;margin-bottom:10px;letter-spacing:0.1em;">Local e Data</p>
          <p style="font-size:12pt;color:#1e293b;font-weight:800;">${reportLocation || "Brasil"}</p>
          <p style="font-size:10pt;color:#64748b;margin-top:4px;">${dateLabel}</p>
          <p style="font-size:9pt;color:#cbd5e0;margin-top:12px;font-weight:700;">Nº ${reportNumber || "RT-" + yearLabel}</p>
        </div>
      </div>
    </div>`;

  const resumoPage = isPro ? `
    <div style="page-break-after:always;font-family:${FONT_BODY};padding:3cm 2cm 2cm 3cm;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;border-bottom:2.5px solid ${primary};padding-bottom:12px;">
        <span style="font-size:91pt;font-weight:800;text-transform:uppercase;color:${primary};letter-spacing:0.1em;">RESUMO TÉCNICO</span>
        <span style="font-size:9pt;color:#94a3b8;font-weight:600;">${orgName}</span>
      </div>
      <h1 style="${H1_STYLE}">RESUMO</h1>
      <div style="${BODY_STYLE};line-height:1.8;">${resumoText}${resumoText.length >= 350 ? "..." : ""}</div>
      <div style="margin-top:40px;padding:20px;background:#f8fafc;border-radius:8px;border-left:5px solid ${primary};">
        <p style="${BODY_STYLE};margin:0;font-size:10pt;color:#475569;"><strong>Palavras-chave:</strong> ${typeLabel.toLowerCase()}; ${clientName ? clientName.toLowerCase() + "; " : ""}${reportLocation ? reportLocation.toLowerCase() + "; " : ""}relatório técnico; ${orgName.toLowerCase()}.</p>
      </div>
    </div>` : "";

  const sumarioPage = isPro ? `
    <div style="page-break-after:always;font-family:${FONT_BODY};padding:3cm 2cm 2cm 3cm;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;border-bottom:2.5px solid ${primary};padding-bottom:12px;">
        <span style="font-size:11pt;font-weight:800;text-transform:uppercase;color:${primary};letter-spacing:0.1em;">Sumário do Documento</span>
        <span style="font-size:9pt;color:#94a3b8;font-weight:600;">${orgName}</span>
      </div>
      <h1 style="${H1_STYLE}">SUMÁRIO</h1>
      <div style="margin-top:32px;">
        ${sections.map(s => `
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin:14px 0;${s.num.includes(".") ? "padding-left:24px;font-size:10pt;color:#475569;" : "font-weight:bold;text-transform:uppercase;font-size:11pt;color:#0f172a;"}">
            <span>${s.num} ${s.title}</span>
            <div style="flex:1;border-bottom:1px dotted #e2e8f0;margin:0 10px;height:12px;"></div>
            <span style="font-weight:700;">...</span>
          </div>`).join("")}
      </div>
    </div>` : "";

  const pageHeader = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;border-bottom:1.5px solid #000;padding-bottom:12px;">
      <span style="font-size:9pt;font-weight:bold;text-transform:uppercase;">${orgName}</span>
      <span style="font-size:9pt;color:#666;text-transform:uppercase;">${typeLabel}${reportNumber ? ` · Nº ${reportNumber}` : ""}</span>
    </div>`;

  const introPage = `
    <div style="page-break-after:always;font-family:${FONT_BODY};padding:3cm 2cm 2cm 3cm;">
      ${pageHeader}
      <h1 style="${H1_STYLE}">1 INTRODUÇÃO</h1>
      <div style="${BODY_STYLE}">${mdToHtml(intro)}</div>
      
      <div style="margin-top:40px;">
        <p style="font-size:8pt;font-weight:800;text-transform:uppercase;margin-bottom:12px;letter-spacing:0.1em;color:${primary};">Dados de Identificação</p>
        <table style="width:100%;border-collapse:collapse;font-size:10.5pt;font-family:${FONT_BODY};border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:700;width:35%;background:#f8fafc;color:#475569;">Natureza do Documento</td><td style="padding:12px;border:1px solid #e2e8f0;color:#1e293b;">${typeLabel}</td></tr>
          ${reportNumber ? `<tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc;color:#475569;">Referência Interna</td><td style="padding:12px;border:1px solid #e2e8f0;color:#1e293b;">${reportNumber}</td></tr>` : ""}
          <tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc;color:#475569;">Data de Emissão</td><td style="padding:12px;border:1px solid #e2e8f0;color:#1e293b;">${dateLabel}</td></tr>
          ${reportLocation ? `<tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc;color:#475569;">Local de Execução</td><td style="padding:12px;border:1px solid #e2e8f0;color:#1e293b;">${reportLocation}</td></tr>` : ""}
          ${clientName ? `<tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc;color:#475569;">Interessado / Cliente</td><td style="padding:12px;border:1px solid #e2e8f0;color:#1e293b;">${clientName}${clientCompany ? ` — ${clientCompany}` : ""}</td></tr>` : ""}
          ${weatherCondition || accessCondition ? `<tr><td style="padding:12px;border:1px solid #e2e8f0;font-weight:700;background:#f8fafc;color:#475569;">Condições Adversas</td><td style="padding:12px;border:1px solid #e2e8f0;color:#1e293b;">${[weatherCondition, accessCondition].filter(Boolean).join(" · ")}</td></tr>` : ""}
        </table>
      </div>
    </div>`;

  const teamTable = teamMembers.filter(m => m.name).length > 0
    ? `<div style="margin-top:32px;">
        <h2 style="${H2_STYLE}">2.1 Equipe técnica envolvida</h2>
        <table style="width:100%;border-collapse:collapse;font-size:10pt;font-family:${FONT_BODY};border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <thead><tr style="background:#f1f5f9;color:#475569;">
            <th style="padding:10px 12px;border:1px solid #e2e8f0;text-align:left;text-transform:uppercase;font-size:8.5pt;letter-spacing:0.05em;">Profissional</th>
            <th style="padding:10px 12px;border:1px solid #e2e8f0;text-align:left;text-transform:uppercase;font-size:8.5pt;letter-spacing:0.05em;">Função / Atribuição</th>
            <th style="padding:10px 12px;border:1px solid #e2e8f0;text-align:right;text-transform:uppercase;font-size:8.5pt;letter-spacing:0.05em;">H.H.</th>
          </tr></thead>
          <tbody>${teamMembers.filter(m => m.name).map((m, i) => `
            <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
              <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#1e293b;font-weight:600;">${m.name}</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#64748b;">${m.role || "—"}</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:700;color:${primary};">${m.hours || "—"}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>` : "";

  const materialsTable = materials.filter(m => m.item).length > 0
    ? `<div style="margin-top:32px;">
        <h2 style="${H2_STYLE}">2.2 Recursos e insumos utilizados</h2>
        <table style="width:100%;border-collapse:collapse;font-size:10pt;font-family:${FONT_BODY};border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <thead><tr style="background:#f1f5f9;color:#475569;">
            <th style="padding:10px 12px;border:1px solid #e2e8f0;text-align:left;text-transform:uppercase;font-size:8.5pt;letter-spacing:0.05em;">Descrição do Item</th>
            <th style="padding:10px 12px;border:1px solid #e2e8f0;text-align:right;text-transform:uppercase;font-size:8.5pt;letter-spacing:0.05em;">Qtd</th>
            <th style="padding:10px 12px;border:1px solid #e2e8f0;text-align:left;text-transform:uppercase;font-size:8.5pt;letter-spacing:0.05em;">Unid.</th>
          </tr></thead>
          <tbody>${materials.filter(m => m.item).map((m, i) => `
            <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
              <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#1e293b;font-weight:500;">${m.item}</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:700;color:${primary};">${m.qty || "—"}</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#64748b;">${m.unit || "—"}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>` : "";

  const photosSection = reportImages.length > 0
    ? `<div style="margin-top:40px;">
        <h2 style="${H2_STYLE}">2.3 Evidências fotográficas</h2>
        <p style="${BODY_STYLE};font-size:11pt;margin-bottom:24px;">Os registros fotográficos abaixo consolidam as observações técnicas pertinentes à execução do serviço.</p>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;">
          ${reportImages.map((img, i) => `
            <div style="break-inside:avoid;text-align:center;padding:12px;border:1px solid #eee;background:#fff;">
              <div style="width:100%;height:190px;overflow:hidden;border:1px solid #eee;margin-bottom:10px;">
                <img src="${img.url}" style="width:100%;height:100%;object-fit:cover;"/>
              </div>
              <p style="font-size:10pt;font-weight:bold;margin:4px 0;text-transform:uppercase;color:#333;">Figura ${i + 1}</p>
              ${img.caption ? `<p style="font-size:10pt;color:#666;font-style:italic;margin:0;">${img.caption}</p>` : ""}
            </div>`).join("")}
        </div>
      </div>` : "";

  const devPage = `
    <div style="page-break-after:always;font-family:${FONT_BODY};padding:3cm 2cm 2cm 3cm;">
      ${pageHeader}
      <h1 style="${H1_STYLE}">2 DESENVOLVIMENTO</h1>
      <div style="${BODY_STYLE}">${mdToHtml(body)}</div>
      ${teamTable}
      ${materialsTable}
      ${photosSection}
    </div>`;

  const conclusionPage = `
    <div style="${showSig ? 'page-break-after:always;' : ''}font-family:${FONT_BODY};padding:3cm 2cm 2cm 3cm;">
      ${pageHeader}
      <h1 style="${H1_STYLE}">3 CONSIDERAÇÕES FINAIS</h1>
      <p style="${BODY_STYLE}">O presente documento técnico foi elaborado sob os preceitos da boa técnica e ética profissional, refletindo com fidedignidade as condições encontradas e os serviços executados no período reportado.</p>
      ${occurrences ? `
        <div style="margin-top:32px;padding:24px;background:#fffefe;border:1.5px solid #fee2e2;border-radius:12px;">
          <p style="font-size:9pt;font-weight:800;text-transform:uppercase;color:#991b1b;margin-bottom:12px;letter-spacing:0.05em;">Anomalias e Observações Relevantes</p>
          <div style="${BODY_STYLE};margin:0;font-size:10.5pt;color:#7f1d1d;">${mdToHtml(occurrences)}</div>
        </div>` : ""}
    </div>`;

  const sigPage = showSig ? `
    <div style="font-family:${FONT_BODY};padding:3cm 2cm 2cm 3cm;">
      ${pageHeader}
      <h1 style="${H1_STYLE}">4 ENCERRAMENTO E ASSINATURA</h1>
      <div style="margin-top:100px;max-width:350px;margin-left:auto;margin-right:auto;text-align:center;">
        ${signature.image_url && limits.canUseSignatureImage
          ? `<img src="${signature.image_url}" style="max-height:85px;max-width:280px;object-fit:contain;margin-bottom:12px;"/>`
          : `<div style="height:85px;"></div>`}
        <div style="width:100%;height:2px;background:#0f172a;margin-bottom:12px;border-radius:1px;"></div>
        <p style="font-size:13pt;font-weight:800;margin:0;text-transform:uppercase;color:#0f172a;letter-spacing:0.02em;">${signature.signer_name || ""}</p>
        <p style="font-size:10pt;color:#64748b;margin:4px 0 0;font-weight:600;">${signature.signer_role || ""}</p>
        <p style="font-size:8.5pt;color:#94a3b8;margin:12px 0 0;font-style:italic;">Emitido eletronicamente em ${dateLabel}</p>
      </div>
    </div>` : "";

  const footer = `
    <div style="position:fixed;bottom:0;left:0;right:0;padding:12px 3cm;
      display:flex;justify-content:space-between;align-items:center;font-size:8.5pt;color:#94a3b8;font-family:${FONT_BODY};border-top:1px solid #f1f5f9;background:#fff;z-index:100;">
      <span style="font-weight:600;">${orgName} · ${typeLabel}</span>
      <span style="letter-spacing:0.1em;">PÁGINA <span class="page-number"></span> DE <span class="page-count"></span></span>
      ${!isBiz ? `<span style="font-weight:bold;color:#cbd5e0;">RELATÓRIOFLOW</span>` : `<span>${dateLabel}</span>`}
    </div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${clientName || typeLabel}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    ${GOOGLE_FONTS}
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    body { font-family: ${FONT_BODY}; font-size: 11pt; line-height: 1.5; color: #1e293b; background: #fff; margin: 0; padding: 0; counter-reset: page; }
    h1, h2, h3, h4 { font-family: ${FONT_BODY}; }
    .page-number::after { counter-increment: page; content: counter(page); }
    /* Para PDF total de páginas, requer injeção via script ou backend, mas para impressão básica counter(page) resolve a numeração atual */
  </style>
</head>
<body>
  ${wm}
  ${folhaDeRosto}
  ${resumoPage}
  ${sumarioPage}
  ${introPage}
  ${devPage}
  ${conclusionPage}
  ${sigPage}
  ${footer}
  <script>
    window.onload = function() {
      // Estimate pages or just set basic counter
      const pageCounts = document.querySelectorAll('.page-count');
      // In a real PDF print, we'd need more complex logic, but for now we'll 
      // just ensure the current page counter works. 
      // Most print engines ignore JS-based total page counts unless it's calculated before print.
      setTimeout(function(){ window.print(); }, 800);
    };
  </script>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════
   RDO — Diário de Obra
   Base: Resolução CONFEA 1.094/2017 + NBR 12.722
══════════════════════════════════════════════════ */
function buildRDOTemplate(p: TemplateParams): string {
  const PRIMARY = p.primary || "#2563eb"; // Vibrant Blue default for RDO

  const lines = p.report.replace(/[#*_`]/g, "").split("\n").map(l => l.trim()).filter(Boolean);
  const servicosLines: string[] = [];
  const ocorrenciasLines: string[] = [];
  let inOcorrencias = false;
  for (const line of lines) {
    const low = line.toLowerCase();
    if (low.includes("ocorrência") || low.includes("problema") ||
        low.includes("impedimento") || low.includes("não conformidade")) {
      inOcorrencias = true;
    }
    if (inOcorrencias) ocorrenciasLines.push(line);
    else servicosLines.push(line);
  }

  const servicosHtml = servicosLines.map((l, i) =>
    `<tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
      <td style="padding:12px 14px;border-bottom:1px solid #edf2f7;font-size:10pt;color:#2d3748;line-height:1.4;">${l}</td>
    </tr>`).join("");

  const teamRows = p.teamMembers.filter(m => m.name).length > 0
    ? p.teamMembers.filter(m => m.name).map((m, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding:10px 14px;border-bottom:1px solid #edf2f7;font-size:9.5pt;font-weight:600;color:#1a202c;">${m.name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #edf2f7;font-size:9pt;color:#718096;">${m.role || "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #edf2f7;font-size:9.5pt;text-align:right;color:#1a202c;font-weight:700;">${m.hours || "—"}h</td>
      </tr>`).join("")
    : `<tr><td colspan="3" style="padding:24px;text-align:center;color:#a0aec0;font-size:9pt;font-style:italic;">Nenhum profissional registrado</td></tr>`;

  const materiaisRows = p.materials.filter(m => m.item).length > 0
    ? p.materials.filter(m => m.item).map((m, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding:10px 14px;border-bottom:1px solid #edf2f7;font-size:9pt;font-weight:500;color:#1e293b;">${m.item}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #edf2f7;font-size:9.5pt;text-align:center;color:${PRIMARY};font-weight:700;">${m.qty || "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #edf2f7;font-size:8.5pt;text-align:right;color:#64748b;">${m.unit || "—"}</td>
      </tr>`).join("")
    : `<tr><td colspan="3" style="padding:20px;text-align:center;color:#94a3b8;font-size:8.5pt;font-style:italic;">Nenhum material registrado</td></tr>`;

  const photosGrid = p.reportImages.length > 0
    ? `<div style="margin-top:32px;break-inside:avoid;">
        <div style="display:flex;align-items:center;margin-bottom:16px;">
          <div style="width:4px;height:18px;background:${PRIMARY};margin-right:10px;border-radius:2px;"></div>
          <h3 style="font-size:11pt;font-weight:800;color:#1a202c;margin:0;text-transform:uppercase;letter-spacing:0.05em;">REGISTRO FOTOGRÁFICO</h3>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">
          ${p.reportImages.map((img, i) => `
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
              <img src="${img.url}" style="width:100%;height:200px;object-fit:cover;display:block;"/>
              <div style="padding:12px;background:#fff;border-top:1px solid #f7fafc;">
                <p style="font-size:9pt;font-weight:700;color:#2d3748;margin:0;">FOTO ${(i + 1).toString().padStart(2, "0")}</p>
                ${img.caption ? `<p style="font-size:8.5pt;color:#718096;margin:4px 0 0;line-height:1.4;">${img.caption}</p>` : ""}
              </div>
            </div>`).join("")}
        </div>
      </div>` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>RDO — ${p.clientName || p.orgName}</title>
  <style>
    ${GOOGLE_FONTS}
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    body { font-family: ${FONT_BODY}; font-size: 10.5pt; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
    .page { background: #fff; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 40px 48px; position: relative; }
    h1, h2, h3, h4 { font-family: ${FONT_BODY}; }
    @media print { body { background: #fff; } .page { width: 100%; box-shadow: none; padding: 2cm 2.5cm; } }
  </style>
</head>
<body>
  ${p.wm}
  <div class="page">
    <!-- HEADER PREMIUM -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;padding-top:10px;">
      <div>
        ${p.finalLogo 
          ? `<img src="${p.finalLogo}" style="max-height:65px;max-width:260px;object-fit:contain;"/>` 
          : `<div style="font-weight:900;color:${PRIMARY};font-size:22px;letter-spacing:-0.04em;font-family:${FONT_TITLE};">${p.orgName.toUpperCase()}</div>`}
      </div>
      <div style="text-align:right;">
        <div style="display:inline-block;background:${PRIMARY}10;color:${PRIMARY};padding:6px 14px;border-radius:100px;font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;border:1px solid ${PRIMARY}20;">
          Relatório Técnico Oficial
        </div>
        <p style="font-size:9pt;color:#94a3b8;font-weight:700;margin-top:8px;font-family:${FONT_TITLE};">Cód. Documento: ${p.reportNumber || "RDO-"+p.yearLabel}</p>
      </div>
    </div>
    
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:22pt;font-weight:400;color:#000;margin:0;font-family:${FONT_TITLE};">Diário de Obra</h1>
      <p style="font-size:10pt;color:#64748b;margin:4px 0 0;font-weight:600;font-family:${FONT_BODY};">${p.dateLabel}</p>
    </div>

    <!-- IDENTIFICAÇÃO GRID -->
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:0;margin-bottom:32px;border:1.5px solid #2563eb;border-radius:4px;overflow:hidden;background:#fff;">
      <div style="padding:20px 24px;border-right:1.5px solid #2563eb;">
        <p style="font-size:7pt;color:#2563eb;font-weight:800;text-transform:uppercase;margin-bottom:8px;letter-spacing:0.05em;">Identificação do Empreendimento</p>
        <div style="display:grid;grid-template-columns:110px 1fr;gap:8px 12px;font-size:9pt;line-height:1.4;">
          <span style="color:#718096;">Empreendimento:</span><span style="font-weight:700;color:#1a202c;">${p.clientName || "—"}</span>
          <span style="color:#718096;">Proprietário:</span><span style="font-weight:700;color:#1a202c;">${p.clientCompany || "—"}</span>
          <span style="color:#718096;">Local / Endereço:</span><span style="color:#4a5568;">${p.reportLocation || "—"}</span>
          <span style="color:#718096;">Resp. Técnico:</span><span style="font-weight:700;color:#1a202c;">${p.authorName}</span>
        </div>
      </div>
      <div style="padding:20px 24px;display:grid;grid-template-columns:80px 1fr;gap:8px 12px;font-size:9pt;line-height:1.4;background:#f8fafc;">
        <span style="color:#718096;">Data:</span><span style="font-weight:700;color:#1a202c;">${p.dateLabel}</span>
        <span style="color:#718096;">Nº RDO:</span><span style="font-weight:700;color:#1a202c;">${p.reportNumber || p.yearLabel}</span>
        <span style="color:#718096;">Empresa:</span><span style="font-weight:700;color:#1a202c;">${p.orgName}</span>
      </div>
    </div>

    <!-- STATUS BADGES -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;">
      <div style="padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
        <p style="font-size:7.5pt;color:#718096;font-weight:800;text-transform:uppercase;margin:0 0 8px;">Clima / Tempo</p>
        <p style="font-size:10pt;color:#2d3748;font-weight:800;margin:0;">${p.weatherCondition || "—"}</p>
      </div>
      <div style="padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
        <p style="font-size:7.5pt;color:#718096;font-weight:800;text-transform:uppercase;margin:0 0 8px;">Condição Acesso</p>
        <p style="font-size:10pt;color:#2d3748;font-weight:800;margin:0;">${p.accessCondition || "—"}</p>
      </div>
      <div style="padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
        <p style="font-size:7.5pt;color:#718096;font-weight:800;text-transform:uppercase;margin:0 0 8px;">Estado da Obra</p>
        <p style="font-size:10pt;color:#2d3748;font-weight:800;margin:0;">${p.siteCondition || "Ativa"}</p>
      </div>
      <div style="padding:16px;background:#f7fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
        <p style="font-size:7.5pt;color:#718096;font-weight:800;text-transform:uppercase;margin:0 0 8px;">Turno Trabalho</p>
        <p style="font-size:10pt;color:#2d3748;font-weight:800;margin:0;">Diurno (07h-17h)</p>
      </div>
    </div>

    <!-- SERVIÇOS EXECUTADOS -->
    <div style="margin-bottom:32px;border:1px solid #cbd5e0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);break-inside:avoid;">
      <div style="background:#1a202c;color:#fff;padding:14px 20px;font-size:9pt;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;display:flex;align-items:center;">
        <span style="margin-right:12px;">📋</span> ATIVIDADES EXECUTADAS NO PERÍODO
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${servicosHtml}</tbody>
      </table>
    </div>

    <!-- TÉCNICO E MATERIAL GRID -->
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:24px;margin-bottom:32px;break-inside:avoid;">
      <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;">
        <div style="background:#f7fafc;padding:12px 20px;border-bottom:1px solid #edf2f7;font-size:9pt;font-weight:800;color:#4a5568;text-transform:uppercase;letter-spacing:0.05em;">Efetivo em Campo</div>
        <table style="width:100%;border-collapse:collapse;">
          <tbody>${teamRows}</tbody>
        </table>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;">
        <div style="background:#f7fafc;padding:12px 20px;border-bottom:1px solid #edf2f7;font-size:9pt;font-weight:800;color:#4a5568;text-transform:uppercase;letter-spacing:0.05em;">Materiais / Equip.</div>
        <table style="width:100%;border-collapse:collapse;">
          <tbody>${materiaisRows}</tbody>
        </table>
      </div>
    </div>

    <!-- OCORRÊNCIAS -->
    <div style="margin-bottom:32px;break-inside:avoid;">
      <div style="display:flex;align-items:center;margin-bottom:12px;">
        <div style="width:4px;height:18px;background:#e53e3e;margin-right:10px;border-radius:2px;"></div>
        <h3 style="font-size:11pt;font-weight:800;color:#1a202c;margin:0;text-transform:uppercase;letter-spacing:0.05em;">OCORRÊNCIAS E PENDÊNCIAS</h3>
      </div>
      <div style="padding:20px;border:1px solid #fed7d7;border-radius:12px;font-size:10pt;line-height:1.7;color:#2d3748;background:#fff5f5;min-height:80px;">
        ${p.occurrences ? p.occurrences.replace(/\n/g, "<br/>") : ocorrenciasLines.length > 0 ? ocorrenciasLines.join("<br/>") : '<span style="color:#a0aec0;font-style:italic;">Nenhum impedimento ou ocorrência crítica registrada.</span>'}
      </div>
    </div>

    ${photosGrid}

    <!-- ASSINATURAS FINAL -->
    <div style="margin-top:64px;display:grid;grid-template-columns:1fr 1fr;gap:48px;break-inside:avoid;">
      <div style="text-align:center;">
        <div style="height:60px;display:flex;align-items:flex-end;justify-content:center;">
          ${p.signature?.image_url && p.limits?.canUseSignatureImage 
            ? `<img src="${p.signature.image_url}" style="max-height:60px;max-width:200px;object-fit:contain;"/>` 
            : ""}
        </div>
        <div style="width:100%;height:1.5px;background:#1a202c;margin:12px 0 8px;"></div>
        <p style="font-size:10.5pt;font-weight:800;margin:0;text-transform:uppercase;">${p.authorName}</p>
        <p style="font-size:8.5pt;color:#718096;margin:4px 0 0;font-weight:600;">Resp. Técnico · ${p.orgName}</p>
      </div>
      <div style="text-align:center;">
        <div style="height:60px;"></div>
        <div style="width:100%;height:1.5px;background:#1a202c;margin:12px 0 8px;"></div>
        <p style="font-size:10.5pt;font-weight:800;margin:0;text-transform:uppercase;">${p.clientName || "FISCALIZAÇÃO"}</p>
        <p style="font-size:8.5pt;color:#718096;margin:4px 0 0;font-weight:600;">Assinatura de Recebimento</p>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="margin-top:60px;text-align:center;font-size:8pt;color:#a0aec0;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-top:1px solid #edf2f7;padding-top:24px;">
      ${p.orgName} · RDO Nº ${p.reportNumber || "—"} · EMISSÃO: ${p.dateLabel}
      ${!p.isBiz ? `<br/><span style="font-weight:400;text-transform:none;color:#cbd5e0;margin-top:4px;display:block;">Processado eletronicamente via RelatórioFlow</span>` : ""}
    </div>
  </div>

  <script>window.onload=function(){setTimeout(function(){window.print();},850);};</script>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════
   ATA DE REUNIÃO
══════════════════════════════════════════════════ */
function buildAtaTemplate(p: TemplateParams): string {
  const PRIMARY = p.primary || "#7c3aed"; // Vibrant Purple default for Ata
  const paragraphs = p.report.replace(/[#*_`]/g, "").split(/\n\n+/).map(s => s.trim()).filter(Boolean);

  /* --- Peças de Conteúdo --- */
  const participantesRows = p.teamMembers.filter(m => m.name).length > 0
    ? p.teamMembers.filter(m => m.name).map((m, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:10pt;text-align:center;color:#64748b;">${i + 1}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:10pt;font-weight:600;color:#1e293b;">${m.name}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:10pt;color:#64748b;">${m.role || "—"}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;width:30%;"></td>
      </tr>`).join("")
    : `<tr>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:10pt;text-align:center;color:#94a3b8;">1</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:10pt;font-weight:600;color:#1e293b;">${p.authorName}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:10pt;color:#64748b;">${p.authorRole || "Coordenador"}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;width:30%;"></td>
      </tr>`;

  const ataCorpo = paragraphs.map(para => `
    <p style="text-align:justify;line-height:1.7;font-size:11pt;margin:0 0 16px;color:#1e293b;font-family:${FONT_BODY};">
      ${para}
    </p>`).join("");

  const encaminhamentos = p.occurrences
    ? p.occurrences.split("\n").filter(Boolean).map((item, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:10pt;text-align:center;color:#64748b;">${i + 1}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:10pt;color:#1e293b;">${item}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;width:20%;"></td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;width:15%;"></td>
      </tr>`).join("")
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ata de Reunião — ${p.clientName || p.orgName}</title>
  <style>
    ${GOOGLE_FONTS}
    @page { size: A4; margin: 0; }
    @media print { @page { margin: 1.5cm 2cm; } }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    body { font-family: ${FONT_BODY}; font-size: 11pt; color: #1e293b; background: #fff; margin:0; padding:0; }
  </style>
</head>
<body>
  ${p.wm}
  <div style="padding:2.5cm 2cm; max-width:210mm; margin:0 auto; min-height:297mm; display:flex; flex-direction:column;">
    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:12px;border-bottom:1.5px solid #f1f5f9;">
      <div>
        ${p.finalLogo 
          ? `<img src="${p.finalLogo}" style="max-height:60px;max-width:180px;object-fit:contain;"/>` 
          : `<div style="font-weight:900;color:${PRIMARY};font-size:16px;">${p.orgName.toUpperCase()}</div>`}
      </div>
      <div style="text-align:right;font-size:8pt;color:#94a3b8;font-weight:700;">
        ATA DE REUNIÃO TÉCNICA
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:32px;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;background:#f9fafb;padding:20px;">
      <div style="display:grid;grid-template-columns:100px 1fr;gap:8px 12px;font-size:10pt;">
        <span style="color:#6b7280;">Data:</span><span style="font-weight:700;color:#111827;">${p.dateLabel}</span>
        <span style="color:#6b7280;">Local:</span><span style="font-weight:700;color:#111827;">${p.reportLocation || "A definir"}</span>
        <span style="color:#6b7280;">Coordenador:</span><span style="font-weight:700;color:#111827;">${p.authorName}</span>
      </div>
      <div style="display:grid;grid-template-columns:100px 1fr;gap:8px 12px;font-size:10pt;">
        <span style="color:#6b7280;">Hora:</span><span style="font-weight:700;color:#111827;">${p.reportDate ? new Date(p.reportDate).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}) : "14h00"}</span>
        <span style="color:#6b7280;">Secretário(a):</span><span style="color:#4b5563;">Maria Santos</span>
      </div>
    </div>

    <!-- TITLE -->
    <div style="text-align:center;margin-bottom:48px;">
      <h1 style="font-size:15pt;font-weight:800;color:#0f172a;margin:0;text-transform:uppercase;letter-spacing:0.05em;font-family:${FONT_TITLE};">ATA DE REUNIÃO</h1>
      <p style="font-size:10pt;color:#64748b;margin:8px 0 0;font-weight:600;">${p.clientName || "Documento Técnico"} · ${p.dateLabel}</p>
    </div>

    <!-- 1. PARTICIPANTES -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:11pt;font-weight:800;color:${PRIMARY};margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">1 PARTICIPANTES</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#f8fafc;color:#64748b;">
          <th style="padding:10px;border:1px solid #e2e8f0;font-size:8pt;text-align:center;width:40px;">#</th>
          <th style="padding:10px;border:1px solid #e2e8f0;font-size:8pt;text-align:left;">NOME COMPLETO</th>
          <th style="padding:10px;border:1px solid #e2e8f0;font-size:8pt;text-align:left;">CARGO / EMPRESA</th>
          <th style="padding:10px;border:1px solid #e2e8f0;font-size:8pt;text-align:left;">ASSINATURA / RUBRICA</th>
        </tr></thead>
        <tbody>${participantesRows}</tbody>
      </table>
    </div>

    <!-- 2. DELIBERAÇÕES -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:11pt;font-weight:800;color:${PRIMARY};margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">2 DELIBERAÇÕES E NOTAS</h2>
      <div style="padding:4px 0;">${ataCorpo}</div>
    </div>

    <!-- 3. ENCAMINHAMENTOS -->
    ${encaminhamentos ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:11pt;font-weight:800;color:${PRIMARY};margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">3 ENCAMINHAMENTOS E PRAZOS</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#f8fafc;color:#64748b;">
          <th style="padding:10px;border:1px solid #e2e8f0;font-size:8pt;width:40px;">#</th>
          <th style="padding:10px;border:1px solid #e2e8f0;font-size:8pt;text-align:left;">AÇÃO / ATIVIDADE</th>
          <th style="padding:10px;border:1px solid #e2e8f0;font-size:8pt;width:120px;">RESPONSÁVEL</th>
          <th style="padding:10px;border:1px solid #e2e8f0;font-size:8pt;width:80px;">PRAZO</th>
        </tr></thead>
        <tbody>${encaminhamentos}</tbody>
      </table>
    </div>` : ""}

    <!-- FOOTER SIGNATURE -->
    <div style="margin-top:auto; padding-top:40px; border-top:1.5px solid #f1f5f9; display:flex; justify-content:space-between; font-size:9pt; color:#94a3b8;">
      <span>${p.orgName.toUpperCase()} · ${p.yearLabel}</span>
      <span>Página 1 de 1</span>
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},850);};</script>
</body>
</html>`;
}


/* ══════════════════════════════════════════════════
   PROPOSTA COMERCIAL / ORÇAMENTO
══════════════════════════════════════════════════ */
function buildCommercialTemplate(p: TemplateParams): string {
  const PRIMARY = p.primary || "#059669"; // Vibrant Green default for Commercial
  const isOrcamento = p.reportType === "orcamento";
  const docTitle = isOrcamento ? "ORÇAMENTO TÉCNICO" : "PROPOSTA COMERCIAL";

  const paragraphs = p.report.replace(/[#*_`]/g, "").split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  const apresentacao = paragraphs.slice(0, 2).join("</p><p style=\"text-align:justify;line-height:1.7;font-size:11pt;margin:0 0 14px;color:#1e293b;\">");
  const escopo = paragraphs.slice(2, 5).join("</p><p style=\"text-align:justify;line-height:1.7;font-size:11pt;margin:0 0 14px;color:#1e293b;\">");
  const methodParagraphs = paragraphs.slice(5, 7).map(para => `<p style="text-align:justify;line-height:1.7;font-size:11pt;margin:0 0 14px;color:#1e293b;">${para}</p>`);

  const items = p.commercialItems?.length
    ? p.commercialItems
    : p.materials.filter(m => m.item).map(m => ({ ...m, price: m.price || "", total: 0 }));
  
  const subtotal = p.commercialItems?.reduce((a, m) => a + (m.total || 0), 0) || 0;
  const bdi = p.bdiPercent ? subtotal * (parseFloat(p.bdiPercent) / 100) : 0;
  const total = subtotal + bdi;

  const fmtBRL = (v: number) => v > 0
    ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
    : "_________";

  const itemRows = items.length > 0
    ? items.map((m: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding:14px 12px;border-bottom:1px solid #edf2f7;text-align:center;font-size:10pt;color:#718096;">${(i + 1).toString().padStart(2, "0")}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #edf2f7;font-size:10pt;color:#1a202c;font-weight:600;">${m.item}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #edf2f7;text-align:center;font-size:10pt;color:#1a202c;">${m.qty || "—"}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #edf2f7;text-align:right;font-size:10pt;color:#718096;">${m.unit || "—"}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #edf2f7;text-align:right;font-size:10pt;color:#1a202c;">
          ${m.price ? `R$ ${parseFloat((m.price || "0").replace(",", ".")).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ —"}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #edf2f7;text-align:right;font-size:10pt;color:#1a202c;font-weight:700;">
          ${m.total > 0 ? `R$ ${fmtBRL(m.total)}` : "R$ —"}
        </td>
      </tr>`).join("")
    : `<tr><td colspan="6" style="padding:32px;text-align:center;color:#a0aec0;font-size:10pt;font-style:italic;">Nenhum item financeiro detalhado</td></tr>`;

  const cover = `
    <div style="page-break-after:always;min-height:280mm;display:flex;background:#fff;position:relative;overflow:hidden;font-family:${FONT_BODY};">
      <div style="width:14px;background:${PRIMARY};height:100%;"></div>
      <div style="flex:1;padding:80px 70px;display:flex;flex-direction:column;">
        <div style="margin-bottom:80px;">
          ${p.finalLogo 
            ? `<img src="${p.finalLogo}" style="max-height:80px;max-width:240px;object-fit:contain;"/>` 
            : `<div style="font-size:24px;font-weight:900;color:${PRIMARY};letter-spacing:-0.03em;font-family:${FONT_BODY};">${p.orgName.toUpperCase()}</div>`}
        </div>

        <div style="margin-top:auto;margin-bottom:auto;">
          <div style="display:inline-block;padding:10px 18px;background:${PRIMARY}10;color:${PRIMARY};font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;border-radius:4px;margin-bottom:32px;">
            Documento Técnico-Comercial
          </div>
          <h1 style="font-size:48pt;font-weight:900;color:#0f172a;margin:0 0 24px;line-height:0.95;letter-spacing:-0.05em;text-transform:uppercase;font-family:${FONT_BODY};">${docTitle}</h1>
          <div style="width:80px;height:8px;background:${PRIMARY};margin-bottom:48px;border-radius:4px;"></div>
          
          <div style="margin-top:60px;">
            <p style="font-size:10pt;color:#94a3b8;margin:0 0 8px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Preparado para:</p>
            <p style="font-size:32pt;color:#1e293b;margin:0;font-weight:900;line-height:1.1;letter-spacing:-0.03em;">${p.clientName || "Cliente Especial"}</p>
            ${p.clientCompany ? `<p style="font-size:18pt;color:#64748b;margin:12px 0 0;font-weight:500;">${p.clientCompany}</p>` : ""}
          </div>
        </div>

        <div style="margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;padding-top:48px;border-top:1px solid #f1f5f9;">
          <div>
            <p style="font-size:8pt;color:#94a3b8;text-transform:uppercase;font-weight:800;margin-bottom:6px;letter-spacing:0.05em;">Data de Emissão</p>
            <p style="font-size:12pt;color:#1e293b;font-weight:700;">${p.dateLabel}</p>
          </div>
          <div>
            <p style="font-size:8pt;color:#94a3b8;text-transform:uppercase;font-weight:800;margin-bottom:6px;letter-spacing:0.05em;">Referência de Proposta</p>
            <p style="font-size:12pt;color:#1e293b;font-weight:700;">${p.reportNumber || "REF-" + p.yearLabel}</p>
          </div>
        </div>
      </div>
    </div>`;

  const header = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;padding-bottom:16px;border-bottom:2px solid #f7fafc;">
      <div style="display:flex;align-items:center;gap:14px;">
        ${p.finalLogo 
          ? `<img src="${p.finalLogo}" style="max-height:35px;max-width:120px;object-fit:contain;"/>` 
          : `<span style="font-weight:900;color:${PRIMARY};font-size:16px;letter-spacing:-0.02em;">${p.orgName}</span>`}
      </div>
      <div style="text-align:right;">
        <p style="font-size:8.5pt;color:#64748b;margin:0;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;font-family:${FONT_BODY};">${docTitle}</p>
        <p style="font-size:9pt;color:#94a3b8;margin:2px 0 0;font-weight:600;font-family:${FONT_BODY};">${p.clientName} · ${p.dateLabel}</p>
      </div>
    </div>`;

  const financialSummary = `
    <div style="margin-top:0;background:#fff;padding:0;break-inside:avoid;">
      <div style="display:flex;justify-content:flex-end;padding:14px 20px;border:1px solid #edf2f7;border-top:0;">
        <span style="color:#1e293b;font-size:10pt;font-weight:800;text-transform:uppercase;margin-right:32px;">Subtotal</span>
        <span style="color:#1e293b;font-size:10pt;font-weight:800;">R$ ${fmtBRL(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;background:${PRIMARY};padding:18px 24px;color:#fff;">
        <span style="font-size:11pt;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;">Valor Total</span>
        <div style="text-align:right;">
          <span style="font-size:16pt;font-weight:900;letter-spacing:-0.02em;">R$ ${fmtBRL(total)}</span>
        </div>
      </div>
    </div>`;

  const content = `
    <div style="font-family:${FONT_BODY};padding:50px 70px;">
      ${header}
      
      <!-- 01 APRESENTAÇÃO -->
      <div style="margin-bottom:48px;">
        <div style="display:flex;align-items:center;margin-bottom:20px;border-left:5px solid ${PRIMARY};padding-left:14px;">
          <h2 style="font-size:15pt;font-weight:900;color:${PRIMARY};margin:0;text-transform:uppercase;letter-spacing:0.05em;">1. Apresentação</h2>
        </div>
        <div style="color:#4a5568;text-align:justify;line-height:1.8;font-size:11.5pt;">
          <p style="margin:0 0 16px;">Prezado(a) <strong>${p.clientName}</strong>,</p>
          <p style="margin:0 0 16px;">A <strong>${p.orgName}</strong> tem a satisfação de submeter esta proposta, reafirmando nosso compromisso com a excelência técnica e agilidade no atendimento às suas demandas.</p>
          <div style="margin-top:16px;">${apresentacao}</div>
        </div>
      </div>

      <!-- 02 ESCOPO -->
      <div style="margin-bottom:48px;">
        <div style="display:flex;align-items:center;margin-bottom:20px;border-left:5px solid ${PRIMARY};padding-left:14px;">
          <h2 style="font-size:15pt;font-weight:900;color:${PRIMARY};margin:0;text-transform:uppercase;letter-spacing:0.05em;">2. Escopo dos Serviços</h2>
        </div>
        <div style="color:#4a5568;text-align:justify;line-height:1.8;font-size:11.5pt;">
          <p style="font-weight:800;color:#2d3748;margin-bottom:12px;text-transform:uppercase;font-size:10pt;">Atuação Técnica:</p>
          <div style="margin:0 0 24px;">${escopo}</div>
          <div style="margin-top:16px;">
            <p style="font-weight:800;color:#2d3748;margin-bottom:12px;text-transform:uppercase;font-size:10pt;">Prazos e Entregáveis:</p>
            ${methodParagraphs.join("")}
          </div>
        </div>
      </div>

      <!-- 03 INVESTIMENTO -->
      <div style="margin-bottom:48px;break-inside:auto;">
        <div style="display:flex;align-items:center;margin-bottom:24px;border-left:5px solid ${PRIMARY};padding-left:14px;">
          <h2 style="font-size:15pt;font-weight:900;color:${PRIMARY};margin:0;text-transform:uppercase;letter-spacing:0.05em;">4. Composição de Preços</h2>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:10px;border:1px solid #edf2f7;">
          <thead>
            <tr style="background:${PRIMARY};color:#fff;">
              <th style="padding:16px 12px;text-align:center;font-size:9pt;font-weight:800;width:50px;">#</th>
              <th style="padding:16px 12px;text-align:left;font-size:9pt;font-weight:800;">DESCRIÇÃO DO ITEM / SERVIÇO</th>
              <th style="padding:16px 12px;text-align:center;font-size:9pt;font-weight:800;">QTD</th>
              <th style="padding:16px 12px;text-align:center;font-size:9pt;font-weight:800;">UN</th>
              <th style="padding:16px 12px;text-align:right;font-size:9pt;font-weight:800;">VALOR UNIT.</th>
              <th style="padding:16px 12px;text-align:right;font-size:9pt;font-weight:800;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
        ${financialSummary}
      </div>

      <!-- 04 CONDIÇÕES -->
      <div style="margin-bottom:48px;break-inside:avoid;">
        <div style="display:flex;align-items:center;margin-bottom:24px;border-left:5px solid ${PRIMARY};padding-left:14px;">
          <h2 style="font-size:15pt;font-weight:900;color:${PRIMARY};margin:0;text-transform:uppercase;letter-spacing:0.05em;">5. Condições Comerciais</h2>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          <div style="padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #edf2f7;">
            <p style="font-size:9pt;color:#718096;font-weight:800;margin-bottom:6px;text-transform:uppercase;">Validade da Proposta</p>
            <p style="font-size:11.5pt;color:#1a202c;font-weight:700;margin:0;">${p.proposalValidity || "30"} dias corridos</p>
          </div>
          <div style="padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #edf2f7;">
            <p style="font-size:9pt;color:#718096;font-weight:800;margin-bottom:6px;text-transform:uppercase;">Forma de Pagamento</p>
            <p style="font-size:11.5pt;color:#1a202c;font-weight:700;margin:0;">${p.paymentTerms || "Condições a negociar"}</p>
          </div>
        </div>
      </div>

      <!-- FORMALIZAÇÃO -->
      <div style="margin-top:60px;padding:48px;border:2.5px solid ${PRIMARY}15;border-radius:12px;break-inside:avoid;background:#fff;position:relative;">
        <div style="position:absolute;top:15px;left:20px;font-size:8.5pt;font-weight:900;color:${PRIMARY};text-transform:uppercase;">Aceite da Proposta</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;">
          <div style="text-align:center;">
            <div style="height:70px;display:flex;align-items:flex-end;justify-content:center;">
              <div style="width:100%;height:1.5px;background:#1a202c;"></div>
            </div>
            <p style="font-size:11pt;font-weight:800;margin:12px 0 4px;color:#1a202c;text-transform:uppercase;">${p.orgName}</p>
            <p style="font-size:9pt;color:#718096;margin:0;font-weight:600;">Emitido em: ${p.dateLabel}</p>
          </div>
          <div style="text-align:center;">
            <div style="height:70px;display:flex;align-items:flex-end;justify-content:center;">
              <div style="width:100%;height:1.5px;background:#1a202c;"></div>
            </div>
            <p style="font-size:11pt;font-weight:800;margin:12px 0 4px;color:#1a202c;text-transform:uppercase;">${p.clientName || "Contratante"}</p>
            <p style="font-size:9pt;color:#718096;margin:0;font-weight:600;">Data do Aceite: ____/____/_______</p>
          </div>
        </div>
      </div>

      <div style="margin-top:48px;text-align:center;border-top:1px solid #edf2f7;padding-top:24px;">
        <p style="font-size:9pt;color:#cbd5e0;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
          ${p.orgName} · ${docTitle} · ${p.dateLabel}
          ${!p.isBiz ? `<br/><span style="font-weight:400;text-transform:none;color:#e2e8f0;margin-top:6px;display:block;">Processado eletronicamente por RelatórioFlow</span>` : ""}
        </p>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${isOrcamento ? "Orçamento" : "Proposta Comercial"} — ${p.clientName || p.orgName}</title>
  <style>
    ${GOOGLE_FONTS}
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    body { font-family: ${FONT_BODY}; font-size: 11pt; color: #1e293b; background: #fff; margin: 0; padding: 0; }
  </style>
</head>
<body>
  ${p.wm}
  ${cover}
  ${content}
  <script>window.onload=function(){setTimeout(function(){window.print();},850);};</script>
</body>
</html>`;
}

