import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import { HistoryRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';

interface EvolutionProps {
  historyRecords: HistoryRecord[];
  initialCapital: number;
  totalPurchases: number;
  onUpdateInitialCapital: (capital: number) => void;
  t: any;
}

export const Evolution: React.FC<EvolutionProps> = ({ historyRecords, initialCapital, totalPurchases, onUpdateInitialCapital, t }) => {
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'DAY' | 'WEEK' | 'MONTH'>('ALL');
  const [tempCapital, setTempCapital] = useState((initialCapital || 0).toString());

  const filteredRecords = useMemo(() => {
    const now = new Date();
    return historyRecords.filter(record => {
      if (periodFilter === 'ALL') return true;
      
      const recordDate = new Date(record.date);
      const diffTime = Math.abs(now.getTime() - recordDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (periodFilter === 'DAY') return diffDays <= 1;
      if (periodFilter === 'WEEK') return diffDays <= 7;
      if (periodFilter === 'MONTH') return diffDays <= 30;
      
      return true;
    });
  }, [historyRecords, periodFilter]);

  const currentWorkingCapital = useMemo(() => {
    const totalRevenue = historyRecords.reduce((sum, r) => sum + (r.revenue || 0), 0);
    const totalCost = historyRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
    return initialCapital + totalRevenue - totalCost - totalPurchases;
  }, [historyRecords, initialCapital, totalPurchases]);

  const chartData = useMemo(() => {
    const sortedRecords = [...filteredRecords].sort((a, b) => a.date - b.date);
    let currentCap = initialCapital;
    return sortedRecords.map(record => {
      currentCap += (record.revenue || 0) - (record.cost || 0);
      return {
        date: new Date(record.date).toLocaleDateString(),
        profit: (record.revenue || 0) - (record.cost || 0),
        capital: currentCap
      };
    });
  }, [filteredRecords, initialCapital]);

  const summary = useMemo(() => {
    return filteredRecords.reduce((acc, record) => {
      acc.revenue += record.revenue || 0;
      acc.cost += record.cost || 0;
      acc.profit += record.profit || 0;
      acc.totalDebts += record.totalDebts || 0;
      acc.totalUnsoldValue += record.totalUnsoldValue || 0;
      return acc;
    }, {
      revenue: 0,
      cost: 0,
      profit: 0,
      totalDebts: 0,
      totalUnsoldValue: 0
    });
  }, [filteredRecords]);

  const handleDownloadDocx = () => {
    const content = `
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <h1>{t.evolutionReport || 'Reporte de Evolución - HorneFin'}</h1>
          <p><strong>{t.periodLabel || 'Periodo:'}</strong> ${periodFilter}</p>
          <hr/>
          <h2>{t.financialSummary || 'Resumen Financiero'}</h2>
          <ul>
            <li><strong>{t.grossRevenue || 'Ingresos Brutos'}:</strong> $${summary.revenue.toFixed(2)}</li>
            <li><strong>{t.productionCosts || 'Costos de Producción'}:</strong> $${summary.cost.toFixed(2)}</li>
            <li><strong>{t.netProfit || 'Ganancia Neta'}:</strong> $${summary.profit.toFixed(2)}</li>
            <li><strong>{t.totalDebts || 'Total Deudas'}:</strong> $${summary.totalDebts.toFixed(2)}</li>
            <li><strong>{t.pendingProductsValue || 'Valor Productos Pendientes'}:</strong> $${summary.totalUnsoldValue.toFixed(2)}</li>
          </ul>
          <hr/>
          <h2>{t.records || 'Registros'}</h2>
          ${filteredRecords.map(r => `
            <p><strong>{t.date || 'Fecha:'}</strong> ${new Date(r.date).toLocaleDateString()}</p>
            <ul>
              <li>{t.revenue || 'Ingresos:'} $${r.revenue.toFixed(2)}</li>
              <li>{t.costs || 'Costos:'} $${r.cost.toFixed(2)}</li>
              <li>{t.profitLabel || 'Ganancia:'} $${r.profit.toFixed(2)}</li>
            </ul>
          `).join('')}
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Evolucion_HorneFin_${new Date().getTime()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const text = `*${t.evolutionReport || 'Reporte de Evolución - HorneFin'}* 📊\n\n` +
      `*${t.grossRevenue || 'Ingresos Brutos'}:* $${summary.revenue.toFixed(2)}\n` +
      `*${t.costs || 'Costos:'}* $${summary.cost.toFixed(2)}\n` +
      `*${t.netProfit || 'Ganancia Neta'}:* $${summary.profit.toFixed(2)}\n` +
      `*${t.debtsLabel || 'Deudas:'}* $${summary.totalDebts.toFixed(2)}\n` +
      `*${t.pendingProducts || 'Productos Pendientes'}:* $${summary.totalUnsoldValue.toFixed(2)}\n\n` +
      `${t.generatedBy || 'Generado por HorneFin.'}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="pb-8 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-blue-600 text-white p-1.5 rounded-lg"><Icons.Up size={24} /></span>
          {t.evolution || 'Evolución'}
        </h1>
        
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-full sm:w-auto">
            <button 
                onClick={() => setPeriodFilter('ALL')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodFilter === 'ALL' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                {t.all || 'Todo'}
            </button>
            <button 
                onClick={() => setPeriodFilter('DAY')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodFilter === 'DAY' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                {t.day || 'Día'}
            </button>
            <button 
                onClick={() => setPeriodFilter('WEEK')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodFilter === 'WEEK' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                {t.week || 'Semana'}
            </button>
            <button 
                onClick={() => setPeriodFilter('MONTH')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodFilter === 'MONTH' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                {t.month || 'Mes'}
            </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Capital de Inversión */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-bold text-stone-800 dark:text-white text-lg">Capital de Trabajo</h2>
              <p className="text-sm text-stone-500">Capital Inicial + Ingresos - Costos - Compras</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-xs font-bold text-stone-400 uppercase mb-1">Capital Inicial ($)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={tempCapital}
                    onChange={(e) => setTempCapital(e.target.value)}
                    className="w-full sm:w-32 p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-stone-900 dark:text-white outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={() => onUpdateInitialCapital(parseFloat(tempCapital) || 0)}
                    className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    title="Guardar Capital Inicial"
                  >
                    <Icons.Save size={20} />
                  </button>
                </div>
              </div>
              <div className="h-12 w-px bg-stone-200 dark:bg-stone-700 hidden sm:block"></div>
              <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                <label className="text-xs font-bold text-stone-400 uppercase mb-1">Capital Actual</label>
                <span className={`text-2xl font-black ${currentWorkingCapital >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  ${currentWorkingCapital.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-3 justify-end">
          <button 
            onClick={handleDownloadDocx}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
          >
            <Icons.Download size={18} />
            {t.downloadDocx || 'Descargar Docx'}
          </button>
          <button 
            onClick={handleShareWhatsApp}
            className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold shadow-sm hover:bg-green-700 transition-all flex items-center gap-2 text-sm"
          >
            <Icons.Share size={18} />
            {t.shareWhatsapp || 'Compartir WhatsApp'}
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t.grossRevenue || 'Ingresos Brutos'}</p>
            <p className="text-2xl font-black text-stone-800 dark:text-white">${summary.revenue.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t.productionCosts || 'Costos de Producción'}</p>
            <p className="text-2xl font-black text-stone-800 dark:text-white">${summary.cost.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t.netProfit || 'Ganancia Neta'}</p>
            <p className="text-2xl font-black text-emerald-500">${summary.profit.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t.totalDebts || 'Total Deudas'}</p>
            <p className="text-2xl font-black text-red-500">${summary.totalDebts.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t.pendingProductsValue || 'Valor Productos Pendientes'}</p>
            <p className="text-2xl font-black text-amber-500">${summary.totalUnsoldValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Gráfico de Tendencia */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 animate-in fade-in">
            <h2 className="font-bold text-stone-800 dark:text-white text-lg mb-6">Tendencia de Capital</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar yAxisId="left" dataKey="profit" name="Ganancia Neta" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Line yAxisId="right" type="monotone" dataKey="capital" name="Capital Acumulado" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Historial */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
          <h2 className="font-bold text-stone-800 dark:text-white text-lg mb-4">{t.savedRecords || 'Registros Guardados'}</h2>
          
          {filteredRecords.length === 0 ? (
            <p className="text-stone-500 text-center py-8">{t.noRecords || 'No hay registros para el periodo seleccionado.'}</p>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div key={record.id} className="p-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-white">{new Date(record.date).toLocaleDateString()}</p>
                    <p className="text-xs text-stone-500">{t.salesLabel || 'Ventas:'} {record.salesCount} | {t.debtsLabel || 'Deudas:'} {record.debtsCount} | {t.pendingLabel || 'Pendientes:'} {record.unsoldQty}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-stone-500 text-xs">{t.revenue || 'Ingresos'}</p>
                      <p className="font-bold">${record.revenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-stone-500 text-xs">{t.profitLabel || 'Ganancia'}</p>
                      <p className="font-bold text-emerald-500">${record.profit.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
