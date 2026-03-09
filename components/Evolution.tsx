import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import { HistoryRecord } from '../types';

interface EvolutionProps {
  historyRecords: HistoryRecord[];
  t: any;
}

export const Evolution: React.FC<EvolutionProps> = ({ historyRecords, t }) => {
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'DAY' | 'WEEK' | 'MONTH'>('ALL');

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
          <h1>Reporte de Evolución - HorneFin</h1>
          <p><strong>Periodo:</strong> ${periodFilter}</p>
          <hr/>
          <h2>Resumen Financiero</h2>
          <ul>
            <li><strong>Ingresos Brutos:</strong> $${summary.revenue.toFixed(2)}</li>
            <li><strong>Costos de Producción:</strong> $${summary.cost.toFixed(2)}</li>
            <li><strong>Ganancia Neta:</strong> $${summary.profit.toFixed(2)}</li>
            <li><strong>Total Deudas:</strong> $${summary.totalDebts.toFixed(2)}</li>
            <li><strong>Valor Productos Pendientes:</strong> $${summary.totalUnsoldValue.toFixed(2)}</li>
          </ul>
          <hr/>
          <h2>Registros</h2>
          ${filteredRecords.map(r => `
            <p><strong>Fecha:</strong> ${new Date(r.date).toLocaleDateString()}</p>
            <ul>
              <li>Ingresos: $${r.revenue.toFixed(2)}</li>
              <li>Costos: $${r.cost.toFixed(2)}</li>
              <li>Ganancia: $${r.profit.toFixed(2)}</li>
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
    const text = `*Reporte de Evolución - HorneFin* 📊\n\n` +
      `*Ingresos Brutos:* $${summary.revenue.toFixed(2)}\n` +
      `*Costos:* $${summary.cost.toFixed(2)}\n` +
      `*Ganancia Neta:* $${summary.profit.toFixed(2)}\n` +
      `*Deudas:* $${summary.totalDebts.toFixed(2)}\n` +
      `*Productos Pendientes:* $${summary.totalUnsoldValue.toFixed(2)}\n\n` +
      `Generado por HorneFin.`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="pb-8 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-blue-600 text-white p-1.5 rounded-lg"><Icons.Up size={24} /></span>
          Evolución
        </h1>
        
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-full sm:w-auto">
            <button 
                onClick={() => setPeriodFilter('ALL')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodFilter === 'ALL' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                Todo
            </button>
            <button 
                onClick={() => setPeriodFilter('DAY')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodFilter === 'DAY' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                Día
            </button>
            <button 
                onClick={() => setPeriodFilter('WEEK')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodFilter === 'WEEK' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                Semana
            </button>
            <button 
                onClick={() => setPeriodFilter('MONTH')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${periodFilter === 'MONTH' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                Mes
            </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Acciones */}
        <div className="flex flex-wrap gap-3 justify-end">
          <button 
            onClick={handleDownloadDocx}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
          >
            <Icons.Download size={18} />
            Descargar Docx
          </button>
          <button 
            onClick={handleShareWhatsApp}
            className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold shadow-sm hover:bg-green-700 transition-all flex items-center gap-2 text-sm"
          >
            <Icons.Share size={18} />
            Compartir WhatsApp
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">Ingresos Brutos</p>
            <p className="text-2xl font-black text-stone-800 dark:text-white">${summary.revenue.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">Costos de Producción</p>
            <p className="text-2xl font-black text-stone-800 dark:text-white">${summary.cost.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">Ganancia Neta</p>
            <p className="text-2xl font-black text-emerald-500">${summary.profit.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">Total Deudas</p>
            <p className="text-2xl font-black text-red-500">${summary.totalDebts.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <p className="text-xs font-bold text-stone-400 uppercase mb-1">Valor Productos Pendientes</p>
            <p className="text-2xl font-black text-amber-500">${summary.totalUnsoldValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
          <h2 className="font-bold text-stone-800 dark:text-white text-lg mb-4">Registros Guardados</h2>
          
          {filteredRecords.length === 0 ? (
            <p className="text-stone-500 text-center py-8">No hay registros para el periodo seleccionado.</p>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div key={record.id} className="p-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-white">{new Date(record.date).toLocaleDateString()}</p>
                    <p className="text-xs text-stone-500">Ventas: {record.salesCount} | Deudas: {record.debtsCount} | Pendientes: {record.unsoldQty}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-stone-500 text-xs">Ingresos</p>
                      <p className="font-bold">${record.revenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-stone-500 text-xs">Ganancia</p>
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
