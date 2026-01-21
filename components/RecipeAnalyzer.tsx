import React, { useState, useCallback } from 'react';
import { Icons } from './Icons';
import { parseRecipeFromText } from '../services/geminiService';
import { Ingredient, Recipe } from '../types';

interface RecipeAnalyzerProps {
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

export const RecipeAnalyzer: React.FC<RecipeAnalyzerProps> = ({ onSave, onCancel }) => {
  const [step, setStep] = useState<'INPUT' | 'ANALYZING' | 'PRICING' | 'SUMMARY'>('INPUT');
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState<{ name: string; ingredients: Ingredient[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Costing State
  const [laborHours, setLaborHours] = useState(1);
  const [hourlyRate, setHourlyRate] = useState(15); // Default €15/hr
  const [overheadPercent, setOverheadPercent] = useState(20); // 20% overhead
  const [desiredMargin, setDesiredMargin] = useState(30); // 30% profit

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setStep('ANALYZING');
    setError(null);
    
    try {
      const result = await parseRecipeFromText(inputText);
      setParsedData(result);
      setStep('PRICING');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStep('INPUT');
    }
  };

  const updateIngredientCost = (index: number, field: 'purchasePrice' | 'purchaseUnitQuantity', value: number) => {
    if (!parsedData) return;
    
    const updatedIngredients = [...parsedData.ingredients];
    const item = updatedIngredients[index];
    
    if (field === 'purchasePrice') item.purchasePrice = value;
    if (field === 'purchaseUnitQuantity') item.purchaseUnitQuantity = value;

    // Calculate actual cost for recipe amount
    // Formula: (Quantity Needed / Quantity Purchased) * Price Purchased
    if (item.purchasePrice && item.purchaseUnitQuantity && item.purchaseUnitQuantity > 0) {
      item.cost = (item.quantity / item.purchaseUnitQuantity) * item.purchasePrice;
    }

    setParsedData({ ...parsedData, ingredients: updatedIngredients });
  };

  const calculateTotals = useCallback(() => {
    if (!parsedData) return { totalMaterials: 0, totalLabor: 0, overhead: 0, total: 0, price: 0 };

    const totalMaterials = parsedData.ingredients.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const totalLabor = laborHours * hourlyRate;
    const overhead = (totalMaterials + totalLabor) * (overheadPercent / 100);
    const totalCost = totalMaterials + totalLabor + overhead;
    
    // Price calculation based on margin: Price = Cost / (1 - Margin%)
    const suggestedPrice = totalCost / (1 - (desiredMargin / 100));

    return { totalMaterials, totalLabor, overhead, total: totalCost, suggestedPrice };
  }, [parsedData, laborHours, hourlyRate, overheadPercent, desiredMargin]);

  const handleFinalSave = () => {
    if (!parsedData) return;
    const totals = calculateTotals();
    
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: parsedData.name,
      ingredients: parsedData.ingredients,
      laborCost: totals.totalLabor,
      overheadPercentage: overheadPercent,
      totalCost: totals.total,
      suggestedPrice: totals.suggestedPrice,
      profitMargin: desiredMargin,
      // Random visually appealing bakery image from picsum
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/500`, 
      createdAt: Date.now()
    };
    onSave(newRecipe);
  };

  const totals = calculateTotals();

  // --- RENDER STEPS ---

  if (step === 'INPUT') {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
            <Icons.Back size={24} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-bold">Nueva Receta</h2>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Pega tu receta aquí
          </label>
          <textarea
            className="w-full flex-1 p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 resize-none text-base placeholder-gray-400 bg-gray-50"
            placeholder="Ejemplo: 500g harina de trigo, 300ml agua, 10g sal, 5g levadura..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          <button
            onClick={handleAnalyze}
            disabled={!inputText.trim()}
            className="mt-6 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Icons.Chef size={20} />
            Analizar Ingredientes
          </button>
        </div>
      </div>
    );
  }

  if (step === 'ANALYZING') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white p-8 text-center">
        <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Analizando Receta...</h3>
        <p className="text-gray-500">Nuestra IA está detectando ingredientes y cantidades.</p>
      </div>
    );
  }

  if (step === 'PRICING') {
    return (
      <div className="flex flex-col h-full bg-gray-50 pb-24">
         <div className="p-4 bg-white border-b flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <button onClick={() => setStep('INPUT')} className="p-2 hover:bg-gray-100 rounded-full">
            <Icons.Back size={20} className="text-gray-600" />
          </button>
          <h2 className="text-base font-bold truncate max-w-[200px]">{parsedData?.name}</h2>
          <div className="w-10"></div> 
        </div>

        <div className="p-4 space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
            <span className="font-bold">✨ IA Detectada:</span> Ingresa el precio de compra del paquete para calcular el costo exacto de la porción.
          </div>

          <div className="space-y-4">
            {parsedData?.ingredients.map((ing, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg capitalize">{ing.name}</h4>
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                       Necesario: {ing.quantity} {ing.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-gray-400 uppercase font-bold">Costo Real</span>
                    <span className="text-lg font-bold text-gray-900">€{ing.cost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Precio Compra (€)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                      placeholder="0.00"
                      onChange={(e) => updateIngredientCost(idx, 'purchasePrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Cant. Paquete ({ing.unit})</label>
                    <input 
                      type="number" 
                      className="w-full p-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                      placeholder="e.g. 1000"
                      defaultValue={ing.unit === 'kg' || ing.unit === 'l' ? 1 : 1000} // Smart default guess
                      onChange={(e) => updateIngredientCost(idx, 'purchaseUnitQuantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Operational Costs */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mt-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icons.Settings size={18} className="text-gray-400"/> Costos Operativos
            </h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Tiempo de Trabajo (Horas)</label>
                  <input type="number" value={laborHours} onChange={e => setLaborHours(Number(e.target.value))} className="w-20 p-2 border rounded-lg text-right font-bold"/>
               </div>
               <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Tarifa por Hora (€)</label>
                  <input type="number" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} className="w-20 p-2 border rounded-lg text-right font-bold"/>
               </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Gastos Generales (%)</label>
                  <input type="number" value={overheadPercent} onChange={e => setOverheadPercent(Number(e.target.value))} className="w-20 p-2 border rounded-lg text-right font-bold"/>
               </div>
                <div className="flex items-center justify-between pt-4 border-t border-dashed">
                  <label className="text-sm text-blue-600 font-bold">Margen Deseado (%)</label>
                  <input type="number" value={desiredMargin} onChange={e => setDesiredMargin(Number(e.target.value))} className="w-20 p-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-right font-bold"/>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Total Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-2xl flex items-center justify-between z-20">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Costo Total</p>
              <p className="text-xl font-bold text-gray-900">€{totals.total.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => setStep('SUMMARY')}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition"
            >
              Ver Resumen <Icons.Up size={16} className="rotate-90"/>
            </button>
        </div>
      </div>
    );
  }

  if (step === 'SUMMARY') {
    return (
      <div className="flex flex-col h-full bg-white pb-6">
        <div className="relative h-64 bg-gray-200">
           <img src={`https://picsum.photos/seed/${Date.now()}/600/400`} className="w-full h-full object-cover" alt="Recipe" />
           <button onClick={() => setStep('PRICING')} className="absolute top-4 left-4 bg-white/80 p-2 rounded-full backdrop-blur-sm">
              <Icons.Back size={20} />
           </button>
        </div>
        
        <div className="-mt-8 bg-white rounded-t-3xl p-6 relative flex-1">
           <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
           
           <h1 className="text-2xl font-bold text-gray-900 mb-2">{parsedData?.name}</h1>
           <p className="text-gray-500 mb-6 flex items-center gap-2 text-sm">
             <span className="w-2 h-2 rounded-full bg-green-500"></span>
             Listo para producción
           </p>

           <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-2xl">
                 <p className="text-xs text-gray-500 font-bold uppercase mb-1">Costo Producción</p>
                 <p className="text-2xl font-bold text-gray-900">€{totals.total.toFixed(2)}</p>
              </div>
              <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200">
                 <p className="text-xs text-blue-200 font-bold uppercase mb-1">Precio Sugerido</p>
                 <p className="text-2xl font-bold">€{totals.suggestedPrice.toFixed(2)}</p>
              </div>
           </div>

           <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Materiales</span>
                <span className="font-bold">€{totals.totalMaterials.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Mano de Obra</span>
                <span className="font-bold">€{totals.totalLabor.toFixed(2)}</span>
              </div>
               <div className="flex justify-between text-sm text-gray-600">
                <span>Gastos Generales</span>
                <span className="font-bold">€{totals.overhead.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-base font-bold text-green-600">
                <span>Ganancia Estimada</span>
                <span>€{(totals.suggestedPrice - totals.total).toFixed(2)}</span>
              </div>
           </div>

           <button 
             onClick={handleFinalSave}
             className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition flex items-center justify-center gap-2"
           >
             <Icons.Save size={20} />
             Guardar Receta
           </button>
        </div>
      </div>
    );
  }

  return null;
};