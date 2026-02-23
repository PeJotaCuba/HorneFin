import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Icons } from './Icons';
import { Recipe, PantryItem } from '../types';
import { calculateIngredientCost, normalizeKey } from '../utils/units';

interface SummaryProps {
  recipes: Recipe[];
  pantry: Record<string, PantryItem>;
  t: any;
}

export const Summary: React.FC<SummaryProps> = ({ recipes, pantry, t }) => {
  const [period, setPeriod] = React.useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const [selectedRecipes, setSelectedRecipes] = React.useState<{ recipeId: string; count: number }[]>(() => {
      // Default to all recipes with count 1
      return recipes.map(r => ({ recipeId: r.id, count: 1 }));
  });

  // Sync selected recipes when recipes prop changes (e.g. new recipe added)
  // But preserve existing counts if possible
  React.useEffect(() => {
      setSelectedRecipes(prev => {
          const newSelection = recipes.map(r => {
              const existing = prev.find(p => p.recipeId === r.id);
              return existing ? existing : { recipeId: r.id, count: 1 };
          });
          return newSelection;
      });
  }, [recipes.length]); // Only re-run if number of recipes changes

  const periodMultiplier = {
      'DAY': 1,
      'WEEK': 6,
      'MONTH': 24
  }[period];

  const updateCount = (id: string, count: number) => {
      if (count < 0) return;
      setSelectedRecipes(prev => prev.map(p => p.recipeId === id ? { ...p, count } : p));
  };

  const toggleRecipe = (id: string) => {
      setSelectedRecipes(prev => {
          const exists = prev.find(p => p.recipeId === id);
          if (exists) {
              return prev.filter(p => p.recipeId !== id);
          } else {
              return [...prev, { recipeId: id, count: 1 }];
          }
      });
  };

  let totalRevenue = 0;
  let totalCosts = 0;
  let totalProfit = 0;
  const ingredientCosts: Record<string, number> = {};

  selectedRecipes.forEach(sel => {
    const recipe = recipes.find(r => r.id === sel.recipeId);
    if (!recipe) return;

    const quantity = sel.count * periodMultiplier;
    if (quantity === 0) return;

    let recipeCost = 0;
    recipe.ingredients.forEach(ing => {
       const key = normalizeKey(ing.name);
       const pItem = pantry[key];
       let cost = 0;
       if (pItem && pItem.price > 0) {
          cost = calculateIngredientCost(ing.quantity, ing.unit, pItem.price, pItem.quantity, pItem.unit);
       }
       recipeCost += cost;
       ingredientCosts[key] = (ingredientCosts[key] || 0) + (cost * quantity);
    });

    const otherExpenses = recipe.otherExpenses || 0;
    recipeCost += otherExpenses;
    const margin = recipe.profitMargin || 25;
    const price = recipe.suggestedPrice || (recipeCost > 0 ? recipeCost / (1 - (margin / 100)) : 0);
    
    totalCosts += recipeCost * quantity;
    totalRevenue += price * quantity;
    totalProfit += (price - recipeCost) * quantity;
  });

  const pieData = Object.entries(ingredientCosts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); 

  const COLORS = ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#57534E'];

  const exportSummaryDoc = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Resumen Financiero Global</title>
      <style>
        body { font-family: 'Arial', sans-serif; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
      </head><body>
      <h1>Resumen Financiero - HorneFin</h1>
      <p>Fecha: ${new Date().toLocaleDateString()}</p>
      <p>Período: ${t[period.toLowerCase()]}</p>
      
      <h3>Producción Planificada:</h3>
      <ul>
        ${selectedRecipes.filter(s => s.count > 0).map(sel => {
            const r = recipes.find(x => x.id === sel.recipeId);
            if (!r) return '';
            return `<li>${r.name} (x${sel.count * periodMultiplier})</li>`;
        }).join('')}
      </ul>

      <h2>Totales Globales (Proyección)</h2>
      <ul>
        <li><strong>Costos Totales:</strong> $${totalCosts.toFixed(2)}</li>
        <li><strong>Ingresos Estimados:</strong> $${totalRevenue.toFixed(2)}</li>
        <li><strong>Ganancia Neta Potencial:</strong> $${totalProfit.toFixed(2)}</li>
      </ul>

      <h2>Distribución de Costos (Top Insumos)</h2>
      <table>
        <thead><tr><th>Ingrediente</th><th>Costo Acumulado</th></tr></thead>
        <tbody>
          ${pieData.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>$${item.value.toFixed(2)}</td>
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
    link.download = `HorneFin_Resumen_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-32 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-4 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <span className="bg-red-600 text-white p-1 rounded-lg"><Icons.PieChart size={18} /></span>
            {t.summaryTitle}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-[10px] mt-0.5">{t.summarySubtitle}</p>
        </div>
        <div className="flex gap-2">
            <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value as any)}
                className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold py-2 px-3 rounded-xl border-none focus:ring-0 cursor-pointer"
            >
                <option value="DAY">{t.day}</option>
                <option value="WEEK">{t.week}</option>
                <option value="MONTH">{t.month}</option>
            </select>
            <button onClick={exportSummaryDoc} className="p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition" title="Exportar Resumen">
            <Icons.Download size={20} />
            </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Recipe Selection */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
            <h3 className="font-bold text-stone-800 dark:text-white mb-3 text-xs uppercase tracking-widest">{t.selectRecipes}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {recipes.map(recipe => {
                    const isSelected = selectedRecipes.some(s => s.recipeId === recipe.id);
                    const count = selectedRecipes.find(s => s.recipeId === recipe.id)?.count || 0;
                    
                    return (
                        <div key={recipe.id} className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${isSelected ? 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700' : 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-800/50'}`}>
                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleRecipe(recipe.id)}>
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-stone-300 dark:border-stone-600'}`}>
                                    {isSelected && <Icons.Check size={14} strokeWidth={3} />}
                                </div>
                                <span className={`text-sm font-bold ${isSelected ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400'}`}>{recipe.name}</span>
                            </div>
                            {isSelected && (
                                <div className="flex items-center bg-white dark:bg-stone-900 border dark:border-stone-700 rounded-lg overflow-hidden shadow-sm">
                                    <span className="px-2 text-[10px] font-bold text-stone-400 uppercase">x</span>
                                    <input 
                                        type="number" 
                                        className="w-12 py-1 pr-1 bg-transparent text-center font-bold text-sm dark:text-white focus:outline-none"
                                        value={count}
                                        onChange={(e) => updateCount(recipe.id, parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
              <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{t.totalCosts}</p>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-200">${totalCosts.toFixed(2)}</p>
           </div>
           <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
              <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{t.estRevenue}</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-500">${totalRevenue.toFixed(2)}</p>
           </div>
           <div className="col-span-2 bg-red-600 p-6 rounded-[2rem] text-white shadow-xl shadow-red-100 dark:shadow-none relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                 <p className="text-red-100 font-bold text-xs uppercase tracking-widest mb-1">{t.netProfit}</p>
                 <p className="text-4xl font-bold">${totalProfit.toFixed(2)}</p>
                 <p className="text-[10px] text-red-100 mt-2 opacity-80">{t.profitHint}</p>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800">
           <h3 className="font-bold text-stone-800 dark:text-white mb-6 text-xs uppercase tracking-widest">{t.costDistribution}</h3>
           
           {pieData.length > 0 ? (
             <div className="h-64 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }} />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">Insumos</span>
                  <span className="font-black text-stone-800 dark:text-white">TOP {pieData.length}</span>
               </div>
             </div>
           ) : (
             <div className="h-40 flex items-center justify-center text-stone-300 dark:text-stone-600 italic text-sm">{t.noData}</div>
           )}
           
           <div className="space-y-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex justify-between items-center group">
                   <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-sm font-bold text-stone-600 dark:text-stone-300 capitalize group-hover:text-stone-900 transition-colors">{entry.name}</span>
                   </div>
                   <span className="font-black text-stone-800 dark:text-stone-200 text-sm">${entry.value.toFixed(2)}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};