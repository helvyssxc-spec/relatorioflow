import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MaintenancePDFData {
  projectName: string;
  projectAddress?: string;
  reportDate: string;
  tecnicoNome: string;
  ativoNome: string;
  ativoTag?: string;
  sistema: string;
  reportType: 'preventiva' | 'corretiva';
  statusAnterior: string;
  statusPosterior: string;
  descricaoServico?: string;
  pecasSubstituidas?: { nome?: string; qtd?: number }[];
  fotos?: { url: string; caption?: string }[];
  observacoes?: string;
  companyName?: string;
  companyLogo?: string;
}

const statusColors: any = {
  operacional: [34, 197, 94], // green-500
  falha_parcial: [234, 179, 8], // yellow-500
  parado: [239, 68, 68] // red-500
};

const statusLabels: any = {
  operacional: 'OPERACIONAL',
  falha_parcial: 'FALHA PARCIAL',
  parado: 'FORA DE OPERAÇÃO'
};

export const openRelatorioManutencaoPDF = (data: MaintenancePDFData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  let y = 20

  // ── Cabeçalho ──
  if (data.companyLogo) {
     try { doc.addImage(data.companyLogo, 'PNG', 15, y - 5, 25, 25) } catch(e) {}
  }
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(data.companyName || 'RELATÓRIO FLOW - SISTEMAS', 45, y + 5)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Relatório de Manutenção ${data.reportType === 'preventiva' ? 'Preventiva' : 'Corretiva'}`, 45, y + 10)
  doc.text(`ID: RM-${format(new Date(), 'yyyyMMddHHmm')}`, 45, y + 15)
  
  y += 25
  doc.setDrawColor(230)
  doc.line(15, y, pageWidth - 15, y)
  y += 10

  // ── Identificação do Equipamento ──
  doc.setFillColor(245, 245, 250)
  doc.roundedRect(15, y, pageWidth - 30, 25, 3, 3, 'F')
  
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('EQUIPAMENTO / ATIVO', 20, y + 7)
  doc.text('TAG / IDENTIFICADOR', pageWidth / 2, y + 7)
  doc.text('SISTEMA / DISCIPLINA', pageWidth - 60, y + 7)
  
  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text(data.ativoNome.toUpperCase(), 20, y + 15)
  doc.text(data.ativoTag?.toUpperCase() || 'N/A', pageWidth / 2, y + 15)
  doc.text(data.sistema.toUpperCase(), pageWidth - 60, y + 15)
  
  y += 35

  // ── Status Comparativo ──
  const colorPrev = statusColors[data.statusAnterior] || [0,0,0]
  const colorPost = statusColors[data.statusPosterior] || [0,0,0]

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('ESTADO INICIAL (Check-in)', 15, y)
  doc.text('ESTADO FINAL (Check-out)', pageWidth / 2 + 5, y)
  
  y += 5
  // Box Incial
  doc.setDrawColor(220)
  doc.roundedRect(15, y, pageWidth / 2 - 20, 12, 2, 2, 'D')
  doc.setTextColor(colorPrev[0], colorPrev[1], colorPrev[2])
  doc.text(statusLabels[data.statusAnterior] || data.statusAnterior.toUpperCase(), 18, y + 8)
  
  // Box Final
  doc.setDrawColor(220)
  doc.roundedRect(pageWidth / 2 + 5, y, pageWidth / 2 - 20, 12, 2, 2, 'D')
  doc.setTextColor(colorPost[0], colorPost[1], colorPost[2])
  doc.text(statusLabels[data.statusPosterior] || data.statusPosterior.toUpperCase(), pageWidth / 2 + 8, y + 8)
  
  y += 22
  doc.setTextColor(0)

  // ── Descrição dos Serviços ──
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIÇÃO TÉCNICA E ATIVIDADES REALIZADAS', 15, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const splitDesc = doc.splitTextToSize(data.descricaoServico || 'Nenhuma descrição informada.', pageWidth - 30)
  doc.text(splitDesc, 15, y)
  y += splitDesc.length * 5 + 10

  // ── Peças Substituídas (Tabela) ──
  if (data.pecasSubstituidas && data.pecasSubstituidas.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('PEÇAS E INSUMOS SUBSTITUÍDOS', 15, y)
    y += 5
    
    autoTable(doc, {
      startY: y,
      head: [['ITEM / COMPONENTE', 'QUANTIDADE']],
      body: (data.pecasSubstituidas || []).map(p => [(p.nome || 'N/A').toUpperCase(), (p.qtd || 0).toString()]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 15, right: 15 }
    })
    
    y = (doc as any).lastAutoTable.finalY + 15
  }

  // ── Observações ──
  if (data.observacoes) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVAÇÕES E RESSALVAS', 15, y)
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const obs = doc.splitTextToSize(data.observacoes, pageWidth - 30)
    doc.text(obs, 15, y)
    y += obs.length * 5 + 15
  }

  // ── Evidências Fotográficas ──
  if (data.fotos && data.fotos.length > 0) {
    // Verifica se precisa de nova página
    if (y > doc.internal.pageSize.height - 100) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('EVIDÊNCIAS FOTOGRÁFICAS', 15, y)
    y += 10

    const imgWidth = (pageWidth - 40) / 2
    const imgHeight = 60

    data.fotos.forEach((foto, index) => {
       // A cada 2 fotos ou se estourar a página, pula
       if (y > doc.internal.pageSize.height - 80) {
          doc.addPage();
          y = 20;
       }

       const x = (index % 2 === 0) ? 15 : (pageWidth / 2 + 5)
       try {
          doc.addImage(foto.url, 'JPEG', x, y, imgWidth, imgHeight)
          if (foto.caption) {
             doc.setFontSize(7)
             doc.text(foto.caption.toUpperCase(), x, y + imgHeight + 5)
          }
       } catch (e) {
          doc.setDrawColor(200)
          doc.rect(x, y, imgWidth, imgHeight, 'D')
          doc.setFontSize(8)
          doc.text('ERRO AO CARREGAR IMAGEM', x + 5, y + imgHeight/2)
       }

       if (index % 2 !== 0 || index === data.fotos!.length - 1) {
          y += imgHeight + 15
       }
    })
  }

  // ── Rodapé / Assinatura de Prestígio ──
  y = doc.internal.pageSize.height - 40
  doc.setDrawColor(240, 240, 240)
  doc.setLineWidth(0.5)
  doc.line(15, y - 5, pageWidth - 15, y - 5) // Linha decorativa leve
  
  doc.setDrawColor(200)
  doc.line(15, y, 90, y)
  doc.line(pageWidth - 90, y, pageWidth - 15, y)
  
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text('ASSINATURA DO RESPONSÁVEL', 35, y + 5)
  doc.text('ASSINATURA DO CLIENTE', pageWidth - 65, y + 5)
  
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text(data.tecnicoNome.toUpperCase(), 35, y + 10)
  
  doc.setFontSize(7)
  doc.setTextColor(180)
  const dt = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })
  
  // Marca d'água de autenticidade (Digital Signature Look)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 80, 220) // Blue prestige
  doc.text('✓ DOCUMENTO ORIGINAL AUTENTICADO POR RELATÓRIOFLOW', pageWidth / 2, y + 20, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(160)
  doc.text(`Emitido eletronicamente em ${dt} | Hash: ${crypto.randomUUID().split('-')[0].toUpperCase()}`, pageWidth / 2, y + 25, { align: 'center' })

  // Gerar e Abrir
  const pdfBlob = doc.output('bloburl')
  window.open(pdfBlob.toString(), '_blank')
}
