import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { Recipe, Ingredient } from '../types';
import { parseRecipeFromText, parseRecipeFromImage } from '../services/geminiService';

interface DashboardProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onAddRecipe: (recipe: Recipe) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onDownloadBackup: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  recipes, 
  onSelectRecipe, 
  onAddRecipe, 
  darkMode, 
  toggleDarkMode, 
  onDownloadBackup 
}) => {
  const [inputMode, setInputMode] = useState<'MANUAL' | 'PHOTO' | 'FILE'>('MANUAL');
  const [isProcessing, setIsProcessing] = useState(false);
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
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      let result;
      if (inputMode === 'FILE') {
        const text = await file.text();
        result = await parseRecipeFromText(text);
      } else {
        // Photo
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        result = await parseRecipeFromImage(base64);
      }

      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: result.name,
        ingredients: result.ingredients,
        imageUrl: `https://picsum.photos/seed/${result.name}/400/300`,
        createdAt: Date.now()
      };
      onAddRecipe(newRecipe);
    } catch (error) {
      alert("Error al procesar: " + error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
              HorneFin
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-xs font-medium ml-9">Gestiona tu repostería</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              title="Modo Oscuro"
            >
               {darkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
            </button>
            <button 
              onClick={onDownloadBackup}
              className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              title="Descargar Respaldo"
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
              <Icons.Edit size={14} /> Manual
            </button>
            <button 
              onClick={() => setInputMode('PHOTO')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${inputMode === 'PHOTO' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-b-2 border-rose-500' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
            >
              <Icons.Camera size={14} /> Foto
            </button>
            <button 
              onClick={() => setInputMode('FILE')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${inputMode === 'FILE' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-b-2 border-rose-500' : 'text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
            >
              <Icons.File size={14} /> TXT
            </button>
          </div>

          <div className="p-5">
            {isProcessing ? (
               <div className="text-center py-8">
                 <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                 <p className="text-stone-500 dark:text-stone-400 font-medium">Analizando Receta con IA...</p>
               </div>
            ) : (
              <>
                {inputMode === 'MANUAL' && (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Nombre de la Receta" 
                      className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 font-bold text-stone-800 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-stone-400"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                    />
                    
                    <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Ingrediente" 
                          className="flex-[2] p-2 rounded-lg border border-stone-200 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 dark:text-white placeholder-stone-400"
                          value={tempIngName}
                          onChange={(e) => setTempIngName(e.target.value)}
                        />
                        <input 
                          type="number" 
                          placeholder="Cant." 
                          className="flex-1 p-2 rounded-lg border border-stone-200 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 dark:text-white placeholder-stone-400"
                          value={tempIngQty}
                          onChange={(e) => setTempIngQty(e.target.value)}
                        />
                        <select 
                          className="w-16 p-2 rounded-lg border border-stone-200 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 dark:text-white"
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
                        </select>
                      </div>
                      <button 
                        onClick={handleAddIngredient}
                        disabled={!tempIngName || !tempIngQty}
                        className="w-full py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-bold hover:bg-stone-300 dark:hover:bg-stone-600 disabled:opacity-50 transition"
                      >
                        + Agregar
                      </button>
                    </div>

                    {/* Ingredient List Preview */}
                    {manualIngredients.length > 0 && (
                      <div className="space-y-2">
                        {manualIngredients.map((ing, i) => (
                          <div key={i} className="flex justify-between items-center text-sm p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-rose-800 dark:text-rose-300">
                             <span>{ing.name}</span>
                             <span className="font-bold">{ing.quantity}{ing.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button 
                      onClick={handleManualSave}
                      disabled={!manualName || manualIngredients.length === 0}
                      className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-600 disabled:opacity-50 transition-all"
                    >
                      Guardar Receta
                    </button>
                  </div>
                )}

                {(inputMode === 'PHOTO' || inputMode === 'FILE') && (
                  <div className="text-center py-8 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition cursor-pointer relative group">
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept={inputMode === 'PHOTO' ? "image/*" : ".txt"}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleFileUpload}
                    />
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500 group-hover:scale-110 transition-transform">
                      {inputMode === 'PHOTO' ? <Icons.Camera size={32} /> : <Icons.Upload size={32} />}
                    </div>
                    <p className="font-bold text-stone-700 dark:text-stone-300">
                      {inputMode === 'PHOTO' ? 'Toma una foto' : 'Sube un archivo .txt'}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">La IA identificará los ingredientes</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Recipe List */}
        <div>
          <h2 className="text-lg font-bold text-stone-800 dark:text-white mb-4 flex items-center gap-2">
            <Icons.Library size={20} className="text-rose-500" /> Recetas Guardadas
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
                    {recipe.ingredients.length} Ingredientes
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-full uppercase tracking-wider">Analizar Costos</span>
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
                <p className="text-stone-400 dark:text-stone-500 font-medium">Aún no hay recetas</p>
                <p className="text-stone-300 dark:text-stone-600 text-sm">Agrega una arriba para comenzar</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};