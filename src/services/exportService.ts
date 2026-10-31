import * as XLSX from 'xlsx';
import { ProductItem } from '../types';
import { formatarDataBR, getExpirationInfo } from '../utils/dateUtils';

/**
 * Exporta a lista de produtos para arquivo Excel (.xlsx) profissional
 */
export function exportarParaExcel(itens: ProductItem[], nomeArquivo: string = 'Controle_Validades_Lotes.xlsx'): void {
  // Prepara os dados formatados para a planilha
  const dadosPlanilha = itens.map((item) => {
    const expInfo = getExpirationInfo(item.validade);
    return {
      'Código de Barras': item.codigoBarras || 'N/A',
      'Descrição': item.descricao,
      'Lote': item.lote || 'N/A',
      'Validade': formatarDataBR(item.validade),
      'Quantidade': item.quantidade,
      'Categoria': item.categoria || 'Geral',
      'Dias Restantes': expInfo.diasRestantes,
      'Status': expInfo.label,
      'Alerta 6 Meses': expInfo.requerAtencao6Meses ? 'SIM (Atenção)' : 'NÃO',
      'Data de Registro': item.dataCriacao ? new Date(item.dataCriacao).toLocaleDateString('pt-BR') : ''
    };
  });

  // Cria a planilha a partir do JSON
  const worksheet = XLSX.utils.json_to_sheet(dadosPlanilha);

  // Ajusta larguras das colunas
  const colWidths = [
    { wch: 18 }, // Código de Barras
    { wch: 35 }, // Descrição
    { wch: 15 }, // Lote
    { wch: 14 }, // Validade
    { wch: 12 }, // Quantidade
    { wch: 15 }, // Categoria
    { wch: 15 }, // Dias Restantes
    { wch: 25 }, // Status
    { wch: 16 }, // Alerta 6 Meses
    { wch: 16 }, // Data de Registro
  ];
  worksheet['!cols'] = colWidths;

  // Cria o workbook e adiciona a aba
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Controle de Validades');

  // Adiciona uma aba apenas com produtos em risco (vencendo em até 6 meses)
  const itensRisco = itens.filter(item => getExpirationInfo(item.validade).requerAtencao6Meses);
  if (itensRisco.length > 0) {
    const dadosRisco = itensRisco.map(item => {
      const expInfo = getExpirationInfo(item.validade);
      return {
        'Código de Barras': item.codigoBarras,
        'Descrição': item.descricao,
        'Lote': item.lote,
        'Validade': formatarDataBR(item.validade),
        'Quantidade': item.quantidade,
        'Dias Restantes': expInfo.diasRestantes,
        'Nível de Alerta': expInfo.label
      };
    });
    const wsRisco = XLSX.utils.json_to_sheet(dadosRisco);
    wsRisco['!cols'] = [
      { wch: 18 }, { wch: 35 }, { wch: 15 }, { wch: 14 }, { wch: 12 }, { wch: 15 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsRisco, '⚠️ Alertas 6 Meses');
  }

  // Gera o arquivo e inicia o download no navegador
  XLSX.writeFile(workbook, nomeArquivo);
}

/**
 * Exporta para arquivo CSV com codificação UTF-8 BOM para abrir sem erros de acentuação no Excel
 */
export function exportarParaCSV(itens: ProductItem[], nomeArquivo: string = 'Controle_Validades.csv'): void {
  const cabecalhos = ['Código de Barras', 'Descrição', 'Lote', 'Validade', 'Quantidade', 'Dias Restantes', 'Status', 'Alerta 6 Meses'];
  
  const linhas = itens.map((item) => {
    const expInfo = getExpirationInfo(item.validade);
    return [
      `"${item.codigoBarras.replace(/"/g, '""')}"`,
      `"${item.descricao.replace(/"/g, '""')}"`,
      `"${item.lote.replace(/"/g, '""')}"`,
      `"${formatarDataBR(item.validade)}"`,
      item.quantidade,
      expInfo.diasRestantes,
      `"${expInfo.label}"`,
      `"${expInfo.requerAtencao6Meses ? 'SIM (Atenção)' : 'NÃO'}"`
    ].join(';');
  });

  // UTF-8 BOM (\uFEFF) para garantir caracteres como ç e acentos no Excel
  const conteudoCsv = '\uFEFF' + [cabecalhos.join(';'), ...linhas].join('\r\n');
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
