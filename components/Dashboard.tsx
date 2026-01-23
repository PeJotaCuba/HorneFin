import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { Recipe, Ingredient, ProductionMode } from '../types';

interface DashboardProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onAddRecipe: (recipe: Recipe) => void;
  onUpdateRecipe?: (recipe: Recipe) => void;
  onDeleteRecipe?: (id: string) => void;
  t: any;
}

// Recetas Preestablecidas
const PRESET_RECIPES = [
  {
    name: "Bizcocho de Vainilla",
    ingredients: [
      { name: "Harina de Trigo", quantity: 250, unit: "g" },
      { name: "Azúcar", quantity: 200, unit: "g" },
      { name: "Huevos", quantity: 4, unit: "u" },
      { name: "Leche", quantity: 120, unit: "ml" },
      { name: "Mantequilla", quantity: 100, unit: "g" },
      { name: "Polvo de hornear", quantity: 10, unit: "g" }
    ]
  },
  {
    name: "Galletas Chispas Chocolate",
    ingredients: [
      { name: "Harina", quantity: 300, unit: "g" },
      { name: "Azúcar Mascabado", quantity: 150, unit: "g" },
      { name: "Mantequilla", quantity: 150, unit: "g" },
      { name: "Chispas de Chocolate", quantity: 150, unit: "g" },
      { name: "Huevo", quantity: 1, unit: "u" }
    ]
  },
  {
    name: "Pan de Molde Blanco",
    ingredients: [
      { name: "Harina de Fuerza", quantity: 500, unit: "g" },
      { name: "Agua", quantity: 300, unit: "ml" },
      { name: "Sal", quantity: 10, unit: "g" },
      { name: "Levadura Seca", quantity: 7, unit: "g" },
      { name: "Aceite", quantity: 30, unit: "ml" }
    ]
  }
];

