import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './Icons';
import { Recipe, PantryItem, Order } from '../types';
import { normalizeKey } from '../utils/units';

interface ShoppingProps {
  recipes: Recipe[];
  pantry: Record<string, PantryItem>;
  orders?: Order[];
  inventoryStock: Record<string, number>;
  onUpdateInventoryStock: (stock: Record<string, number>) => void;
  t: any;
}

export const Shopping: React.FC<ShoppingProps> = ({ recipes, pantry, orders = [], inventoryStock, onUpdateInventoryStock, t }) => {
  const [mode, setMode] = useState<'STOCK' | 'COMPRAS'>('STOCK');
  const [period, setPeriod] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  
  // Compras Mode State
  const [selectedRecipes, setSelectedRecipes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('shopping_selected_recipes');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedRecipeToAdd, setSelectedRecipeToAdd] = useState('');

  useEffect(() => {
    localStorage.setItem('shopping_selected_recipes', JSON.stringify(selectedRecipes));
  }, [selectedRecipes]);

  const allIngredients = useMemo(() => {
    const ingredientsMap: Record<string, { name: string, unit: string }> = {};
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const key = normalizeKey(ing.name);
        if (!ingredientsMap[key]) {
          ingredientsMap[key] = { name: ing.name, unit: ing.unit };
        }
      });
    });
    return Object.values(ingredientsMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes]);

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

  const handleStockChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    const newStock = { ...inventoryStock };
    if (isNaN(numValue) || numValue === 0) {
      delete newStock[key];
    } else {
      newStock[key] = numValue;
    }
    onUpdateInventoryStock(newStock);
  };

  const shoppingList = useMemo(() => {
    const ingredientsNeeded: Record<string, { name: string, quantity: number; unit: string }> = {};
    const periodMultiplier = period === 'MONTH' ? 30 : period === 'WEEK' ? 7 : 1;

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
            name: ing.name,
            quantity: totalNeeded,
            unit: ing.unit
          };
        }
      });
    });

    return Object.entries(ingredientsNeeded).map(([key, needed]) => {
      const currentStock = inventoryStock[key] || 0;
      const toBuy = Math.max(0, needed.quantity - currentStock);
      
      return {
        key,
        name: needed.name,
        needed: needed.quantity,
        inStock: currentStock,
        toBuy,
        unit: needed.unit
      };
    }).filter(item => item.toBuy > 0);
  }, [recipes, selectedRecipes, inventoryStock, period]);

  return (
    <div className="pb-8 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span className="bg-emerald-600 text-white p-1.5 rounded-lg"><Icons.Package size={24} /></span>
          Inventario
        </h1>
        
        {/* Mode Toggle */}
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl mt-4">
            <button 
                onClick={() => setMode('STOCK')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'STOCK' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                Stock
            </button>
            <button 
                onClick={() => setMode('COMPRAS')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'COMPRAS' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
            >
                Compras
            </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {mode === 'STOCK' ? (
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 animate-in fade-in">
            <h2 className="text-lg font-bold text-stone-800 dark:text-white mb-4">Stock Actual</h2>
            <p className="text-sm text-stone-500 mb-6">Introduce la cantidad disponible de cada insumo. Los campos vacíos se consideran como 0.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {allIngredients.map(ing => {
                const key = normalizeKey(ing.name);
                const stockValue = inventoryStock[key] || 0;
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                    <span className="font-medium text-stone-700 dark:text-stone-300 capitalize truncate pr-2">{ing.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <input 
                        type="number" 
                        placeholder="0"
                        className="w-20 p-2 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-600 rounded-lg text-sm dark:text-white focus:border-emerald-500 focus:outline-none placeholder-stone-400"
                        value={stockValue === 0 ? '' : stockValue}
                        onChange={(e) => handleStockChange(key, e.target.value)}
                      />
                      <span className="text-xs text-stone-500 w-8">{ing.unit}</span>
                    </div>
                  </div>
                );
              })}
              {allIngredients.length === 0 && (
                <p className="text-stone-400 text-sm col-span-full text-center py-4">No hay insumos registrados en las recetas.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
              <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Producción Deseada</label>
                  <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
                      <button onClick={() => setPeriod('DAY')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${period === 'DAY' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}>Día</button>
                      <button onClick={() => setPeriod('WEEK')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${period === 'WEEK' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}>Semana</button>
                      <button onClick={() => setPeriod('MONTH')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${period === 'MONTH' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}>Mes</button>
                  </div>
              </div>
              
              <div className="flex gap-2 mb-4">
                <select 
                  className="flex-1 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white"
                  value={selectedRecipeToAdd}
                  onChange={e => setSelectedRecipeToAdd(e.target.value)}
                >
                  <option value="">Seleccionar receta...</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <button 
                  onClick={addRecipe}
                  disabled={!selectedRecipeToAdd}
                  className="px-4 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Añadir
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
                            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-stone-700 rounded-full shadow-sm text-stone-600"
                        >-</button>
                        <span className="font-bold text-sm w-6 text-center dark:text-white">{count}</span>
                        <button 
                            onClick={() => updateQuantity(recipe.id, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-stone-700 rounded-full shadow-sm text-stone-600"
                        >+</button>
                        <button 
                            onClick={() => removeRecipe(recipe.id)}
                            className="ml-2 text-red-400 hover:text-red-500"
                        >
                          <Icons.Close size={18} />
                        </button>
                    </div>
                    </div>
                  );
              })}
              {Object.keys(selectedRecipes).length === 0 && (
                <p className="text-center text-stone-400 text-sm py-4">Añade recetas para calcular las necesidades de compra.</p>
              )}
              </div>
            </div>

            {shoppingList.length > 0 ? (
              <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
                <h2 className="font-bold text-stone-900 dark:text-white text-lg mb-4">Lista de Compras</h2>
                <div className="space-y-3">
                  {shoppingList.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-stone-50 dark:bg-stone-800 rounded-xl gap-3 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="flex-1">
                        <p className="font-bold text-stone-800 dark:text-white capitalize">{item.name}</p>
                        <p className="text-xs text-stone-500 mt-1">
                          Necesario: {item.needed.toFixed(1)} {item.unit} | Stock: {item.inStock.toFixed(1)} {item.unit}
                        </p>
                      </div>
                      
                      <div className="text-right bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg">
                          <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Pendiente de compra</label>
                          <span className="block text-lg font-bold text-emerald-700 dark:text-emerald-300">
                          {item.toBuy.toFixed(1)} <span className="text-xs">{item.unit}</span>
                          </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 opacity-50">
                <Icons.Package size={48} className="mx-auto mb-2 text-stone-300" />
                <p className="text-stone-400 font-medium">No hay insumos pendientes de compra.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
