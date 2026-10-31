import React, { useState, useEffect } from 'react';
import { X, Save, Barcode, Calendar, Hash, Tag, AlertTriangle, CheckCircle2, AlertCircle, Sparkles, Wand2 } from 'lucide-react';
import { ProductItem, OCRResult } from '../types';
import { getExpirationInfo, formatarDataBR } from '../utils/dateUtils';
import { buscarProdutoPorCodigoBarras, gerarCodigoBarrasAleatorio } from '../services/barcodeService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (produto: ProductItem) => void;
  produtoEdicao?: ProductItem | null;
  ocrDadosIniciais?: {
    ocrResult: OCRResult;
    fotoUrl?: string;
  } | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  produtoEdicao,
  ocrDadosIniciais
}) => {
  const [codigoBarras, setCodigoBarras] = useState('');
  const [descricao, setDescricao] = useState('');
  const [lote, setLote] = useState('');
  const [validade, setValidade] = useState(''); // YYYY-MM-DD
  const [quantidade, setQuantidade] = useState<number>(1);
  const [categoria, setCategoria] = useState('Geral');
  const [observacoes, setObservacoes] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(undefined);
  const [ocrTextInfo, setOcrTextInfo] = useState<string | null>(null);

  // Inicializa dados ao abrir
  useEffect(() => {
    if (!isOpen) return;

    if (produtoEdicao) {
      // Modo edição
      setCodigoBarras(produtoEdicao.codigoBarras || '');
      setDescricao(produtoEdicao.descricao || '');
      setLote(produtoEdicao.lote || '');
      setValidade(produtoEdicao.validade || '');
      setQuantidade(produtoEdicao.quantidade || 1);
      setCategoria(produtoEdicao.categoria || 'Geral');
      setObservacoes(produtoEdicao.observacoes || '');
      setFotoUrl(produtoEdicao.fotoUrl);
      setOcrTextInfo(null);
    } else if (ocrDadosIniciais) {
      // Modo novo a partir do OCR
      const { ocrResult, fotoUrl: foto } = ocrDadosIniciais;
      setLote(ocrResult.loteDetectado || '');
      setValidade(ocrResult.validadeDetectada || '');
      setFotoUrl(foto);
      setOcrTextInfo(ocrResult.rawText || null);
      setQuantidade(1);

      // Se o OCR achou código de barras
      if (ocrResult.codigoBarrasDetectado) {
        setCodigoBarras(ocrResult.codigoBarrasDetectado);
        const produtoCatalogo = buscarProdutoPorCodigoBarras(ocrResult.codigoBarrasDetectado);
        if (produtoCatalogo) {
          setDescricao(produtoCatalogo.descricao);
          setCategoria(produtoCatalogo.categoria);
        }
      } else {
        setCodigoBarras('');
        setDescricao('');
      }
    } else {
      // Modo novo manual
      setCodigoBarras('');
      setDescricao('');
      setLote('');
      setValidade('');
      setQuantidade(1);
      setCategoria('Geral');
      setObservacoes('');
      setFotoUrl(undefined);
      setOcrTextInfo(null);
    }
  }, [isOpen, produtoEdicao, ocrDadosIniciais]);

  // Autocomplete ao digitar código de barras
  const handleCodigoBarrasChange = (codigo: string) => {
    setCodigoBarras(codigo);
    const produto = buscarProdutoPorCodigoBarras(codigo);
    if (produto && !descricao) {
      setDescricao(produto.descricao);
      setCategoria(produto.categoria);
    }
  };

  const handleGerarCodigoExemplo = () => {
    const novoCodigo = gerarCodigoBarrasAleatorio();
    handleCodigoBarrasChange(novoCodigo);
  };

  // Cálculo de alerta em tempo real
  const expirationInfo = getExpirationInfo(validade);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert('Por favor, informe a descrição do produto.');
      return;
    }
    if (!validade) {
      alert('Por favor, informe a data de validade.');
      return;
    }

    const itemSalvar: ProductItem = {
      id: produtoEdicao?.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      codigoBarras: codigoBarras.trim(),
      descricao: descricao.trim(),
      lote: lote.trim().toUpperCase(),
      validade,
      quantidade: Number(quantidade) || 1,
      categoria,
      observacoes: observacoes.trim(),
      fotoUrl: fotoUrl,
      dataCriacao: produtoEdicao?.dataCriacao || new Date().toISOString()
    };

    onSave(itemSalvar);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-slate-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {produtoEdicao ? 'Editar Registro na Planilha' : 'Confirmar e Salvar na Planilha'}
              </h2>
              <p className="text-xs text-slate-500">
                {ocrDadosIniciais ? 'Dados extraídos da foto via OCR' : 'Preencha os dados do item'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll se necessário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Miniatura da Foto com Validade Extraída */}
          {fotoUrl && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <img
                src={fotoUrl}
                alt="Foto do produto"
                className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-sm shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Foto Capturada do Rótulo
                </span>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  Lote e validade preenchidos automaticamente.
                </p>
                {ocrTextInfo && (
                  <span className="text-[10px] text-slate-400 block truncate font-mono mt-0.5">
                    OCR: {ocrTextInfo.slice(0, 50)}...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Preview do Alerta de Validade em Tempo Real */}
          {validade && (
            <div className={`p-3 rounded-xl border flex items-center justify-between ${expirationInfo.colorClass.bg} ${expirationInfo.colorClass.border}`}>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${expirationInfo.colorClass.dot}`} />
                <div>
                  <span className={`text-xs font-bold block ${expirationInfo.colorClass.text}`}>
                    {expirationInfo.label}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatarDataBR(validade)} • {expirationInfo.diasRestantes} dias de prazo
                  </span>
                </div>
              </div>
              {expirationInfo.requerAtencao6Meses && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-sm flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Alerta ≤ 6 Meses
                </span>
              )}
            </div>
          )}

          {/* Grid de Campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Código de Barras */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-slate-500" />
                  Código de Barras (EAN / Código)
                </span>
                <button
                  type="button"
                  onClick={handleGerarCodigoExemplo}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" /> Gerar Teste EAN
                </button>
              </label>
              <input
                type="text"
                value={codigoBarras}
                onChange={(e) => handleCodigoBarrasChange(e.target.value)}
                placeholder="Ex: 7898024394181"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Descrição do Produto */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descrição do Produto <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Leite Integral UHT Piracanjuba 1L"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Lote */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-slate-500" />
                Lote de Fabricação
              </label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Ex: L2409A ou LT-884"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono uppercase"
              />
            </div>

            {/* Validade */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Data de Validade <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-l-xl border border-r-0 border-slate-300"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantidade}
                  onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 text-center text-sm border-y border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => q + 1)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-r-xl border border-l-0 border-slate-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Geral">Geral</option>
                <option value="Laticínios">Laticínios</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Matinais">Matinais</option>
                <option value="Grãos & Cereais">Grãos & Cereais</option>
                <option value="Biscoitos & Doces">Biscoitos & Doces</option>
                <option value="Mercearia">Mercearia</option>
                <option value="Higiene & Cosméticos">Higiene & Cosméticos</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Farmácia">Farmácia</option>
              </select>
            </div>

            {/* Observações */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações / Localização no Estoque (Opcional)
              </label>
              <input
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Prateleira 4B, frente de loja"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Rodapé do Formulário */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {produtoEdicao ? 'Salvar Alterações' : 'Adicionar à Planilha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
