export type ExpirationStatus = 
  | 'vencido'       // Dias restantes < 0
  | 'critico_30'    // <= 30 dias (1 mês)
  | 'alerta_90'     // 31 a 90 dias (1 a 3 meses)
  | 'atencao_180'   // 91 a 180 dias (3 a 6 meses)
  | 'seguro';       // > 180 dias (> 6 meses)

export interface ProductItem {
  id: string;
  codigoBarras: string;
  descricao: string;
  lote: string;
  validade: string; // Formato YYYY-MM-DD para compatibilidade e ordenação
  quantidade: number;
  fotoUrl?: string; // Foto capturada do rótulo/lote
  dataCriacao: string;
  categoria?: string;
  observacoes?: string;
}

export interface ExpirationInfo {
  status: ExpirationStatus;
  diasRestantes: number;
  mesesRestantes: number;
  label: string;
  colorClass: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    dot: string;
  };
  requerAtencao6Meses: boolean;
}

export interface OCRResult {
  rawText: string;
  validadeDetectada?: string; // Formato YYYY-MM-DD
  validadeOriginalTexto?: string;
  loteDetectado?: string;
  codigoBarrasDetectado?: string;
  confianca?: number;
}

export type FilterStatusOption = 'todos' | 'alerta_6m' | 'vencidos' | 'critico_30' | 'alerta_90' | 'atencao_180' | 'seguro';
