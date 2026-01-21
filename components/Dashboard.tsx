import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { Recipe, Ingredient } from '../types';

interface DashboardProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onAddRecipe: (recipe: Recipe) => void;
  onUpdateRecipe?: (recipe: Recipe) => void;
  onDeleteRecipe?: (id: string) => void;
  t: any;
}

// Helper para generar imagen SVG temática
const generateRecipeImage = (name: string) => {
  const colors = ['#FECACA', '#FED7AA', '#FDE68A', '#A7F3D0', '#BFDBFE', '#DDD6FE', '#FBCFE8'];
  const emojis = ['🎂', '🧁', '🍰', '🍪', '🍩', '🥯', '🍞', '🥐', '🥨', '🥞'];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colorIndex = Math.abs(hash) % colors.length;
  const emojiIndex = Math.abs(hash) % emojis.length;
  const bgColor = colors[colorIndex];
  const emoji = emojis[emojiIndex];

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
      <rect width="100%" height="100%" fill="${bgColor}" />
      <text x="50%" y="55%" font-size="50" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif">${emoji}</text>
    </svg>
  `;
  
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
  const [inputMode, setInputMode] = useState<'MANUAL' | 'FILE'>('MANUAL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualIngredients, setManualIngredients] = useState<Ingredient[]>([]);
  
  // Ingredient Input State
  const [tempIngName, setTempIngName] = useState('');
  const [tempIngQty, setTempIngQty] = useState('');
  const [tempIngUnit, setTempIngUnit] = useState('g');
  const [editingIngIndex, setEditingIngIndex] = useState<number | null>(null);
  
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

  const handleEditIngredientClick = (index: number) => {
    const ing = manualIngredients[index];
    setTempIngName(ing.name);
    setTempIngQty(ing.quantity.toString());
    setTempIngUnit(ing.unit);
    setEditingIngIndex(index);
  };

  const removeIngredient = (index: number) => {
    if (window.confirm(t.confirmDeleteIngredient)) {
      const newIngs = [...manualIngredients];
      newIngs.splice(index, 1);
      setManualIngredients(newIngs);
      if (editingIngIndex === index) {
        setEditingIngIndex(null);
        setTempIngName('');
        setTempIngQty('');
      }
    }
  };

  const handleManualSave = () => {
    if (manualName && manualIngredients.length > 0) {
      const newRecipe: Recipe = {
        id: editingId || Date.now().toString(),
        name: manualName,
        ingredients: manualIngredients,
        imageUrl: generateRecipeImage(manualName),
        createdAt: editingId ? (recipes.find(r => r.id === editingId)?.createdAt || Date.now()) : Date.now()
      };

      if (editingId && onUpdateRecipe) {
        onUpdateRecipe(newRecipe);
      } else {
        onAddRecipe(newRecipe);
      }

      setManualName('');
      setManualIngredients([]);
      setEditingId(null);
      setEditingIngIndex(null);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation(); 
    setManualName(recipe.name);
    setManualIngredients([...recipe.ingredients]);
    setEditingId(recipe.id);
    setInputMode('MANUAL');
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t.confirmDelete)) {
      if (onDeleteRecipe) onDeleteRecipe(id);
      if (editingId === id) {
        setManualName('');
        setManualIngredients([]);
        setEditingId(null);
      }
    }
  };

  const handleCancelEdit = () => {
    setManualName('');
    setManualIngredients([]);
    setEditingId(null);
    setEditingIngIndex(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseTxtToRecipe(text, file.name.replace('.txt', ''));
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseTxtToRecipe = (text: string, fileName: string) => {
    const lines = text.split(/\r?\n/);
    const ingredients: Ingredient[] = [];
    let detectedName = fileName;
    let nameFoundInText = false;

    const normalizeTxtUnit = (u: string) => {
      u = u.toLowerCase().trim();
      if (u.startsWith('gram')) return 'g';
      if (u.startsWith('mililitr')) return 'ml';
      if (u.startsWith('litr')) return 'l';
      if (u.startsWith('unidad')) return 'u';
      if (u.startsWith('cucharada')) return 'cda';
      if (u.startsWith('cucharita')) return 'cdita';
      if (u.startsWith('taza')) return 'taza';
      if (u.startsWith('onz')) return 'oz';
      if (u.startsWith('libr')) return 'lb';
      if (!u) return 'u';
      return u; 
    };
    
    const regexColonFormat = /^\s*-?\s*([^:]+):\s*(\d+(?:[.,]\d+)?)\s*([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)/i;
    const regexStandardFormat = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)\s+(.*)/i;

    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;
      if (cleanLine.toLowerCase().includes('ingredientes:')) return;

      const matchA = cleanLine.match(regexColonFormat);
      if (matchA) {
        ingredients.push({
          name: matchA[1].trim(),
          quantity: parseFloat(matchA[2].replace(',', '.')),
          unit: normalizeTxtUnit(matchA[3])
        });
        return;
      }

      const matchB = cleanLine.match(regexStandardFormat);
      if (matchB) {
        ingredients.push({
          quantity: parseFloat(matchB[1].replace(',', '.')),
          unit: normalizeTxtUnit(matchB[2]),
          name: matchB[3].trim()
        });
        return;
      }

      if (!nameFoundInText && index === 0 && cleanLine.length > 2) {
         detectedName = cleanLine;
         nameFoundInText = true;
      }
    });

    if (ingredients.length > 0) {
      setManualName(detectedName);
      setManualIngredients(ingredients);
      setEditingId(null); 
      setInputMode('MANUAL'); 
    } else {
      alert(t.noIngredientsDetected);
    }
  };

  return (
    <div className="pb-24 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300" ref={topRef}>
      
      <div className="p-4 space-y-6">
        
        {/* Input Section */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="flex border-b border-stone-100 dark:border-stone-800">
            <button 
              onClick={() => { setInputMode('MANUAL'); setEditingId(null); setManualName(''); setManualIngredients([]); }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${inputMode === 'MANUAL' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-b-2 border-amber-600' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
            >
              <Icons.Edit size={14} /> {t.manual}
            </button>
            <button 
              onClick={() => { setInputMode('FILE'); setEditingId(null); }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${inputMode === 'FILE' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-b-2 border-amber-600' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
            >
              <Icons.File size={14} /> {t.file}
            </button>
          </div>

          <div className="p-5">
              {inputMode === 'MANUAL' ? (
                <div className="space-y-4">
                  {editingId && (
                    <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg mb-2">
                       <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1"><Icons.Edit size={12}/> {t.editingRecipe}</span>
                       <button onClick={handleCancelEdit} className="text-xs underline text-amber-700 dark:text-amber-400">{t.cancel}</button>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">{t.recipeName}</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Pastel de Vainilla"
                      className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 font-bold text-stone-800 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-stone-400"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                    />
                  </div>
                  
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-[2]">
                        <input 
                          type="text" 
                          placeholder={t.ingredient}
                          className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500"
                          value={tempIngName}
                          onChange={(e) => setTempIngName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdateIngredient()}
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="number" 
                          placeholder={t.qty}
                          className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500"
                          value={tempIngQty}
                          onChange={(e) => setTempIngQty(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdateIngredient()}
                        />
                      </div>
                      <div className="w-16">
                        <select 
                          className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 dark:text-white focus:outline-none focus:border-amber-500"
                          value={tempIngUnit}
                          onChange={(e) => setTempIngUnit(e.target.value)}
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="lb">lb</option>
                          <option value="oz">oz</option>
                          <option value="u">u</option>
                          <option value="cda">cda</option>
                          <option value="cdita">cdita</option>
                          <option value="taza">taza</option>
                          <option value="file">file (30u)</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={handleAddOrUpdateIngredient}
                      disabled={!tempIngName || !tempIngQty}
                      className={`w-full py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 ${editingIngIndex !== null ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'}`}
                    >
                      {editingIngIndex !== null ? t.update : t.add}
                    </button>
                  </div>

                  {/* Ingredient List Preview */}
                  {manualIngredients.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {manualIngredients.map((ing, i) => (
                        <div 
                           key={i} 
                           onClick={() => handleEditIngredientClick(i)}
                           className={`flex justify-between items-center text-sm p-2 rounded-lg border cursor-pointer transition ${editingIngIndex === i ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700' : 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/30'}`}
                        >
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-amber-600 dark:text-amber-400">{ing.quantity}{ing.unit}</span>
                             <span className="text-stone-700 dark:text-stone-300 capitalize">{ing.name}</span>
                             {editingIngIndex === i && <span className="text-[10px] bg-amber-200 text-amber-800 px-1 rounded ml-2">{t.editing}</span>}
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); removeIngredient(i); }} 
                             className="text-stone-400 hover:text-red-500 p-1"
                           >
                             <Icons.Trash size={14} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={handleManualSave}
                    disabled={!manualName || manualIngredients.length === 0}
                    className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-200 dark:shadow-none hover:bg-amber-700 disabled:opacity-50 transition-all"
                  >
                    {editingId ? t.updateRecipe : t.saveRecipe}
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-center py-12 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition cursor-pointer relative group"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600 group-hover:scale-110 transition-transform">
                    <Icons.Upload size={32} />
                  </div>
                  <p className="font-bold text-stone-700 dark:text-stone-300">
                    {t.uploadFile}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 max-w-[200px] mx-auto leading-relaxed">
                    {t.flexibleFormats}<br/>
                    <span className="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-1 rounded">- Ingrediente: 200 g</span><br/>
                    <span className="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-1 rounded">200 g Ingrediente</span>
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Recipe List */}
        <div>
          <h2 className="text-lg font-bold text-stone-800 dark:text-white mb-4 flex items-center gap-2">
            <Icons.Library size={20} className="text-amber-600" /> {t.savedRecipes}
          </h2>
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <div 
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className="bg-white dark:bg-stone-900 p-3 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900 transition group relative"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                  <img src={recipe.imageUrl || generateRecipeImage(recipe.name)} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h3 className="font-bold text-stone-900 dark:text-white truncate text-base">{recipe.name}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    {recipe.ingredients.length} {t.ingredientsCount}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                       <Icons.Calc size={10} /> {t.analyzeCosts}
                     </span>
                  </div>
                </div>
                
                {/* Action Buttons for Edit/Delete */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={(e) => handleStartEdit(e, recipe)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400 transition"
                    title={t.edit}
                  >
                    <Icons.Edit size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteClick(e, recipe.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition"
                    title={t.delete}
                  >
                    <Icons.Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
            {recipes.length === 0 && (
              <div className="text-center py-10 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 border-dashed">
                <div className="w-16 h-16 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-300 dark:text-stone-600">
                   <Icons.Chef size={32} />
                </div>
                <p className="text-stone-400 dark:text-stone-500 font-medium">{t.noRecipes}</p>
                <p className="text-stone-300 dark:text-stone-600 text-sm">{t.addRecipeHint}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};