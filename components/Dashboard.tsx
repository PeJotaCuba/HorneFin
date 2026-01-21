import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { Recipe, Ingredient } from '../types';
import { Language } from '../utils/translations';

interface DashboardProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onAddRecipe: (recipe: Recipe) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onDownloadBackup: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  recipes, 
  onSelectRecipe, 
  onAddRecipe, 
  darkMode, 
  toggleDarkMode, 
  onDownloadBackup,
  language,
  setLanguage,
  t
}) => {
  const [inputMode, setInputMode] = useState<'MANUAL' | 'FILE'>('MANUAL');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual Form State
  const [manualName, setManualName] = useState('');
  const [manualIngredients, setManualIngredients] = useState<Ingredient[]>([]);
  const [tempIngName, setTempIngName] = useState('');
  const [tempIngQty, setTempIngQty] = useState('');
  const [tempIngUnit, setTempIngUnit] = useState('g');

  const handleAddIngredient = () => {
    if (tempIngName && tempIngQty) {
      setManualIngredients([
        ...manualIngredients,
        { name: tempIngName, quantity: parseFloat(tempIngQty), unit: tempIngUnit }
      ]);
      setTempIngName('');
      setTempIngQty('');
    }
  };

  const removeIngredient = (index: number) => {
    const newIngs = [...manualIngredients];
    newIngs.splice(index, 1);
    setManualIngredients(newIngs);
  };

  const handleManualSave = () => {
    if (manualName && manualIngredients.length > 0) {
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: manualName,
        ingredients: manualIngredients,
        imageUrl: `https://picsum.photos/seed/${manualName}/400/300`,
        createdAt: Date.now()
      };
      onAddRecipe(newRecipe);
      setManualName('');
      setManualIngredients([]);
      // Stay in manual mode to see result or add another
    }
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

  // Improved Local Regex Parser
  const parseTxtToRecipe = (text: string, fileName: string) => {
    const lines = text.split(/\r?\n/);
    const ingredients: Ingredient[] = [];
    let detectedName = fileName;
    let nameFoundInText = false;

    // Helper to normalize units from text (e.g., "gramos" -> "g")
    const normalizeTxtUnit = (u: string) => {
      u = u.toLowerCase().trim();
      if (u.startsWith('gram')) return 'g';
      if (u.startsWith('mililitr')) return 'ml';
      if (u.startsWith('litr')) return 'l';
      if (u.startsWith('unidad')) return 'u';
      if (u.startsWith('cucharada')) return 'cda'; // Spoon
      if (u.startsWith('cucharita')) return 'cdita'; // Teaspoon
      if (u.startsWith('taza')) return 'taza'; // Cup
      if (u.startsWith('onz')) return 'oz';
      if (u.startsWith('libr')) return 'lb';
      if (!u) return 'u';
      return u; // Return as is if short (e.g. 'g', 'ml')
    };
    
    // Regex Strategy 1: "Name: Quantity Unit" (e.g., "- Azúcar: 200 gramos")
    // Matches: Optional dash, Name (before colon), Colon, Number, Word (Unit)
    const regexColonFormat = /^\s*-?\s*([^:]+):\s*(\d+(?:[.,]\d+)?)\s*([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)/i;

    // Regex Strategy 2: "Quantity Unit Name" (e.g., "500 g Harina")
    // Matches: Number, Word (Unit), Rest (Name)
    const regexStandardFormat = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)\s+(.*)/i;

    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;
      
      // Skip headers
      if (cleanLine.toLowerCase().includes('ingredientes:')) return;

      // Try Strategy 1 (Colon format)
      const matchA = cleanLine.match(regexColonFormat);
      if (matchA) {
        ingredients.push({
          name: matchA[1].trim(), // Name is first
          quantity: parseFloat(matchA[2].replace(',', '.')),
          unit: normalizeTxtUnit(matchA[3])
        });
        return;
      }

      // Try Strategy 2 (Standard format)
      const matchB = cleanLine.match(regexStandardFormat);
      if (matchB) {
        ingredients.push({
          quantity: parseFloat(matchB[1].replace(',', '.')),
          unit: normalizeTxtUnit(matchB[2]),
          name: matchB[3].trim()
        });
        return;
      }

      // If line didn't match an ingredient, and it's the very first line, assume it's the Title
      if (!nameFoundInText && index === 0 && cleanLine.length > 2) {
         detectedName = cleanLine;
         nameFoundInText = true;
      }
    });

    if (ingredients.length > 0) {
      setManualName(detectedName);
      setManualIngredients(ingredients);
      setInputMode('MANUAL'); // Switch to manual to review
      // Optional: alert(`Importado: ${detectedName} con ${ingredients.length} ingredientes.`);
    } else {
      alert("No se pudieron detectar ingredientes. Formatos soportados:\n1. '- Ingrediente: 200 g'\n2. '200 g Ingrediente'");
    }
  };

  const availableLanguages: Language[] = ['ES', 'EN', 'PT'];

  return (
    <div className="pb-24 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 shadow-sm sticky top-0 z-20 border-b border-stone-100 dark:border-stone-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2 tracking-tight">
              <span className="bg-rose-500 text-white p-1.5 rounded-lg">
                <Icons.Chef size={20} />
              </span>
              {t.appTitle}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-xs font-medium ml-9">{t.appSubtitle}</p>
          </div>
          <div className="flex gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center justify-center font-bold text-xs w-9 h-9"
              >
                 {language}
              </button>
              {showLangMenu && (
                <div className="absolute top-10 right-0 bg-white dark:bg-stone-800 shadow-xl rounded-xl border border-stone-100 dark:border-stone-700 overflow-hidden w-24 z-50">
                   {availableLanguages.map(lang => (
                     <button
                       key={lang}
                       onClick={() => { setLanguage(lang); setShowLangMenu(false); }}
                       className={`w-full text-left px-4 py-2 text-sm font-bold transition ${language === lang ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                     >
                       {lang === 'ES' && 'Español'}
                       {lang === 'EN' && 'English'}
                       {lang === 'PT' && 'Português'}
                     </button>
                   ))}
                </div>
              )}
            </div>

            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              title={t.darkMode}
            >
               {darkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
            </button>
            <button 
              onClick={onDownloadBackup}
              className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              title={t.downloadBackup}
            >
               <Icons.Download size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Input Section */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="flex border-b border-stone-100 dark:border-stone-800">
            <button 
              onClick={() => setInputMode('MANUAL')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${inputMode === 'MANUAL' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-b-2 border-rose-500' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
            >
              <Icons.Edit size={14} /> {t.manual}
            </button>
            <button 
              onClick={() => setInputMode('FILE')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${inputMode === 'FILE' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-b-2 border-rose-500' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
            >
              <Icons.File size={14} /> {t.file}
            </button>
          </div>

          <div className="p-5">
              {inputMode === 'MANUAL' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">{t.recipeName}</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Pastel de Vainilla"
                      className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 font-bold text-stone-800 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-stone-400"
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
                          className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 dark:text-white placeholder-stone-400 focus:outline-none focus:border-rose-500"
                          value={tempIngName}
                          onChange={(e) => setTempIngName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="number" 
                          placeholder={t.qty}
                          className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 dark:text-white placeholder-stone-400 focus:outline-none focus:border-rose-500"
                          value={tempIngQty}
                          onChange={(e) => setTempIngQty(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                        />
                      </div>
                      <div className="w-16">
                        <select 
                          className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 dark:text-white focus:outline-none focus:border-rose-500"
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
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={handleAddIngredient}
                      disabled={!tempIngName || !tempIngQty}
                      className="w-full py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-bold hover:bg-stone-300 dark:hover:bg-stone-600 disabled:opacity-50 transition"
                    >
                      {t.add}
                    </button>
                  </div>

                  {/* Ingredient List Preview */}
                  {manualIngredients.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {manualIngredients.map((ing, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg border border-rose-100 dark:border-rose-900/50">
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-rose-600 dark:text-rose-400">{ing.quantity}{ing.unit}</span>
                             <span className="text-stone-700 dark:text-stone-300 capitalize">{ing.name}</span>
                           </div>
                           <button onClick={() => removeIngredient(i)} className="text-stone-400 hover:text-red-500 p-1">
                             <Icons.Trash size={14} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={handleManualSave}
                    disabled={!manualName || manualIngredients.length === 0}
                    className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-600 disabled:opacity-50 transition-all"
                  >
                    {t.saveRecipe}
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-center py-12 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition cursor-pointer relative group"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500 group-hover:scale-110 transition-transform">
                    <Icons.Upload size={32} />
                  </div>
                  <p className="font-bold text-stone-700 dark:text-stone-300">
                    {t.uploadFile}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 max-w-[200px] mx-auto leading-relaxed">
                    Soporta formatos flexibles:<br/>
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
            <Icons.Library size={20} className="text-rose-500" /> {t.savedRecipes}
          </h2>
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <div 
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className="bg-white dark:bg-stone-900 p-3 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-rose-200 dark:hover:border-rose-900 transition group"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                  <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-stone-900 dark:text-white truncate text-base">{recipe.name}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    {recipe.ingredients.length} {t.ingredientsCount}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-full uppercase tracking-wider">{t.analyzeCosts}</span>
                  </div>
                </div>
                <div className="text-stone-300 dark:text-stone-600">
                    <Icons.Back className="rotate-180" size={20} />
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