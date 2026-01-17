/**
 * DTC Scan Report Service
 * Gera relatórios PDF detalhados para auditoria mecânica profissional
 */

import jsPDF from 'jspdf';
import type { ParsedDTC } from '@/lib/dtcParser';
import type { VINInfo } from '@/lib/vinDecoder';
import { getDTCInfo, type DTCInfo } from '@/lib/dtcDatabase';

export interface ScanAuditData {
  // Informações do Veículo
  vin?: VINInfo | null;
  
  // Resultados do Scan
  confirmedDTCs: ParsedDTC[];
  discardedDTCs: ParsedDTC[];
  initialDTCs: ParsedDTC[];
  
  // Metadados
  scanDate: Date;
  scanDurationMs: number;
  modulesScanned: number;
  protocolUsed: string;
  
  // Condições do Veículo
  batteryVoltage?: number | null;
  lowVoltageWarning: boolean;
  
  // Logs do scan
  scanLogs: string[];
}

interface ReportConfig {
  includeDiscarded: boolean;
  includeLogs: boolean;
  includeTimestamps: boolean;
  language: 'pt' | 'en';
}

const DEFAULT_CONFIG: ReportConfig = {
  includeDiscarded: true,
  includeLogs: true,
  includeTimestamps: true,
  language: 'pt',
};

/**
 * Formata duração em formato legível
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Formata data/hora em formato brasileiro
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Retorna cor baseada na severidade
 */
function getSeverityColor(severity: string): [number, number, number] {
  switch (severity) {
    case 'high':
      return [220, 38, 38]; // Vermelho
    case 'medium':
      return [234, 179, 8]; // Amarelo
    case 'low':
      return [34, 197, 94]; // Verde
    default:
      return [107, 114, 128]; // Cinza
  }
}

/**
 * Traduz severidade para português
 */
function translateSeverity(severity: string): string {
  switch (severity) {
    case 'high':
      return 'CRÍTICO';
    case 'medium':
      return 'MODERADO';
    case 'low':
      return 'BAIXO';
    default:
      return 'DESCONHECIDO';
  }
}

/**
 * Gera o relatório PDF completo
 */
