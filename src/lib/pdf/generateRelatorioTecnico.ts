import { mdToHtml, mdCss } from './markdownToHtml'

interface FotoItem { url: string; caption?: string }
interface SecaoTecnica { titulo: string; conteudo: string; fotos: FotoItem[] }
interface Recomendacao { texto: string; prioridade: 'alta' | 'media' | 'baixa' }

interface RelatorioTecnicoPDFData {
  projectName: string
  projectAddress?: string
  clientName?: string
  artRrt?: string
  companyName?: string
  companyLogo?: string
  numeroRelatorio: string
  reportDate: string
  responsavelTecnico: string
  creaCau?: string
  objetivo: string
  metodologia: string
  diagnostico: SecaoTecnica[]
  conclusao: string
  recomendacoes: Recomendacao[]
  fotosGerais: FotoItem[]
}

const PRI_CONFIG = {
  alta:  { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', label: 'ALTA'  },
  media: { bg: '#fffbeb', border: '#fcd34d', badge: '#d97706', label: 'MÉDIA' },
  baixa: { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a', label: 'BAIXA' },
}

export function generateRelatorioTecnicoHTML(data: RelatorioTecnicoPDFData): string {
  const dateObj = new Date(data.reportDate + 'T12:00:00')
  const dateStr  = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const dateShort = dateObj.toLocaleDateString('pt-BR')

  // Contador dinâmico de seções
  let sec = 0
  const S = () => `<span class="sec-num">${++sec}</span>`

  const totalFotos = data.fotosGerais.length + data.diagnostico.reduce((a, d) => a + d.fotos.length, 0)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>RT ${data.numeroRelatorio} — ${data.projectName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    ${mdCss}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; font-size: 9.5pt; color: #1e293b; background: #f1f5f9; line-height: 1.6; }
    @page { size: A4; margin: 2cm 1.8cm; }
    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .avoid-break { break-inside: avoid; }
    }
    .page { max-width: 210mm; margin: 0 auto; background: white; }

    /* ═══ CAPA ═══ */
    .cover {
      height: 297mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      background: white;
    }
    .cover-top {
      background: #0f2746;
      color: white;
      padding: 40px 50px 50px;
      flex-shrink: 0;
    }
    .cover-top-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .cover-logo { width: 72px; height: 72px; background: white; border-radius: 10px; padding: 6px; display: flex; align-items: center; justify-content: center; }
    .cover-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .cover-logo-text { font-size: 24pt; }
    .cover-company { text-align: right; }
    .cover-company strong { font-size: 13pt; font-weight: 800; display: block; }
    .cover-company span { font-size: 8.5pt; opacity: 0.6; margin-top: 4px; display: block; }

    .cover-badge {
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 4px 14px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.7);
      margin-top: 40px;
      margin-bottom: 16px;
    }
    .cover-title { font-size: 30pt; font-weight: 800; line-height: 1.15; letter-spacing: -0.01em; margin-bottom: 10px; }
    .cover-subtitle { font-size: 13pt; opacity: 0.55; font-weight: 400; }

    .cover-body { flex: 1; padding: 40px 50px; display: flex; flex-direction: column; justify-content: space-between; }
    .cover-id-table { width: 100%; border-collapse: collapse; border: 1.5px solid #e2e8f0; }
    .cover-id-table th {
      background: #f8fafc;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #64748b;
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      width: 35%;
    }
    .cover-id-table td {
      font-size: 9.5pt;
      font-weight: 600;
      color: #1e293b;
      padding: 9px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .cover-id-table tr:last-child th,
    .cover-id-table tr:last-child td { border-bottom: none; }

    .cover-footer {
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    /* ═══ CABEÇALHO INTERNO (páginas de conteúdo) ═══ */
    .doc-header {
      border: 1.5px solid #0f2746;
      border-bottom: none;
      margin-bottom: 0;
    }
    .doc-header-top {
      display: grid;
      grid-template-columns: 80px 1fr 180px;
      border-bottom: 1.5px solid #0f2746;
    }
    .dhdr-logo { padding: 8px; display: flex; align-items: center; justify-content: center; border-right: 1px solid #0f2746; }
    .dhdr-logo img { max-width: 64px; max-height: 40px; object-fit: contain; }
    .dhdr-title { padding: 8px 14px; display: flex; flex-direction: column; justify-content: center; }
    .dhdr-title strong { font-size: 11pt; font-weight: 800; color: #0f2746; display: block; }
    .dhdr-title span { font-size: 8pt; color: #64748b; margin-top: 2px; display: block; }
    .dhdr-num { border-left: 1px solid #0f2746; padding: 8px 12px; display: flex; flex-direction: column; justify-content: center; background: #0f2746; color: white; }
    .dhdr-num label { font-size: 6pt; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.7; font-weight: 700; }
    .dhdr-num strong { font-size: 12pt; font-weight: 800; display: block; margin-top: 2px; }

    .doc-meta { display: grid; grid-template-columns: 2fr 1fr 1fr; border-bottom: 1px solid #cbd5e1; }
    .doc-meta-2 { grid-template-columns: 1fr 1fr; }
    .meta-cell { padding: 6px 12px; border-right: 1px solid #e2e8f0; }
    .meta-cell:last-child { border-right: none; }
    .meta-cell label { font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; display: block; }
    .meta-cell span  { font-size: 9pt; font-weight: 600; color: #1e293b; display: block; margin-top: 2px; }

    /* ═══ SEÇÕES ═══ */
    .rt-section { border: 1.5px solid #0f2746; border-top: none; avoid-break: inside; }
    .rt-section-title {
      background: #0f2746;
      color: white;
      padding: 7px 14px;
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sec-num {
      background: rgba(255,255,255,0.15);
      border-radius: 50%;
      width: 20px; height: 20px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 8pt; font-weight: 800; flex-shrink: 0;
    }

    /* ═══ CONCLUSÃO / RESUMO EXECUTIVO ═══ */
    .conclusao-box {
      background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
      border-left: 4px solid #0f2746;
      padding: 18px 20px;
      margin: 0;
    }
    .conclusao-label { font-size: 6.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #0f2746; display: block; margin-bottom: 8px; }
    .conclusao-text { font-size: 9.5pt; color: #1e3a5f; line-height: 1.7; }

    /* ═══ TEXTO DE SEÇÃO ═══ */
    .section-body { padding: 16px 20px; font-size: 9.5pt; line-height: 1.7; color: #334155; }

    /* ═══ DIAGNÓSTICO ═══ */
    .diag-item { border-bottom: 1px solid #e2e8f0; }
    .diag-item:last-child { border-bottom: none; }
    .diag-sub-header {
      background: #f8fafc;
      padding: 7px 20px;
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f2746;
      border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; gap: 8px;
    }
    .diag-sub-num { color: #94a3b8; font-weight: 600; font-size: 8pt; }
    .diag-content { padding: 14px 20px; }
    .diag-fotos { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 0 20px 14px; }
    .diag-foto-item { border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
    .diag-foto-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; border-bottom: 1px solid #e2e8f0; }
    .diag-foto-cap { font-size: 7pt; color: #64748b; padding: 5px 7px; text-align: center; font-style: italic; background: #f8fafc; }

    /* ═══ RECOMENDAÇÕES ═══ */
    .rec-table { width: 100%; border-collapse: collapse; }
    .rec-table th { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; padding: 8px 14px; background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; text-align: left; }
    .rec-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 9pt; color: #334155; vertical-align: top; }
    .rec-table tr:last-child td { border-bottom: none; }
    .rec-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 7pt; font-weight: 800; color: white; }

    /* ═══ FOTOS GERAIS ═══ */
    .foto-grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
    .foto-cell { border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .foto-cell:nth-child(even) { border-right: none; }
    .foto-img-wrap { padding: 12px 12px 0; }
    .foto-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; border: 1px solid #e2e8f0; border-radius: 3px; }
    .foto-caption { font-size: 8pt; color: #64748b; padding: 6px 12px 12px; text-align: center; font-style: italic; }

    /* ═══ ASSINATURA ═══ */
    .assinatura-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .assinatura-cell { padding: 16px 24px; border-right: 1px solid #e2e8f0; }
    .assinatura-cell:last-child { border-right: none; }
    .assinatura-label { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; display: block; margin-bottom: 28px; }
    .assinatura-line { border-top: 1.5px solid #0f2746; padding-top: 8px; }
    .assinatura-name { font-size: 9.5pt; font-weight: 700; color: #0f2746; }
    .assinatura-role { font-size: 7.5pt; color: #64748b; display: block; margin-top: 3px; }

    /* ═══ RODAPÉ ═══ */
    .rt-footer { border-top: 1px solid #e2e8f0; padding: 8px 0; display: flex; justify-content: space-between; font-size: 7pt; color: #94a3b8; margin-top: 0; }

    /* ═══ BOTÃO ═══ */
    .print-btn {
      position: fixed; bottom: 28px; right: 28px;
      background: #0f2746; color: white; border: none;
      padding: 13px 26px; border-radius: 8px;
      font-weight: 700; cursor: pointer; font-size: 13px;
      box-shadow: 0 4px 20px rgba(15,39,70,0.4); z-index: 1000;
    }
    .print-btn:hover { background: #1e3a5f; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">⬇ Imprimir / Salvar PDF</button>

  <div class="page">

    <!-- ══════════════════════════════════════
         CAPA
    ══════════════════════════════════════ -->
    <div class="cover">
      <div class="cover-top">
        <div class="cover-top-row">
          <div class="cover-logo">
            ${data.companyLogo
              ? `<img src="${data.companyLogo}" />`
              : `<div class="cover-logo-text">📋</div>`}
          </div>
          <div class="cover-company">
            <strong>${data.companyName || 'RelatorioFlow'}</strong>
            <span>${data.responsavelTecnico}</span>
            <span>${data.creaCau ? `CREA/CAU: ${data.creaCau}` : ''}</span>
          </div>
        </div>
        <div class="cover-badge">Padrão ABNT NBR 10719 · Documento Técnico Oficial</div>
        <div class="cover-title">${data.projectName}</div>
        <div class="cover-subtitle">Relatório Técnico de Inspeção e Análise</div>
      </div>

      <div class="cover-body">
        <table class="cover-id-table">
          <tr>
            <th>Nº do Relatório</th>
            <td style="font-weight:800; font-size:12pt; color:#0f2746;">${data.numeroRelatorio}</td>
          </tr>
          <tr>
            <th>Data de Emissão</th>
            <td>${dateStr}</td>
          </tr>
          <tr>
            <th>Empreendimento / Obra</th>
            <td>${data.projectName}</td>
          </tr>
          <tr>
            <th>Endereço / Local</th>
            <td>${data.projectAddress || 'Não informado'}</td>
          </tr>
          <tr>
            <th>Contratante / Cliente</th>
            <td>${data.clientName || 'Não informado'}</td>
          </tr>
          <tr>
            <th>Responsável Técnico</th>
            <td>${data.responsavelTecnico}</td>
          </tr>
          <tr>
            <th>CREA / CAU / CFT</th>
            <td>${data.creaCau || '—'}</td>
          </tr>
          <tr>
            <th>ART / RRT Nº</th>
            <td>${data.artRrt || 'Não informado'}</td>
          </tr>
        </table>

        <div class="cover-footer">
          Gerado por RelatorioFlow · Documento sigiloso e de uso exclusivo do contratante · ${dateShort}
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         CONTEÚDO — Cabeçalho Interno
    ══════════════════════════════════════ -->
    <div class="doc-header">
      <div class="doc-header-top">
        <div class="dhdr-logo">
          ${data.companyLogo ? `<img src="${data.companyLogo}" />` : '📋'}
        </div>
        <div class="dhdr-title">
          <strong>RELATÓRIO TÉCNICO</strong>
          <span>${data.companyName || 'RelatorioFlow'} · Conforme ABNT NBR 10719</span>
        </div>
        <div class="dhdr-num">
          <label>RT Nº</label>
          <strong>${data.numeroRelatorio}</strong>
        </div>
      </div>
      <div class="doc-meta">
        <div class="meta-cell">
          <label>Empreendimento / Obra</label>
          <span>${data.projectName}</span>
        </div>
        <div class="meta-cell">
          <label>Data de Emissão</label>
          <span>${dateShort}</span>
        </div>
        <div class="meta-cell">
          <label>ART / RRT Nº</label>
          <span>${data.artRrt || 'N/A'}</span>
        </div>
      </div>
      <div class="doc-meta doc-meta-2" style="border-bottom:none;">
        <div class="meta-cell">
          <label>Responsável Técnico</label>
          <span>${data.responsavelTecnico}</span>
        </div>
        <div class="meta-cell">
          <label>CREA / CAU / CFT</label>
          <span>${data.creaCau || '—'}</span>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         SEÇÃO 1 — CONCLUSÃO / PARECER EXECUTIVO
    ══════════════════════════════════════ -->
    <div class="rt-section avoid-break">
      <div class="rt-section-title">${S()} Parecer Executivo — Conclusão</div>
      <div class="conclusao-box">
        <span class="conclusao-label">Síntese dos Achados e Recomendação Final</span>
        <div class="conclusao-text">${mdToHtml(data.conclusao)}</div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         SEÇÃO 2 — OBJETIVO
    ══════════════════════════════════════ -->
    <div class="rt-section avoid-break">
      <div class="rt-section-title">${S()} Objetivo da Inspeção / Análise</div>
      <div class="section-body">${mdToHtml(data.objetivo)}</div>
    </div>

    <!-- ══════════════════════════════════════
         SEÇÃO 3 — METODOLOGIA
    ══════════════════════════════════════ -->
    <div class="rt-section avoid-break">
      <div class="rt-section-title">${S()} Metodologia e Procedimentos Adotados</div>
      <div class="section-body">${mdToHtml(data.metodologia)}</div>
    </div>

    <!-- ══════════════════════════════════════
         SEÇÃO 4+ — DIAGNÓSTICO
    ══════════════════════════════════════ -->
    ${data.diagnostico.length > 0 ? `
    <div class="rt-section">
      <div class="rt-section-title">${S()} Diagnóstico e Análise Técnica</div>
      ${data.diagnostico.map((d, i) => `
      <div class="diag-item avoid-break">
        <div class="diag-sub-header">
          <span class="diag-sub-num">${sec}.${i + 1}</span>
          ${d.titulo}
        </div>
        <div class="diag-content">${mdToHtml(d.conteudo)}</div>
        ${d.fotos.length > 0 ? `
        <div class="diag-fotos">
          ${d.fotos.map((f, fi) => `
          <div class="diag-foto-item">
            <img src="${f.url}" class="diag-foto-img" />
            <div class="diag-foto-cap">Fig. ${i + 1}.${fi + 1} — ${f.caption || 'Registro de campo.'}</div>
          </div>`).join('')}
        </div>` : ''}
      </div>`).join('')}
    </div>` : ''}

    <!-- ══════════════════════════════════════
         RECOMENDAÇÕES
    ══════════════════════════════════════ -->
    ${data.recomendacoes.length > 0 ? `
    <div class="rt-section avoid-break">
      <div class="rt-section-title">${S()} Plano de Ação e Recomendações</div>
      <table class="rec-table">
        <thead>
          <tr>
            <th style="width:30px;">#</th>
            <th style="width:80px;">Prioridade</th>
            <th>Recomendação Técnica</th>
          </tr>
        </thead>
        <tbody>
          ${(data.recomendacoes as Recomendacao[]).map((r, i) => {
            const cfg = PRI_CONFIG[r.prioridade] || PRI_CONFIG.media
            return `
          <tr style="background:${cfg.bg};">
            <td style="text-align:center;color:#94a3b8;font-size:8pt;">${String(i + 1).padStart(2, '0')}</td>
            <td><span class="rec-badge" style="background:${cfg.badge};">${cfg.label}</span></td>
            <td>${r.texto}</td>
          </tr>`}).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <!-- ══════════════════════════════════════
         REGISTRO FOTOGRÁFICO GERAL
    ══════════════════════════════════════ -->
    ${data.fotosGerais.length > 0 ? `
    <div class="rt-section page-break">
      <div class="rt-section-title">${S()} Registro Fotográfico (${totalFotos} imagem${totalFotos !== 1 ? 'ns' : ''})</div>
      <div class="foto-grid-2">
        ${data.fotosGerais.map((f, i) => `
        <div class="foto-cell">
          <div class="foto-img-wrap"><img src="${f.url}" class="foto-img" /></div>
          <div class="foto-caption">Foto ${String(i + 1).padStart(2, '0')} — ${f.caption || 'Evidência fotográfica.'}</div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- ══════════════════════════════════════
         ASSINATURA
    ══════════════════════════════════════ -->
    <div class="rt-section avoid-break">
      <div class="rt-section-title">${S()} Assinaturas e Responsabilidade Técnica</div>
      <div class="assinatura-grid">
        <div class="assinatura-cell">
          <span class="assinatura-label">Responsável Técnico pelo Relatório</span>
          <div class="assinatura-line">
            <div class="assinatura-name">${data.responsavelTecnico}</div>
            <span class="assinatura-role">CREA/CAU/CFT: ${data.creaCau || '—'}</span>
            <span class="assinatura-role">${data.companyName || 'RelatorioFlow'}</span>
          </div>
        </div>
        <div class="assinatura-cell">
          <span class="assinatura-label">Contratante / Cliente / Fiscalização</span>
          <div class="assinatura-line">
            <div class="assinatura-name">&nbsp;</div>
            <span class="assinatura-role">${data.clientName || '—'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rodapé de Prestígio -->
    <div style="margin-top:20px; text-align:center; padding:15px; border-top:1.5px solid #0f2746;">
      <div style="font-weight:800; font-size:9.5pt; color:#0f2746; letter-spacing:0.06em; display:flex; align-items:center; justify-content:center; gap:8px;">
        <span style="font-size:14pt;">✓</span> DOCUMENTO TÉCNICO AUTENTICADO POR RELATÓRIOFLOW
      </div>
      <div style="font-size:7.5pt; color:#64748b; margin-top:5px; font-weight:500;">
        Emitido eletronicamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | 
        ID de Autenticidade: ${Math.random().toString(36).substring(2, 12).toUpperCase()}
      </div>
    </div>

    <div class="rt-footer">
      <span><strong>${data.projectName}</strong> · RT Nº ${data.numeroRelatorio} · ${dateShort}</span>
      <span>Gerado por RelatórioFlow · Padrão ABNT NBR 10719</span>
    </div>

  </div>
</body>
</html>`
}

export function openRelatorioTecnicoPDF(data: RelatorioTecnicoPDFData) {
  const html = generateRelatorioTecnicoHTML(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) {
    win.onload = () => setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
}
