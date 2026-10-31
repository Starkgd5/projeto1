import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { SpreadsheetTable } from './components/SpreadsheetTable';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ProductFormModal } from './components/ProductFormModal';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { ProductItem, FilterStatusOption, OCRResult } from './types';
import { buscarProdutos, carregarProdutos, salvarProdutos, sincronizarProdutos, DADOS_INICIAIS_EXEMPLO } from './services/storageService';
import { Camera, FileSpreadsheet, Plus, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [itens, setItens] = useState<ProductItem[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<FilterStatusOption>('todos');
  
  // Modais
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<ProductItem | null>(null);
  const [ocrDadosRecebidos, setOcrDadosRecebidos] = useState<{
    ocrResult: OCRResult;
    fotoUrl?: string;
  } | null>(null);
  const [fotoVisualizacao, setFotoVisualizacao] = useState<string | null>(null);

  // Mensagem toast temporária
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const mostrarToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    let ativo = true;
    buscarProdutos()
      .then(produtos => {
        if (!ativo) return;
        const produtosLocais = carregarProdutos();
        setItens(produtos.length === 0 && produtosLocais.length > 0 ? produtosLocais : produtos);
      })
      .catch(() => {
        if (!ativo) return;
        setItens(carregarProdutos());
        mostrarToast('API indisponível. Os dados estão sendo mantidos neste navegador.');
      })
      .finally(() => {
        if (ativo) setDadosCarregados(true);
      });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;
    salvarProdutos(itens);
    sincronizarProdutos(itens).catch(() => {
      mostrarToast('Não foi possível sincronizar com o servidor. Os dados locais foram mantidos.');
    });
  }, [itens, dadosCarregados]);

  // Handler de sucesso do OCR por foto
  const handleOcrSuccess = (ocrResult: OCRResult, fotoUrl: string) => {
    setOcrDadosRecebidos({ ocrResult, fotoUrl });
    setProdutoEmEdicao(null);
    setIsCaptureModalOpen(false);
    setIsFormModalOpen(true);
    mostrarToast('✨ Foto analisada! Confira os dados antes de salvar na planilha.');
  };

  // Salvar ou atualizar produto na planilha
  const handleSalvarProduto = (novoOuEditado: ProductItem) => {
    setItens(prev => {
      const index = prev.findIndex(item => item.id === novoOuEditado.id);
      if (index >= 0) {
        const atualizado = [...prev];
        atualizado[index] = novoOuEditado;
        return atualizado;
      } else {
        return [novoOuEditado, ...prev];
      }
    });
    setProdutoEmEdicao(null);
    setOcrDadosRecebidos(null);
    mostrarToast('✅ Item salvo com sucesso na planilha!');
  };

  // Excluir produto
  const handleExcluirProduto = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item da planilha?')) {
      setItens(prev => prev.filter(item => item.id !== id));
      mostrarToast('🗑️ Item removido da planilha.');
    }
  };

  // Abrir edição
  const handleEditarProduto = (item: ProductItem) => {
    setProdutoEmEdicao(item);
    setOcrDadosRecebidos(null);
    setIsFormModalOpen(true);
  };

  // Restaurar dados de exemplo
  const handleRestaurarExemplos = () => {
    if (confirm('Deseja recarregar a lista de produtos de exemplo?')) {
      setItens(DADOS_INICIAIS_EXEMPLO);
      salvarProdutos(DADOS_INICIAIS_EXEMPLO);
      setFiltroStatus('todos');
      mostrarToast('🔄 Exemplos recarregados com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navbar Superior */}
      <Navbar
        itens={itens}
        onOpenCapture={() => setIsCaptureModalOpen(true)}
        onOpenManualAdd={() => {
          setProdutoEmEdicao(null);
          setOcrDadosRecebidos(null);
          setIsFormModalOpen(true);
        }}
        onFilterAlert6M={() => setFiltroStatus(filtroStatus === 'alerta_6m' ? 'todos' : 'alerta_6m')}
      />

      {/* Notificação Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-3 fade-in duration-300">
          <div className="bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2">
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner de Boas-Vindas & Ações Rápidas em Mobile */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Leitor Óptico OCR de Rótulos & Planilha
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Controle de Validades & Lotes por Foto
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
                Tire foto da embalagem para extrair automaticamente o lote e a validade com inteligência artificial,
                alimente a planilha com código de barras e acompanhe os alertas para vencimentos a partir de 6 meses.
              </p>
            </div>

            {/* Botão de Disparo em Destaque */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setIsCaptureModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition"
              >
                <Camera className="w-5 h-5 stroke-[2.5]" />
                Tirar Foto de Validade
              </button>
            </div>
          </div>
        </div>

        {/* Alertas para a partir de 6 Meses de Expiração & Filtros */}
        <AlertBanner
          itens={itens}
          filtroAtivo={filtroStatus}
          onSelecionarFiltro={setFiltroStatus}
        />

        {/* Planilha de Produtos */}
        <SpreadsheetTable
          itens={itens}
          filtroStatus={filtroStatus}
          onFiltrarStatus={setFiltroStatus}
          onEditar={handleEditarProduto}
          onExcluir={handleExcluirProduto}
          onVisualizarFoto={setFotoVisualizacao}
        />

        {/* Rodapé com Atalhos e Informações */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2 pb-6 border-t border-slate-200">
          <div>
            Controle de Validade com Leitura OCR • Compatível com códigos de barras EAN-13, EAN-8 e CODE-128
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRestaurarExemplos}
              className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 transition"
              title="Restaurar dados de demonstração"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar Dados de Exemplo
            </button>
          </div>
        </div>
      </main>

      {/* Modal 1: Câmera & OCR */}
      <CameraCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onSuccess={handleOcrSuccess}
      />

      {/* Modal 2: Formulário de Produto & Confirmação na Planilha */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProdutoEmEdicao(null);
          setOcrDadosRecebidos(null);
        }}
        onSave={handleSalvarProduto}
        produtoEdicao={produtoEmEdicao}
        ocrDadosIniciais={ocrDadosRecebidos}
      />

      {/* Modal 3: Visualizador de Foto em Alta Definição */}
      <PhotoViewerModal
        fotoUrl={fotoVisualizacao}
        onClose={() => setFotoVisualizacao(null)}
      />
    </div>
  );
};

export default App;
