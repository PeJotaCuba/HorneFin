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
  
  const [mode, setMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(recipe.name);
  
  // Batch Settings
  const [batchSize, setBatchSize] = useState(12);
  const [batchesPerDay, setBatchesPerDay] = useState(1);
  const [desiredMargin, setDesiredMargin] = useState(45);
  
  // Form State
  const [pantryFormValues, setPantryFormValues] = useState<Record<string, PantryItem>>({});
  const [otherExpenses, setOtherExpenses] = useState<string>(recipe.otherExpenses?.toString() || '');

  // Inicializar formulario con datos de la despensa global o defaults
  useEffect(() => {
    const initialForm: Record<string, PantryItem> = {};
    recipe.ingredients.forEach(ing => {
      const key = normalizeKey(ing.name);
      // Busca en despensa usando clave normalizada
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
    // 1. Enviar precios a la despensa global
    onUpdatePantry(Object.values(pantryFormValues));
    
    // 2. Calcular costo TOTAL basado en los valores que ACABAMOS de editar
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

    // 3. Actualizar receta
    const updatedRecipe = { 
      ...recipe, 
      otherExpenses: extras,
      totalCost: calculatedTotal,
      hasPricesConfigured: true
    };
    
    onUpdateRecipe(updatedRecipe);
    setShowPantryForm(false);
  };

  const handlePantryChange = (key: string, field: keyof PantryItem, value: any) => {
    setPantryFormValues(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const saveName = () => {
     if (editedName.trim()) {
        onUpdateRecipe({ ...recipe, name: editedName });
     } else {
        setEditedName(recipe.name);
     }
     setIsEditingName(false);
  };

  // Cálculos en tiempo real
  const calculations = useMemo(() => {
    let totalMaterialsCost = 0;
    
    const ingredientBreakdown = recipe.ingredients.map(ing => {
      const key = normalizeKey(ing.name);
      const pantryItem = pantry[key] || pantryFormValues[key];
      
      let cost = 0;
      if (pantryItem && pantryItem.price > 0) {
        cost = calculateIngredientCost(ing.quantity, ing.unit, pantryItem.price, pantryItem.quantity, pantryItem.unit);
      }
      totalMaterialsCost += cost;
      return { ...ing, cost };
    });

    const extras = recipe.otherExpenses || 0;
    const totalRecipeCost = totalMaterialsCost + extras;

    const costPerItem = mode === 'SINGLE' ? totalRecipeCost : (totalRecipeCost / batchSize);
    const suggestedPrice = costPerItem > 0 ? costPerItem / (1 - (desiredMargin / 100)) : 0;
    
    const itemsSold = mode === 'SINGLE' ? 1 : batchSize * batchesPerDay;
    const totalDailyRevenue = suggestedPrice * itemsSold;
    const totalDailyCost = (mode === 'SINGLE' ? totalRecipeCost : totalRecipeCost * batchesPerDay);
    const dailyProfit = totalDailyRevenue - totalDailyCost;

    return {
      totalMaterialsCost,
      totalRecipeCost,
      ingredientBreakdown,
      costPerItem,
      suggestedPrice,
      dailyProfit,
      extras
    };
  }, [recipe, pantry, pantryFormValues, mode, batchSize, batchesPerDay, desiredMargin]);

  // Función para exportar reporte a "Word" (HTML disfrazado)
  const handleExportReport = () => {
    const date = new Date().toLocaleDateString();
    
    // Construcción del HTML para el reporte
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${recipe.name} - Reporte</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; }
          h1 { color: #E11D48; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; color: #333; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .card { border: 1px solid #ccc; padding: 15px; background: #fafafa; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${recipe.name}</h1>
        <p><strong>Fecha:</strong> ${date}</p>
        <p><strong>Modo:</strong> ${mode === 'SINGLE' ? 'Individual' : `Lote (${batchSize} unids)`}</p>
        
        <div class="card">
          <h2>Resumen Financiero</h2>
          <p><strong>Costo Producción:</strong> $${calculations.costPerItem.toFixed(2)}</p>
          <p><strong>Precio Sugerido:</strong> $${calculations.suggestedPrice.toFixed(2)} (Margen ${desiredMargin}%)</p>
          <p><strong>Ganancia Estimada:</strong> $${calculations.dailyProfit.toFixed(2)}</p>
        </div>

        <h2>Desglose de Costos</h2>
        <table>
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Cantidad</th>
              <th>Costo</th>
            </tr>
          </thead>
          <tbody>
            ${calculations.ingredientBreakdown.map(ing => `
              <tr>
                <td>${ing.name}</td>
                <td>${ing.quantity} ${ing.unit}</td>
                <td>$${ing.cost.toFixed(2)}</td>
              </tr>
            `).join('')}
            ${calculations.extras > 0 ? `
              <tr>
                <td>Otros Gastos (Fijo)</td>
                <td>1</td>
                <td>$${calculations.extras.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="2">Costo Total Receta</td>
              <td>$${calculations.totalRecipeCost.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 10px; color: #888; margin-top: 20px;">Generado con HorneFin App</p>
      </body>
      </html>
    `;

    // Crear blob y descargar
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_${recipe.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // FORMULARIO DE EDICIÓN DE PRECIOS - Layout Flexbox Corregido
  if (showPantryForm) {
    return (
      <div className="fixed inset-0 z-[100] bg-stone-50 dark:bg-stone-950 flex flex-col h-[100dvh]">
        {/* Header (Fijo) */}
        <div className="flex-none bg-white dark:bg-stone-900 p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center shadow-sm">
          <h2 className="text-lg font-bold text-stone-800 dark:text-white">{t.updatePrices}</h2>
          <button onClick={() => setShowPantryForm(false)} className="text-stone-400 hover:text-stone-600">
             <Icons.Close />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm mb-4 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50">
              <p>{t.pricesInfo}</p>
            </div>
            
            <div className="space-y-4">
              {Object.values(pantryFormValues).map((item: PantryItem, idx) => (
                <div key={idx} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl p-4 shadow-sm">
                  <p className="font-bold text-lg capitalize mb-3 text-stone-800 dark:text-stone-200">{item.name}</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">{t.purchasePrice}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-stone-400">$</span>
                        <input 
                          type="number" 
                          placeholder="0.00"
                          className="w-full pl-6 p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-bold dark:text-white focus:border-rose-500 focus:outline-none"
                          value={item.price === 0 ? '' : item.price}
                          onChange={(e) => handlePantryChange(normalizeKey(item.name), 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="w-20">
                       <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">{t.qty}</label>
                       <input 
                          type="number" 
                          className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-center dark:text-white focus:border-rose-500 focus:outline-none"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => handlePantryChange(normalizeKey(item.name), 'quantity', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="w-24">
                       <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">{t.unit}</label>
                       <select 
                          className="w-full p-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:text-white focus:border-rose-500 focus:outline-none"
                          value={item.unit}
                          onChange={(e) => handlePantryChange(normalizeKey(item.name), 'unit', e.target.value)}
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

              {/* Other Expenses */}
              <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 shadow-sm mt-6 mb-4">
                 <div className="flex items-center gap-2 mb-3">
                   <Icons.Settings className="text-rose-500" size={20} />
                   <p className="font-bold text-lg text-rose-800 dark:text-rose-200">{t.otherExpenses}</p>
                 </div>
                 <p className="text-xs text-rose-600 dark:text-rose-300 mb-2">{t.otherExpensesHint}</p>
                 <div className="relative">
                    <span className="absolute left-3 top-2.5 text-rose-400 font-bold">$</span>
                    <input 
                      type="number" 
                      className="w-full pl-6 p-3 bg-white dark:bg-stone-800 border border-rose-200 dark:border-rose-900/50 rounded-lg font-bold text-lg dark:text-white focus:border-rose-500 focus:outline-none"
                      value={otherExpenses}
                      onChange={(e) => setOtherExpenses(e.target.value)}
                      placeholder="0.00"
                    />
                 </div>
              </div>
            </div>
        </div>

        {/* Footer con Botón Guardar (Fijo al fondo del modal, pero dentro del flex) */}
        <div className="flex-none p-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
          <button 
            onClick={handlePantrySubmit}
            className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-4 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Icons.Save size={22} /> {t.savePrices}
          </button>
        </div>
      </div>
    );
  }

  // VISTA DE ANÁLISIS FINANCIERO (RESUMEN)
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-28 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between border-b border-stone-100 dark:border-stone-800 no-print">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition">
           <Icons.Back className="text-stone-600 dark:text-stone-400" />
        </button>
        
        {isEditingName ? (
           <input 
              autoFocus
              className="font-bold text-stone-900 dark:text-white bg-transparent border-b border-rose-500 focus:outline-none text-center flex-1 mx-2"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
           />
        ) : (
           <h1 
              onClick={() => setIsEditingName(true)}
              className="font-bold text-stone-900 dark:text-white truncate max-w-[200px] cursor-pointer hover:text-rose-500 flex items-center gap-2"
           >
              {recipe.name} <Icons.Edit size={14} className="text-stone-300 dark:text-stone-600" />
           </h1>
        )}
        
        <div className="flex gap-2">
            <button 
                onClick={handleExportReport} 
                className="flex items-center gap-2 px-3 py-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                title="Descargar Reporte DOC"
            >
                <Icons.File size={18} />
                <span className="text-xs font-bold">{t.printPdf}</span>
            </button>
        </div>
      </div>

      <div className="p-4 space-y-6 print:space-y-4">
        
        {/* Toggle Mode */}
        <div className="bg-stone-100 dark:bg-stone-900 p-1 rounded-xl flex no-print">
          <button 
            onClick={() => setMode('SINGLE')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'SINGLE' ? 'bg-white dark:bg-stone-800 text-rose-500 shadow-sm' : 'text-stone-400 dark:text-stone-500'}`}
          >
            {t.single}
          </button>
          <button 
            onClick={() => setMode('BATCH')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'BATCH' ? 'bg-white dark:bg-stone-800 text-rose-500 shadow-sm' : 'text-stone-400 dark:text-stone-500'}`}
          >
            {t.batch}
          </button>
        </div>
        
        {/* Print Title Only */}
        <div className="hidden print:block text-center mb-4">
            <h1 className="text-2xl font-bold">{recipe.name}</h1>
            <p className="text-sm text-gray-500">Reporte Financiero - HorneFin</p>
        </div>

        {/* Configuration for Batch (RESTAURADO) */}
        {mode === 'BATCH' && (
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 space-y-3 print:border-gray-300">
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-600 dark:text-stone-300">{t.batchSize}</span>
                <input 
                  type="number" 
                  value={batchSize} 
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-20 p-1 text-right font-bold border border-stone-200 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-800 dark:text-white focus:border-rose-400 focus:outline-none"
                />
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-600 dark:text-stone-300">{t.batchesDay}</span>
                <input 
                  type="number" 
                  value={batchesPerDay} 
                  onChange={(e) => setBatchesPerDay(Number(e.target.value))}
                  className="w-20 p-1 text-right font-bold border border-stone-200 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-800 dark:text-white focus:border-rose-400 focus:outline-none"
                />
             </div>
          </div>
        )}

        {/* Main Financial Card */}
        <div className="bg-stone-900 dark:bg-stone-800 rounded-3xl p-6 text-white shadow-xl shadow-stone-300 dark:shadow-none relative overflow-hidden print:bg-white print:text-black print:border print:border-black print:shadow-none">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 blur-[60px] opacity-20 rounded-full print:hidden"></div>
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-1 print:text-black">{t.costRecipe} {mode === 'SINGLE' ? '' : t.costItem}</p>
                   <p className="text-3xl font-bold text-white print:text-black">${calculations.costPerItem.toFixed(2)}</p>
                </div>
                <div className="bg-stone-800 dark:bg-stone-700 p-2 rounded-lg no-print">
                   <Icons.Calc className="text-stone-200" />
                </div>
             </div>

             <div className="space-y-4">
                <div>
                   <div className="flex justify-between mb-1">
                     <label className="text-xs font-bold text-stone-400 uppercase print:text-black">{t.desiredMargin}</label>
                     <span className="text-xs font-bold text-rose-400 print:text-black">{desiredMargin}%</span>
                   </div>
                   <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={desiredMargin} 
                    onChange={(e) => setDesiredMargin(Number(e.target.value))}
                    className="w-full h-2 bg-stone-700 dark:bg-stone-900 rounded-lg appearance-none cursor-pointer accent-rose-500 no-print"
                   />
                </div>
                
                <div className="bg-stone-800/50 dark:bg-stone-900/50 rounded-xl p-4 border border-stone-700 dark:border-stone-600 print:bg-gray-100 print:border-gray-300">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-stone-300 print:text-black">{t.suggestedPrice}</span>
                      <span className="text-2xl font-bold text-green-400 print:text-black">${calculations.suggestedPrice.toFixed(2)}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div>
                      <p className="text-[10px] uppercase text-stone-500 font-bold print:text-black">{t.profit} {mode === 'BATCH' ? t.daily : ''}</p>
                      <p className="text-lg font-bold text-rose-300 print:text-black">${calculations.dailyProfit.toFixed(2)}</p>
                   </div>
                   <div className="text-right">
                       <p className="text-[10px] uppercase text-stone-500 font-bold print:text-black">{t.totalRevenue}</p>
                       <p className="text-lg font-bold text-white print:text-black">${(calculations.suggestedPrice * (mode === 'SINGLE' ? 1 : batchSize * batchesPerDay)).toFixed(2)}</p>
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* Breakdown */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden print:border-gray-300">
           <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800 font-bold text-stone-700 dark:text-stone-300 flex justify-between print:bg-gray-100 print:border-gray-300">
              <span className="print:text-black">{t.costBreakdown}</span>
              <span className="text-xs font-normal text-stone-400 self-center print:text-black">{t.basedOn}</span>
           </div>
           <div className="divide-y divide-stone-50 dark:divide-stone-800 print:divide-gray-200">
              {calculations.ingredientBreakdown.map((item, i) => (
                <div key={i} className="p-4 flex justify-between items-center hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                   <div>
                      <p className="font-bold text-stone-800 dark:text-stone-200 capitalize print:text-black">{item.name}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 print:text-gray-600">{item.quantity} {item.unit}</p>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-stone-900 dark:text-white print:text-black">${item.cost.toFixed(2)}</p>
                      {item.cost === 0 && <span className="text-[10px] text-red-400 font-bold print:text-red-600">{t.noPrice}</span>}
                   </div>
                </div>
              ))}
              
              {/* Other Expenses Item in Breakdown */}
              {calculations.extras > 0 && (
                 <div className="p-4 flex justify-between items-center bg-rose-50 dark:bg-rose-900/10 print:bg-gray-50">
                    <div>
                       <p className="font-bold text-rose-800 dark:text-rose-300 print:text-black">Otros Gastos</p>
                       <p className="text-xs text-rose-500 dark:text-rose-400 print:text-gray-600">Fijo</p>
                    </div>
                    <p className="font-bold text-rose-900 dark:text-rose-200 print:text-black">${calculations.extras.toFixed(2)}</p>
                 </div>
              )}

              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 flex justify-between items-center font-bold text-stone-800 dark:text-white print:bg-gray-200 print:text-black">
                 <span>{t.totalMaterials}</span>
                 <span>${calculations.totalRecipeCost.toFixed(2)}</span>
              </div>
           </div>
        </div>
        
        {/* Re-Open Edit Prices Button */}
        <button 
           onClick={() => setShowPantryForm(true)}
           className="w-full py-4 bg-white dark:bg-stone-800 text-stone-800 dark:text-white border-2 border-stone-100 dark:border-stone-700 rounded-2xl font-bold shadow-sm hover:border-amber-400 dark:hover:border-amber-500 transition-colors flex items-center justify-center gap-2 no-print"
        >
           <Icons.Money size={20} className="text-amber-500" />
           {t.editPrices}
        </button>

      </div>
    </div>
  );
};