interface FotoItem { url: string; caption?: string }

interface SecaoTecnica {
  titulo: string
  conteudo: string
  fotos: FotoItem[]
}

interface Recomendacao {
  texto: string
  prioridade: 'alta' | 'media' | 'baixa'
}

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

export function generateRelatorioTecnicoHTML(data: RelatorioTecnicoPDFData): string {
  const dateStr = new Date(data.reportDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const dateShort = new Date(data.reportDate + 'T12:00:00').toLocaleDateString('pt-BR')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Técnico ${data.numeroRelatorio} — ${data.projectName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      color: #0f172a;
      background: #fafafa;
      line-height: 1.6;
    }

    @page { size: A4; margin: 0; }
    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page { margin: 2.5cm 1.5cm; min-height: 29.7cm; break-after: page; position: relative; }
    }

    .page { background: white; width: 210mm; min-height: 297mm; padding: 2.5cm 1.5cm; margin: 0 auto; position: relative; }

    /* CAPA */
    .capa {
      background: #1e1b4b;
      color: white;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 297mm;
      width: 210mm;
      margin: 0 auto;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    .capa::before {
      content: ''; position: absolute; top: -10%; right: -10%; width: 40%; height: 40%;
      background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 75%);
      border-radius: 50%;
    }
    .capa-header { display: flex; justify-content: space-between; align-items: flex-start;  border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 30px; }
    .capa-logo { width: 80px; height: 80px; background: white; border-radius: 12px; padding: 8px; display: flex; align-items: center; justify-content: center; }
    .capa-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .capa-comp { text-align: right; }
    .capa-comp strong { font-size: 16pt; display: block; font-weight: 800; }
    .capa-comp span { font-size: 9.5pt; opacity: 0.6; display: block; margin-top: 4px; }

    .capa-main { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .capa-tag { display: inline-block; background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4); padding: 5px 15px; border-radius: 99px; font-size: 9pt; font-weight: 800; letter-spacing: 0.1em; color: #a5b4fc; margin-bottom: 30px; text-transform: uppercase; }
    .capa-title { font-size: 38pt; font-weight: 800; line-height: 1.1; margin-bottom: 15px; letter-spacing: -0.01em; }
    .capa-sub { font-size: 16pt; opacity: 0.6; margin-bottom: 60px; max-width: 80%; }
    
    .capa-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: rgba(255,255,255,0.05); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
    .m-item label { font-size: 7.5pt; text-transform: uppercase; opacity: 0.5; font-weight: 800; letter-spacing: 0.05em; display: block; }
    .m-item div { font-size: 12pt; font-weight: 600; margin-top: 5px; }

    .capa-foot { padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; font-size: 9pt; color: rgba(255,255,255,0.4); weight: 600; }

    /* CONTENT PAGES */
    .inner-header { position: absolute; top: 1cm; left: 1.5cm; right: 1.5cm; display: flex; justify-content: space-between; font-size: 8pt; color: #94a3b8; font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
    .inner-footer { position: absolute; bottom: 1cm; left: 1.5cm; right: 1.5cm; display: flex; justify-content: space-between; font-size: 8pt; color: #94a3b8; font-weight: 700; border-top: 1px solid #f1f5f9; padding-top: 10px; }

    .section { margin-bottom: 40px; break-inside: avoid-page; }
    .section-h { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .section-h h2 { font-size: 13pt; font-weight: 800; text-transform: uppercase; color: #1e1b4b; letter-spacing: 0.02em; }
    .section-h:after { content: ''; flex: 1; height: 2px; background: #e0e7ff; }

    /* Resumo Box */
    .resumo { background: linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%); border: 2px solid #7c3aed; border-radius: 16px; padding: 25px; margin-bottom: 40px; }
    .res-tag { display: inline-block; background: #7c3aed; color: white; padding: 3px 12px; border-radius: 99px; font-size: 7.5pt; font-weight: 800; margin-bottom: 12px; }
    .res-title { font-size: 15pt; font-weight: 800; color: #4c1d95; margin-bottom: 10px; }
    .res-text { font-size: 10.5pt; color: #5b21b6; font-weight: 500; white-space: pre-wrap; }

    .text-box { background: white; border: 1px solid #f1f5f9; padding: 20px; border-radius: 12px; font-size: 10pt; color: #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); white-space: pre-wrap; }

    /* Diagnostics */
    .diag-card { margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; break-inside: avoid-page; }
    .diag-h { background: #1e1b4b; color: white; padding: 12px 20px; font-weight: 800; font-size: 10.5pt; }
    .diag-b { padding: 20px; }
    .diag-txt { font-size: 10pt; margin-bottom: 15px; color: #475569; }
    .diag-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .diag-p-box { border-radius: 10px; overflow: hidden; border: 1px solid #f1f5f9; }
    .diag-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-bottom: 1px solid #f1f5f9; }
    .diag-cap { padding: 6px; font-size: 7pt; color: #94a3b8; text-align: center; }

    /* Recommendations */
    .rec-item { display: flex; gap: 15px; padding: 15px; border-radius: 12px; margin-bottom: 12px; break-inside: avoid; border: 1px solid transparent; }
    .rec-flag { flex-shrink: 0; width: 80px; text-align: center; font-size: 7.5pt; font-weight: 800; padding: 4px; border-radius: 6px; color: white; }
    .rec-body { font-size: 10pt; font-weight: 500; color: #1e293b; }

    /* Buttons */
    .print-btn {
      position: fixed; bottom: 30px; right: 30px;
      background: #7c3aed; color: white; border: none;
      padding: 15px 30px; border-radius: 99px;
      font-weight: 800; cursor: pointer; box-shadow: 0 10px 30px rgba(124,58,237,0.4);
      z-index: 1000; font-size: 14px;
    }
  </style>
</head>
<body>

  <button class="print-btn no-print" onclick="window.print()">⬇ Baixar Relatório Técnico Premium</button>

  <!-- CAPA -->
  <div class="capa">
    <div class="capa-header">
      <div class="capa-logo">
        ${data.companyLogo ? `<img src="${data.companyLogo}" />` : '📂'}
      </div>
      <div class="capa-comp">
        <strong>${data.companyName || 'RelatorioFlow'}</strong>
        <span>${data.responsavelTecnico} · CREA/CAU ${data.creaCau || ''}</span>
      </div>
    </div>

    <div class="capa-main">
      <div class="capa-tag">Padrão ABNT NBR 10719 · Documento Técnico</div>
      <div class="capa-title">${data.projectName}</div>
      <p class="capa-sub">${data.projectAddress || 'Local não informado'}</p>

      <div class="capa-meta">
        <div class="m-item"><label>Data da Emissão</label><div>${dateStr}</div></div>
        <div class="m-item"><label>N° do Registro</label><div>${data.numeroRelatorio}</div></div>
        <div class="m-item"><label>Cliente</label><div>${data.clientName || '---'}</div></div>
        <div class="m-item"><label>Documento de Responsabilidade</label><div>${data.artRrt || 'Não vinculada'}</div></div>
      </div>
    </div>

    <div class="capa-foot">
      <div>RelatorioFlow · Advanced Engineering Docs</div>
      <div>Confidencial © ${new Date().getFullYear()}</div>
    </div>
  </div>

  <!-- PAGE 2: Resumo e Escopo -->
  <div class="page">
    <div class="inner-header"><div>${data.projectName}</div><div>Página 1</div></div>
    
    <div class="resumo">
      <div class="res-tag">PARECER EXECUTIVO</div>
      <h2 class="res-title">Conclusão Final</h2>
      <div class="res-text">${data.conclusao}</div>
    </div>

    <section class="section">
      <div class="section-h"><h2>1. Objetivo</h2></div>
      <div class="text-box">${data.objetivo}</div>
    </section>

    <section class="section">
      <div class="section-h"><h2>2. Metodologia</h2></div>
      <div class="text-box">${data.metodologia}</div>
    </section>

    <div class="inner-footer"><div>Doc ID: ${data.numeroRelatorio}</div><div>${dateShort}</div></div>
  </div>

  <!-- PAGE 3+: Diagnóstico -->
  <div class="page">
    <div class="inner-header"><div>${data.projectName}</div><div>Página 2</div></div>
    
    <section class="section">
      <div class="section-h"><h2>3. Diagnóstico e Análise Técnica</h2></div>
      ${data.diagnostico.map((d, i) => `
        <div class="diag-card">
          <div class="diag-h">Seção 3.${i+1} · ${d.titulo}</div>
          <div class="diag-b">
            <div class="diag-txt">${d.conteudo}</div>
            <div class="diag-grid">
              ${d.fotos.map(f => `
                <div class="diag-p-box">
                  <img src="${f.url}" class="diag-img" />
                  <div class="diag-cap">${f.caption || 'Registro de campo.'}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </section>

    <div class="inner-footer"><div>Doc ID: ${data.numeroRelatorio}</div><div>${dateShort}</div></div>
  </div>

  <!-- PAGE FINAL: Recomendações e Assinatura -->
  <div class="page" style="break-before: always;">
    <div class="inner-header"><div>${data.projectName}</div><div>Página Final</div></div>

    <section class="section">
      <div class="section-h"><h2>4. Plano de Ação e Recomendações</h2></div>
      ${data.recomendacoes.map(r => {
        const bg = r.prioridade === 'alta' ? '#fee2e2' : r.prioridade === 'media' ? '#fef3c7' : '#f0fdf4';
        const color = r.prioridade === 'alta' ? '#dc2626' : r.prioridade === 'media' ? '#d97706' : '#15803d';
        return `
          <div class="rec-item" style="background: ${bg}; border-color: ${color}20;">
            <div class="rec-flag" style="background: ${color};">${r.prioridade.toUpperCase()}</div>
            <div class="rec-body">${r.texto}</div>
          </div>
        `
      }).join('')}
    </section>

    <section style="margin-top: 150px; text-align: center;">
      <div style="width: 350px; margin: 0 auto; border-top: 3px solid #1e1b4b; padding-top: 15px;">
        <strong style="font-size: 13pt; display: block;">${data.responsavelTecnico}</strong>
        <span style="font-size: 9pt; color: #64748b; font-weight: 700; display: block; margin-top: 5px;">RESPONSÁVEL TÉCNICO</span>
        <span style="font-size: 8.5pt; color: #94a3b8; display: block; margin-top: 2px;">CREA/CAU ${data.creaCau || '---'}</span>
      </div>
    </section>

    <div class="inner-footer"><div>Gerado por RelatorioFlow</div><div>${dateShort}</div></div>
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
    win.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    }
  }
}
