import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem } from '../types';
import { calculateIngredientCost, normalizeKey, convertUnit } from '../utils/units';

interface ShoppingProps {
  recipes: Recipe[];
  pantry: Record<string, PantryItem>;
  t: any;
}

interface ShoppingItem {
    originalName: string;
    normalizedKey: string;
    totalNeeded: number;
    unit: string;
    pricePerUnit: number;
    purchaseUnit: string;
    cost: number;
}

export const Shopping: React.FC<ShoppingProps> = ({ recipes, pantry, t }) => {
  const [selectedRecipes, setSelectedRecipes] = useState<{ recipeId: string; count: number }[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [stock, setStock] = useState<Record<string, number>>({});
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>({});

  const addRecipe = () => {
      if (!selectedRecipeId) return;
      if (selectedRecipes.find(r => r.recipeId === selectedRecipeId)) {
          alert(t.recipeAlreadyInList);
          return;
      }
      setSelectedRecipes([...selectedRecipes, { recipeId: selectedRecipeId, count: 1 }]);
      setSelectedRecipeId('');
  };

  const removeRecipe = (id: string) => {
      setSelectedRecipes(selectedRecipes.filter(r => r.recipeId !== id));
  };

  const updateCount = (id: string, newCount: number) => {
      if (newCount < 0) return;
      setSelectedRecipes(selectedRecipes.map(r => r.recipeId === id ? { ...r, count: newCount } : r));
  };

  const updateStock = (key: string, val: number) => {
      setStock(prev => ({ ...prev, [key]: val }));
  };

  const updateUnitOverride = (key: string, newUnit: string) => {
      setUnitOverrides(prev => ({ ...prev, [key]: newUnit }));
  };

  const clearAll = () => {
    if (confirm(t.clearList + "?")) {
      setSelectedRecipes([]);
      setStock({});
      setUnitOverrides({});
    }
  };

  const shoppingList = useMemo(() => {
      const itemsMap: Record<string, ShoppingItem> = {};

      selectedRecipes.forEach(sel => {
          const recipe = recipes.find(r => r.id === sel.recipeId);
          if (!recipe) return;

          recipe.ingredients.forEach(ing => {
              const key = normalizeKey(ing.name);
              const pItem = pantry[key];
              const targetUnit = unitOverrides[key] || (pItem ? pItem.unit : ing.unit);

              if (!itemsMap[key]) {
                  itemsMap[key] = {
                      originalName: ing.name, 
                      normalizedKey: key,
                      totalNeeded: 0,
                      unit: targetUnit,
                      pricePerUnit: pItem ? pItem.price : 0,
                      purchaseUnit: pItem ? pItem.unit : targetUnit,
                      cost: 0
                  };
              }

              const convertedQty = convertUnit(ing.quantity, ing.unit, targetUnit);
              itemsMap[key].totalNeeded += convertedQty * (sel.count || 0);
          });
      });

      return Object.values(itemsMap).map(item => {
          const inStock = stock[item.normalizedKey] || 0;
          const needToBuy = Math.max(0, item.totalNeeded - inStock);
          
          let cost = 0;
          if (item.pricePerUnit > 0) {
               const pItem = pantry[item.normalizedKey];
               if (pItem) {
                  cost = calculateIngredientCost(needToBuy, item.unit, pItem.price, pItem.quantity, pItem.unit);
               }
          }
          return { ...item, needToBuy, cost };
      });
  }, [selectedRecipes, recipes, pantry, stock, unitOverrides]);

  const totalCost = shoppingList.reduce((acc, item) => acc + item.cost, 0);

  return (
    <div className="pb-32 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-4 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20 flex justify-between items-center">
        <div>
           <h1 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
             <span className="bg-orange-500 text-white p-1 rounded-lg"><Icons.Package size={18} /></span>
             {t.shoppingTitle}
           </h1>
           <p className="text-stone-500 dark:text-stone-400 text-[10px] mt-0.5">{t.shoppingSubtitle}</p>
        </div>
        {selectedRecipes.length > 0 && (
           <button onClick={clearAll} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition" title={t.clearList}><Icons.Trash size={20}/></button>
        )}
      </div>

      <div className="p-4 space-y-6">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
             <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">{t.selectRecipe}</label>
             <div className="flex gap-2">
                 <select 
                   className="flex-1 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white focus:outline-none focus:border-orange-500 appearance-none"
                   value={selectedRecipeId}
                   onChange={(e) => setSelectedRecipeId(e.target.value)}
                 >
                     <option value="">-- {t.selectRecipe} --</option>
                     {recipes.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                 </select>
                 <button onClick={addRecipe} disabled={!selectedRecipeId} className="bg-orange-500 text-white px-5 rounded-xl font-bold disabled:opacity-50 hover:bg-orange-600 transition shadow-md shadow-orange-100">{t.add}</button>
             </div>
          </div>

          {selectedRecipes.length > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  {selectedRecipes.map((sel) => {
                      const r = recipes.find(x => x.id === sel.recipeId);
                      return (
                          <div key={sel.recipeId} className="bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-100 dark:border-stone-800 flex justify-between items-center shadow-sm">
                              <span className="font-bold text-stone-800 dark:text-stone-200 ml-2">{r?.name}</span>
                              <div className="flex items-center gap-3">
                                  <div className="flex items-center bg-stone-50 dark:bg-stone-800 border dark:border-stone-700 rounded-xl overflow-hidden">
                                      <span className="px-2 text-[10px] font-bold text-stone-400 uppercase">x</span>
                                      <input 
                                        type="number" 
                                        className="w-12 py-1.5 pr-2 bg-transparent text-center font-bold dark:text-white focus:outline-none"
                                        placeholder="0"
                                        value={sel.count || ''}
                                        onChange={(e) => updateCount(sel.recipeId, parseInt(e.target.value) || 0)}
                                      />
                                  </div>
                                  <button onClick={() => removeRecipe(sel.recipeId)} className="p-2 text-stone-300 hover:text-red-500 transition"><Icons.Close size={18} /></button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}

          {shoppingList.length > 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-md border border-stone-100 dark:border-stone-800 overflow-hidden animate-in zoom-in-95">
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 flex justify-between items-center">
                      <span className="font-bold text-stone-700 dark:text-stone-300 uppercase text-[10px] tracking-widest">{t.ingredientsCount}</span>
                      <span className="text-[10px] text-stone-400">Total: {shoppingList.length}</span>
                  </div>
                  <div className="divide-y divide-stone-50 dark:divide-stone-800">
                      {shoppingList.map((item, idx) => (
                          <div key={idx} className="p-4 hover:bg-stone-50/50 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                      <p className="font-bold text-stone-800 dark:text-stone-200 capitalize leading-tight">{item.originalName}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] font-bold text-stone-400">{item.totalNeeded.toFixed(2)}</span>
                                          <select className="text-[10px] bg-stone-100 dark:bg-stone-700 rounded px-1.5 py-0.5 border-none font-bold dark:text-white" value={item.unit} onChange={(e) => updateUnitOverride(item.normalizedKey, e.target.value)}>
                                              <option value="kg">kg</option><option value="lb">lb</option><option value="g">g</option><option value="ml">ml</option><option value="l">l</option><option value="oz">oz</option><option value="u">u</option><option value="file">file</option>
                                          </select>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-stone-900 dark:text-white">${item.cost.toFixed(2)}</p>
                                  </div>
                              </div>
                              <div className="flex gap-4 items-center bg-stone-50 dark:bg-stone-800 p-2.5 rounded-xl border border-stone-100 dark:border-stone-700 shadow-inner">
                                  <div className="flex-1">
                                      <label className="text-[9px] uppercase font-bold text-stone-400 block mb-0.5">{t.inStock} ({item.unit})</label>
                                      <input type="number" className="w-full bg-transparent font-bold text-stone-600 dark:text-stone-300 focus:outline-none text-sm" placeholder="0" value={stock[item.normalizedKey] || ''} onChange={(e) => updateStock(item.normalizedKey, parseFloat(e.target.value) || 0)} />
                                  </div>
                                  <div className="flex-1 border-l pl-4 border-stone-200 dark:border-stone-700">
                                      <label className="text-[9px] uppercase font-bold text-orange-500 block mb-0.5">{t.need}</label>
                                      <p className="font-bold text-orange-600 dark:text-orange-400 text-sm">{item.needToBuy.toFixed(2)} <span className="text-[10px]">{item.unit}</span></p>
                                  </div>
                              </div>
                          </div>
                      ))}
                      <div className="p-5 bg-stone-900 dark:bg-black text-white flex justify-between items-center shadow-inner">
                          <span className="font-bold text-sm tracking-wide">{t.totalShoppingCost}</span>
                          <span className="text-2xl font-bold">${totalCost.toFixed(2)}</span>
                      </div>
                  </div>
              </div>
          ) : (
            selectedRecipes.length > 0 && (
              <div className="text-center py-10 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 border-dashed">
                 <p className="text-stone-400 text-sm">Ingresa cantidades para ver la lista</p>
              </div>
            )
          )}

          {shoppingList.length > 0 && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-5">
                  <button className="py-4 bg-white dark:bg-stone-800 text-stone-800 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm border dark:border-stone-700 hover:bg-stone-50"><Icons.File size={18} /> {t.exportList}</button>
                  <button className="py-4 bg-orange-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 hover:bg-orange-600 transition-transform active:scale-95"><Icons.Globe size={18} /> WhatsApp</button>
              </div>
          )}
      </div>
    </div>
  );
};