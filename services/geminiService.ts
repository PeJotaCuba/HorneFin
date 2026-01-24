// Este servicio ha sido actualizado para funcionar localmente sin depender de Google Gemini AI.
// Utiliza análisis de texto heurístico para extraer ingredientes.

const normalizeUnit = (rawUnit: string): string => {
  const u = rawUnit.toLowerCase().trim().replace('.', '');
  
  if (['g', 'gr', 'grs', 'gramo', 'gramos'].includes(u)) return 'g';
  if (['kg', 'kilo', 'kilos', 'kilogramo'].includes(u)) return 'kg';
  if (['ml', 'mililitro', 'mililitros'].includes(u)) return 'ml';
  if (['l', 'lt', 'litro', 'litros'].includes(u)) return 'l';
  if (['lb', 'lbs', 'libra', 'libras'].includes(u)) return 'lb';
  if (['oz', 'onza', 'onzas'].includes(u)) return 'oz';
  if (['cda', 'cdas', 'cucharada', 'cucharadas', 'tbsp'].includes(u)) return 'cda';
  if (['cdita', 'cditas', 'cucharadita', 'cucharaditas', 'tsp'].includes(u)) return 'cdita';
  if (['taza', 'tazas', 'cup', 'cups'].includes(u)) return 'taza';
  if (['u', 'unidad', 'unidades', 'pieza', 'piezas', 'ud', 'uds', 'huevo', 'huevos'].includes(u)) return 'u';
  
  return u; // Retornar tal cual si no se reconoce
};

// Parsea cantidades fraccionarias (1/2) o decimales (1.5, 1,5)
const parseQuantity = (qtyStr: string): number => {
  if (qtyStr.includes('/')) {
    const [num, den] = qtyStr.split('/');
    return parseFloat(num) / parseFloat(den);
  }
  return parseFloat(qtyStr.replace(',', '.'));
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const parseRecipeFromText = async (text: string): Promise<any> => {
  // Simular una pequeña espera para UX (opcional)
  await new Promise(resolve => setTimeout(resolve, 500));

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) return null;

  // 1. Extraer el Nombre (Asumimos que es la primera línea)
  // Limpiamos viñetas comunes si existen
  let name = lines[0].replace(/^[\·\-\*]\s*/, '').trim();
  
  // Si la primera linea termina en dos puntos, quítalos
  if (name.endsWith(':')) name = name.slice(0, -1);

  // 2. Extraer Ingredientes
  const ingredients: any[] = [];
  
  // Empezamos desde la segunda línea, o la primera si no parece un título (heurística simple)
  const startIdx = 1;

  for (let i = startIdx; i < lines.length; i++) {
    let line = lines[i];
    
    // Ignorar líneas que parecen instrucciones largas o vacías
    if (line.length > 150) continue; 
    
    // Limpieza inicial de la línea (eliminar viñetas ·, -, *)
    let cleanLine = line.replace(/^[\·\-\*]\s*/, '').trim();

    // LÓGICA DE DETECCIÓN
    let foundName = '';
    let foundQty = 0;
    let foundUnit = 'u'; // Default unit

    // Regex para buscar patrones de cantidad y unidad
    // Busca números (enteros, decimales, fracciones) seguidos opcionalmente de texto (unidad)
    // Ejemplo match: "1 kg", "100 g", "2 unidades", "1/2 taza"
    const qtyRegex = /(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*([a-zA-Záéíóúñ]+)/i;
    
    // ESTRATEGIA A: Formato "Ingrediente - Cantidad Unidad" (Ej: Harina - 1 kg)
    if (cleanLine.includes('-')) {
      const parts = cleanLine.split('-');
      // Asumimos que la parte con el número es la cantidad
      const rightSide = parts[parts.length - 1].trim(); // Lo que está después del último guión
      const leftSide = parts.slice(0, parts.length - 1).join('-').trim(); // Lo que está antes

      const match = rightSide.match(qtyRegex);
      if (match) {
        foundQty = parseQuantity(match[1]);
        foundUnit = normalizeUnit(match[2]);
        foundName = leftSide;
      } else {
        // Quizás solo es un número sin unidad clara (ej: Huevos - 2)
        const numMatch = rightSide.match(/(\d+(?:[.,]\d+)?)/);
        if (numMatch) {
            foundQty = parseQuantity(numMatch[1]);
            foundUnit = 'u';
            foundName = leftSide;
        }
      }
    } 
    
    // ESTRATEGIA B: Formato "Cantidad Unidad de Ingrediente" (Ej: 1 kg de Harina)
    if (!foundName) {
        const matchStart = cleanLine.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*([a-zA-Záéíóúñ]+)?/);
        if (matchStart) {
            foundQty = parseQuantity(matchStart[1]);
            foundUnit = matchStart[2] ? normalizeUnit(matchStart[2]) : 'u';
            
            // El resto del string es el nombre
            let remainder = cleanLine.substring(matchStart[0].length).trim();
            // Quitar preposiciones comunes como "de"
            remainder = remainder.replace(/^(de\s+)/i, '');
            foundName = remainder;
        }
    }

    // ESTRATEGIA C: Fallback, buscar cualquier número en la línea
    if (!foundName && !foundQty) {
        const anyNum = cleanLine.match(/(\d+(?:[.,]\d+)?)/);
        if (anyNum) {
            foundQty = parseQuantity(anyNum[1]);
            // Intentar adivinar unidad basándonos en palabras cercanas, o default 'u'
            if (cleanLine.match(/\b(g|kg|ml|l|taza|cda)\b/i)) {
                // Extracción simple de unidad si está presente
                const uMatch = cleanLine.match(/\b(g|gr|kg|ml|l|taza|cda|cdita)\b/i);
                if (uMatch) foundUnit = normalizeUnit(uMatch[0]);
            }
            // El nombre es la línea completa quitando el número
            foundName = cleanLine.replace(anyNum[0], '').replace(/\b(g|kg|ml|l)\b/i, '').trim();
        }
    }

    if (foundName && foundQty > 0) {
        // Limpieza final del nombre
        // Eliminar paréntesis extras si quedaron solos
        foundName = foundName.replace(/^\(/, '').replace(/\)$/, '').trim();
        
        ingredients.push({
            name: capitalize(foundName),
            quantity: foundQty,
            unit: foundUnit
        });
    }
  }

  return {
    name: capitalize(name),
    ingredients: ingredients
  };
};

export const parseRecipeFromImage = async (base64Image: string): Promise<any> => {
  // Función deshabilitada para cumplir con la restricción de no usar IA externa.
  // En una versión futura se podría integrar OCR local (Tesseract.js), 
  // pero para mantener la app ligera y sin dependencias externas pesadas, retornamos error.
  throw new Error("El análisis de imágenes requiere servicios en la nube que han sido deshabilitados. Por favor utiliza el modo Texto o Manual.");
};
