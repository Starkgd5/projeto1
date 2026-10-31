import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  Eye, 
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { ProductItem, FilterStatusOption } from '../types';
import { formatarDataBR, getExpirationInfo } from '../utils/dateUtils';
import { exportarParaExcel, exportarParaCSV } from '../services/exportService';

interface SpreadsheetTableProps {
  itens: ProductItem[];
  filtroStatus: FilterStatusOption;
  onFiltrarStatus: (filtro: FilterStatusOption) => void;
  onEditar: (item: ProductItem) => void;
  onExcluir: (id: string) => void;
  onVisualizarFoto: (fotoUrl: string) => void;
}

type SortField = 'validade' | 'descricao' | 'quantidade' | 'diasRestantes';
type SortOrder = 'asc' | 'desc';

export const SpreadsheetTable: React.FC<SpreadsheetTableProps> = ({
  itens,
  filtroStatus,
  onFiltrarStatus,
  onEditar,
  onExcluir,
  onVisualizarFoto
}) => {
  const [busca, setBusca] = useState('');
  const [sortField, setSortField] = useState<SortField>('validade');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Alterna ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtragem e Ordenação
  const itensProcessados = useMemo(() => {
    let filtrados = itens.filter(item => {
      // Filtro de texto de busca
      const termo = busca.toLowerCase();
      const bateBusca = 
        !busca ||
        item.descricao.toLowerCase().includes(termo) ||
        item.codigoBarras.toLowerCase().includes(termo) ||
        item.lote.toLowerCase().includes(termo) ||
        (item.categoria && item.categoria.toLowerCase().includes(termo));

      if (!bateBusca) return false;

      // Filtro de status de validade
      const info = getExpirationInfo(item.validade);
      if (filtroStatus === 'todos') return true;
      if (filtroStatus === 'alerta_6m') return info.requerAtencao6Meses;
      if (filtroStatus === 'vencidos') return info.status === 'vencido';
      if (filtroStatus === 'critico_30') return info.status === 'critico_30';
      if (filtroStatus === 'alerta_90') return info.status === 'alerta_90';
      if (filtroStatus === 'atencao_180') return info.status === 'atencao_180';
      if (filtroStatus === 'seguro') return info.status === 'seguro';

      return true;
    });

    // Ordenação
    return filtrados.sort((a, b) => {
      if (sortField === 'diasRestantes') {
        const dA = getExpirationInfo(a.validade).diasRestantes;
        const dB = getExpirationInfo(b.validade).diasRestantes;
        return sortOrder === 'asc' ? dA - dB : dB - dA;
      } else if (sortField === 'validade') {
        const vA = new Date(a.validade).getTime();
        const vB = new Date(b.validade).getTime();
        return sortOrder === 'asc' ? vA - vB : vB - vA;
      } else if (sortField === 'descricao') {
        return sortOrder === 'asc' 
          ? a.descricao.localeCompare(b.descricao) 
          : b.descricao.localeCompare(a.descricao);
      } else if (sortField === 'quantidade') {
        return sortOrder === 'asc' 
          ? a.quantidade - b.quantidade 
          : b.quantidade - a.quantidade;
      }
      return 0;
    });
  }, [itens, busca, filtroStatus, sortField, sortOrder]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Barra de Ferramentas Superior da Planilha */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        {/* Campo de Busca Rápida */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição, lote ou código de barras..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Botões de Ação e Alternador de Visão */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Alternar entre visualização de Tabela e Cards */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Planilha / Tabela"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          {/* Botões de Exportação */}
          <button
            onClick={() => exportarParaExcel(itensProcessados)}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Baixar planilha filtrada em Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportarParaCSV(itensProcessados)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Baixar planilha em formato CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Indicador de Filtro Ativo */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Exibindo: <strong>{itensProcessados.length}</strong> de {itens.length} itens</span>
          {filtroStatus !== 'todos' && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-[11px] flex items-center gap-1">
              Filtro ativo: {filtroStatus === 'alerta_6m' ? '≤ 6 Meses' : filtroStatus}
              <button 
                onClick={() => onFiltrarStatus('todos')}
                className="hover:text-amber-950 font-bold ml-1"
              >
                ✕
              </button>
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Clique nas colunas para ordenar
        </span>
      </div>

      {/* Conteúdo: Tabela ou Cards */}
      {itensProcessados.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">Nenhum produto encontrado</p>
          <p className="text-xs text-slate-500 mt-1">Tente ajustar a busca ou limpar os filtros de status.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Visualização em Tabela Tradicional */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Foto</th>
                <th className="py-3 px-4">Código de Barras</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition"
                  onClick={() => handleSort('descricao')}
                >
                  <div className="flex items-center gap-1">
                    <span>Descrição</span>
                    {sortField === 'descricao' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="py-3 px-4">Lote</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition"
                  onClick={() => handleSort('validade')}
                >
                  <div className="flex items-center gap-1">
                    <span>Validade</span>
                    {sortField === 'validade' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-center cursor-pointer hover:bg-slate-200/60 transition"
                  onClick={() => handleSort('quantidade')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Qtd</span>
                    {sortField === 'quantidade' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition"
                  onClick={() => handleSort('diasRestantes')}
                >
                  <div className="flex items-center gap-1">
                    <span>Prazo / Status</span>
                    {sortField === 'diasRestantes' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Alerta 6M</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {itensProcessados.map((item) => {
                const expInfo = getExpirationInfo(item.validade);
                const isAlerta6M = expInfo.requerAtencao6Meses;

                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isAlerta6M ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Foto */}
                    <td className="py-2.5 px-4 text-center">
                      {item.fotoUrl ? (
                        <button
                          onClick={() => onVisualizarFoto(item.fotoUrl!)}
                          className="w-9 h-9 rounded-lg overflow-hidden border border-slate-300 shadow-sm inline-block hover:opacity-80 transition"
                          title="Clique para ampliar a foto do lote"
                        >
                          <img src={item.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 inline-flex items-center justify-center text-[10px]">
                          -
                        </span>
                      )}
                    </td>

                    {/* Código de Barras */}
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                      {item.codigoBarras ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.codigoBarras}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sem código</span>
                      )}
                    </td>

                    {/* Descrição & Categoria */}
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.descricao}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">{item.categoria || 'Geral'}</span>
                        {item.observacoes && (
                          <span className="text-[10px] text-slate-400 italic truncate max-w-xs">
                            • {item.observacoes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Lote */}
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                      {item.lote ? (
                        <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.lote}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>

                    {/* Validade */}
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {formatarDataBR(item.validade)}
                    </td>

                    {/* Quantidade */}
                    <td className="py-2.5 px-4 text-center font-bold text-slate-800 text-sm">
                      {item.quantidade}
                    </td>

                    {/* Prazo / Status */}
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${expInfo.colorClass.badge}`}>
                        <span className={`w-2 h-2 rounded-full ${expInfo.colorClass.dot}`} />
                        {expInfo.label}
                      </span>
                    </td>

                    {/* Alerta 6 Meses */}
                    <td className="py-2.5 px-4 text-center">
                      {isAlerta6M ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px] shadow-sm">
                          <AlertTriangle className="w-3 h-3" />
                          ≤ 6 Meses
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          OK
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditar(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                          title="Editar item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onExcluir(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Excluir item da planilha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Visualização em Cards (ideal para celular / telas menores) */
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {itensProcessados.map((item) => {
            const expInfo = getExpirationInfo(item.validade);
            const isAlerta6M = expInfo.requerAtencao6Meses;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isAlerta6M ? 'bg-amber-50/30 border-amber-300' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${expInfo.colorClass.badge}`}>
                      {expInfo.label}
                    </span>
                    {isAlerta6M && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> ≤ 6 Meses
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">{item.descricao}</h3>
                  <div className="text-[11px] text-slate-500 mb-3">{item.categoria || 'Geral'}</div>

                  {/* Informações chaves */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Validade</span>
                      <strong className="text-slate-900">{formatarDataBR(item.validade)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Lote</span>
                      <strong className="text-slate-900">{item.lote || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Quantidade</span>
                      <strong className="text-slate-900">{item.quantidade} un</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Código</span>
                      <strong className="text-slate-700 truncate block">{item.codigoBarras || '-'}</strong>
                    </div>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {item.fotoUrl ? (
                    <button
                      onClick={() => onVisualizarFoto(item.fotoUrl!)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Foto
                    </button>
                  ) : <span />}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditar(item)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onExcluir(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
