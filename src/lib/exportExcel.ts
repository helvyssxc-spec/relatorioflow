import * as XLSX from "xlsx";
import type { TemplateParams } from "@/lib/pdfTemplates";

type CellStyle = {
  font?: { bold?: boolean; sz?: number; color?: { rgb: string }; name?: string };
  fill?: { fgColor: { rgb: string }; patternType: "solid" };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
};

function cell(value: string | number, style: CellStyle = {}, type: string = "s"): XLSX.CellObject {
  return { v: value, t: type as XLSX.ExcelDataType, s: style } as any;
}

const BORDER = (color: string) => ({
  top: { style: "thin", color: { rgb: color } },
  bottom: { style: "thin", color: { rgb: color } },
  left: { style: "thin", color: { rgb: color } },
  right: { style: "thin", color: { rgb: color } },
});

function hexToRgb(hex: string) {
  return hex.replace("#", "").toUpperCase();
}

export function exportAsExcel(params: TemplateParams) {
  const wb = XLSX.utils.book_new();
  const group = getGroup(params.reportType);

  if (group === "rdo") buildRDOSheets(wb, params);
  else if (group === "commercial") buildCommercialSheets(wb, params);
  else if (group === "ata") buildAtaSheet(wb, params);
  else buildABNTSheet(wb, params);

  const filename = `relatorio-${
    (params.clientName || "export").replace(/[^a-zA-Z0-9]/g, "-")
  }-${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, filename);
}

function getGroup(type: string) {
  if (["diario_de_obra"].includes(type)) return "rdo";
  if (["proposta_comercial", "orcamento"].includes(type)) return "commercial";
  if (["ata_reuniao"].includes(type)) return "ata";
  return "abnt";
}

function arrToSheet(data: any[][]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  let maxCol = 0;
  data.forEach((row, r) => {
    maxCol = Math.max(maxCol, row.length);
    row.forEach((cellObj: any, c: number) => {
      ws[XLSX.utils.encode_cell({ r, c })] = cellObj;
    });
  });
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: maxCol - 1 } });
  return ws;
}

/* ── RDO — 3 abas ── */
function buildRDOSheets(wb: XLSX.WorkBook, p: TemplateParams) {
  const PRI = hexToRgb(p.primary);
  const border = BORDER("CBD5E1");
  const hdr: CellStyle = { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { fgColor: { rgb: PRI }, patternType: "solid" }, alignment: { horizontal: "left", vertical: "center" }, border };
  const lbl: CellStyle = { font: { bold: true, sz: 10, name: "Arial", color: { rgb: "334155" } }, fill: { fgColor: { rgb: "F8FAFC" }, patternType: "solid" }, alignment: { horizontal: "left", vertical: "center", wrapText: true }, border };
  const val: CellStyle = { font: { sz: 10, name: "Arial" }, alignment: { horizontal: "left", vertical: "center", wrapText: true }, border };

  // Aba 1: Identificação
  const id: any[][] = [];
  const addRow = (label: string, value: string) => id.push([cell(label, lbl), cell(value, val)]);
  id.push([cell("RELATÓRIO DIÁRIO DE OBRA", hdr), cell("", hdr)]);
  id.push([cell("Base: Resolução CONFEA + NBR 12.722", { font: { sz: 9, color: { rgb: "64748B" }, name: "Arial" } }), cell("", {})]);
  id.push([cell("", {}), cell("", {})]);
  id.push([cell("IDENTIFICAÇÃO", { font: { bold: true, sz: 10, color: { rgb: PRI }, name: "Arial" } }), cell("", {})]);
  addRow("Empreendimento / Obra", p.clientName || "—");
  addRow("Contratante", p.clientCompany || p.clientName || "—");
  addRow("Local / Endereço", p.reportLocation || "—");
  addRow("Nº do RDO", p.reportNumber || "—");
  addRow("Data", p.dateLabel);
  addRow("Responsável Técnico", `${p.authorName}${p.authorRole ? ` — ${p.authorRole}` : ""}`);
  addRow("Empresa", p.orgName);
  id.push([cell("", {}), cell("", {})]);
  id.push([cell("CONDIÇÕES DO DIA", { font: { bold: true, sz: 10, color: { rgb: PRI }, name: "Arial" } }), cell("", {})]);
  addRow("Condição climática", p.weatherCondition || "—");
  addRow("Condição de acesso", p.accessCondition || "—");
  addRow("Estado do local", p.siteCondition || "—");
  id.push([cell("", {}), cell("", {})]);
  id.push([cell("OCORRÊNCIAS / OBSERVAÇÕES", { font: { bold: true, sz: 10, color: { rgb: PRI }, name: "Arial" } }), cell("", {})]);
  id.push([cell(p.occurrences || "Nenhuma ocorrência registrada.", { font: { sz: 10, name: "Arial" }, alignment: { wrapText: true }, border }), cell("", { border })]);

  const wsId = arrToSheet(id);
  wsId["!cols"] = [{ wch: 35 }, { wch: 55 }];
  wsId["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: id.length - 1, c: 0 }, e: { r: id.length - 1, c: 1 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsId, "Identificação");

  // Aba 2: Serviços
  const srv: any[][] = [];
  srv.push([cell("SERVIÇOS EXECUTADOS NO DIA", hdr), cell("", hdr), cell("Concluído", { ...hdr, alignment: { horizontal: "center" } })]);
  srv.push([cell("Nº", { ...lbl, alignment: { horizontal: "center" } }), cell("Descrição do serviço / atividade", lbl), cell("✓ / —", { ...lbl, alignment: { horizontal: "center" } })]);

  const lines = p.report.replace(/[#*`]/g, "").split("\n").map(l => l.trim()).filter(l => l.length > 10).slice(0, 15);
  lines.forEach((line, i) => srv.push([cell(i + 1, { ...val, alignment: { horizontal: "center" } }, "n"), cell(line, { ...val, alignment: { wrapText: true } }), cell("", { ...val, alignment: { horizontal: "center" } })]));
  for (let i = 0; i < Math.max(0, 10 - lines.length); i++) {
    srv.push([cell(lines.length + i + 1, { ...val, alignment: { horizontal: "center" } }, "n"), cell("", val), cell("", { ...val, alignment: { horizontal: "center" } })]);
  }

  const wsSrv = arrToSheet(srv);
  wsSrv["!cols"] = [{ wch: 6 }, { wch: 65 }, { wch: 12 }];
  wsSrv["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  XLSX.utils.book_append_sheet(wb, wsSrv, "Serviços");

  // Aba 3: Efetivo e Materiais
  const ef: any[][] = [];
  ef.push([cell("EFETIVO EM CAMPO", hdr), cell("", hdr), cell("", hdr)]);
  ef.push([cell("Profissional / Equipe", lbl), cell("Função / Empresa", lbl), cell("Horas", { ...lbl, alignment: { horizontal: "center" } })]);
  const members = p.teamMembers.filter(m => m.name);
  if (members.length > 0) members.forEach(m => ef.push([cell(m.name, val), cell(m.role || "—", val), cell(m.hours || "—", { ...val, alignment: { horizontal: "center" } })]));
  else for (let i = 0; i < 5; i++) ef.push([cell("", val), cell("", val), cell("", val)]);

  ef.push([cell("", {}), cell("", {}), cell("", {})]);
  ef.push([cell("MATERIAIS E EQUIPAMENTOS", hdr), cell("", hdr), cell("", hdr)]);
  ef.push([cell("Descrição", lbl), cell("Quantidade", { ...lbl, alignment: { horizontal: "right" } }), cell("Unidade", lbl)]);
  const mats = p.materials.filter(m => m.item);
  if (mats.length > 0) mats.forEach(m => ef.push([cell(m.item, val), cell(m.qty || "—", { ...val, alignment: { horizontal: "right" } }), cell(m.unit || "—", val)]));
  else for (let i = 0; i < 5; i++) ef.push([cell("", val), cell("", val), cell("", val)]);

  const wsEf = arrToSheet(ef);
  wsEf["!cols"] = [{ wch: 45 }, { wch: 20 }, { wch: 15 }];
  const matHeaderRow = members.length > 0 ? 2 + members.length + 1 : 7;
  wsEf["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: matHeaderRow, c: 0 }, e: { r: matHeaderRow, c: 2 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsEf, "Efetivo e Materiais");
}

/* ── Proposta / Orçamento — 2 abas ── */
function buildCommercialSheets(wb: XLSX.WorkBook, p: TemplateParams) {
  const PRI = hexToRgb(p.primary);
  const border = BORDER("E2E8F0");
  const isOrcamento = p.reportType === "orcamento";
  const hdr: CellStyle = { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { fgColor: { rgb: PRI }, patternType: "solid" }, alignment: { horizontal: "left", vertical: "center" }, border };
  const lbl: CellStyle = { font: { bold: true, sz: 10, name: "Arial", color: { rgb: "64748B" } }, fill: { fgColor: { rgb: "F8FAFC" }, patternType: "solid" }, alignment: { horizontal: "left" }, border };
  const val: CellStyle = { font: { sz: 10, name: "Arial" }, alignment: { horizontal: "left", wrapText: true }, border };
  const numStyle: CellStyle = { font: { sz: 10, name: "Arial" }, alignment: { horizontal: "right" }, border };
  const subtotalStyle: CellStyle = { font: { bold: true, sz: 10, name: "Arial" }, fill: { fgColor: { rgb: "F1F5F9" }, patternType: "solid" }, alignment: { horizontal: "right" }, border };
  const totalStyle: CellStyle = { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { fgColor: { rgb: PRI }, patternType: "solid" }, alignment: { horizontal: "right" }, border };

  // Aba 1: Dados da Proposta
  const capa: any[][] = [];
  const docTitle = isOrcamento ? "ORÇAMENTO TÉCNICO" : "PROPOSTA COMERCIAL";
  capa.push([cell(docTitle, { ...hdr, font: { ...hdr.font!, sz: 14 } }), cell("", hdr)]);
  capa.push([cell("", {}), cell("", {})]);
  const addField = (label: string, value: string) => capa.push([cell(label, lbl), cell(value, val)]);

  addField("Empresa emissora", p.orgName);
  addField("Data de emissão", p.dateLabel);
  if (p.reportNumber) addField("Nº do documento", p.reportNumber);
  addField("Cliente / Contratante", p.clientName || "—");
  if (p.clientCompany) addField("Empresa do cliente", p.clientCompany);
  if (p.reportLocation) addField("Local / Referência", p.reportLocation);
  addField("Elaborado por", `${p.authorName}${p.authorRole ? ` — ${p.authorRole}` : ""}`);

  capa.push([cell("", {}), cell("", {})]);
  capa.push([cell("CONDIÇÕES COMERCIAIS", { font: { bold: true, sz: 10, color: { rgb: PRI }, name: "Arial" } }), cell("", {})]);
  addField("Validade da proposta", p.proposalValidity ? `${p.proposalValidity} dias corridos` : "30 dias");
  addField("Forma de pagamento", p.paymentTerms || "A definir entre as partes");
  addField("Prazo de execução", p.executionDays ? `${p.executionDays} dias úteis` : "A definir");
  addField("Garantia dos serviços", "Conforme descrito no escopo");

  capa.push([cell("", {}), cell("", {})]);
  capa.push([cell("RESUMO DO ESCOPO", { font: { bold: true, sz: 10, color: { rgb: PRI }, name: "Arial" } }), cell("", {})]);
  const paragraphs = p.report.replace(/[#*`]/g, "").split(/\n\n+/).slice(0, 3);
  paragraphs.forEach(par => capa.push([cell(par.replace(/\n/g, " "), { font: { sz: 10, name: "Arial" }, alignment: { wrapText: true } }), cell("", {})]));

  const wsCapa = arrToSheet(capa);
  wsCapa["!cols"] = [{ wch: 28 }, { wch: 55 }];
  wsCapa["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, wsCapa, "Dados da Proposta");

  // Aba 2: Planilha de Preços
  const items = p.commercialItems?.length ? p.commercialItems : p.materials.filter(m => m.item);
  const planilha: any[][] = [];

  planilha.push([
    cell("#", { ...hdr, alignment: { horizontal: "center" } }),
    cell("Descrição do item / serviço", hdr),
    cell("Qtd", { ...hdr, alignment: { horizontal: "center" } }),
    cell("Un", { ...hdr, alignment: { horizontal: "center" } }),
    cell("Valor unitário (R$)", { ...hdr, alignment: { horizontal: "right" } }),
    cell("Total (R$)", { ...hdr, alignment: { horizontal: "right" } }),
  ]);

  items.forEach((m: any, i: number) => {
    const priceNum = parseFloat((m.price || "0").replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    const qtyNum = parseFloat(m.qty) || 0;
    const totalNum = m.total || (priceNum * qtyNum);
    planilha.push([
      cell(i + 1, { ...numStyle, alignment: { horizontal: "center" } }, "n"),
      cell(m.item || "", val),
      cell(qtyNum, numStyle, "n"),
      cell(m.unit || "un", { ...val, alignment: { horizontal: "center" } }),
      cell(priceNum > 0 ? priceNum : "", priceNum > 0 ? numStyle : val, priceNum > 0 ? "n" : "s"),
      cell(totalNum > 0 ? totalNum : "", totalNum > 0 ? numStyle : val, totalNum > 0 ? "n" : "s"),
    ]);
  });

  const emptyRows = Math.max(0, 8 - items.length);
  for (let i = 0; i < emptyRows; i++) {
    planilha.push([
      cell(items.length + i + 1, { ...numStyle, alignment: { horizontal: "center" } }, "n"),
      cell("", val), cell("", numStyle), cell("un", { ...val, alignment: { horizontal: "center" } }),
      cell("", val), cell("", val),
    ]);
  }

  const firstDataRow = 2;
  const lastDataRow = planilha.length;
  planilha.push([cell("", {}), cell("", {}), cell("", {}), cell("", {}),
    cell("SUBTOTAL", subtotalStyle),
    { v: `SUM(F${firstDataRow}:F${lastDataRow})`, t: "s", f: `SUM(F${firstDataRow}:F${lastDataRow})`, s: subtotalStyle } as any,
  ]);

  if (isOrcamento && p.bdiPercent) {
    const bdiPct = parseFloat(p.bdiPercent) / 100;
    const subtotalRow = planilha.length;
    planilha.push([cell("", {}), cell("", {}), cell("", {}), cell("", {}),
      cell(`BDI (${p.bdiPercent}%)`, subtotalStyle),
      { v: 0, t: "n", f: `F${subtotalRow}*${bdiPct}`, s: subtotalStyle } as any,
    ]);
  }

  const bdiRow = planilha.length;
  planilha.push([cell("", {}), cell("", {}), cell("", {}), cell("", {}),
    cell("VALOR TOTAL", totalStyle),
    {
      v: 0, t: "n",
      f: isOrcamento && p.bdiPercent ? `F${bdiRow - 1}+F${bdiRow}` : `F${bdiRow}`,
      s: { ...totalStyle, font: { ...totalStyle.font!, sz: 12 } },
    } as any,
  ]);

  planilha.push([cell("* Valores em Reais (R$). Edite as células para recalcular os totais.", { font: { sz: 9, color: { rgb: "94A3B8" }, name: "Arial" }, alignment: { wrapText: true } }),
    cell(""), cell(""), cell(""), cell(""), cell("")]);

  const wsPlanilha = arrToSheet(planilha);
  wsPlanilha["!cols"] = [{ wch: 6 }, { wch: 50 }, { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 18 }];

  const fmtCurrency = '#,##0.00';
  for (let r = 1; r <= items.length + emptyRows; r++) {
    const eAddr = XLSX.utils.encode_cell({ r, c: 4 });
    const fAddr = XLSX.utils.encode_cell({ r, c: 5 });
    if (wsPlanilha[eAddr]) (wsPlanilha[eAddr] as any).z = fmtCurrency;
    if (wsPlanilha[fAddr]) (wsPlanilha[fAddr] as any).z = fmtCurrency;
  }

  XLSX.utils.book_append_sheet(wb, wsPlanilha, "Planilha de Preços");
}

/* ── Ata de Reunião — 1 aba ── */
function buildAtaSheet(wb: XLSX.WorkBook, p: TemplateParams) {
  const PRI = hexToRgb(p.primary);
  const border = BORDER("D1D5DB");
  const data: any[][] = [];

  const addH = (title: string) => data.push([
    cell(title, { font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { fgColor: { rgb: PRI }, patternType: "solid" } }),
    cell("", {}), cell("", {}), cell("", {}),
  ]);
  const addR = (label: string, value: string) => data.push([
    cell(label, { font: { bold: true, sz: 10, name: "Arial", color: { rgb: "64748B" } }, fill: { fgColor: { rgb: "F9FAFB" }, patternType: "solid" }, border }),
    cell(value, { font: { sz: 10, name: "Arial" }, border }),
    cell("", {}), cell("", {}),
  ]);

  addH("ATA DE REUNIÃO");
  data.push([cell(""), cell(""), cell(""), cell("")]);
  addH("DADOS DA REUNIÃO");
  addR("Data", p.dateLabel);
  addR("Local", p.reportLocation || "—");
  addR("Coordenador", p.authorName);
  if (p.clientName) addR("Assunto / Projeto", p.clientName);

  data.push([cell(""), cell(""), cell(""), cell("")]);
  addH("PARTICIPANTES");
  const tblHdr: CellStyle = { font: { bold: true, sz: 10, name: "Arial" }, fill: { fgColor: { rgb: "F3F4F6" }, patternType: "solid" }, border };
  data.push([cell("Nome", tblHdr), cell("Cargo / Empresa", tblHdr), cell("Assinatura", { ...tblHdr, alignment: { horizontal: "center" } }), cell("", {})]);

  const members = p.teamMembers.filter(m => m.name);
  if (members.length > 0) members.forEach(m => data.push([cell(m.name, { font: { sz: 10, name: "Arial" }, border }), cell(m.role || "—", { font: { sz: 10, name: "Arial" }, border }), cell("", { border }), cell("", {})]));
  else for (let i = 0; i < 5; i++) data.push([cell("", { border }), cell("", { border }), cell("", { border }), cell("", {})]);

  data.push([cell(""), cell(""), cell(""), cell("")]);
  addH("DELIBERAÇÕES");
  p.report.replace(/[#*`]/g, "").split(/\n\n+/).filter(Boolean).forEach(par => {
    data.push([cell(par, { font: { sz: 10, name: "Arial" }, alignment: { wrapText: true } }), cell(""), cell(""), cell("")]);
  });

  data.push([cell(""), cell(""), cell(""), cell("")]);
  addH("ENCAMINHAMENTOS");
  data.push([cell("#", tblHdr), cell("Ação", tblHdr), cell("Responsável", tblHdr), cell("Prazo", tblHdr)]);
  const occLines = (p.occurrences || "").split("\n").filter(Boolean);
  if (occLines.length > 0) occLines.forEach((line, i) => data.push([cell(i + 1, { font: { sz: 10, name: "Arial" }, border, alignment: { horizontal: "center" } }, "n"), cell(line, { font: { sz: 10, name: "Arial" }, border }), cell("", { border }), cell("", { border })]));
  else for (let i = 0; i < 3; i++) data.push([cell(i + 1, { font: { sz: 10, name: "Arial" }, border, alignment: { horizontal: "center" } }, "n"), cell("", { border }), cell("", { border }), cell("", { border })]);

  const ws = arrToSheet(data);
  ws["!cols"] = [{ wch: 10 }, { wch: 50 }, { wch: 25 }, { wch: 15 }];
  const merges: XLSX.Range[] = [];
  const sectionTitles = ["ATA DE REUNIÃO", "DADOS DA REUNIÃO", "PARTICIPANTES", "DELIBERAÇÕES", "ENCAMINHAMENTOS"];
  data.forEach((row, i) => {
    if (sectionTitles.includes(String(row[0]?.v))) merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 3 } });
  });
  ws["!merges"] = merges;
  XLSX.utils.book_append_sheet(wb, ws, "Ata de Reunião");
}

/* ── ABNT (Relatório Técnico, Laudo, etc) — 1 aba ── */
function buildABNTSheet(wb: XLSX.WorkBook, p: TemplateParams) {
  const PRI = hexToRgb(p.primary);
  const border = BORDER("D1D5DB");
  const data: any[][] = [];
  const secHdr: CellStyle = { font: { bold: true, sz: 10, color: { rgb: PRI }, name: "Arial" } };
  const lbl: CellStyle = { font: { bold: true, sz: 10, name: "Arial", color: { rgb: "64748B" } }, fill: { fgColor: { rgb: "F8FAFC" }, patternType: "solid" }, border };
  const val: CellStyle = { font: { sz: 10, name: "Arial" }, border };
  const tblHdr: CellStyle = { font: { bold: true, sz: 10, name: "Arial" }, fill: { fgColor: { rgb: "F3F4F6" }, patternType: "solid" }, border };

  data.push([cell(`${p.typeLabel.toUpperCase()} — ${p.clientName || p.orgName}`, { font: { bold: true, sz: 13, color: { rgb: "FFFFFF" }, name: "Times New Roman" }, fill: { fgColor: { rgb: PRI }, patternType: "solid" } }), cell(""), cell("")]);
  data.push([cell(""), cell(""), cell("")]);
  data.push([cell("IDENTIFICAÇÃO DO DOCUMENTO", secHdr), cell(""), cell("")]);

  const addRow2 = (l: string, v: string) => data.push([cell(l, lbl), cell(v, val), cell("", {})]);
  addRow2("Tipo de documento", p.typeLabel);
  if (p.reportNumber) addRow2("Nº do documento", p.reportNumber);
  addRow2("Data de emissão", p.dateLabel);
  if (p.reportLocation) addRow2("Local de execução", p.reportLocation);
  addRow2("Cliente / Contratante", p.clientName || "—");
  if (p.clientCompany) addRow2("Empresa / Órgão", p.clientCompany);
  addRow2("Responsável técnico", p.authorName);
  if (p.authorRole) addRow2("Cargo / Registro", p.authorRole);
  if (p.weatherCondition) addRow2("Condição climática", p.weatherCondition);
  data.push([cell(""), cell(""), cell("")]);

  const filteredMembers = p.teamMembers.filter(m => m.name);
  if (filteredMembers.length > 0) {
    data.push([cell("EQUIPE ENVOLVIDA", secHdr), cell(""), cell("")]);
    data.push([cell("Profissional", tblHdr), cell("Função", tblHdr), cell("Horas", { ...tblHdr, alignment: { horizontal: "center" } })]);
    filteredMembers.forEach(m => data.push([cell(m.name, { font: { sz: 10, name: "Arial" }, border }), cell(m.role || "—", { font: { sz: 10, name: "Arial" }, border }), cell(m.hours || "—", { font: { sz: 10, name: "Arial" }, border, alignment: { horizontal: "center" } })]));
    data.push([cell(""), cell(""), cell("")]);
  }

  data.push([cell("CONTEÚDO DO RELATÓRIO", secHdr), cell(""), cell("")]);
  p.report.replace(/[#*_`]/g, "").split(/\n\n+/).filter(Boolean).forEach(par => {
    data.push([cell(par.replace(/\n/g, " "), { font: { sz: 11, name: "Times New Roman" }, alignment: { wrapText: true } }), cell(""), cell("")]);
    data.push([cell(""), cell(""), cell("")]);
  });

  const filteredMats = p.materials.filter(m => m.item);
  if (filteredMats.length > 0) {
    data.push([cell("MATERIAIS E EQUIPAMENTOS", secHdr), cell(""), cell("")]);
    data.push([cell("Descrição", tblHdr), cell("Qtd", { ...tblHdr, alignment: { horizontal: "right" } }), cell("Un", tblHdr)]);
    filteredMats.forEach(m => data.push([cell(m.item, { font: { sz: 10, name: "Arial" }, border }), cell(m.qty || "—", { font: { sz: 10, name: "Arial" }, border, alignment: { horizontal: "right" } }), cell(m.unit || "—", { font: { sz: 10, name: "Arial" }, border })]));
    data.push([cell(""), cell(""), cell("")]);
  }

  if (p.occurrences) {
    data.push([cell("OCORRÊNCIAS E OBSERVAÇÕES", secHdr), cell(""), cell("")]);
    data.push([cell(p.occurrences, { font: { sz: 10, name: "Arial" }, alignment: { wrapText: true } }), cell(""), cell("")]);
  }

  const ws = arrToSheet(data);
  ws["!cols"] = [{ wch: 35 }, { wch: 40 }, { wch: 15 }];
  const merges: XLSX.Range[] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  const sectionNames = ["IDENTIFICAÇÃO DO DOCUMENTO", "EQUIPE ENVOLVIDA", "CONTEÚDO DO RELATÓRIO", "MATERIAIS E EQUIPAMENTOS", "OCORRÊNCIAS E OBSERVAÇÕES"];
  data.forEach((row, i) => {
    if (i === 0) return;
    if (sectionNames.includes(String(row[0]?.v))) merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 2 } });
  });
  ws["!merges"] = merges;
  XLSX.utils.book_append_sheet(wb, ws, p.typeLabel.slice(0, 30));
}
