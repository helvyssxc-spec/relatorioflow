import { mdToHtml, mdCss } from './markdownToHtml'

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

const TEMPO_OPCOES = ['Ensolarado', 'Parcialmente Nublado', 'Nublado', 'Chuva Fraca', 'Chuva Forte', 'Tempestade']

function tempoIcon(t: string): string {
  if (t.includes('Ensol')) return '☀'
  if (t.includes('Parcial')) return '⛅'
  if (t.includes('Nublado')) return '☁'
  if (t.includes('Fraca')) return '🌦'
  if (t.includes('Forte')) return '🌧'
  if (t.includes('Temp')) return '⛈'
  return '🌤'
}

function checkbox(checked: boolean) {
  return checked
    ? `<span style="display:inline-block;width:14px;height:14px;border:1.5px solid #1e3a5f;background:#1e3a5f;border-radius:2px;text-align:center;line-height:14px;color:white;font-size:9px;">✓</span>`
    : `<span style="display:inline-block;width:14px;height:14px;border:1.5px solid #64748b;border-radius:2px;"></span>`
}

export function generateDiarioObraHTML(data: DiarioObraPDFData): string {
  const dateObj = new Date(data.reportDate + 'T12:00:00')
  const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const dateShort = dateObj.toLocaleDateString('pt-BR')
  const rdoNum = data.reportDate.replace(/-/g, '')
  const totalHoras = data.equipe.reduce((a, e) => a + (Number(e.horas) || 0), 0)

  // Contador dinâmico de seções — evita pulos na numeração
  let sec = 0
  const S = () => `<span class="num">${++sec}</span>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>RDO — ${data.projectName} — ${dateShort}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    ${mdCss}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; font-size: 9pt; color: #1e293b; background: #f1f5f9; line-height: 1.4; }
    @page { size: A4; margin: 1.5cm 1.5cm 2cm; }
    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    .page { max-width: 210mm; margin: 0 auto; background: white; }

    /* ── Cabeçalho principal ── */
    .rdo-header { border: 2px solid #1e3a5f; border-bottom: none; }
    .rdo-header-top {
      display: grid;
      grid-template-columns: 120px 1fr 120px;
      border-bottom: 2px solid #1e3a5f;
    }
    .hdr-logo { padding: 10px; display: flex; align-items: center; justify-content: center; border-right: 1.5px solid #1e3a5f; min-height: 80px; }
    .hdr-logo img { max-width: 100px; max-height: 60px; object-fit: contain; }
    .hdr-logo-placeholder { font-size: 26pt; }
    .hdr-title { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; text-align: center; }
    .hdr-title h1 { font-size: 14pt; font-weight: 800; color: #1e3a5f; letter-spacing: 0.01em; }
    .hdr-title p { font-size: 8pt; color: #475569; margin-top: 3px; }
    .hdr-num { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; border-left: 1.5px solid #1e3a5f; text-align: center; }
    .hdr-num label { font-size: 7pt; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.08em; }
    .hdr-num strong { font-size: 16pt; font-weight: 800; color: #1e3a5f; display: block; margin-top: 2px; }

    /* ── Grid de dados gerais ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-bottom: 1.5px solid #1e3a5f;
    }
    .info-grid-3 { grid-template-columns: 2fr 1fr 1fr; }
    .info-cell {
      padding: 6px 10px;
      border-right: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .info-cell:last-child { border-right: none; }
    .info-cell label { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.07em; display: block; }
    .info-cell span { font-size: 9pt; font-weight: 600; color: #1e293b; display: block; margin-top: 2px; }

    /* ── Seções ── */
    .section { border: 1.5px solid #1e3a5f; border-top: none; }
    .section-title {
      background: #1e3a5f;
      color: white;
      padding: 6px 12px;
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title .num { background: rgba(255,255,255,0.2); border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 8pt; flex-shrink: 0; }

    /* ── Tabelas ── */
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f1f5f9; }
    th { padding: 7px 10px; font-size: 7pt; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.06em; border-bottom: 1.5px solid #cbd5e1; text-align: left; }
    td { padding: 7px 10px; font-size: 8.5pt; color: #334155; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background: #f8fafc; }
    .td-center { text-align: center; }
    .td-bold { font-weight: 700; color: #1e293b; }

    /* ── Condição do tempo checkboxes ── */
    .tempo-grid { display: flex; flex-wrap: wrap; gap: 16px; padding: 12px 14px; align-items: center; }
    .tempo-opt { display: flex; align-items: center; gap: 6px; font-size: 8.5pt; color: #334155; }
    .tempo-icon { font-size: 13pt; }

    /* ── Progress bar ── */
    .prog-bar { background: #e2e8f0; border-radius: 2px; height: 6px; width: 80px; display: inline-block; overflow: hidden; }
    .prog-fill { height: 100%; background: #1e3a5f; border-radius: 2px; }

    /* Status equipamento */
    .status-op { color: #16a34a; font-weight: 700; }
    .status-par { color: #dc2626; font-weight: 700; }
    .status-man { color: #d97706; font-weight: 700; }

    /* ── Fotos ── */
    .foto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .foto-cell { border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .foto-cell:nth-child(even) { border-right: none; }
    .foto-img-wrap { padding: 10px 10px 0; }
    .foto-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border: 1px solid #e2e8f0; display: block; border-radius: 4px; }
    .foto-meta { padding: 6px 10px 10px; }
    .foto-meta table { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
    .foto-meta th { font-size: 6pt; padding: 4px 6px; }
    .foto-meta td { font-size: 7.5pt; padding: 4px 6px; border-bottom: none; }
    .foto-caption { font-size: 8pt; color: #334155; padding: 4px 10px 8px; font-style: italic; }

    /* ── Assinatura ── */
    .assinatura-row { display: grid; grid-template-columns: 1fr 1fr; }
    .assinatura-cell { padding: 14px 20px; border-right: 1px solid #cbd5e1; }
    .assinatura-cell:last-child { border-right: none; }
    .assinatura-label { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.07em; display: block; margin-bottom: 30px; }
    .assinatura-line { border-top: 1.5px solid #1e3a5f; padding-top: 6px; }
    .assinatura-name { font-size: 9pt; font-weight: 700; color: #1e293b; }
    .assinatura-role { font-size: 7.5pt; color: #64748b; display: block; margin-top: 2px; }

    /* ── Ocorrências ── */
    .ocorrencias-box { padding: 12px 14px; min-height: 80px; font-size: 8.5pt; color: #334155; }

    /* ── Totalizador ── */
    .totalizador { background: #f8fafc; display: flex; gap: 0; }
    .total-item { flex: 1; padding: 8px 14px; border-right: 1px solid #e2e8f0; }
    .total-item:last-child { border-right: none; }
    .total-item label { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.07em; display: block; }
    .total-item strong { font-size: 12pt; font-weight: 800; color: #1e3a5f; display: block; margin-top: 3px; }

    /* ── Rodapé ── */
    .rdo-footer { border-top: 1px solid #cbd5e1; padding: 8px 14px; display: flex; justify-content: space-between; font-size: 7pt; color: #94a3b8; }

    /* ── Botão imprimir ── */
    .print-btn {
      position: fixed; bottom: 28px; right: 28px;
      background: #1e3a5f; color: white; border: none;
      padding: 13px 26px; border-radius: 8px;
      font-weight: 700; cursor: pointer; font-size: 13px;
      box-shadow: 0 4px 20px rgba(30,58,95,0.4); z-index: 1000;
    }
    .print-btn:hover { background: #2d4f82; }
  </style>
</head>
<body>

  <button class="print-btn no-print" onclick="window.print()">⬇ Imprimir / Salvar PDF</button>

  <div class="page">

    <!-- ═══════════════════ CABEÇALHO PRINCIPAL ═══════════════════ -->
    <div class="rdo-header">
      <div class="rdo-header-top">
        <div class="hdr-logo">
          ${data.companyLogo
            ? `<img src="${data.companyLogo}" />`
            : `<div class="hdr-logo-placeholder">🏗</div>`}
        </div>
        <div class="hdr-title">
          <h1>RELATÓRIO DIÁRIO DE OBRA</h1>
          <p>RDO — Conforme NBR 12.722 e Resolução CONFEA 1.094/2019</p>
        </div>
        <div class="hdr-num">
          <label>RDO Nº</label>
          <strong>${rdoNum}</strong>
        </div>
      </div>

      <!-- Dados da obra -->
      <div class="info-grid info-grid-3">
        <div class="info-cell">
          <label>Empreendimento / Obra</label>
          <span>${data.projectName}</span>
        </div>
        <div class="info-cell">
          <label>Data do Registro</label>
          <span>${dateStr}</span>
        </div>
        <div class="info-cell">
          <label>ART / RRT Nº</label>
          <span>${data.artRrt || 'Não informado'}</span>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-cell">
          <label>Endereço / Local da Obra</label>
          <span>${data.projectAddress || 'Não informado'}</span>
        </div>
        <div class="info-cell">
          <label>Contratante / Cliente</label>
          <span>${data.clientName || 'Não informado'}</span>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-cell">
          <label>Responsável Técnico</label>
          <span>${data.responsavelNome}</span>
        </div>
        <div class="info-cell">
          <label>CREA / CAU / CFT</label>
          <span>${data.creaCau || '—'}</span>
        </div>
      </div>
    </div>

    <!-- ═══════════════════ 1. CONDIÇÕES CLIMÁTICAS ═══════════════════ -->
    <div class="section">
      <div class="section-title">
        ${S()} Condições Climáticas e de Trabalho
      </div>
      <div class="tempo-grid">
        ${TEMPO_OPCOES.map(op => `
          <div class="tempo-opt">
            ${checkbox(data.condicaoTempo === op || data.condicaoTempo.includes(op.split(' ')[0]))}
            <span class="tempo-icon">${tempoIcon(op)}</span>
            <span>${op}</span>
          </div>
        `).join('')}
        ${data.temperatura ? `
        <div class="tempo-opt" style="margin-left:auto; font-weight:700; color:#1e3a5f;">
          🌡 Temperatura: ${data.temperatura}
        </div>` : ''}
      </div>
      <div style="border-top:1px solid #e2e8f0; padding: 6px 14px; background:#f8fafc;">
        <span style="font-size:8pt; color:#475569;">Condição de Trabalho: </span>
        <span style="font-size:8pt; font-weight:700; color:${data.condicaoTempo.includes('Chuva Forte') || data.condicaoTempo.includes('Temp') ? '#dc2626' : '#16a34a'}">
          ${data.condicaoTempo.includes('Chuva Forte') || data.condicaoTempo.includes('Temp') ? '✗ Suspensão parcial ou total das atividades' : '✓ Condições favoráveis à execução dos serviços'}
        </span>
      </div>
    </div>

    <!-- ═══════════════════ 2. EFETIVO — MÃO DE OBRA ═══════════════════ -->
    ${data.equipe.length > 0 ? `
    <div class="section">
      <div class="section-title">
        ${S()} Efetivo em Campo — Mão de Obra
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:30px;">#</th>
            <th>Colaborador / Equipe</th>
            <th>Função / Especialidade</th>
            <th class="td-center" style="width:80px;">Horas</th>
          </tr>
        </thead>
        <tbody>
          ${data.equipe.map((e, i) => `
          <tr>
            <td class="td-center" style="color:#94a3b8; font-size:8pt;">${String(i + 1).padStart(2, '0')}</td>
            <td class="td-bold">${e.nome || '—'}</td>
            <td>${e.funcao || '—'}</td>
            <td class="td-center td-bold">${e.horas}h</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="totalizador">
        <div class="total-item"><label>Total de Profissionais</label><strong>${data.equipe.length}</strong></div>
        <div class="total-item"><label>Total de Horas-Homem</label><strong>${totalHoras}h</strong></div>
        <div class="total-item"><label>Média de Horas / Pessoa</label><strong>${data.equipe.length > 0 ? (totalHoras / data.equipe.length).toFixed(1) : '0'}h</strong></div>
      </div>
    </div>` : ''}

    <!-- ═══════════════════ 3. SERVIÇOS EXECUTADOS ═══════════════════ -->
    ${data.atividades.length > 0 ? `
    <div class="section">
      <div class="section-title">
        ${S()} Serviços Executados no Dia
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:30px;">#</th>
            <th>Descrição do Serviço</th>
            <th style="width:100px;">Disciplina</th>
            <th style="width:110px;" class="td-center">% Concluído</th>
            <th>Observações Técnicas</th>
          </tr>
        </thead>
        <tbody>
          ${data.atividades.map((a, i) => `
          <tr>
            <td class="td-center" style="color:#94a3b8; font-size:8pt;">${String(i + 1).padStart(2, '0')}</td>
            <td class="td-bold">${a.descricao}</td>
            <td style="font-size:8pt;">${a.disciplina}</td>
            <td class="td-center">
              <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                <div class="prog-bar"><div class="prog-fill" style="width:${a.percentual_concluido}%"></div></div>
                <span style="font-weight:700;color:#1e3a5f;font-size:8.5pt;">${a.percentual_concluido}%</span>
              </div>
            </td>
            <td style="font-size:8.5pt;color:#64748b;">${a.observacao || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <!-- ═══════════════════ 4. EQUIPAMENTOS ═══════════════════ -->
    ${data.equipamentos.length > 0 ? `
    <div class="section">
      <div class="section-title">
        ${S()} Equipamentos e Máquinas
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:30px;">#</th>
            <th>Equipamento / Máquina</th>
            <th style="width:70px;" class="td-center">Qtd.</th>
            <th style="width:160px;">Situação Operacional</th>
          </tr>
        </thead>
        <tbody>
          ${data.equipamentos.map((e, i) => {
            const cls = e.status === 'operando' ? 'status-op' : e.status === 'parado' ? 'status-par' : 'status-man'
            const label = e.status === 'operando' ? '● Em Operação' : e.status === 'parado' ? '● Parado' : '● Em Manutenção'
            return `
          <tr>
            <td class="td-center" style="color:#94a3b8; font-size:8pt;">${String(i + 1).padStart(2, '0')}</td>
            <td class="td-bold">${e.nome}</td>
            <td class="td-center">${e.quantidade}</td>
            <td class="${cls}">${label}</td>
          </tr>`}).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <!-- ═══════════════════ 5. OCORRÊNCIAS / OBSERVAÇÕES ═══════════════════ -->
    <div class="section">
      <div class="section-title">
        ${S()} Ocorrências, Interferências e Observações Gerais
      </div>
      <div class="ocorrencias-box">
        ${data.ocorrencias ? mdToHtml(data.ocorrencias) : '<span style="color:#94a3b8;font-style:italic;">Sem ocorrências registradas no dia.</span>'}
      </div>
    </div>

    <!-- ═══════════════════ 6. REGISTRO FOTOGRÁFICO ═══════════════════ -->
    ${data.fotos.length > 0 ? `
    <div class="section page-break">
      <div class="section-title">
        ${S()} Registro Fotográfico (${data.fotos.length} foto${data.fotos.length !== 1 ? 's' : ''})
      </div>
      <div class="foto-grid">
        ${data.fotos.map((f, i) => `
        <div class="foto-cell">
          <div class="foto-img-wrap">
            <img src="${f.url}" class="foto-img" />
          </div>
          <div class="foto-caption">Foto ${String(i + 1).padStart(2, '0')} — ${f.caption || 'Evidência fotográfica de campo.'}</div>
          <div class="foto-meta">
            <table>
              <tr>
                <th>Data</th><th>Responsável</th>
              </tr>
              <tr>
                <td>${dateShort}</td><td>${data.responsavelNome}</td>
              </tr>
            </table>
          </div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- ═══════════════════ 7. ASSINATURAS ═══════════════════ -->
    <div class="section">
      <div class="section-title">
        ${S()} Assinaturas e Responsabilidades
      </div>
      <div class="assinatura-row">
        <div class="assinatura-cell">
          <span class="assinatura-label">Responsável Técnico pela Obra</span>
          <div class="assinatura-line">
            <div class="assinatura-name">${data.responsavelNome}</div>
            <span class="assinatura-role">CREA/CAU/CFT: ${data.creaCau || '—'} · ${data.companyName || 'RelatorioFlow'}</span>
          </div>
        </div>
        <div class="assinatura-cell">
          <span class="assinatura-label">Fiscalização / Contratante</span>
          <div class="assinatura-line">
            <div class="assinatura-name">&nbsp;</div>
            <span class="assinatura-role">${data.clientName || '—'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rodapé -->
    <div class="rdo-footer">
      <span><strong>${data.projectName}</strong> — RDO Nº ${rdoNum} — ${dateShort}</span>
      <span>Gerado por RelatorioFlow · Conforme ABNT NBR 12.722</span>
    </div>

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
    win.onload = () => setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
}
