import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem } from '../types';
import { calculateIngredientCost, getDefaultUnit, normalizeKey } from '../utils/units';

interface CostAnalysisProps {
  recipe: Recipe;
  pantry: Record<string, PantryItem>;
  onUpdatePantry: (items: PantryItem[]) => void;
  onUpdateRecipe: (recipe: Recipe) => void;
  onBack: () => void;
  initialEditMode?: boolean;
  t: any;
}

export const CostAnalysis: React.FC<CostAnalysisProps> = ({ 
  recipe, 
  pantry, 
  onUpdatePantry, 
  onUpdateRecipe, 
  onBack, 
  initialEditMode = false,
  t 
}) => {
  const [showPantryForm, setShowPantryForm] = useState(initialEditMode);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(recipe.name);
  // Margen inicial 25% si no tiene uno guardado
  const [desiredMargin, setDesiredMargin] = useState(recipe.profitMargin || 25);
  const [pantryFormValues, setPantryFormValues] = useState<Record<string, PantryItem>>({});
  const [otherExpenses, setOtherExpenses] = useState<string>(recipe.otherExpenses?.toString() || '');

  useEffect(() => {
    const initialForm: Record<string, PantryItem> = {};
    recipe.ingredients.forEach(ing => {
      const key = normalizeKey(ing.name);
      initialForm[key] = pantry[key] || {
        name: ing.name,
        price: 0,
        quantity: 1,
        unit: getDefaultUnit(ing.name)
      };
    });
    setPantryFormValues(initialForm);
    setOtherExpenses(recipe.otherExpenses?.toString() || '');
  }, [recipe, pantry]);

  useEffect(() => {
    setShowPantryForm(initialEditMode);
  }, [initialEditMode, recipe.id]);

  const handlePantrySubmit = () => {
    onUpdatePantry(Object.values(pantryFormValues));
    let calculatedTotal = 0;
    recipe.ingredients.forEach(ing => {
        const key = normalizeKey(ing.name);
        const pItem = pantryFormValues[key];
        if (pItem && pItem.price > 0) {
            const cost = calculateIngredientCost(ing.quantity, ing.unit, pItem.price, pItem.quantity, pItem.unit);
            calculatedTotal += cost;
        }
    });
    const extras = parseFloat(otherExpenses) || 0;
    calculatedTotal += extras;
    onUpdateRecipe({ 
      ...recipe, 
      otherExpenses: extras, 
      totalCost: calculatedTotal, 
      profitMargin: desiredMargin, 
      hasPricesConfigured: true 
    });
    setShowPantryForm(false);
  };

  const calculations = useMemo(() => {
    let totalMaterialsCost = 0;
    const ingredientBreakdown = recipe.ingredients.map(ing => {
      const key = normalizeKey(ing.name);
      const pantryItem = pantry[key] || pantryFormValues[key];
      let cost = 0;
      if (pantryItem && pantryItem.price > 0) cost = calculateIngredientCost(ing.quantity, ing.unit, pantryItem.price, pantryItem.quantity, pantryItem.unit);
      totalMaterialsCost += cost;
      return { ...ing, cost };
    });
    const extras = recipe.otherExpenses || 0;
    const totalRecipeCost = totalMaterialsCost + extras;
    
    // El modo se saca directamente de la receta
    const costPerItem = recipe.mode === 'BATCH' ? (totalRecipeCost / (recipe.batchSize || 1)) : totalRecipeCost;
    const suggestedPrice = costPerItem > 0 ? costPerItem / (1 - (desiredMargin / 100)) : 0;
    
    return { totalMaterialsCost, totalRecipeCost, ingredientBreakdown, costPerItem, suggestedPrice, extras };
  }, [recipe, pantry, pantryFormValues, desiredMargin]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-28 transition-colors duration-300">
      {showPantryForm ? (
        <div className="fixed inset-0 z-[100] bg-stone-50 dark:bg-stone-950 flex flex-col h-[100dvh]">
          <div className="p-4 bg-white dark:bg-stone-900 border-b flex justify-between items-center shadow-sm">
            <h2 className="font-bold text-lg dark:text-white">{t.updatePrices}</h2>
            <button onClick={() => setShowPantryForm(false)} className="p-2 text-stone-400"><Icons.Close /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Fix: Cast Object.values(pantryFormValues) to PantryItem[] to resolve 'unknown' type errors. */}
            {(Object.values(pantryFormValues) as PantryItem[]).map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm">
                <p className="font-bold mb-3 capitalize text-stone-800 dark:text-white">{item.name}</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">{t.purchasePrice}</label>
                    <div className="relative">
                       <span className="absolute left-3 top-2.5 text-stone-400">$</span>
                       <input type="number" className="w-full pl-6 p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg dark:text-white focus:border-amber-500 focus:outline-none" value={item.price || ''} onChange={e => setPantryFormValues({...pantryFormValues, [normalizeKey(item.name)]: {...item, price: parseFloat(e.target.value) || 0}})} />
                    </div>
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">{t.qty}</label>
                    <input type="number" className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-center dark:text-white focus:border-amber-500 focus:outline-none" value={item.quantity || ''} onChange={e => setPantryFormValues({...pantryFormValues, [normalizeKey(item.name)]: {...item, quantity: parseFloat(e.target.value) || 0}})} />
                  </div>
                  <div className="w-24">
                     <label className="text-[10px] font-bold text-stone-400 uppercase">{t.unit}</label>
                     <select 
                        className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm dark:text-white focus:border-amber-500 focus:outline-none appearance-none"
                        value={item.unit}
                        onChange={(e) => setPantryFormValues({...pantryFormValues, [normalizeKey(item.name)]: {...item, unit: e.target.value}})}
                      >
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="oz">oz</option>
                        <option value="u">u</option>
                        <option value="file">file</option>
                        <option value="cda">cda</option>
                        <option value="cdita">cdita</option>
                        <option value="taza">taza</option>
                     </select>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
               <p className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2"><Icons.Settings size={18}/> {t.otherExpenses}</p>
               <div className="relative">
                  <span className="absolute left-4 top-3 text-red-400 font-bold">$</span>
                  <input type="number" className="w-full pl-8 p-3 bg-white dark:bg-stone-800 border border-red-200 dark:border-red-900/40 rounded-xl font-bold dark:text-white text-lg focus:border-red-500 focus:outline-none" value={otherExpenses} onChange={e => setOtherExpenses(e.target.value)} placeholder="0.00" />
               </div>
               <p className="text-[10px] text-red-600 mt-2 opacity-70">{t.otherExpensesHint}</p>
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800">
            <button onClick={handlePantrySubmit} className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-4 rounded-2xl font-bold text-lg shadow-xl hover:opacity-90 transition-all">{t.savePrices}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-stone-900 p-4 shadow-sm flex items-center justify-between border-b dark:border-stone-800 sticky top-0 z-20 no-print">
            <button onClick={onBack} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition"><Icons.Back className="text-stone-600 dark:text-stone-400"/></button>
            <h1 className="font-bold truncate text-stone-900 dark:text-white mx-2">{recipe.name}</h1>
            <button onClick={() => setShowPantryForm(true)} className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl hover:bg-amber-100 transition"><Icons.Edit size={20}/></button>
          </div>

          <div className="p-4 space-y-6">
            <div className="bg-stone-900 dark:bg-stone-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden print:bg-white print:text-black print:border print:border-black">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 blur-[60px] opacity-20 rounded-full no-print"></div>
               <div className="relative z-10">
                 <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1 print:text-stone-600">{t.costRecipe} {recipe.mode === 'BATCH' ? t.costItem : ''}</p>
                 <p className="text-4xl font-bold mb-8">${calculations.costPerItem.toFixed(2)}</p>
                 
                 <div className="space-y-5">
                    <div>
                       <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-wide print:text-stone-600">{t.desiredMargin}</label>
                          <div className="flex items-center gap-1 bg-stone-800 dark:bg-stone-700 px-2 py-1 rounded-lg border border-stone-700 no-print">
                            <input type="number" className="w-12 bg-transparent text-white text-right font-bold text-sm focus:outline-none" value={desiredMargin} onChange={e => setDesiredMargin(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} />
                            <span className="text-stone-500 font-bold text-xs">%</span>
                          </div>
                          <span className="hidden print:inline font-bold">{desiredMargin}%</span>
                       </div>
                       <input type="range" min="0" max="100" step="1" value={desiredMargin} onChange={e => setDesiredMargin(Number(e.target.value))} className="w-full h-2 bg-stone-700 dark:bg-stone-900 rounded-lg appearance-none accent-red-500 cursor-pointer no-print" />
                    </div>
                    
                    <div className="bg-stone-800 dark:bg-stone-900/50 rounded-2xl p-4 border border-stone-700 shadow-inner flex justify-between items-center print:bg-stone-100 print:border-stone-300">
                       <span className="text-sm font-medium text-stone-400 print:text-stone-700">{t.suggestedPrice}</span>
                       <span className="text-3xl font-bold text-green-400 print:text-green-700">${calculations.suggestedPrice.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                       <div className="bg-stone-800/50 dark:bg-stone-900/30 p-3 rounded-xl">
                          <p className="text-[10px] uppercase text-stone-500 font-bold mb-1">{t.profit} {recipe.mode === 'BATCH' ? `(${t.single})` : ''}</p>
                          <p className="text-xl font-bold text-amber-300 print:text-amber-700">${(calculations.suggestedPrice - calculations.costPerItem).toFixed(2)}</p>
                       </div>
                       <div className="bg-stone-800/50 dark:bg-stone-900/30 p-3 rounded-xl text-right">
                          <p className="text-[10px] uppercase text-stone-500 font-bold mb-1">{t.reportMode}</p>
                          <p className="text-sm font-bold text-stone-300 truncate">{recipe.mode === 'BATCH' ? `${t.batchMode} (${recipe.batchSize}u)` : t.singleMode}</p>
                       </div>
                    </div>
                 </div>
               </div>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden print:border-stone-300">
               <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border-b dark:border-stone-800 flex justify-between items-center print:bg-stone-50">
                  <span className="font-bold text-stone-700 dark:text-stone-300 uppercase text-xs tracking-wider">{t.costBreakdown}</span>
                  <span className="text-[10px] text-stone-400">{t.basedOn}</span>
               </div>
               <div className="divide-y divide-stone-50 dark:divide-stone-800">
                  {calculations.ingredientBreakdown.map((item, i) => (
                    <div key={i} className="p-4 flex justify-between items-center hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                       <div>
                          <p className="font-bold text-stone-800 dark:text-stone-200 capitalize text-sm">{item.name}</p>
                          <p className="text-[10px] text-stone-500">{item.quantity} {item.unit}</p>
                       </div>
                       <div className="text-right">
                          <p className="font-bold text-stone-900 dark:text-white">${item.cost.toFixed(2)}</p>
                          {item.cost === 0 && <span className="text-[10px] text-red-400 font-bold uppercase">{t.noPrice}</span>}
                       </div>
                    </div>
                  ))}
                  {calculations.extras > 0 && (
                     <div className="p-4 flex justify-between items-center bg-red-50/50 dark:bg-red-900/5">
                        <div>
                           <p className="font-bold text-red-800 dark:text-red-300 text-sm">{t.otherExpenses}</p>
                           <p className="text-[10px] text-red-500">Gasto fijo</p>
                        </div>
                        <p className="font-bold text-red-900 dark:text-red-200">${calculations.extras.toFixed(2)}</p>
                     </div>
                  )}
                  <div className="p-5 bg-stone-50 dark:bg-stone-800/50 flex justify-between items-center">
                     <span className="font-bold text-stone-800 dark:text-white text-base">{t.costRecipe} Total</span>
                     <span className="text-xl font-bold text-stone-900 dark:text-white">${calculations.totalRecipeCost.toFixed(2)}</span>
                  </div>
               </div>
            </div>

            <div className="flex gap-3 no-print">
               <button onClick={() => setShowPantryForm(true)} className="flex-1 py-4 bg-white dark:bg-stone-800 text-stone-800 dark:text-white border border-stone-200 dark:border-stone-700 rounded-2xl font-bold hover:bg-stone-50 transition flex items-center justify-center gap-2 shadow-sm"><Icons.Money size={18} className="text-amber-500"/> {t.editPrices}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};