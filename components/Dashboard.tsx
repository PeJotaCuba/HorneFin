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
    ],
    notes: "Batir la mantequilla con el azúcar hasta que esté cremosa. Agregar los huevos uno a uno, batiendo bien después de cada adición. Cernir la harina con el polvo de hornear. Incorporar los ingredientes secos a la mezcla alternando con la leche y la vainilla. Verter en un molde engrasado y hornear a 180°C durante 30-40 minutos o hasta que al insertar un palillo salga limpio."
  },
  {
    name: "Pan Cubano",
    ingredients: [
      { name: "Harina todo uso sin blanquear", quantity: 4, unit: "taza" },
      { name: "Azúcar", quantity: 4, unit: "cdita" },
      { name: "Sal", quantity: 2, unit: "cdita" },
      { name: "Levadura seca activa", quantity: 2.25, unit: "cdita" },
      { name: "Mantequilla o manteca", quantity: 4, unit: "cda" },
      { name: "Agua", quantity: 1.25, unit: "taza" }
    ],
    notes: "Mezcla harina, azúcar, sal y levadura. Agrega mantequilla y agua para formar una masa. Amasa hasta suave y elástica. Deja fermentar hasta doblar volumen. Divide, forma barras y realiza cortes superficiales. Fermenta nuevamente. Hornea hasta dorado."
  },
  {
    name: "Gaceñiga",
    ingredients: [
      { name: "Harina", quantity: 2, unit: "taza" },
      { name: "Huevos", quantity: 5, unit: "u" },
      { name: "Azúcar", quantity: 1, unit: "taza" },
      { name: "Mantequilla (derretida)", quantity: 0.5, unit: "taza" },
      { name: "Leche", quantity: 0.5, unit: "taza" },
      { name: "Vainilla", quantity: 1, unit: "cdita" },
      { name: "Polvo de hornear", quantity: 1, unit: "cdita" },
      { name: "Bicarbonato", quantity: 1, unit: "cdita" },
      { name: "Sal", quantity: 1, unit: "pizca" },
      { name: "Pasas", quantity: 50, unit: "g" }
    ],
    notes: "Bate huevos con azúcar hasta esponjar. Incorpora mantequilla derretida, leche y vainilla. Añade harina, polvo de hornear, bicarbonato y sal premezclados. Agrega pasas. Vierte en molde y hornea."
  },
  {
    name: "Marquesitas Cubanas",
    ingredients: [
      { name: "Harina", quantity: 1, unit: "taza" },
      { name: "Huevos", quantity: 10, unit: "u" },
      { name: "Azúcar", quantity: 2, unit: "taza" },
      { name: "Dulce de guayaba (barrita)", quantity: 1, unit: "u" },
      { name: "Vainilla", quantity: 1, unit: "cda" },
      { name: "Polvo de hornear", quantity: 1, unit: "cdita" },
      { name: "Sal", quantity: 1, unit: "pizca" }
    ],
    notes: "Bate huevos con azúcar hasta triplicar volumen. Agrega vainilla. Incorpora harina y polvo de hornear con movimientos envolventes. Hornea en lámina delgada. Corta en rectángulos, rellena con dulce de guayaba y cubre con merengue."
  },
  {
    name: "Panetela de Piña",
    ingredients: [
      { name: "Harina de pan", quantity: 2, unit: "taza" },
      { name: "Dulce de piña (lata)", quantity: 1, unit: "u" },
      { name: "Huevos", quantity: 4, unit: "u" },
      { name: "Leche", quantity: 1, unit: "taza" },
      { name: "Azúcar", quantity: 1, unit: "taza" },
      { name: "Mantequilla", quantity: 0.5, unit: "taza" },
      { name: "Vainilla", quantity: 1, unit: "cdita" },
      { name: "Polvo de hornear", quantity: 1, unit: "cdita" },
      { name: "Sal", quantity: 1, unit: "cdita" }
    ],
    notes: "Bate mantequilla con azúcar. Añade huevos uno a uno. Incorpora harina con polvo de hornear y sal alternando con leche y vainilla. Agrega dulce de piña picado. Hornea."
  },
  {
    name: "Crema Frita",
    ingredients: [
      { name: "Harina de trigo", quantity: 2, unit: "taza" },
      { name: "Leche", quantity: 500, unit: "ml" },
      { name: "Huevos", quantity: 8, unit: "u" },
      { name: "Azúcar", quantity: 6, unit: "cda" },
      { name: "Mantequilla", quantity: 1, unit: "cda" },
      { name: "Galletas molidas", quantity: 2, unit: "u" },
      { name: "Limón", quantity: 1, unit: "u" },
      { name: "Aceite para freír", quantity: 250, unit: "ml" },
      { name: "Sal", quantity: 1, unit: "pizca" }
    ],
    notes: "Hierve leche con azúcar, mantequilla, ralladura de limón y sal. Añade harina removiendo rápido hasta espesar. Vierte en molde, enfría y corta en porciones. Pasa por huevo batido y galletas molida. Fríe hasta dorar."
  },
  {
    name: "Buñuelos de Viento",
    ingredients: [
      { name: "Harina de pan", quantity: 0.5, unit: "lb" },
      { name: "Huevos", quantity: 3, unit: "u" },
      { name: "Azúcar (masa)", quantity: 2, unit: "cda" },
      { name: "Azúcar (almíbar)", quantity: 1, unit: "lb" },
      { name: "Mantequilla", quantity: 1, unit: "cda" },
      { name: "Agua (masa)", quantity: 500, unit: "ml" },
      { name: "Agua (almíbar)", quantity: 2, unit: "taza" },
      { name: "Aceite para freír", quantity: 250, unit: "ml" }
    ],
    notes: "Hierve agua con mantequilla y sal. Añade la harina de golpe removiendo hasta formar una bola. Enfría, añade huevos uno a uno. Forma bolitas y fríe en aceite caliente hasta inflar. Baña en almíbar."
  },
  {
    name: "Leche Frita",
    ingredients: [
      { name: "Harina de trigo", quantity: 4, unit: "cda" },
      { name: "Leche", quantity: 1, unit: "l" }, 
      { name: "Pan rallado", quantity: 12, unit: "cda" },
      { name: "Mantequilla", quantity: 4, unit: "cda" },
      { name: "Azúcar", quantity: 6, unit: "cda" },
      { name: "Huevo", quantity: 1, unit: "u" },
      { name: "Galletas molidas", quantity: 2, unit: "u" },
      { name: "Aceite para freír", quantity: 250, unit: "ml" }
    ],
    notes: "Hierve leche con azúcar y mantequilla. Mezcla harina con un poco de leche fría y añade a la leche caliente removiendo hasta espesar. Vierte en molde, enfría y corta en cuadros. Empaniza con pan rallado y huevo. Fríe."
  },
  {
    name: "Turrón de Doña Pepa",
    ingredients: [
      { name: "Harina de trigo", quantity: 460, unit: "g" },
      { name: "Mantequilla", quantity: 55, unit: "g" },
      { name: "Aceite o manteca", quantity: 55, unit: "g" },
      { name: "Ajonjolí", quantity: 2, unit: "cda" },
      { name: "Maní", quantity: 0.25, unit: "taza" },
      { name: "Anís", quantity: 1, unit: "cdita" },
      { name: "Azúcar", quantity: 460, unit: "g" },
      { name: "Naranja", quantity: 1, unit: "u" },
      { name: "Piña (rodajas)", quantity: 2, unit: "u" },
      { name: "Canela", quantity: 1, unit: "u" },
      { name: "Clavo de olor", quantity: 1, unit: "u" },
      { name: "Limones", quantity: 4, unit: "u" },
      { name: "Agua", quantity: 0.25, unit: "taza" }
    ],
    notes: "Mezcla harina con manteca, aceite, ajonjolí, maní y anís hasta arenosa. Forma bastones y hornea. Para la miel: hierve todos los ingredientes hasta punto de hebra medio. Baña los bastones con la miel caliente y apila."
  },
  {
    name: "Buñuelos de Navidad",
    ingredients: [
      { name: "Harina de pan", quantity: 250, unit: "g" },
      { name: "Yuca pequeña", quantity: 1, unit: "u" },
      { name: "Malanga", quantity: 1, unit: "u" },
      { name: "Boniato/Bonito pequeño", quantity: 1, unit: "u" },
      { name: "Huevo", quantity: 1, unit: "u" },
      { name: "Vino", quantity: 0.25, unit: "taza" },
      { name: "Anís", quantity: 5, unit: "g" },
      { name: "Azúcar", quantity: 300, unit: "g" },
      { name: "Aceite", quantity: 0.5, unit: "taza" },
      { name: "Agua", quantity: 0.5, unit: "taza" },
      { name: "Canela", quantity: 1, unit: "u" },
      { name: "Limón", quantity: 1, unit: "u" }
    ],
    notes: "Cocina y maja la yuca, malanga y boniató. Mezcla con harina, huevo, vino y anís. Amasa, forma \"ochos\" y fríe. Prepara un almíbar espeso con azúcar, agua, canela y limón. Baña los buñuelos calientes."
  },
  {
    name: "Panetela Borracha",
    ingredients: [
      { name: "Maicena", quantity: 95, unit: "g" },
      { name: "Harina todo uso", quantity: 20, unit: "g" },
      { name: "Yemas de huevo", quantity: 12, unit: "u" },
      { name: "Huevo entero", quantity: 1, unit: "u" },
      { name: "Azúcar (masa)", quantity: 55, unit: "g" },
      { name: "Azúcar (almíbar)", quantity: 2, unit: "taza" },
      { name: "Agua", quantity: 1, unit: "taza" },
      { name: "Ron blanco", quantity: 0.25, unit: "taza" },
      { name: "Limón (cáscara)", quantity: 0.5, unit: "u" },
      { name: "Vainilla", quantity: 4, unit: "cdita" },
      { name: "Sal", quantity: 0.5, unit: "cdita" }
    ],
    notes: "Bate yemas, huevo, azúcar y vainilla hasta claros. Incorpora maicena y harina. Hornea en molde rectangular. Prepara almíbar hirviendo agua, azúcar, cáscara de limón y vainilla. Retira del fuego, añade ron. Empapa el bizcocho frío con el almíbar."
  }
];

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
  const [isParsing, setIsParsing] = useState(false);
  
  const [tempIngName, setTempIngName] = useState('');
  const [tempIngQty, setTempIngQty] = useState('');
  const [tempIngUnit, setTempIngUnit] = useState('g');
  const [editingIngIndex, setEditingIngIndex] = useState<number | null>(null);
  const [showNotesModal, setShowNotesModal] = useState<Recipe | null>(null);
  
  const topRef = useRef<HTMLDivElement>(null);

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
      alert("Error al analizar el texto. Intenta usar un formato más claro o ingresa manualmente.");
      console.error(e);
    } finally {
      setIsParsing(false);
    }
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
                  <input type="text" placeholder={t.ingredient} className="flex-grow min-w-0 p-2 rounded-lg border text-sm dark:bg-stone-700 dark:text-white" value={tempIngName} onChange={e => setTempIngName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOrUpdateIngredient()} />
                  <input type="number" placeholder={t.qty} className="w-20 flex-shrink-0 p-2 rounded-lg border text-sm dark:bg-stone-700 dark:text-white" value={tempIngQty} onChange={e => setTempIngQty(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOrUpdateIngredient()} />
                  <select className="w-24 flex-shrink-0 p-2 rounded-lg border text-sm dark:bg-stone-700 dark:text-white" value={tempIngUnit} onChange={e => setTempIngUnit(e.target.value)}>
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
                <button onClick={parseWithGemini} disabled={!inputText.trim() || isParsing} className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                   {isParsing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Icons.Chef size={20} />}
                   {t.analyzeCosts}
                </button>
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
              <div key={recipe.id} onClick={() => onSelectRecipe(recipe)} className="bg-white dark:bg-stone-900 p-3 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 flex gap-4 cursor-pointer hover:border-amber-200 transition group relative overflow-hidden">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0"><img src={recipe.imageUrl || generateRecipeImage(recipe.name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={recipe.name} /></div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                      <h3 className="font-bold text-stone-900 dark:text-white truncate text-base">{recipe.name}</h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mb-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${recipe.mode === 'BATCH' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                        {recipe.ingredients.length} {t.ingredientsCount} • {recipe.mode === 'BATCH' ? `${t.batchMode} (${recipe.batchSize}u)` : t.singleMode}
                      </p>
                  </div>

                  <div className="flex items-center gap-2 mt-auto">
                    <button onClick={(e) => handleShare(e, recipe)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-green-600 transition" title={t.share}><Icons.Share size={16}/></button>
                    <button onClick={(e) => handleShowNotes(e, recipe)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-blue-500 transition" title={t.notes}><Icons.Help size={16}/></button>
                    
                    <div className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1"></div>
                    
                    <button onClick={(e) => handleStartEdit(e, recipe)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-amber-600 transition" title={t.edit}><Icons.Edit size={16} /></button>
                    <button onClick={(e) => {e.stopPropagation(); if(confirm(t.confirmDelete)) onDeleteRecipe?.(recipe.id); }} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-red-500 transition" title={t.delete}><Icons.Trash size={16} /></button>
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
                <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">{showNotesModal.notes || "No hay notas de elaboración guardadas para esta receta."}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};