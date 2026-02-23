import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem, Order } from '../types';
import { calculateIngredientCost, normalizeKey, convertUnit } from '../utils/units';

interface ShoppingProps {
  recipes: Recipe[];
  pantry: Record<string, PantryItem>;
  orders?: Order[]; // Added orders prop
  t: any;
}

export const Shopping: React.FC<ShoppingProps> = ({ recipes, pantry, orders = [], t }) => {
  const [mode, setMode] = useState<'MANUAL' | 'ORDERS'>('MANUAL');
  
  // Manual Mode State
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [selectedRecipes, setSelectedRecipes] = useState<Record<string, number>>({});
  
  // Orders Mode State
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

  const [selectedRecipeToAdd, setSelectedRecipeToAdd] = useState('');
  const [showAllIngredients, setShowAllIngredients] = useState(false);

  const addRecipe = () => {
    if (selectedRecipeToAdd && !selectedRecipes[selectedRecipeToAdd]) {
      setSelectedRecipes(prev => ({ ...prev, [selectedRecipeToAdd]: 1 }));
      setSelectedRecipeToAdd('');
    }
  };

  const removeRecipe = (id: string) => {
    setSelectedRecipes(prev => {
      const newSelected = { ...prev };
      delete newSelected[id];
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

  const shoppingList = useMemo(() => {
    const ingredientsNeeded: Record<string, { quantity: number; unit: string }> = {};

    if (mode === 'MANUAL') {
        const periodMultiplier = selectedPeriod === 'week' ? 6 : selectedPeriod === 'month' ? 24 : 1;

        Object.entries(selectedRecipes).forEach(([recipeId, count]) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        recipe.ingredients.forEach(ing => {
            const key = normalizeKey(ing.name);
            const totalNeeded = ing.quantity * count * periodMultiplier;

            if (ingredientsNeeded[key]) {
            ingredientsNeeded[key].quantity += totalNeeded;
            } else {
            ingredientsNeeded[key] = {
                quantity: totalNeeded,
                unit: ing.unit
            };
            }
        });
        });
    } else {
        // ORDERS MODE
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + 86400000; // End of day

        // Iterate through each day in range to check recurring orders
        const dayMap: Record<string, number> = {}; // recipeId -> totalQuantity

        // 1. One-time orders in range
        orders.filter(o => !o.isRecurring && o.recipeId && o.deliveryDate >= start && o.deliveryDate < end && o.status !== 'CANCELLED')
              .forEach(o => {
                  dayMap[o.recipeId!] = (dayMap[o.recipeId!] || 0) + o.quantity;
              });

        // 2. Recurring orders
        const recurringOrders = orders.filter(o => o.isRecurring && o.recipeId && o.status !== 'CANCELLED');
        
        if (recurringOrders.length > 0) {
            let current = new Date(start);
            while (current.getTime() < end) {
                const dayOfWeek = current.getDay(); // 0-6
                recurringOrders.forEach(o => {
                    if (o.recurringDays?.includes(dayOfWeek)) {
                        dayMap[o.recipeId!] = (dayMap[o.recipeId!] || 0) + o.quantity;
                    }
                });
                current.setDate(current.getDate() + 1);
            }
        }

        // Calculate ingredients based on dayMap
        Object.entries(dayMap).forEach(([recipeId, count]) => {
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe) return;

            recipe.ingredients.forEach(ing => {
                const key = normalizeKey(ing.name);
                const totalNeeded = ing.quantity * count;

                if (ingredientsNeeded[key]) {
                    ingredientsNeeded[key].quantity += totalNeeded;
                } else {
                    ingredientsNeeded[key] = {
                        quantity: totalNeeded,
                        unit: ing.unit
                    };
                }
            });
        });
    }

    // Compare with pantry
    return Object.entries(ingredientsNeeded).map(([name, needed]) => {
      const pantryItem = pantry[normalizeKey(name)];
      let pantryQty = 0;
      
      if (pantryItem) {
        if (pantryItem.unit !== needed.unit) {
             const converted = convertUnit(pantryItem.quantity, pantryItem.unit, needed.unit);
             if (converted !== null) pantryQty = converted;
        } else {
            pantryQty = pantryItem.quantity;
        }
      }

      const toBuy = Math.max(0, needed.quantity - pantryQty);
      
      return {
        name,
        needed: needed.quantity,
        inPantry: pantryQty,
        toBuy,
        unit: needed.unit
      };
    }).filter(item => showAllIngredients || item.toBuy > 0);
  }, [recipes, selectedRecipes, selectedPeriod, pantry, mode, orders, startDate, endDate, showAllIngredients]);

  const handleExport = () => {
    const title = mode === 'MANUAL' 
        ? `Lista de Compras (${t[selectedPeriod]})`
        : `Lista de Compras (${startDate} - ${endDate})`;

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>
        body { font-family: 'Arial', sans-serif; }
        ul { list-style-type: none; padding: 0; }
        li { padding: 8px 0; border-bottom: 1px solid #eee; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
      </style>
      </head><body>
      <div class="header">
        <h1>${title}</h1>
        ${mode === 'MANUAL' ? `
        <p><strong>Recetas seleccionadas:</strong></p>
        <ul>
          ${Object.entries(selectedRecipes).map(([id, count]) => {
             const r = recipes.find(rec => rec.id === id);
             return r ? `<li>${count}x ${r.name}</li>` : '';
          }).join('')}
        </ul>
        ` : ''}
      </div>
      <h2>Ingredientes a Comprar</h2>
      <ul>
        ${shoppingList.map(item => `
          <li>
            <strong>${item.name}</strong>: ${item.toBuy.toFixed(2)} ${item.unit}
            <br/><span style="font-size: 12px; color: #666;">(Necesario: ${item.needed.toFixed(2)} - En Despensa: ${item.inPantry.toFixed(2)})</span>
          </li>
        `).join('')}
      </ul>
      </body></html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Compras_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsApp = () => {
    const text = `*Lista de Compras*\n\n` + shoppingList.map(item => 
      `- ${item.name}: ${item.toBuy.toFixed(2)} ${item.unit}`
    ).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="pb-8 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-emerald-600 text-white p-1.5 rounded-lg"><Icons.Package size={24} /></span>
          {t.navShopping}
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
        
        {/* Configuration Section */}
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
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
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
                    
                    <div className="flex gap-2 mb-3">
                      <select 
                        className="flex-1 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white"
                        value={selectedRecipeToAdd}
                        onChange={e => setSelectedRecipeToAdd(e.target.value)}
                      >
                        <option value="">{t.select}</option>
                        {recipes.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={addRecipe}
                        disabled={!selectedRecipeToAdd}
                        className="px-4 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50"
                      >
                        {t.add}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {Object.entries(selectedRecipes).map(([recipeId, count]) => {
                        const recipe = recipes.find(r => r.id === recipeId);
                        if (!recipe) return null;
                        return (
                          <div 
                          key={recipe.id}
                          className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex justify-between items-center"
                          >
                          <span className="font-medium text-stone-700 dark:text-stone-300">
                              {recipe.name}
                          </span>
                          
                          <div className="flex items-center gap-3">
                              <button 
                                  onClick={() => updateQuantity(recipe.id, -1)}
                                  className="w-6 h-6 flex items-center justify-center bg-white dark:bg-stone-700 rounded-full shadow-sm text-stone-600"
                              >-</button>
                              <span className="font-bold text-sm w-4 text-center dark:text-white">{count}</span>
                              <button 
                                  onClick={() => updateQuantity(recipe.id, 1)}
                                  className="w-6 h-6 flex items-center justify-center bg-white dark:bg-stone-700 rounded-full shadow-sm text-stone-600"
                              >+</button>
                              <button 
                                  onClick={() => removeRecipe(recipe.id)}
                                  className="ml-2 text-red-400 hover:text-red-500"
                              >
                                <Icons.Close size={16} />
                              </button>
                          </div>
                          </div>
                        );
                    })}
                    {Object.keys(selectedRecipes).length === 0 && (
                      <p className="text-center text-stone-400 text-sm py-4">{t.noRecipes}</p>
                    )}
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
                      Se calcularán los ingredientes necesarios para todos los pedidos (incluyendo recurrentes) dentro de este rango de fechas.
                  </p>
              </div>
          )}
        </div>

        {/* Results */}
        {shoppingList.length > 0 ? (
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-stone-900 dark:text-white text-lg">{t.shoppingList}</h2>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => setShowAllIngredients(!showAllIngredients)}
                  className={`p-2 rounded-xl transition ${showAllIngredients ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}
                  title="Mostrar todos los ingredientes"
                >
                  <Icons.Layers size={20} />
                </button>
                <button onClick={handleWhatsApp} className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition">
                  <Icons.Share size={20} />
                </button>
                <button onClick={handleExport} className="p-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition">
                  <Icons.Download size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {shoppingList.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-white capitalize">{item.name}</p>
                    <p className="text-xs text-stone-500">
                      {t.needed}: {item.needed.toFixed(1)} {item.unit} • {t.inPantry}: {item.inPantry.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {item.toBuy.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 opacity-50">
            <Icons.Package size={48} className="mx-auto mb-2 text-stone-300" />
            <p className="text-stone-400 font-medium">{t.noItemsToBuy}</p>
          </div>
        )}
      </div>
    </div>
  );
};
