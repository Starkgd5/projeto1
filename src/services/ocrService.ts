import { createWorker } from 'tesseract.js';
import { OCRResult } from '../types';
import { MESES_PT, getUltimoDiaDoMes, normalizarAno } from '../utils/dateUtils';

/**
 * Pré-processa uma imagem no canvas (escala de cinza, aumento de contraste e binarização)
 * para facilitar a leitura de caracteres gravados por jato de tinta (inkjet) em rótulos.
 */
export async function preprocessImage(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      // Redimensiona se for excessivamente grande para acelerar OCR mantendo nitidez
      const maxDim = 1600;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Desenha imagem original
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Converte para escala de cinza e aumenta o contraste
        // fator de contraste: 1.3
        const contrast = 1.35;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          // Luminância padrão ITU-R BT.601
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // Ajuste de contraste
          let adjusted = factor * (gray - 128) + 128;
          if (adjusted < 0) adjusted = 0;
          if (adjusted > 255) adjusted = 255;

          data[i] = adjusted;     // R
          data[i + 1] = adjusted; // G
          data[i + 2] = adjusted; // B
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (e) {
        console.warn('Erro ao processar imagem no canvas:', e);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/**
 * Extrai texto da imagem usando Tesseract.js com callbacks de progresso
 */
export async function extractTextFromImage(
  imageSrc: string,
  onProgress?: (progress: number, status: string) => void
): Promise<OCRResult> {
  let processedSrc = imageSrc;
  try {
    if (onProgress) onProgress(10, 'Otimizando nitidez da foto...');
    processedSrc = await preprocessImage(imageSrc);
  } catch (err) {
    console.warn('Aviso no pré-processamento:', err);
  }

  if (onProgress) onProgress(25, 'Iniciando inteligência de reconhecimento...');

  let worker;
  try {
    worker = await createWorker('por+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const p = Math.round(30 + (m.progress || 0) * 65);
          onProgress(p, `Decodificando texto: ${Math.round((m.progress || 0) * 100)}%`);
        } else if (onProgress && m.status) {
          onProgress(30, `Preparando OCR (${m.status})...`);
        }
      }
    });

    // Configura parâmetros para focar em números, letras maiúsculas e pontuação comum em datas/lotes
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/.:- '
    });

    const ret = await worker.recognize(processedSrc);
    await worker.terminate();

    const rawText = ret.data.text || '';
    const parsed = parseOcrText(rawText);

    if (onProgress) onProgress(100, 'Texto processado com sucesso!');

    return {
      rawText,
      validadeDetectada: parsed.validadeDetectada,
      validadeOriginalTexto: parsed.validadeOriginalTexto,
      loteDetectado: parsed.loteDetectado,
      codigoBarrasDetectado: parsed.codigoBarrasDetectado,
      confianca: ret.data.confidence
    };
  } catch (error) {
    console.error('Falha no Tesseract.js:', error);
    if (worker) {
      try { await worker.terminate(); } catch (_) {}
    }
    // Fallback: se falhar o worker (ex: sem conexão inicial para download de idioma),
    // tenta parser genérico ou lança erro explicativo
    throw new Error(
      'Não foi possível concluir o OCR automático. Você pode digitar os dados manualmente ou tentar outra foto mais nítida.'
    );
  }
}

/**
 * Analisa o texto bruto extraído e busca com expressões regulares inteligentes
 * a data de validade, lote e código de barras.
 */
