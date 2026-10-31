import { ExpirationInfo, ExpirationStatus } from '../types';

export const MESES_PT: Record<string, string> = {
  jan: '01', janeiro: '01',
  fev: '02', fevereiro: '02', feb: '02',
  mar: '03', marco: '03', março: '03',
  abr: '04', abril: '04', apr: '04',
  mai: '05', maio: '05', may: '05',
  jun: '06', junho: '06',
  jul: '07', julho: '07',
  ago: '08', agosto: '08', aug: '08',
  set: '09', setembro: '09', sep: '09',
  out: '10', outubro: '10', oct: '10',
  nov: '11', novembro: '11',
  dez: '12', dezembro: '12', dec: '12',
};

/**
 * Retorna os dias restantes e a categoria de alerta para a validade.
 */
export function getExpirationInfo(validadeISO: string): ExpirationInfo {
  if (!validadeISO) {
    return {
      status: 'seguro',
      diasRestantes: 9999,
      mesesRestantes: 99,
      label: 'Sem data',
      colorClass: {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-400'
      },
      requerAtencao6Meses: false
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse YYYY-MM-DD
  const parts = validadeISO.split('-');
  const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  expDate.setHours(0, 0, 0, 0);

  const diffMs = expDate.getTime() - today.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const mesesRestantes = parseFloat((diasRestantes / 30.4375).toFixed(1));

  let status: ExpirationStatus;
  let label = '';
  let colorClass = {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500'
  };

  if (diasRestantes < 0) {
    status = 'vencido';
    const diasVencido = Math.abs(diasRestantes);
    label = diasVencido === 1 ? 'Venceu ontem' : `Vencido há ${diasVencido} dias`;
    colorClass = {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      dot: 'bg-rose-600 animate-pulse'
    };
  } else if (diasRestantes === 0) {
    status = 'critico_30';
    label = 'Vence HOJE!';
    colorClass = {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-300',
      badge: 'bg-rose-500 text-white border-rose-600',
      dot: 'bg-rose-500 animate-ping'
    };
  } else if (diasRestantes <= 30) {
    status = 'critico_30';
    label = `Crítico: Vence em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;
    colorClass = {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-800 border-orange-300',
      dot: 'bg-orange-500'
    };
  } else if (diasRestantes <= 90) {
    status = 'alerta_90';
    label = `Alerta: ${diasRestantes} dias (~${Math.round(mesesRestantes)} meses)`;
    colorClass = {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      dot: 'bg-amber-500'
    };
  } else if (diasRestantes <= 180) {
    status = 'atencao_180';
    label = `Atenção: ${diasRestantes} dias (~${Math.round(mesesRestantes)} meses)`;
    colorClass = {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      badge: 'bg-sky-100 text-sky-800 border-sky-300',
      dot: 'bg-sky-500'
    };
  } else {
    status = 'seguro';
    label = `Seguro: ${diasRestantes} dias (${mesesRestantes} meses)`;
    colorClass = {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500'
    };
  }

  // Alerta solicitado no prompt: "alertas para a partir de 6 meses de expiração"
  // Todos os produtos que vencem em 6 meses ou menos (<= 180 dias)
  const requerAtencao6Meses = diasRestantes <= 180;

  return {
    status,
    diasRestantes,
    mesesRestantes,
    label,
    colorClass,
    requerAtencao6Meses
  };
}

/**
 * Formata data ISO (YYYY-MM-DD) para padrão brasileiro DD/MM/YYYY
 */
export function formatarDataBR(isoString: string): string {
  if (!isoString) return '--/--/----';
  const parts = isoString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoString;
}

/**
 * Obtém último dia de determinado mês/ano
 */
export function getUltimoDiaDoMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

/**
 * Normaliza ano com 2 dígitos para 4 dígitos (ex: 25 -> 2025, 26 -> 2026, 99 -> 1999)
 */
export function normalizarAno(anoStr: string): string {
  if (anoStr.length === 4) return anoStr;
  const num = parseInt(anoStr, 10);
  if (num >= 0 && num <= 70) {
    return `20${anoStr.padStart(2, '0')}`;
  }
  return `19${anoStr.padStart(2, '0')}`;
}
