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
  let totalRevenue = 0;
  let totalCosts = 0;
  let totalProfit = 0;
  const ingredientCosts: Record<string, number> = {};

  recipes.forEach(recipe => {
    let recipeCost = 0;
    recipe.ingredients.forEach(ing => {
       const key = normalizeKey(ing.name);
       const pItem = pantry[key];
       let cost = 0;
       if (pItem && pItem.price > 0) {
          cost = calculateIngredientCost(ing.quantity, ing.unit, pItem.price, pItem.quantity, pItem.unit);
       }
       recipeCost += cost;
       ingredientCosts[key] = (ingredientCosts[key] || 0) + cost;
    });

    const otherExpenses = recipe.otherExpenses || 0;
    recipeCost += otherExpenses;
    const margin = recipe.profitMargin || 25;
    const price = recipe.suggestedPrice || (recipeCost > 0 ? recipeCost / (1 - (margin / 100)) : 0);
    
    totalCosts += recipeCost;
    totalRevenue += price;
    totalProfit += (price - recipeCost);
  });

  const pieData = Object.entries(ingredientCosts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); 

  const COLORS = ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#57534E'];

  return (
    <div className="pb-32 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-4 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-red-600 text-white p-1 rounded-lg"><Icons.PieChart size={18} /></span>
          {t.summaryTitle}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-[10px] mt-0.5">{t.summarySubtitle}</p>
      </div>

      <div className="p-4 space-y-6">
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