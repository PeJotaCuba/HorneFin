import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Icons } from './Icons';
import { Recipe, PantryItem } from '../types';
import { calculateIngredientCost } from '../utils/units';

interface SummaryProps {
  recipes: Recipe[];
  pantry: Record<string, PantryItem>;
  t: any;
}

export const Summary: React.FC<SummaryProps> = ({ recipes, pantry, t }) => {
  // Calculate aggregate stats
  let totalRevenue = 0;
  let totalCosts = 0;
  let totalProfit = 0;
  const ingredientCosts: Record<string, number> = {};

  // Mocking "usage" or sales assumption: 1 batch of each recipe sold
  recipes.forEach(recipe => {
    let recipeCost = 0;
    recipe.ingredients.forEach(ing => {
       const key = ing.name.toLowerCase();
       const pItem = pantry[key];
       let cost = 0;
       if (pItem && pItem.price > 0) {
          cost = calculateIngredientCost(ing.quantity, ing.unit, pItem.price, pItem.quantity, pItem.unit);
       }
       recipeCost += cost;
       
       // Aggregate for Pie Chart
       ingredientCosts[key] = (ingredientCosts[key] || 0) + cost;
    });

    // Default profit margin assumption if not set is 45% (from CostAnalysis default)
    const margin = recipe.profitMargin || 45;
    const price = recipe.suggestedPrice || (recipeCost > 0 ? recipeCost / (1 - (margin / 100)) : 0);
    
    totalCosts += recipeCost;
    totalRevenue += price;
    totalProfit += (price - recipeCost);
  });

  const pieData = Object.entries(ingredientCosts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 ingredients

  // Vibrant colors for the pie chart as requested
  const COLORS = ['#F43F5E', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#64748B'];

  return (
    <div className="pb-24 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm sticky top-0 z-20 border-b border-stone-100 dark:border-stone-800">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
           <span className="bg-purple-500 text-white p-1.5 rounded-lg">
             <Icons.PieChart size={20} />
           </span>
           {t.summaryTitle}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">{t.summarySubtitle}</p>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
              <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t.totalCosts}</p>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-200">€{totalCosts.toFixed(2)}</p>
           </div>
           <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
              <p className="text-xs font-bold text-stone-400 uppercase mb-1">{t.estRevenue}</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-500">€{totalRevenue.toFixed(2)}</p>
           </div>
           <div className="col-span-2 bg-rose-500 p-5 rounded-2xl text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/20">
              <div className="flex justify-between items-center mb-2">
                 <p className="text-rose-100 font-bold text-sm uppercase">{t.netProfit}</p>
                 <Icons.Up size={20} className="text-rose-200" />
              </div>
              <p className="text-3xl font-bold">€{totalProfit.toFixed(2)}</p>
              <p className="text-xs text-rose-100 mt-1 opacity-80">{t.profitHint}</p>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
           <h3 className="font-bold text-stone-800 dark:text-white mb-4 text-sm uppercase tracking-wide">{t.costDistribution}</h3>
           
           {pieData.length > 0 ? (
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                       itemStyle={{ color: '#1c1917' }}
                       formatter={(value: number) => `€${value.toFixed(2)}`}
                    />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="h-40 flex items-center justify-center text-stone-300 dark:text-stone-600">
               {t.noData}
             </div>
           )}
           
           <div className="space-y-3 mt-2">
              {pieData.map((entry, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-stone-600 dark:text-stone-300 capitalize">{entry.name}</span>
                   </div>
                   <span className="font-bold text-stone-800 dark:text-stone-200">€{entry.value.toFixed(2)}</span>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};