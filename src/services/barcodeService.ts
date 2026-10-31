// Banco de dados prévio com produtos comuns no mercado brasileiro para agilizar cadastro
export const PRODUTOS_CATALOGO: Record<string, { descricao: string; categoria: string }> = {
  '7891000100103': { descricao: 'Leite Condensado Moça Nestlé 395g', categoria: 'Laticínios' },
  '7894900010015': { descricao: 'Refrigerante Coca-Cola 2L', categoria: 'Bebidas' },
  '7896005800104': { descricao: 'Café Torrado e Moído Pilão Tradicional 500g', categoria: 'Matinais' },
  '7891000053508': { descricao: 'Achocolatado em Pó Nescau 2.0 370g', categoria: 'Matinais' },
  '7898024394181': { descricao: 'Leite Integral UHT Piracanjuba 1L', categoria: 'Laticínios' },
  '7896004000307': { descricao: 'Arroz Branco Tipo 1 Tio João 5kg', categoria: 'Grãos' },
  '7896006700014': { descricao: 'Feijão Carioca Camil 1kg', categoria: 'Grãos' },
  '7891058001230': { descricao: 'Biscoito Recheado Passatempo 130g', categoria: 'Biscoitos' },
  '7896090700013': { descricao: 'Óleo de Soja Refinado Liza 900ml', categoria: 'Mercearia' },
  '7896004000109': { descricao: 'Macarrão Espaguete com Ovos Barilla 500g', categoria: 'Massas' },
  '7891038000017': { descricao: 'Maionese Tradicional Hellmanns 500g', categoria: 'Molhos' },
  '7891024132050': { descricao: 'Sabonete Dove Original 90g', categoria: 'Higiene' },
  '7891150005082': { descricao: 'Creme Dental Colgate Total 12 90g', categoria: 'Higiene' },
  '7896094900129': { descricao: 'Amaciante Concentrado Downy Brisa de Verão 500ml', categoria: 'Limpeza' },
  '7891035000049': { descricao: 'Iogurte Natural Integral Danone 160g', categoria: 'Laticínios' },
};

/**
 * Busca sugestão de produto pelo código de barras
 */
export function buscarProdutoPorCodigoBarras(codigo: string): { descricao: string; categoria: string } | null {
  if (!codigo) return null;
  const limpo = codigo.trim().replace(/[^0-9]/g, '');
  return PRODUTOS_CATALOGO[limpo] || null;
}

/**
 * Tenta ler código de barras usando a BarcodeDetector API (suportada nativamente no Chrome Android / Edge)
 */
export async function detectarCodigoBarras(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<string | null> {
  try {
    // Verifica se a API do navegador está disponível
    const anyWindow = window as unknown as { BarcodeDetector?: any };
    if (anyWindow.BarcodeDetector) {
      const formats = ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'];
      const detector = new anyWindow.BarcodeDetector({ formats });
      const barcodes = await detector.detect(imageElement);
      if (barcodes && barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
    }
  } catch (err) {
    console.warn('BarcodeDetector indisponível ou falhou:', err);
  }
  return null;
}

/**
 * Gera um código de barras de teste no padrão EAN-13 brasileiro (começa com 789)
 */
export function gerarCodigoBarrasAleatorio(): string {
  let codigo = '789';
  for (let i = 0; i < 9; i++) {
    codigo += Math.floor(Math.random() * 10).toString();
  }
  // Cálculo do dígito verificador do EAN-13
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(codigo[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const dv = (10 - (soma % 10)) % 10;
  return codigo + dv;
}
