import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem } from '../types';
import { getDefaultUnit, normalizeKey } from '../utils/units';

interface PantryProps {
  recipes: Recipe[];
  pantry: Record<string, PantryItem>;
  onUpdatePantry: (items: PantryItem[]) => void;
  t: any;
}

export const Pantry: React.FC<PantryProps> = ({ recipes, pantry, onUpdatePantry, t }) => {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Combine all ingredients from all recipes into a unique list
  useEffect(() => {
    const uniqueIngredients = new Set<string>();
    recipes.forEach(r => r.ingredients.forEach(i => uniqueIngredients.add(normalizeKey(i.name))));
    
    const keyToOriginalName: Record<string, string> = {};
    recipes.forEach(r => r.ingredients.forEach(i => {
       const key = normalizeKey(i.name);
       if (!keyToOriginalName[key]) keyToOriginalName[key] = i.name;
    }));
    
    const combinedItems: PantryItem[] = Array.from(uniqueIngredients).map(key => {
      const existing = pantry[key];
      return existing || {
        name: keyToOriginalName[key] || key, 
        price: 0,
        quantity: 1,
        unit: getDefaultUnit(keyToOriginalName[key] || key) 
      };
    });

    setItems(combinedItems);
  }, [recipes, pantry]);

  const handleUpdateItem = (index: number, field: keyof PantryItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSaveAll = () => {
    onUpdatePantry(items);
    alert(t.globalPricesUpdated);
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="pb-32 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-4 shadow-sm border-b border-stone-100 dark:border-stone-800">
        <h1 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-amber-500 text-white p-1 rounded-lg">
             <Icons.Money size={18} />
          </span>
          {t.pantryTitle}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">{t.pantrySubtitle}</p>
        
        <div className="mt-3 relative">
          <Icons.Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-stone-900 dark:text-white placeholder-stone-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {filteredItems.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
            <h3 className="font-bold text-stone-800 dark:text-stone-200 text-lg capitalize mb-3 flex items-center gap-2">
               {item.name}
               {item.price > 0 ? (
                 <Icons.Check size={16} className="text-green-500" />
               ) : (
                 <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-500 px-2 py-0.5 rounded-full uppercase">{t.noPrice}</span>
               )}
            </h3>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">{t.purchasePrice}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-bold">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full pl-6 p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-bold text-stone-800 dark:text-white focus:border-amber-500 focus:outline-none"
                    value={item.price === 0 ? '' : item.price}
                    onChange={(e) => handleUpdateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="w-20">
                 <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">{t.qty}</label>
                 <input 
                    type="number" 
                    className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-center font-medium focus:border-amber-500 focus:outline-none dark:text-white"
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  />
              </div>
              <div className="w-24">
                 <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">{t.unit}</label>
                 <select 
                    className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:text-white focus:border-amber-500 focus:outline-none"
                    value={item.unit}
                    onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="oz">oz</option>
                    <option value="u">u</option>
                    <option value="file">file (30u)</option>
                 </select>
              </div>
            </div>
          </div>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="text-center py-10 text-stone-400 dark:text-stone-500">
            <p>{t.noIngredients}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-[90px] left-0 right-0 px-4 z-30">
         <button 
           onClick={handleSaveAll}
           className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-stone-200 transition-colors"
         >
           <Icons.Save size={18} />
           {t.saveAll}
         </button>
      </div>
    </div>
  );
};