export async function generateDTCReportPDF(
  data: ScanAuditData,
  config: Partial<ReportConfig> = {}
): Promise<Blob> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const doc = new jsPDF();
  
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  // === CABEÇALHO ===
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE DIAGNÓSTICO VEICULAR', margin, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Scanner - Auditoria Mecânica Profissional', margin, yPos);
  
  // Data do relatório no canto
  doc.setFontSize(9);
  doc.text(formatDateTime(data.scanDate), pageWidth - margin - 45, 15);
  
  yPos = 45;
  doc.setTextColor(0, 0, 0);
  
  // === INFORMAÇÕES DO VEÍCULO ===
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, yPos - 5, contentWidth, 30, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTIFICAÇÃO DO VEÍCULO', margin + 5, yPos + 3);
  
  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (data.vin) {
    doc.text(`VIN: ${data.vin.vin}`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Fabricante: ${data.vin.manufacturer} (${data.vin.manufacturerGroup})`, margin + 5, yPos);
    doc.text(`Ano: ${data.vin.modelYear}`, margin + 100, yPos);
    doc.text(`País: ${data.vin.country}`, margin + 140, yPos);
  } else {
    doc.text('VIN: Não disponível', margin + 5, yPos);
  }
  
  yPos += 15;
  
  // === RESUMO DO SCAN ===
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, yPos - 5, contentWidth, 35, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DO DIAGNÓSTICO', margin + 5, yPos + 3);
  
  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Grid de estatísticas
  const stats = [
    [`Módulos Escaneados: ${data.modulesScanned}`, `Duração: ${formatDuration(data.scanDurationMs)}`],
    [`Protocolo: ${data.protocolUsed}`, `Voltagem: ${data.batteryVoltage?.toFixed(1) || 'N/D'}V`],
    [`DTCs Encontrados: ${data.initialDTCs.length}`, `DTCs Confirmados: ${data.confirmedDTCs.length}`],
    [`DTCs Descartados: ${data.discardedDTCs.length}`, `Taxa de Ruído: ${data.initialDTCs.length > 0 ? Math.round((data.discardedDTCs.length / data.initialDTCs.length) * 100) : 0}%`],
  ];
  
  for (const row of stats) {
    doc.text(row[0], margin + 5, yPos);
    doc.text(row[1], margin + 95, yPos);
    yPos += 6;
  }
  
  // Aviso de bateria fraca
  if (data.lowVoltageWarning) {
    yPos += 5;
    doc.setFillColor(254, 249, 195); // yellow-100
    doc.rect(margin, yPos - 4, contentWidth, 12, 'F');
    doc.setTextColor(161, 98, 7); // yellow-700
    doc.setFont('helvetica', 'bold');
    doc.text('⚠️ ATENÇÃO: Bateria fraca detectada - resultados podem incluir códigos falsos', margin + 5, yPos + 3);
    doc.setTextColor(0, 0, 0);
    yPos += 15;
  } else {
    yPos += 10;
  }
  
  // === CÓDIGOS CONFIRMADOS ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`CÓDIGOS DE ERRO CONFIRMADOS (${data.confirmedDTCs.length})`, margin, yPos);
  yPos += 8;
  
  if (data.confirmedDTCs.length === 0) {
    doc.setFillColor(220, 252, 231); // green-100
    doc.rect(margin, yPos - 4, contentWidth, 15, 'F');
    doc.setTextColor(22, 101, 52); // green-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('✓ NENHUM CÓDIGO DE ERRO ENCONTRADO', margin + 5, yPos + 4);
    doc.setTextColor(0, 0, 0);
    yPos += 20;
  } else {
    for (const dtc of data.confirmedDTCs) {
      // Verificar se precisa nova página
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      const info: DTCInfo | undefined = getDTCInfo(dtc.code);
      const severity = info?.severity || 'medium';
      const [r, g, b] = getSeverityColor(severity);
      
      // Card do DTC
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos - 4, contentWidth, 22, 'S');
      
      // Badge de severidade
      doc.setFillColor(r, g, b);
      doc.rect(margin, yPos - 4, 5, 22, 'F');
      
      // Código
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(r, g, b);
      doc.text(dtc.code, margin + 10, yPos + 2);
      
      // Severidade
      doc.setFontSize(8);
      doc.text(translateSeverity(severity), margin + 40, yPos + 2);
      
      // Módulo
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      if (dtc.module) {
        doc.text(`${dtc.module.shortName}`, margin + 70, yPos + 2);
      }
      
      // Descrição
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      const description = info?.description || 'Descrição não disponível';
      const truncated = description.length > 70 ? description.substring(0, 67) + '...' : description;
      doc.text(truncated, margin + 10, yPos + 10);
      
      // Causas
      if (info?.causes && info.causes.length > 0) {
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(8);
        const causes = info.causes.slice(0, 2).join('; ');
        const truncatedCauses = causes.length > 80 ? causes.substring(0, 77) + '...' : causes;
        doc.text(`Causas: ${truncatedCauses}`, margin + 10, yPos + 16);
      }
      
      yPos += 28;
    }
  }
  
  // === CÓDIGOS DESCARTADOS (RUÍDO) ===
  if (cfg.includeDiscarded && data.discardedDTCs.length > 0) {
    // Verificar se precisa nova página
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(`CÓDIGOS DESCARTADOS - RUÍDO DE COMUNICAÇÃO (${data.discardedDTCs.length})`, margin, yPos);
    yPos += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Estes códigos apareceram na primeira leitura mas não foram confirmados na verificação dupla.', margin, yPos);
    yPos += 8;
    
    // Lista compacta de descartados
    doc.setFillColor(249, 250, 251); // gray-50
    doc.rect(margin, yPos - 4, contentWidth, Math.min(data.discardedDTCs.length * 6 + 8, 50), 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    
    const discardedCodes = data.discardedDTCs.map(d => {
      const moduleName = d.module?.shortName || '';
      return moduleName ? `${d.code} (${moduleName})` : d.code;
    });
    
    // Dividir em colunas
    const codesPerLine = 4;
    for (let i = 0; i < Math.min(discardedCodes.length, 12); i += codesPerLine) {
      const line = discardedCodes.slice(i, i + codesPerLine).join('   |   ');
      doc.text(line, margin + 5, yPos + 2);
      yPos += 6;
    }
    
    if (discardedCodes.length > 12) {
      doc.text(`... e mais ${discardedCodes.length - 12} código(s)`, margin + 5, yPos + 2);
      yPos += 6;
    }
    
    yPos += 10;
  }
  
  // === LOGS DO SCAN ===
  if (cfg.includeLogs && data.scanLogs.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('LOG COMPLETO DO DIAGNÓSTICO', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(7);
    doc.setFont('courier', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    
    for (const log of data.scanLogs) {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      
      // Remover emojis e limitar tamanho
      const cleanLog = log.replace(/[\u{1F300}-\u{1F9FF}]/gu, '•').substring(0, 100);
      doc.text(cleanLog, margin, yPos);
      yPos += 4;
    }
  }
  
  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 285, pageWidth, 15, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    
    doc.text(`Smart Scanner - Relatório de Auditoria | Gerado em: ${formatDateTime(new Date())}`, margin, 292);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, 292);
  }
  
  return doc.output('blob');
}

/**
 * Faz download do PDF
 */
export function downloadPDF(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `relatorio-dtc-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
