import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem, Order } from '../types';
import { calculateIngredientCost, normalizeKey } from '../utils/units';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SummaryProps {
  recipes: Recipe[];
  pantry: Record<string, PantryItem>;
  orders?: Order[]; // Added orders prop
  t: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Summary: React.FC<SummaryProps> = ({ recipes, pantry, orders = [], t }) => {
  const [mode, setMode] = useState<'MANUAL' | 'ORDERS'>('MANUAL');
  
  // Manual Mode State
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [selectedRecipes, setSelectedRecipes] = useState<Record<string, number>>({});
  
  // Orders Mode State
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

  const toggleRecipe = (id: string) => {
    setSelectedRecipes(prev => {
      const newSelected = { ...prev };
      if (newSelected[id]) {
        delete newSelected[id];
      } else {
        newSelected[id] = 1;
      }
      return newSelected;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedRecipes(prev => {
      const current = prev[id] || 0;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [id]: newQty };
    });
  };

  const financials = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    const recipeBreakdown: any[] = [];

    const calculateForRecipe = (recipe: Recipe, count: number) => {
        const cost = recipe.ingredients.reduce((sum, ing) => {
            const itemCost = calculateIngredientCost(ing, pantry);
            return sum + itemCost;
        }, 0);
        
        const revenue = (recipe.salePrice || 0) * count;
        const productionCost = cost * count;
        
        totalRevenue += revenue;
        totalCost += productionCost;

        recipeBreakdown.push({
            name: recipe.name,
            count,
            revenue,
            cost: productionCost,
            profit: revenue - productionCost
        });
    };

    if (mode === 'MANUAL') {
        const periodMultiplier = selectedPeriod === 'week' ? 6 : selectedPeriod === 'month' ? 24 : 1;

        Object.entries(selectedRecipes).forEach(([recipeId, count]) => {
            const recipe = recipes.find(r => r.id === recipeId);
            if (recipe) {
                calculateForRecipe(recipe, count * periodMultiplier);
            }
        });
    } else {
        // ORDERS MODE
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + 86400000;

        const dayMap: Record<string, number> = {};

        // 1. One-time orders
        orders.filter(o => !o.isRecurring && o.recipeId && o.deliveryDate >= start && o.deliveryDate < end && o.status !== 'CANCELLED')
              .forEach(o => {
                  dayMap[o.recipeId!] = (dayMap[o.recipeId!] || 0) + o.quantity;
              });

        // 2. Recurring orders
        const recurringOrders = orders.filter(o => o.isRecurring && o.recipeId && o.status !== 'CANCELLED');
        
        if (recurringOrders.length > 0) {
            let current = new Date(start);
            while (current.getTime() < end) {
                const dayOfWeek = current.getDay();
                recurringOrders.forEach(o => {
                    if (o.recurringDays?.includes(dayOfWeek)) {
                        dayMap[o.recipeId!] = (dayMap[o.recipeId!] || 0) + o.quantity;
                    }
                });
                current.setDate(current.getDate() + 1);
            }
        }

        Object.entries(dayMap).forEach(([recipeId, count]) => {
            const recipe = recipes.find(r => r.id === recipeId);
            if (recipe) {
                calculateForRecipe(recipe, count);
            }
        });
    }

    return {
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalRevenue - totalCost,
      breakdown: recipeBreakdown
    };
  }, [recipes, selectedRecipes, selectedPeriod, pantry, mode, orders, startDate, endDate]);

  const handleExport = () => {
    const title = mode === 'MANUAL' 
        ? `Reporte Financiero (${t[selectedPeriod]})`
        : `Reporte Financiero (${startDate} - ${endDate})`;

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>
        body { font-family: 'Arial', sans-serif; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .summary { margin-bottom: 20px; font-size: 1.2em; }
      </style>
      </head><body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generado el: ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="summary">
        <p><strong>Ingresos Totales:</strong> $${financials.revenue.toFixed(2)}</p>
        <p><strong>Costos Totales:</strong> $${financials.cost.toFixed(2)}</p>
        <p><strong>Ganancia Neta:</strong> $${financials.profit.toFixed(2)}</p>
        <p><strong>Margen:</strong> ${financials.revenue > 0 ? ((financials.profit / financials.revenue) * 100).toFixed(1) : 0}%</p>
      </div>
      <h2>Detalle por Receta</h2>
      <table>
        <thead>
          <tr>
            <th>Receta</th>
            <th>Cantidad</th>
            <th>Ingresos</th>
            <th>Costo</th>
            <th>Ganancia</th>
          </tr>
        </thead>
        <tbody>
          ${financials.breakdown.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.count}</td>
              <td>$${item.revenue.toFixed(2)}</td>
              <td>$${item.cost.toFixed(2)}</td>
              <td>$${item.profit.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </body></html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-8 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-indigo-600 text-white p-1.5 rounded-lg"><Icons.PieChart size={24} /></span>
          {t.navSummary}
        </h1>

        {/* Mode Toggle */}
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl mt-4">
            <button 
                onClick={() => setMode('MANUAL')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'MANUAL' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                {t.modeManual}
            </button>
            <button 
                onClick={() => setMode('ORDERS')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'ORDERS' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                {t.modeOrders}
            </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Configuration */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
          {mode === 'MANUAL' ? (
              <>
                <div className="mb-6">
                    <label className="text-xs font-bold text-stone-400 uppercase mb-2 block tracking-wider">{t.selectPeriod}</label>
                    <div className="flex gap-2">
                    {(['day', 'week', 'month'] as const).map(p => (
                        <button
                        key={p}
                        onClick={() => setSelectedPeriod(p)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                            selectedPeriod === p 
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' 
                            : 'border-transparent bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}
                        >
                        {t[p]}
                        </button>
                    ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-2 block tracking-wider">{t.selectRecipes}</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {recipes.map(recipe => (
                        <div 
                        key={recipe.id}
                        onClick={() => toggleRecipe(recipe.id)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                            selectedRecipes[recipe.id] 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' 
                            : 'border-transparent bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700'
                        }`}
                        >
                        <span className={`font-medium ${selectedRecipes[recipe.id] ? 'text-indigo-900 dark:text-indigo-100' : 'text-stone-600 dark:text-stone-400'}`}>
                            {recipe.name}
                        </span>
                        
                        {selectedRecipes[recipe.id] && (
                            <div className="flex items-center gap-3 bg-white dark:bg-stone-900 rounded-lg px-2 py-1 shadow-sm" onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={() => updateQuantity(recipe.id, -1)}
                                className="w-6 h-6 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 text-stone-600"
                            >-</button>
                            <span className="font-bold text-sm w-4 text-center dark:text-white">{selectedRecipes[recipe.id]}</span>
                            <button 
                                onClick={() => updateQuantity(recipe.id, 1)}
                                className="w-6 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 rounded-full hover:bg-indigo-200 text-indigo-700"
                            >+</button>
                            </div>
                        )}
                        </div>
                    ))}
                    </div>
                </div>
              </>
          ) : (
              // ORDERS MODE CONFIG
              <div className="animate-in fade-in">
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">{t.startDate}</label>
                        <input 
                            type="date" 
                            className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">{t.endDate}</label>
                        <input 
                            type="date" 
                            className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 italic">
                      Se calcularán las finanzas basadas en los pedidos (incluyendo recurrentes) dentro de este rango de fechas.
                  </p>
              </div>
          )}
        </div>

        {/* Charts & Stats */}
        {financials.revenue > 0 ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
                <p className="text-xs font-bold text-stone-400 uppercase">{t.totalRevenue}</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-white mt-1">${financials.revenue.toFixed(0)}</p>
              </div>
              <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
                <p className="text-xs font-bold text-stone-400 uppercase">{t.netProfit}</p>
                <p className={`text-2xl font-bold mt-1 ${financials.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  ${financials.profit.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: t.profit, value: Math.max(0, financials.profit) },
                      { name: t.costs, value: financials.cost }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell key="profit" fill="#10B981" />
                    <Cell key="cost" fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <button 
                onClick={handleExport}
                className="w-full py-4 bg-stone-900 dark:bg-stone-700 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
            >
                <Icons.Download size={20} />
                {t.exportReport}
            </button>
          </div>
        ) : (
          <div className="text-center py-10 opacity-50">
            <Icons.PieChart size={48} className="mx-auto mb-2 text-stone-300" />
            <p className="text-stone-400 font-medium">{t.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
};
