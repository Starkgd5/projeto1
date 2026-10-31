import React from 'react';
import { Camera, FileSpreadsheet, Plus, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import { ProductItem } from '../types';
import { getExpirationInfo } from '../utils/dateUtils';
import { exportarParaExcel, exportarParaCSV } from '../services/exportService';

interface NavbarProps {
  itens: ProductItem[];
  onOpenCapture: () => void;
  onOpenManualAdd: () => void;
  onFilterAlert6M: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  itens,
  onOpenCapture,
  onOpenManualAdd,
  onFilterAlert6M
}) => {
  // Contagem de itens que requerem atenção em até 6 meses
  const itensAtencao6M = itens.filter(item => getExpirationInfo(item.validade).requerAtencao6Meses);
  const itensVencidos = itens.filter(item => getExpirationInfo(item.validade).status === 'vencido');

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30">
              <Camera className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Valida<span className="text-emerald-400">Smart</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  OCR & Planilha
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden xs:block">
                Controle de Validade e Lote por Foto
              </p>
            </div>
          </div>

          {/* Botão de Alerta Rápido <= 6 Meses */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onFilterAlert6M}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                itensAtencao6M.length > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
              title="Filtrar produtos com vencimento em até 6 meses"
            >
              <AlertTriangle className={`w-4 h-4 ${itensAtencao6M.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>
                {itensAtencao6M.length > 0 ? (
                  <>
                    <strong className="font-bold text-amber-200">{itensAtencao6M.length}</strong> em risco (≤ 6 meses)
                  </>
                ) : (
                  <>Todos em dia (&gt; 6 meses)</>
                )}
              </span>
            </button>
          </div>

          {/* Ações: Tirar Foto e Exportar Planilha */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Exportar Excel Dropdown/Botão */}
            <div className="relative group">
              <button
                onClick={() => exportarParaExcel(itens)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition shadow-sm"
                title="Exportar planilha Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Exportar</span> Excel
              </button>
            </div>

            {/* Cadastro Manual Opcional */}
            <button
              onClick={onOpenManualAdd}
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition flex items-center gap-1.5"
              title="Cadastrar manualmente sem foto"
            >
              <Plus className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Manual</span>
            </button>

            {/* Ação Principal: Tirar Foto com OCR */}
            <button
              onClick={onOpenCapture}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span className="font-bold">Tirar Foto</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