export function parseOcrText(text: string): {
  validadeDetectada?: string;
  validadeOriginalTexto?: string;
  loteDetectado?: string;
  codigoBarrasDetectado?: string;
} {
  if (!text) return {};

  const cleanText = text.replace(/\r\n/g, '\n').toUpperCase();
  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);

  let validadeDetectada: string | undefined;
  let validadeOriginalTexto: string | undefined;
  let loteDetectado: string | undefined;
  let codigoBarrasDetectado: string | undefined;

  // 1. Busca por Código de Barras (8, 12, 13 ou 14 dígitos consecutivos ou com espaços)
  const barcodeRegex = /\b(789\d{10}|[0-9]{13}|[0-9]{12}|[0-9]{14}|[0-9]{8})\b/;
  const barcodeMatch = cleanText.match(barcodeRegex);
  if (barcodeMatch) {
    codigoBarrasDetectado = barcodeMatch[1];
  }

  // 2. Busca por LOTE
  // Padrões como: LOTE: 12345, LOTE AB-2024, L. 9043, LOT: X123, LT 8934, L: 20240901, BATCH 990
  const lotePatterns = [
    /(?:LOTE|LOT|LT|L|BATCH|PARTIDA)\s*[:.\-]?\s*([A-Z0-9\-_]{3,15})/i,
    /\bL\s*[:.\-]?\s*([A-Z0-9]{4,12})\b/i,
    /\b([A-Z]{1,3}\d{3,8}[A-Z]?)\b/ // Código alfanumérico isolado com formato típico de lote
  ];

  for (const pattern of lotePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Não confunda com a palavra VAL ou FAB
      if (!candidate.startsWith('VAL') && !candidate.startsWith('FAB') && candidate.length >= 3) {
        loteDetectado = candidate;
        break;
      }
    }
  }

  // Se não achou com prefixo explícito, procura por linha contendo L ou LOTE
  if (!loteDetectado) {
    for (const line of lines) {
      if (line.includes('LOT') || line.includes('LT')) {
        const parts = line.split(/[:\s]+/);
        const idx = parts.findIndex((p) => p.includes('LOT') || p.includes('LT'));
        if (idx >= 0 && parts[idx + 1]) {
          loteDetectado = parts[idx + 1].replace(/[^A-Z0-9\-_]/g, '');
          break;
        }
      }
    }
  }

  // 3. Busca por VALIDADE / VENCIMENTO
  // Prioridade A: Linhas com palavras-chave VAL, VENC, V, VALIDADE, EXP
  const valKeywordPatterns = [
    /(?:VAL|VENC|VALIDADE|VENCIMENTO|V|EXP)\s*[:.\-]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
    /(?:VAL|VENC|VALIDADE|VENCIMENTO|V|EXP)\s*[:.\-]?\s*(\d{1,2}[\/\.\-]\d{2,4})/i,
    /(?:VAL|VENC)\s*[:.\-]?\s*([A-Z]{3}[\/\.\- ]\d{2,4})/i,
    /(?:VAL|VENC)\s*[:.\-]?\s*(\d{1,2}\s+[A-Z]{3}\s+\d{2,4})/i
  ];

  for (const pattern of valKeywordPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const rawDate = match[1].trim();
      const parsed = parseDateString(rawDate);
      if (parsed) {
        validadeDetectada = parsed;
        validadeOriginalTexto = rawDate;
        break;
      }
    }
  }

  // Prioridade B: Se não achou com prefixo, procura datas no formato DD/MM/YYYY, DD.MM.YYYY, DD/MM/YY
  if (!validadeDetectada) {
    const genericDateRegex = /\b(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})\b/g;
    const allDateMatches = [...cleanText.matchAll(genericDateRegex)];

    // Se houver múltiplas datas (ex: FAB e VAL), normalmente a segunda data é a validade
    if (allDateMatches.length > 1) {
      const candidate = allDateMatches[allDateMatches.length - 1][1];
      const parsed = parseDateString(candidate);
      if (parsed) {
        validadeDetectada = parsed;
        validadeOriginalTexto = candidate;
      }
    } else if (allDateMatches.length === 1) {
      const candidate = allDateMatches[0][1];
      const parsed = parseDateString(candidate);
      if (parsed) {
        validadeDetectada = parsed;
        validadeOriginalTexto = candidate;
      }
    }
  }

  // Prioridade C: Formato MM/YYYY ou MM/YY isolado (ex: 12/26, 08/2027)
  if (!validadeDetectada) {
    const monthYearRegex = /\b(0[1-9]|1[0-2])[\/\.\-](20\d{2}|\d{2})\b/;
    const myMatch = cleanText.match(monthYearRegex);
    if (myMatch) {
      const parsed = parseDateString(myMatch[0]);
      if (parsed) {
        validadeDetectada = parsed;
        validadeOriginalTexto = myMatch[0];
      }
    }
  }

  return {
    validadeDetectada,
    validadeOriginalTexto,
    loteDetectado,
    codigoBarrasDetectado
  };
}

/**
 * Converte diversas strings de data para o padrão ISO (YYYY-MM-DD)
 */
export function parseDateString(str: string): string | null {
  if (!str) return null;
  const s = str.trim().toLowerCase();

  // Caso: DD/MM/YYYY ou DD.MM.YYYY ou DD-MM-YYYY ou com 2 dígitos de ano
  const dmyMatch = s.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
  if (dmyMatch) {
    const dia = dmyMatch[1].padStart(2, '0');
    const mes = dmyMatch[2].padStart(2, '0');
    const ano = normalizarAno(dmyMatch[3]);
    const numDia = parseInt(dia, 10);
    const numMes = parseInt(mes, 10);
    if (numMes >= 1 && numMes <= 12 && numDia >= 1 && numDia <= 31) {
      return `${ano}-${mes}-${dia}`;
    }
  }

  // Caso: MM/YYYY ou MM/YY (ex: 08/26 ou 11/2027) -> atribui último dia do mês
  const myMatch = s.match(/^(\d{1,2})[\/\.\-](\d{2,4})$/);
  if (myMatch) {
    const mes = myMatch[1].padStart(2, '0');
    const ano = normalizarAno(myMatch[2]);
    const numMes = parseInt(mes, 10);
    const numAno = parseInt(ano, 10);
    if (numMes >= 1 && numMes <= 12) {
      const ultimoDia = getUltimoDiaDoMes(numMes, numAno);
      const diaStr = String(ultimoDia).padStart(2, '0');
      return `${ano}-${mes}-${diaStr}`;
    }
  }

  // Caso: Mês textual (ex: 15 AGO 2026, AGO/26, 20-OUT-25)
  for (const [key, mesNum] of Object.entries(MESES_PT)) {
    if (s.includes(key)) {
      // Extrai os números presentes
      const digits = s.match(/\d+/g);
      if (digits) {
        if (digits.length >= 2) {
          const dia = digits[0].padStart(2, '0');
          const ano = normalizarAno(digits[1]);
          return `${ano}-${mesNum}-${dia}`;
        } else if (digits.length === 1) {
          // Apenas o ano presente (ex: AGO/26)
          const ano = normalizarAno(digits[0]);
          const numAno = parseInt(ano, 10);
          const ultimoDia = getUltimoDiaDoMes(parseInt(mesNum, 10), numAno);
          return `${ano}-${mesNum}-${String(ultimoDia).padStart(2, '0')}`;
        }
      }
    }
  }

  // Caso: Formato ISO já fornecido (YYYY-MM-DD)
  const isoMatch = s.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/);
  if (isoMatch) {
    const ano = isoMatch[1];
    const mes = isoMatch[2].padStart(2, '0');
    const dia = isoMatch[3].padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  return null;
}
