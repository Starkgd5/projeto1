import { ProductItem } from '../types';

const STORAGE_KEY = 'validadepro_produtos_v1';

/**
 * Gera uma data ISO relativa ao dia de hoje (adiciona ou subtrai dias)
 */
function getDataRelativa(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

export const DADOS_INICIAIS_EXEMPLO: ProductItem[] = [
  {
    id: 'demo-1',
    codigoBarras: '7898024394181',
    descricao: 'Leite Integral UHT Piracanjuba 1L',
    lote: 'L2409A',
    validade: getDataRelativa(-12), // Vencido há 12 dias
    quantidade: 24,
    categoria: 'Laticínios',
    dataCriacao: new Date(Date.now() - 30 * 86400000).toISOString(),
    observacoes: 'Separado para descarte ou devolução'
  },
  {
    id: 'demo-2',
    codigoBarras: '7891035000049',
    descricao: 'Iogurte Natural Integral Danone 160g',
    lote: 'LT-8812',
    validade: getDataRelativa(14), // Vence em 14 dias (Crítico)
    quantidade: 48,
    categoria: 'Laticínios',
    dataCriacao: new Date(Date.now() - 15 * 86400000).toISOString(),
    observacoes: 'Colocar na frente com desconto de 30%'
  },
  {
    id: 'demo-3',
    codigoBarras: '7891000100103',
    descricao: 'Leite Condensado Moça Nestlé 395g',
    lote: 'LC7721',
    validade: getDataRelativa(55), // Vence em ~1.8 meses (Alerta 90 dias)
    quantidade: 60,
    categoria: 'Laticínios',
    dataCriacao: new Date(Date.now() - 10 * 86400000).toISOString(),
    observacoes: 'Planejar promoção relâmpago de confeitaria'
  },
  {
    id: 'demo-4',
    codigoBarras: '7896005800104',
    descricao: 'Café Torrado e Moído Pilão Tradicional 500g',
    lote: 'P9044B',
    validade: getDataRelativa(135), // Vence em ~4.5 meses (Atenção <= 6 meses)
    quantidade: 120,
    categoria: 'Matinais',
    dataCriacao: new Date(Date.now() - 5 * 86400000).toISOString(),
    observacoes: 'Monitorar giro de vendas semanal'
  },
  {
    id: 'demo-5',
    codigoBarras: '7894900010015',
    descricao: 'Refrigerante Coca-Cola Original 2L',
    lote: 'CC1092',
    validade: getDataRelativa(220), // Vence em ~7.2 meses (> 6 meses - Seguro)
    quantidade: 96,
    categoria: 'Bebidas',
    dataCriacao: new Date(Date.now() - 2 * 86400000).toISOString(),
    observacoes: 'Estoque recém-chegado da distribuidora'
  },
  {
    id: 'demo-6',
    codigoBarras: '7896006700014',
    descricao: 'Feijão Carioca Camil 1kg',
    lote: 'FC5543',
    validade: getDataRelativa(320), // Vence em ~10.5 meses (> 6 meses - Seguro)
    quantidade: 200,
    categoria: 'Grãos',
    dataCriacao: new Date(Date.now() - 1 * 86400000).toISOString(),
    observacoes: 'Armazenado no palete central'
  }
];

export function carregarProdutos(): ProductItem[] {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler do localStorage:', e);
  }
  // Se não houver dados, inicializa com o exemplo
  salvarProdutos(DADOS_INICIAIS_EXEMPLO);
  return DADOS_INICIAIS_EXEMPLO;
}

export function salvarProdutos(itens: ProductItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
}

export async function buscarProdutos(): Promise<ProductItem[]> {
  const response = await fetch('/api/products');
  if (!response.ok) {
    throw new Error('Não foi possível carregar os produtos da API.');
  }
  return response.json() as Promise<ProductItem[]>;
}

export async function sincronizarProdutos(itens: ProductItem[]): Promise<void> {
  const response = await fetch('/api/products', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itens)
  });
  if (!response.ok) {
    throw new Error('Não foi possível salvar os produtos na API.');
  }
}