const generateRecipeImage = (name: string) => {
  const colors = ['#FECACA', '#FED7AA', '#FDE68A', '#A7F3D0', '#BFDBFE', '#DDD6FE', '#FBCFE8'];
  const emojis = ['🎂', '🧁', '🍰', '🍪', '🍩', '🥯', '🍞', '🥐', '🥨', '🥞'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colorIndex = Math.abs(hash) % colors.length;
  const emojiIndex = Math.abs(hash) % emojis.length;
  const bgColor = colors[colorIndex];
  const emoji = emojis[emojiIndex];
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="${bgColor}" /><text x="50%" y="55%" font-size="50" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif">${emoji}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  recipes, 
  onSelectRecipe, 
  onAddRecipe, 
  onUpdateRecipe,
  onDeleteRecipe,
  t
}) => {
  const [inputMode, setInputMode] = useState<'MANUAL' | 'TEXT' | 'PRESETS'>('MANUAL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualIngredients, setManualIngredients] = useState<Ingredient[]>([]);
  const [productionMode, setProductionMode] = useState<ProductionMode>('SINGLE');
  const [batchSize, setBatchSize] = useState(1);
  const [notes, setNotes] = useState('');
  const [inputText, setInputText] = useState('');
  
  const [tempIngName, setTempIngName] = useState('');
  const [tempIngQty, setTempIngQty] = useState('');
  const [tempIngUnit, setTempIngUnit] = useState('g');
  const [editingIngIndex, setEditingIngIndex] = useState<number | null>(null);
  const [showNotesModal, setShowNotesModal] = useState<Recipe | null>(null);
  
  const topRef = useRef<HTMLDivElement>(null);

  const handleAddOrUpdateIngredient = () => {
    if (tempIngName && tempIngQty) {
      const newIng = { name: tempIngName, quantity: parseFloat(tempIngQty), unit: tempIngUnit };
      if (editingIngIndex !== null) {
        const updatedList = [...manualIngredients];
        updatedList[editingIngIndex] = newIng;
        setManualIngredients(updatedList);
        setEditingIngIndex(null);
      } else {
        setManualIngredients([...manualIngredients, newIng]);
      }
      setTempIngName('');
      setTempIngQty('');
      setTempIngUnit('g');
    }
  };

  const handleManualSave = () => {
    if (manualName && manualIngredients.length > 0) {
      const recipeToSave: Recipe = {
        id: editingId || Date.now().toString(),
        name: manualName,
        ingredients: manualIngredients,
        imageUrl: generateRecipeImage(manualName),
        createdAt: editingId ? (recipes.find(r => r.id === editingId)?.createdAt || Date.now()) : Date.now(),
        mode: productionMode,
        batchSize: productionMode === 'BATCH' ? batchSize : 1,
        notes: notes,
        profitMargin: editingId ? (recipes.find(r => r.id === editingId)?.profitMargin || 25) : 25
      };

      if (editingId && onUpdateRecipe) {
        onUpdateRecipe(recipeToSave);
      } else {
        onAddRecipe(recipeToSave);
      }

      setManualName('');
      setManualIngredients([]);
      setEditingId(null);
      setNotes('');
      setBatchSize(1);
      setProductionMode('SINGLE');
    }
  };

  const handleStartEdit = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation(); 
    setManualName(recipe.name);
    setManualIngredients([...recipe.ingredients]);
    setEditingId(recipe.id);
    setNotes(recipe.notes || '');
    setProductionMode(recipe.mode || 'SINGLE');
    setBatchSize(recipe.batchSize || 1);
    setInputMode('MANUAL');
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShare = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    const text = `*HorneFin - ${recipe.name}*\n\nIngredientes:\n${recipe.ingredients.map(i => `- ${i.name}: ${i.quantity}${i.unit}`).join('\n')}\n\nNotas:\n${recipe.notes || 'Sin notas'}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShowNotes = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    setShowNotesModal(recipe);
  };

  const parseFromText = () => {
    const lines = inputText.split('\n');
    const ingredients: Ingredient[] = [];
    
    // Regex flexible para: "Cantidad Unidad Ingrediente" o "Ingrediente: Cantidad Unidad"
    const regex = /(-?\d+[.,]?\d*)\s*([a-zA-Záéíóúñ]+)?\s+(.+)/i;
    const regexReverse = /(.+):\s*(-?\d+[.,]?\d*)\s*([a-zA-Záéíóúñ]+)?/i;

    lines.forEach(line => {
      let m = line.match(regex);
      if (m) {
        ingredients.push({
          name: m[3].trim(),
          quantity: parseFloat(m[1].replace(',', '.')),
          unit: m[2] || 'u'
        });
      } else {
        m = line.match(regexReverse);
        if (m) {
          ingredients.push({
            name: m[1].trim(),
            quantity: parseFloat(m[2].replace(',', '.')),
            unit: m[3] || 'u'
          });
        }
      }
    });

    if (ingredients.length > 0) {
      setManualIngredients(prev => [...prev, ...ingredients]);
      setInputMode('MANUAL');
      setInputText('');
    } else {
      alert(t.noIngredientsDetected);
    }
  };

  const addPreset = (preset: any) => {
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: preset.name,
      ingredients: preset.ingredients,
      imageUrl: generateRecipeImage(preset.name),
      createdAt: Date.now(),
      mode: 'SINGLE',
      batchSize: 1,
      profitMargin: 25
    };
    onAddRecipe(newRecipe);
    alert(`${t.appTitle}: ${t.presets} añadida`);
  };

  return (
    <div className="pb-24 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300" ref={topRef}>
      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="flex border-b border-stone-100 dark:border-stone-800">
            <button onClick={() => setInputMode('MANUAL')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide transition-colors ${inputMode === 'MANUAL' ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600' : 'text-stone-400 hover:bg-stone-50'}`}>{t.manual}</button>
            <button onClick={() => setInputMode('TEXT')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide transition-colors ${inputMode === 'TEXT' ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600' : 'text-stone-400 hover:bg-stone-50'}`}>{t.textInput}</button>
            <button onClick={() => setInputMode('PRESETS')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide transition-colors ${inputMode === 'PRESETS' ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600' : 'text-stone-400 hover:bg-stone-50'}`}>{t.presets}</button>
          </div>

          <div className="p-5">
            {inputMode === 'MANUAL' && (
              <div className="space-y-4">
                <input type="text" placeholder={t.recipeName} className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 font-bold dark:text-white" value={manualName} onChange={e => setManualName(e.target.value)} />
                
                <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex gap-1">
                   <button onClick={() => setProductionMode('SINGLE')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${productionMode === 'SINGLE' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-200'}`}>{t.singleMode}</button>
                   <button onClick={() => setProductionMode('BATCH')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${productionMode === 'BATCH' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-200'}`}>{t.batchMode}</button>
                </div>

                {productionMode === 'BATCH' && (
                   <div className="animate-in fade-in slide-in-from-top-1">
                     <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">{t.batchSize}</label>
                     <input type="number" className="w-full p-2 bg-stone-50 dark:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-600 dark:text-white" value={batchSize} onChange={e => setBatchSize(parseInt(e.target.value) || 1)} />
                   </div>
                )}

                <div className="flex gap-2">
                  <input type="text" placeholder={t.ingredient} className="flex-[2] p-2 rounded-lg border text-sm dark:bg-stone-700 dark:text-white" value={tempIngName} onChange={e => setTempIngName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOrUpdateIngredient()} />
                  <input type="number" placeholder={t.qty} className="flex-1 p-2 rounded-lg border text-sm dark:bg-stone-700 dark:text-white" value={tempIngQty} onChange={e => setTempIngQty(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOrUpdateIngredient()} />
                  <select className="w-16 p-2 rounded-lg border text-sm dark:bg-stone-700 dark:text-white" value={tempIngUnit} onChange={e => setTempIngUnit(e.target.value)}>
                    <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="l">l</option><option value="u">u</option><option value="cda">cda</option><option value="cdita">cdita</option><option value="taza">taza</option>
                  </select>
                </div>
                <button onClick={handleAddOrUpdateIngredient} className="w-full py-2 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-300 transition">{editingIngIndex !== null ? t.update : t.add}</button>
                
                {manualIngredients.length > 0 && (
                   <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                     {manualIngredients.map((ing, i) => (
                       <div key={i} className="flex justify-between items-center text-xs p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                          <span className="font-bold text-stone-700 dark:text-stone-300">{ing.quantity}{ing.unit} <span className="capitalize font-normal ml-1">{ing.name}</span></span>
                          <button onClick={() => setManualIngredients(manualIngredients.filter((_, idx) => idx !== i))} className="text-red-400 p-1"><Icons.Close size={14}/></button>
                       </div>
                     ))}
                   </div>
                )}

                <textarea placeholder={t.notesPlaceholder} className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border dark:border-stone-700 text-sm dark:text-white" rows={2} value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                <button onClick={handleManualSave} disabled={!manualName || manualIngredients.length === 0} className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold shadow-lg hover:bg-amber-700 disabled:opacity-50 transition-all">{editingId ? t.updateRecipe : t.saveRecipe}</button>
              </div>
            )}
            {inputMode === 'TEXT' && (
              <div className="space-y-4">
                <textarea placeholder={t.pasteRecipeHint} className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 min-h-[150px] dark:text-white focus:outline-none focus:border-amber-500" value={inputText} onChange={e => setInputText(e.target.value)}></textarea>
                <button onClick={parseFromText} disabled={!inputText.trim()} className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-all">{t.analyzeCosts}</button>
                <p className="text-[10px] text-stone-400 text-center italic">{t.flexibleFormats}</p>
              </div>
            )}
            {inputMode === 'PRESETS' && (
              <div className="space-y-3">
                {PRESET_RECIPES.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 group hover:border-amber-300 transition-colors">
                    <span className="font-bold text-stone-700 dark:text-stone-200">{p.name}</span>
                    <button onClick={() => addPreset(p)} className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition">{t.select}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-stone-800 dark:text-white mb-4 flex items-center gap-2"><Icons.Library size={20} className="text-amber-600" /> {t.savedRecipes}</h2>
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <div key={recipe.id} onClick={() => onSelectRecipe(recipe)} className="bg-white dark:bg-stone-900 p-3 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 flex items-center gap-4 cursor-pointer hover:border-amber-200 transition group relative overflow-hidden">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0"><img src={recipe.imageUrl || generateRecipeImage(recipe.name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={recipe.name} /></div>
                <div className="flex-1 min-w-0 pr-10">
                  <h3 className="font-bold text-stone-900 dark:text-white truncate text-base">{recipe.name}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${recipe.mode === 'BATCH' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                    {recipe.ingredients.length} {t.ingredientsCount} • {recipe.mode === 'BATCH' ? `${t.batchMode} (${recipe.batchSize}u)` : t.singleMode}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => handleShare(e, recipe)} className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-500 hover:text-green-500 transition" title={t.share}><Icons.Globe size={14}/></button>
                    <button onClick={(e) => handleShowNotes(e, recipe)} className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-500 hover:text-blue-500 transition" title={t.notes}><Icons.Help size={14}/></button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                  <button onClick={(e) => handleStartEdit(e, recipe)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition" title={t.edit}><Icons.Edit size={16} /></button>
                  <button onClick={(e) => {e.stopPropagation(); if(confirm(t.confirmDelete)) onDeleteRecipe?.(recipe.id); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition" title={t.delete}><Icons.Trash size={16} /></button>
                </div>
              </div>
            ))}
            {recipes.length === 0 && (
              <div className="text-center py-10 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 border-dashed">
                <p className="text-stone-400">{t.noRecipes}</p>
                <p className="text-stone-300 text-sm">{t.addRecipeHint}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNotesModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
              <button onClick={() => setShowNotesModal(null)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"><Icons.Close size={24}/></button>
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl"><Icons.Help size={24}/></div>
                 <h3 className="font-bold text-stone-900 dark:text-white leading-tight">{t.notes}:<br/><span className="text-amber-600 text-sm">{showNotesModal.name}</span></h3>
              </div>
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">{showNotesModal.notes || "No hay notas de elaboración guardadas para esta receta."}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};