import React from 'react';
import { AlertCircle, AlertTriangle, Clock, CheckCircle2, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { FilterStatusOption, ProductItem } from '../types';
import { getExpirationInfo } from '../utils/dateUtils';

interface AlertBannerProps {
  itens: ProductItem[];
  filtroAtivo: FilterStatusOption;
  onSelecionarFiltro: (filtro: FilterStatusOption) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  itens,
  filtroAtivo,
  onSelecionarFiltro
}) => {
  // Estatísticas calculadas
  let countVencidos = 0;
  let countInvalidas = 0;
  let countCritico30 = 0;
  let countAlerta90 = 0;
  let countAtencao180 = 0;
  let countSeguro = 0;
  let countTotal6M = 0;

  for (const item of itens) {
    const info = getExpirationInfo(item.validade);
    if (info.status === 'invalida') countInvalidas++;
    else if (info.status === 'vencido') countVencidos++;
    else if (info.status === 'critico_30') countCritico30++;
    else if (info.status === 'alerta_90') countAlerta90++;
    else if (info.status === 'atencao_180') countAtencao180++;
    else if (info.status === 'seguro') countSeguro++;

    if (info.requerAtencao6Meses) {
      countTotal6M++;
    }
  }

  return (
    <div className="space-y-4">
      {/* Faixa de Alerta Global para Vencimento em até 6 Meses */}
      {countTotal6M > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border-l-4 border-amber-500 rounded-r-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-600 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Alerta de Validades no Radar (Até 6 Meses)</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    {countTotal6M} {countTotal6M === 1 ? 'produto' : 'produtos'}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Itens vencidos ou com vencimento previsto dentro da janela de 6 meses (prioridade para queima de estoque ou substituição).
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelecionarFiltro(filtroAtivo === 'alerta_6m' ? 'todos' : 'alerta_6m')}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 shadow-sm ${
                filtroAtivo === 'alerta_6m'
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {filtroAtivo === 'alerta_6m' ? 'Exibindo Alertas de 6M' : 'Filtrar Todos de ≤ 6M'}
            </button>
          </div>
        </div>
      )}

      {/* Cards de Métricas e Categorias de Alerta */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 sm:gap-3">
        {/* Total Geral */}
        <button
          onClick={() => onSelecionarFiltro('todos')}
          className={`text-left p-3 rounded-xl border transition-all ${
            filtroAtivo === 'todos'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium opacity-80 mb-1">
            <span>Total Cadastrado</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black">{itens.length}</div>
          <div className="text-[10px] mt-0.5 opacity-70">Todos os registros</div>
        </button>

        <button
          onClick={() => onSelecionarFiltro('invalidas')}
          className={`text-left p-3 rounded-xl border transition-all ${
            filtroAtivo === 'invalidas'
              ? 'bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-700/20'
              : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
          }`}
        >
          <div className="text-xs font-semibold mb-1">Data inválida</div>
          <div className="text-2xl font-black">{countInvalidas}</div>
          <div className="text-[10px] mt-0.5 opacity-70">Revisar cadastro</div>
        </button>

        {/* 1. Vencidos */}
        <button
          onClick={() => onSelecionarFiltro('vencidos')}
          className={`text-left p-3 rounded-xl border transition-all ${
            filtroAtivo === 'vencidos'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-600/20'
              : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:bg-rose-100/70'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className="font-semibold">Vencidos</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 group-hover:text-rose-700">
            {countVencidos}
          </div>
          <div className="text-[10px] text-rose-700/80 mt-0.5">Retirar de gôndola</div>
        </button>

        {/* 2. Crítico: Até 30 dias */}
        <button
          onClick={() => onSelecionarFiltro('critico_30')}
          className={`text-left p-3 rounded-xl border transition-all ${
            filtroAtivo === 'critico_30'
              ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-600/20'
              : 'bg-orange-50/70 text-orange-900 border-orange-200 hover:bg-orange-100/70'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className="font-semibold">Crítico (≤ 30d)</span>
            <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-600">
            {countCritico30}
          </div>
          <div className="text-[10px] text-orange-700/80 mt-0.5">Queima urgente</div>
        </button>

        {/* 3. Alerta: 1 a 3 meses */}
        <button
          onClick={() => onSelecionarFiltro('alerta_90')}
          className={`text-left p-3 rounded-xl border transition-all ${
            filtroAtivo === 'alerta_90'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100/70'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className="font-semibold">1 a 3 meses</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {countAlerta90}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">Promoção recomendada</div>
        </button>

        {/* 4. Atenção: 3 a 6 meses */}
        <button
          onClick={() => onSelecionarFiltro('atencao_180')}
          className={`text-left p-3 rounded-xl border transition-all ${
            filtroAtivo === 'atencao_180'
              ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-600/20'
              : 'bg-sky-50/70 text-sky-900 border-sky-200 hover:bg-sky-100/70'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className="font-semibold">3 a 6 meses</span>
            <Clock className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600">
            {countAtencao180}
          </div>
          <div className="text-[10px] text-sky-700/80 mt-0.5">Planejar giro</div>
        </button>

        {/* 5. Seguro: Mais de 6 meses */}
        <button
          onClick={() => onSelecionarFiltro('seguro')}
          className={`text-left p-3 rounded-xl border transition-all ${
            filtroAtivo === 'seguro'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
              : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className="font-semibold">&gt; 6 meses</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {countSeguro}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">Estoque seguro</div>
        </button>
      </div>
    </div>
  );
};
