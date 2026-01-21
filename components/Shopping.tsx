import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem } from '../types';
import { calculateIngredientCost, normalizeKey } from '../utils/units';

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
  // Mapa de stock: Clave Normalizada -> Cantidad
  const [stock, setStock] = useState<Record<string, number>>({});

  const addRecipe = () => {
      if (!selectedRecipeId) return;
      // Check if already added
      if (selectedRecipes.find(r => r.recipeId === selectedRecipeId)) {
          alert('Esta receta ya está en la lista');
          return;
      }
      setSelectedRecipes([...selectedRecipes, { recipeId: selectedRecipeId, count: 1 }]);
      setSelectedRecipeId('');
  };

  const removeRecipe = (id: string) => {
      setSelectedRecipes(selectedRecipes.filter(r => r.recipeId !== id));
  };

  const updateCount = (id: string, newCount: number) => {
      if (newCount < 1) return;
      setSelectedRecipes(selectedRecipes.map(r => r.recipeId === id ? { ...r, count: newCount } : r));
  };

  const updateStock = (key: string, val: number) => {
      setStock(prev => ({ ...prev, [key]: val }));
  };

  // Aggregation Logic
  const shoppingList = useMemo(() => {
      const itemsMap: Record<string, ShoppingItem> = {};

      selectedRecipes.forEach(sel => {
          const recipe = recipes.find(r => r.id === sel.recipeId);
          if (!recipe) return;

          recipe.ingredients.forEach(ing => {
              const key = normalizeKey(ing.name);
              const pItem = pantry[key];
              
              if (!itemsMap[key]) {
                  itemsMap[key] = {
                      originalName: ing.name,
                      normalizedKey: key,
                      totalNeeded: 0,
                      unit: ing.unit,
                      pricePerUnit: pItem ? pItem.price : 0,
                      purchaseUnit: pItem ? pItem.unit : ing.unit,
                      cost: 0
                  };
              }

              // Sumar cantidad necesaria
              // Nota: Asumimos unidades compatibles para la suma simple visual. 
              // En un sistema real complejo se requeriría conversión dinámica si las unidades difieren entre recetas.
              itemsMap[key].totalNeeded += ing.quantity * sel.count;
          });
      });

      // Calcular costos finales basados en lo que falta (Needed - Stock)
      return Object.values(itemsMap).map(item => {
          const inStock = stock[item.normalizedKey] || 0;
          const needToBuy = Math.max(0, item.totalNeeded - inStock);
          
          let cost = 0;
          if (item.pricePerUnit > 0) {
              // Calcular costo usando la función utilitaria, asumiendo que compramos "needToBuy" cantidad
              // cost = (needToBuy / purchaseQty) * purchasePrice -> simplificado a costo proporcional
               const pItem = pantry[item.normalizedKey];
               if (pItem) {
                  cost = calculateIngredientCost(needToBuy, item.unit, pItem.price, pItem.quantity, pItem.unit);
               }
          }

          return { ...item, needToBuy, cost };
      });

  }, [selectedRecipes, recipes, pantry, stock]);

  const totalCost = shoppingList.reduce((acc, item) => acc + item.cost, 0);

  const handleExportDOC = () => {
    const date = new Date().toLocaleDateString();
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Lista de Compras</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; }
          h1 { color: #8B5CF6; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 1.2em; color: #E11D48; }
        </style>
      </head>
      <body>
        <h1>Lista de Compras - HorneFin</h1>
        <p><strong>Fecha:</strong> ${date}</p>
        
        <h3>Recetas Seleccionadas:</h3>
        <ul>
            ${selectedRecipes.map(s => {
                const r = recipes.find(x => x.id === s.recipeId);
                return `<li>${r?.name} (x${s.count})</li>`;
            }).join('')}
        </ul>

        <table>
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Necesario</th>
              <th>En Stock</th>
              <th>A Comprar</th>
              <th>Costo Est.</th>
            </tr>
          </thead>
          <tbody>
            ${shoppingList.map(item => `
              <tr>
                <td style="text-transform: capitalize;">${item.originalName}</td>
                <td>${item.totalNeeded.toFixed(2)} ${item.unit}</td>
                <td>${(stock[item.normalizedKey] || 0)} ${item.unit}</td>
                <td style="font-weight:bold">${item.needToBuy.toFixed(2)} ${item.unit}</td>
                <td>$${item.cost.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr>
               <td colspan="4" align="right" class="total">TOTAL ESTIMADO</td>
               <td class="total">$${totalCost.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lista_Compras_${date.replace(/\//g, '-')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsApp = () => {
      let text = `*Lista de Compras HorneFin - ${new Date().toLocaleDateString()}*\n\n`;
      text += `*Recetas:*\n`;
      selectedRecipes.forEach(s => {
          const r = recipes.find(x => x.id === s.recipeId);
          text += `- ${r?.name} (x${s.count})\n`;
      });
      text += `\n*A Comprar:*\n`;
      shoppingList.forEach(item => {
          if (item.needToBuy > 0) {
              text += `- ${item.originalName}: ${item.needToBuy.toFixed(2)} ${item.unit} ($${item.cost.toFixed(2)})\n`;
          }
      });
      text += `\n*Total Est.: $${totalCost.toFixed(2)}*`;
      
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <div className="pb-32 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm sticky top-0 z-20 border-b border-stone-100 dark:border-stone-800">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-emerald-500 text-white p-1.5 rounded-lg">
             <Icons.Package size={20} />
          </span>
          {t.shoppingTitle}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">{t.shoppingSubtitle}</p>
      </div>

      <div className="p-4 space-y-6">
          
          {/* Selector de Recetas */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800">
             <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">{t.selectRecipe}</label>
             <div className="flex gap-2">
                 <select 
                   className="flex-1 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white focus:outline-none"
                   value={selectedRecipeId}
                   onChange={(e) => setSelectedRecipeId(e.target.value)}
                 >
                     <option value="">-- Seleccionar --</option>
                     {recipes.map(r => (
                         <option key={r.id} value={r.id}>{r.name}</option>
                     ))}
                 </select>
                 <button 
                   onClick={addRecipe}
                   disabled={!selectedRecipeId}
                   className="bg-emerald-500 text-white px-4 rounded-xl font-bold disabled:opacity-50"
                 >
                    {t.add}
                 </button>
             </div>
          </div>

          {/* Lista de Recetas en Cola */}
          {selectedRecipes.length > 0 && (
              <div className="space-y-3">
                  {selectedRecipes.map((sel) => {
                      const r = recipes.find(x => x.id === sel.recipeId);
                      return (
                          <div key={sel.recipeId} className="bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-100 dark:border-stone-800 flex justify-between items-center">
                              <span className="font-bold text-stone-800 dark:text-stone-200">{r?.name}</span>
                              <div className="flex items-center gap-3">
                                  <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg">
                                      <span className="px-2 text-xs font-bold text-stone-500">{t.preparations}</span>
                                      <input 
                                        type="number" 
                                        className="w-12 p-1 bg-transparent text-center font-bold dark:text-white focus:outline-none"
                                        value={sel.count}
                                        onChange={(e) => updateCount(sel.recipeId, parseInt(e.target.value) || 1)}
                                      />
                                  </div>
                                  <button onClick={() => removeRecipe(sel.recipeId)} className="text-red-400">
                                      <Icons.Close size={18} />
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}

          {/* Tabla de Resultados */}
          {selectedRecipes.length > 0 && (
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
                  <div className="p-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex justify-between items-center">
                      <span className="font-bold text-stone-700 dark:text-stone-300 uppercase text-xs">{t.ingredientsCount}</span>
                      <button onClick={() => setStock({})} className="text-xs text-rose-500 font-bold hover:underline">{t.clearList}</button>
                  </div>
                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                      {shoppingList.map((item, idx) => (
                          <div key={idx} className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <p className="font-bold text-stone-800 dark:text-stone-200 capitalize">{item.originalName}</p>
                                      <p className="text-xs text-stone-500">Total Req: {item.totalNeeded.toFixed(2)} {item.unit}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-stone-900 dark:text-white">${item.cost.toFixed(2)}</p>
                                  </div>
                              </div>
                              
                              <div className="flex gap-4 items-center bg-stone-50 dark:bg-stone-800 p-2 rounded-lg">
                                  <div className="flex-1">
                                      <label className="text-[10px] uppercase font-bold text-stone-400 block">{t.inStock}</label>
                                      <input 
                                        type="number" 
                                        className="w-full bg-transparent font-bold text-stone-600 dark:text-stone-300 focus:outline-none border-b border-stone-300 focus:border-emerald-500"
                                        placeholder="0"
                                        value={stock[item.normalizedKey] || ''}
                                        onChange={(e) => updateStock(item.normalizedKey, parseFloat(e.target.value) || 0)}
                                      />
                                  </div>
                                  <div className="flex-1 border-l pl-4 border-stone-200 dark:border-stone-700">
                                      <label className="text-[10px] uppercase font-bold text-rose-500 block">{t.need}</label>
                                      <p className="font-bold text-rose-600 dark:text-rose-400">
                                          {item.needToBuy.toFixed(2)} <span className="text-xs">{item.unit}</span>
                                      </p>
                                  </div>
                              </div>
                          </div>
                      ))}
                      
                      <div className="p-4 bg-stone-900 dark:bg-black text-white flex justify-between items-center">
                          <span className="font-bold">{t.totalShoppingCost}</span>
                          <span className="text-xl font-bold">${totalCost.toFixed(2)}</span>
                      </div>
                  </div>
              </div>
          )}

          {selectedRecipes.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pb-safe">
                  <button 
                    onClick={handleExportDOC}
                    className="py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                      <Icons.File size={18} /> {t.exportList}
                  </button>
                  <button 
                    onClick={handleWhatsApp}
                    className="py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none"
                  >
                      <Icons.Globe size={18} /> {t.shareWhatsapp}
                  </button>
              </div>
          )}

      </div>
    </div>
  );
};