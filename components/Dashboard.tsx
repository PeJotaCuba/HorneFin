import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { Recipe, Ingredient, ProductionMode } from '../types';

interface DashboardProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onAddRecipe: (recipe: Recipe) => void;
  onUpdateRecipe?: (recipe: Recipe) => void;
  onDeleteRecipe?: (id: string) => void;
  onDuplicateRecipe?: (recipe: Recipe, multiplier?: number) => void;
  baseRecipes?: any[];
  onAddToBase?: (recipe: Recipe) => void;
  onUpdateBaseFromURL?: () => void;
  t: any;
}

// Recetas Preestablecidas removidas, ahora vienen por props


const generateRecipeImage = (name: string) => {
  const n = name.toLowerCase();
  
  let emoji = '🧁'; 
  if (n.includes('panetela') || n.includes('bizcocho')) emoji = '🍰';
  else if (n.includes('galleta')) emoji = '🍪';
  else if (n.includes('pan')) emoji = '🍞';
  else if (n.includes('gaceñiga')) emoji = '🍞';
  else if (n.includes('marquesitas')) emoji = '🥮';
  else if (n.includes('piña')) emoji = '🍍';
  else if (n.includes('turrón')) emoji = '🍬';
  else if (n.includes('buñuelos')) emoji = '🥯';
  else if (n.includes('frita')) emoji = '🥘';
  else if (n.includes('leche')) emoji = '🥛';
  else if (n.includes('chocolate')) emoji = '🍫';

  const colors = ['#FECACA', '#FED7AA', '#FDE68A', '#A7F3D0', '#BFDBFE', '#DDD6FE', '#FBCFE8'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colorIndex = Math.abs(hash) % colors.length;
  const bgColor = colors[colorIndex];
  
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="${bgColor}" /><text x="50%" y="55%" font-size="50" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif">${emoji}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  recipes, 
  onSelectRecipe, 
  onAddRecipe, 
  onUpdateRecipe,
  onDeleteRecipe,
  onDuplicateRecipe,
  baseRecipes = [],
  onAddToBase,
  onUpdateBaseFromURL,
  t
}) => {
  const [inputMode, setInputMode] = useState<'MANUAL' | 'TEXT' | 'PRESETS'>('MANUAL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualIngredients, setManualIngredients] = useState<Ingredient[]>([]);
  const [productionMode, setProductionMode] = useState<ProductionMode>('SINGLE');
  // Change batchSize type to allow empty string for input placeholder logic
  const [batchSize, setBatchSize] = useState<number | ''>(''); 
  const [notes, setNotes] = useState('');
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  const [tempIngName, setTempIngName] = useState('');
  const [tempIngQty, setTempIngQty] = useState('');
  const [tempIngUnit, setTempIngUnit] = useState('g');
  const [editingIngIndex, setEditingIngIndex] = useState<number | null>(null);
  const [showNotesModal, setShowNotesModal] = useState<Recipe | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('bottom');
  
  const topRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>, recipeId: string) => {
    e.stopPropagation();
    if (activeMenuId === recipeId) {
      setActiveMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Estimate menu height ~ 320px
      if (spaceBelow < 320) {
        setMenuPosition('top');
      } else {
        setMenuPosition('bottom');
      }
      setActiveMenuId(recipeId);
    }
  };

  const handleDownloadBase = () => {
    const data = JSON.stringify(baseRecipes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const parseWithGemini = async () => {
    setIsParsing(true);
    try {
      const { parseRecipeFromText } = await import('../services/geminiService');
      const result = await parseRecipeFromText(inputText);
      
      if (result) {
        setManualName(result.name || "Nueva Receta");
        setManualIngredients(result.ingredients || []);
        setInputMode('MANUAL');
        setInputText('');
      }
    } catch (e) {
      alert(t.errorParsing);
      console.error(e);
    } finally {
      setIsParsing(false);
    }
  };

  const handleEditIngredient = (index: number) => {
    const ing = manualIngredients[index];
    setTempIngName(ing.name);
    setTempIngQty(ing.quantity.toString());
    setTempIngUnit(ing.unit);
    setEditingIngIndex(index);
  };

  const handleCancelEditIngredient = () => {
    setTempIngName('');
    setTempIngQty('');
    setTempIngUnit('g');
    setEditingIngIndex(null);
  };

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
      // Ensure batchSize has a valid number for the recipe object
      const finalBatchSize = (batchSize === '' || batchSize <= 0) ? 1 : batchSize;

      const recipeToSave: Recipe = {
        id: editingId || Date.now().toString(),
        name: manualName,
        ingredients: manualIngredients,
        imageUrl: generateRecipeImage(manualName),
        createdAt: editingId ? (recipes.find(r => r.id === editingId)?.createdAt || Date.now()) : Date.now(),
        mode: productionMode,
        batchSize: productionMode === 'BATCH' ? finalBatchSize : 1,
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
      setBatchSize('');
      setProductionMode('SINGLE');
      handleCancelEditIngredient();
    }
  };

  const handleStartEdit = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation(); 
    setManualName(recipe.name);
    setManualIngredients([...recipe.ingredients]);
    setEditingId(recipe.id);
    setNotes(recipe.notes || '');
    setProductionMode(recipe.mode || 'SINGLE');
    setBatchSize(recipe.batchSize || '');
    setInputMode('MANUAL');
    handleCancelEditIngredient();
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

  const addPreset = (preset: any) => {
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: preset.name,
      ingredients: preset.ingredients,
      imageUrl: generateRecipeImage(preset.name),
      createdAt: Date.now(),
      mode: 'SINGLE',
      batchSize: 1,
      profitMargin: 25,
      notes: preset.notes
    };
    onAddRecipe(newRecipe);
    alert(t.presetAdded);
  };

  return (
    <div className="pb-8 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300" ref={topRef}>
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
                     <input 
                       type="number" 
                       placeholder="1"
                       className="w-full p-2 bg-stone-50 dark:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-600 dark:text-white placeholder-stone-300 dark:placeholder-stone-600" 
                       value={batchSize} 
                       onChange={e => setBatchSize(e.target.value === '' ? '' : parseInt(e.target.value))} 
                     />
                   </div>
                )}

                <div className="flex gap-2">
                  <input type="text" placeholder={t.ingredient} className="flex-grow min-w-0 p-2 rounded-lg border text-sm dark:bg-stone-700 dark:text-white" value={tempIngName} onChange={e => setTempIngName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOrUpdateIngredient()} />
                  <input type="number" placeholder={t.qty} className="w-20 flex-shrink-0 p-2 rounded-lg border text-sm dark:bg-stone-700 dark:text-white" value={tempIngQty} onChange={e => setTempIngQty(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOrUpdateIngredient()} />
                  <select className="w-24 flex-shrink-0 p-2 rounded-lg border text-sm dark:bg-stone-700 dark:text-white" value={tempIngUnit} onChange={e => setTempIngUnit(e.target.value)}>
                    <option value="g">g</option><option value="kg">kg</option><option value="oz">oz</option><option value="ml">ml</option><option value="l">l</option><option value="u">u</option><option value="cda">cda</option><option value="cdita">cdita</option><option value="taza">taza</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                   <button onClick={handleAddOrUpdateIngredient} className="flex-grow py-2 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-300 transition">{editingIngIndex !== null ? t.update : t.add}</button>
                   {editingIngIndex !== null && (
                       <button onClick={handleCancelEditIngredient} className="w-12 py-2 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center justify-center" title={t.cancel}>
                           <Icons.Close size={18} />
                       </button>
                   )}
                </div>
                
                {manualIngredients.length > 0 && (
                   <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                     {manualIngredients.map((ing, i) => (
                       <div key={i} className={`flex justify-between items-center text-xs p-2 rounded-lg border transition-colors ${editingIngIndex === i ? 'bg-amber-100 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}>
                          <span className="font-bold text-stone-700 dark:text-stone-300">{ing.quantity}{ing.unit} <span className="capitalize font-normal ml-1">{ing.name}</span></span>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditIngredient(i)} className="text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-800 p-1 rounded transition-colors" title={t.edit}><Icons.Edit size={14}/></button>
                            <button onClick={() => {
                                const newList = manualIngredients.filter((_, idx) => idx !== i);
                                setManualIngredients(newList);
                                if (editingIngIndex === i) handleCancelEditIngredient();
                                else if (editingIngIndex !== null && i < editingIngIndex) setEditingIngIndex(editingIngIndex - 1);
                            }} className="text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 p-1 rounded transition-colors" title={t.delete}><Icons.Trash size={14}/></button>
                          </div>
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
                <button onClick={parseWithGemini} disabled={!inputText.trim() || isParsing} className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                   {isParsing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Icons.Chef size={20} />}
                   {t.analyzeCosts}
                </button>
                <p className="text-[10px] text-stone-400 text-center italic">{t.flexibleFormats}</p>
              </div>
            )}
            {inputMode === 'PRESETS' && (
              <div className="space-y-3">
                <div className="flex gap-2 mb-4">
                    <button onClick={handleDownloadBase} className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center justify-center gap-2">
                        <Icons.Download size={14} /> {t.downloadBase}
                    </button>
                    <button onClick={onUpdateBaseFromURL} className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center justify-center gap-2">
                        <Icons.UploadDB size={14} /> {t.updateBase}
                    </button>
                </div>
                {baseRecipes.map((p, i) => (
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
              <div key={recipe.id} onClick={() => onSelectRecipe(recipe)} className="bg-white dark:bg-stone-900 p-3 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 flex gap-4 cursor-pointer hover:border-amber-200 transition group relative overflow-visible">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0"><img src={recipe.imageUrl || generateRecipeImage(recipe.name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={recipe.name} /></div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="pr-8">
                      <h3 className="font-bold text-stone-900 dark:text-white truncate text-base">{recipe.name}</h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mb-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${recipe.mode === 'BATCH' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                        {recipe.ingredients.length} {t.ingredientsCount} • {recipe.mode === 'BATCH' ? `${t.batchMode} (${recipe.batchSize}u)` : t.singleMode}
                      </p>
                  </div>

                  {/* Menu Trigger */}
                  <div className="absolute top-3 right-3">
                      <button 
                        onClick={(e) => handleMenuToggle(e, recipe.id)}
                        className="p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                      >
                        <Icons.More size={20} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === recipe.id && (
                        <div className={`absolute right-0 ${menuPosition === 'top' ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-1 origin-top-right'} w-48 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-100 dark:border-stone-800 z-50 overflow-hidden animate-in fade-in zoom-in-95`}>
                            <button onClick={(e) => { e.stopPropagation(); handleShare(e, recipe); setActiveMenuId(null); }} className="w-full text-left px-4 py-3 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3">
                                <Icons.Share size={16} className="text-green-500"/> {t.share}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleShowNotes(e, recipe); setActiveMenuId(null); }} className="w-full text-left px-4 py-3 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3">
                                <Icons.Help size={16} className="text-blue-500"/> {t.notes}
                            </button>
                            <div className="w-full px-4 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 dark:bg-stone-800/50 flex items-center gap-2">
                                <Icons.Copy size={12} className="text-purple-500"/> {t.duplicate}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onDuplicateRecipe?.(recipe, 1); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3 pl-8">
                                {t.similar}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDuplicateRecipe?.(recipe, 2); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3 pl-8">
                                {t.double}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDuplicateRecipe?.(recipe, 0.5); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3 pl-8">
                                {t.half}
                            </button>
                            <div className="h-px bg-stone-100 dark:bg-stone-800 my-1"></div>
                            <button onClick={(e) => { e.stopPropagation(); onAddToBase?.(recipe); setActiveMenuId(null); }} className="w-full text-left px-4 py-3 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3">
                                <Icons.UploadDB size={16} className="text-green-600"/> {t.addToBase}
                            </button>
                            <div className="h-px bg-stone-100 dark:bg-stone-800 my-1"></div>
                            <button onClick={(e) => { handleStartEdit(e, recipe); setActiveMenuId(null); }} className="w-full text-left px-4 py-3 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-3">
                                <Icons.Edit size={16} className="text-amber-500"/> {t.edit}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); if(confirm(t.confirmDelete)) onDeleteRecipe?.(recipe.id); setActiveMenuId(null); }} className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3">
                                <Icons.Trash size={16}/> {t.delete}
                            </button>
                        </div>
                      )}
                  </div>
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
                <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">{showNotesModal.notes || t.noNotes}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};