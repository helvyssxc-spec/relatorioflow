interface EquipeItem { nome: string; funcao: string; horas: number }
interface AtividadeItem { descricao: string; disciplina: string; percentual_concluido: number; observacao?: string }
interface EquipamentoItem { nome: string; quantidade: number; status: string }
interface FotoItem { url: string; caption?: string }

interface DiarioObraPDFData {
  projectName: string
  projectAddress?: string
  clientName?: string
  artRrt?: string
  companyName?: string
  companyLogo?: string
  responsavelNome: string
  creaCau?: string
  reportDate: string
  condicaoTempo: string
  temperatura?: string
  equipe: EquipeItem[]
  atividades: AtividadeItem[]
  equipamentos: EquipamentoItem[]
  ocorrencias?: string
  fotos: FotoItem[]
  totalDiasRegistrados?: number
  totalHorasAcumuladas?: number
}

function statusLabel(s: string) {
  if (s === 'operando') return '<span style="color:#10b981; font-weight: bold;">● Ativo</span>'
  if (s === 'parado') return '<span style="color:#ef4444; font-weight: bold;">● Parado</span>'
  return '<span style="color:#f59e0b; font-weight: bold;">● Manutenção</span>'
}

export function generateDiarioObraHTML(data: DiarioObraPDFData): string {
  const dateStr = new Date(data.reportDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const totalHorasDia = data.equipe.reduce((acc, e) => acc + (Number(e.horas) || 0), 0)
  const totalPessoas = data.equipe.length

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Diário de Obra — ${data.projectName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      color: #0f172a;
      background: #fafafa;
      line-height: 1.5;
      counter-reset: page;
    }

    /* Paginação */
    @page {
      size: A4;
      margin: 2cm 1.5cm;
    }

    /* Print Specifics */
    @media print {
      body { background: #white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }

    .container { max-width: 800px; margin: 0 auto; background: white; min-height: 29.7cm; position: relative; }

    /* Header */
    .header {
      background: #1e1b4b;
      color: white;
      padding: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 5px solid #4f46e5;
    }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .logo-box { width: 70px; height: 70px; background: white; border-radius: 12px; padding: 6px; display: flex; align-items: center; justify-content: center; }
    .logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .title-box h1 { font-size: 18pt; font-weight: 800; letter-spacing: -0.02em; }
    .title-box p { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.7); font-weight: 600; }

    .header-right { text-align: right; }
    .header-right strong { font-size: 12pt; display: block; }
    .header-right span { font-size: 8.5pt; opacity: 0.7; }

    /* Info Bar */
    .info-bar {
      padding: 24px 40px;
      background: #f1f5f9;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-item label { font-size: 7pt; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; }
    .info-item div { font-size: 9.5pt; font-weight: 600; color: #1e293b; margin-top: 3px; }

    /* Summary Boxes */
    .clima-summary {
      margin: 32px 40px;
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      border-radius: 16px;
      padding: 24px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.2);
    }
    .clima-left { display: flex; align-items: center; gap: 16px; }
    .clima-icon { font-size: 28pt; }
    .clima-text h2 { font-size: 16pt; font-weight: 700; }
    .clima-text p { opacity: 0.8; font-size: 9pt; }

    .stats-grid { display: flex; gap: 12px; }
    .stat-pill { background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 12px; backdrop-filter: blur(4px); text-align: center; }
    .stat-val { font-size: 13pt; font-weight: 800; display: block; }
    .stat-lab { font-size: 7pt; text-transform: uppercase; opacity: 0.7; font-weight: 700; }

    /* Content Area */
    .main-content { padding: 0 40px 40px; }

    .section { margin-bottom: 40px; break-inside: avoid; }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; color: #1e1b4b; position: relative; }
    .section-header h2 { font-size: 11pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .section-header:after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }

    /* Tables */
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 10px; }
    th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 7.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px 16px; font-size: 9pt; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:last-child td { border-bottom: none; }
    .row-highlight { font-weight: 700; color: #1e293b; }

    /* Activities */
    .atv-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .atv-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .atv-name { font-weight: 700; color: #1e293b; font-size: 10pt; flex: 1; }
    .atv-tag { font-size: 7pt; font-weight: 800; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
    .atv-prog { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin: 10px 0; }
    .atv-fill { height: 100%; background: #4f46e5; border-radius: 3px; }
    .atv-footer { display: flex; justify-content: space-between; font-size: 8.5pt; color: #64748b; }
    .atv-pct { font-weight: 800; color: #4f46e5; }

    /* Photos */
    .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .photo-cell { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; page-break-inside: avoid; }
    .photo-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; border-bottom: 1px solid #e2e8f0; }
    .photo-cap { padding: 10px; font-size: 8pt; color: #475569; text-align: center; font-style: italic; background: #f8fafc; }

    /* Footer */
    .footer {
      border-top: 1px solid #e2e8f0;
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 7.5pt;
      font-weight: 600;
    }
    .footer strong { color: #64748b; }

    /* Custom Print Button */
    .print-button {
      position: fixed; bottom: 30px; right: 30px;
      background: #4f46e5; color: white; border: none;
      padding: 14px 28px; border-radius: 99px;
      font-weight: 700; cursor: pointer;
      box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);
      z-index: 100; font-size: 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .print-button:hover { transform: scale(1.05); transition: 0.2s; background: #4338ca; }
  </style>
</head>
<body>

  <button class="print-button no-print" onclick="window.print()">⬇ Baixar Documento Oficial</button>

  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <div class="logo-box">
          ${data.companyLogo ? `<img src="${data.companyLogo}" class="logo-img" />` : '🏗️'}
        </div>
        <div class="title-box">
          <p>Relatório Institucional</p>
          <h1>Diário de Obra (RDO)</h1>
        </div>
      </div>
      <div class="header-right">
        <strong>${data.companyName || 'RelatorioFlow'}</strong>
        <span>${data.responsavelNome}</span>
      </div>
    </header>

    <!-- Info Bar -->
    <div class="info-bar">
      <div class="info-item">
        <label>Empreendimento / Obra</label>
        <div>${data.projectName}</div>
      </div>
      <div class="info-item">
        <label>Data de Registro</label>
        <div>${dateStr}</div>
      </div>
      <div class="info-item" style="text-align: right;">
        <label>ART / RRT</label>
        <div>${data.artRrt || 'Não informado'}</div>
      </div>
    </div>

    <!-- Clima & Pessoas -->
    <div class="clima-summary">
      <div class="clima-left">
        <div class="clima-icon">${
          data.condicaoTempo.includes('Ensol') ? '☀️'
          : data.condicaoTempo.includes('Nublado') ? '⛅'
          : data.condicaoTempo.includes('Chuv') ? '🌧️'
          : data.condicaoTempo.includes('Temp') ? '⛈️'
          : '🌤️'
        }</div>
        <div class="clima-text">
          <h2>${data.condicaoTempo}</h2>
          <p>${data.temperatura ? `Temperatura média: ${data.temperatura}` : 'Clima apurado no local'}</p>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-pill">
          <span class="stat-val">${totalPessoas}</span>
          <span class="stat-lab">Profissionais</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">${totalHorasDia}h</span>
          <span class="stat-lab">Produtividade</span>
        </div>
      </div>
    </div>

    <!-- Main -->
    <main class="main-content">
      
      <!-- Equipe -->
      ${data.equipe.length > 0 ? `
      <section class="section">
        <div class="section-header"><h2>1. Efetivo do Dia</h2></div>
        <table>
          <thead>
            <tr>
              <th>Colaborador / Equipe</th>
              <th>Função / Qualificação</th>
              <th style="text-align: center; width: 60px;">Horas</th>
            </tr>
          </thead>
          <tbody>
            ${data.equipe.map(e => `
              <tr>
                <td class="row-highlight">${e.nome}</td>
                <td>${e.funcao}</td>
                <td style="text-align: center">${e.horas}h</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      ` : ''}

      <!-- Atividades -->
      ${data.atividades.length > 0 ? `
      <section class="section">
        <div class="section-header"><h2>2. Serviços Executados</h2></div>
        ${data.atividades.map(a => `
          <div class="atv-card">
            <div class="atv-top">
              <div class="atv-name">${a.descricao}</div>
              <div class="atv-tag">${a.disciplina}</div>
            </div>
            <div class="atv-prog"><div class="atv-fill" style="width: ${a.percentual_concluido}%"></div></div>
            <div class="atv-footer">
              <span>${a.observacao || 'Nenhuma observação técnica.'}</span>
              <span class="atv-pct">${a.percentual_concluido}% concluído</span>
            </div>
          </div>
        `).join('')}
      </section>
      ` : ''}

      <!-- Equipamentos -->
      ${data.equipamentos.length > 0 ? `
      <section class="section">
        <div class="section-header"><h2>3. Equipamentos e Máquinas</h2></div>
        <table>
          <thead>
            <tr>
              <th>Equipamento</th>
              <th style="width: 50px; text-align: center">Qtd</th>
              <th style="width: 140px">Situação Operacional</th>
            </tr>
          </thead>
          <tbody>
            ${data.equipamentos.map(e => `
              <tr>
                <td class="row-highlight">${e.nome}</td>
                <td style="text-align: center">${e.quantidade}</td>
                <td>${statusLabel(e.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      ` : ''}

      <!-- Ocorrências -->
      ${data.ocorrencias ? `
      <section class="section">
        <div class="section-header"><h2>4. Ocorrências Gerais</h2></div>
        <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 12px; font-size: 9.5pt; color: #92400e; white-space: pre-wrap;">${data.ocorrencias}</div>
      </section>
      ` : ''}

      <!-- Fotos -->
      ${data.fotos.length > 0 ? `
      <section class="section">
        <div class="section-header"><h2>5. Registro Fotográfico</h2></div>
        <div class="photo-grid">
          ${data.fotos.map(f => `
            <div class="photo-cell">
              <img src="${f.url}" class="photo-img" />
              <div class="photo-cap">${f.caption || 'Evidência fotográfica capturada em campo.'}</div>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <!-- Assinatura -->
      <section style="margin-top: 80px; text-align: center; break-inside: avoid;">
        <div style="width: 300px; margin: 0 auto; border-top: 2px solid #1e1b4b; padding-top: 10px;">
          <strong style="display: block; font-size: 11pt;">${data.responsavelNome}</strong>
          <span style="display: block; font-size: 8pt; color: #64748b; margin-top: 4px;">RESPONSÁVEL TÉCNICO</span>
          ${data.creaCau ? `<span style="font-size: 8pt; color: #94a3b8;">Registre Profissional: ${data.creaCau}</span>` : ''}
        </div>
      </section>

    </main>

    <footer class="footer">
      <div><strong>${data.projectName}</strong> — Doc ID: RDO-${data.reportDate.replace(/-/g, '')}</div>
      <div>Gerado de forma segura via RelatorioFlow · Página oficial</div>
    </footer>
  </div>

</body>
</html>`
}

export function openDiarioObraPDF(data: DiarioObraPDFData) {
  const html = generateDiarioObraHTML(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) {
    win.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    }
  }
}
