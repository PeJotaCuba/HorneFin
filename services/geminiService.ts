import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Parse unstructured recipe text using Gemini AI
export const parseRecipeFromText = async (text: string): Promise<any> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an expert baker assistant. Your task is to extract a structured recipe from the following raw text. 
    The text might contain ingredient lists with various formats (e.g., "Ingredient - Quantity", "Quantity Unit Ingredient", "1 cup of...", etc.) and may optionally include a title or instructions.

    Rules:
    1. Extract the **Recipe Name** if present. If not found, use a generic name based on the ingredients (e.g., "Pastry Recipe").
    2. Extract a list of **Ingredients**.
    3. For each ingredient, extract:
       - **name**: The name of the item (e.g., "Flour", "Sugar"). Capitalize the first letter.
       - **quantity**: A number. Convert fractions (1/2) to decimals (0.5). If a range is given, use the average. If no quantity is specified, use 0.
       - **unit**: The unit of measurement (e.g., "g", "kg", "ml", "l", "taza", "cda", "cdita", "u"). 
         - Normalize units: "cup"/"tazas" -> "taza", "tbsp"/"cucharada" -> "cda", "tsp"/"cucharadita" -> "cdita", "pcs"/"unidades" -> "u".
         - If the unit is "pizca", "puñado" or similar imprecise terms, map it to "u" or a small weight in "g" if appropriate, or leave as is if you can't determine.
    4. Ignore preparation steps or instructions. Focus only on the materials needed.
    5. If there are multiple sections (e.g., "Dough", "Filling"), combine all ingredients into a single flat list.

    Raw Text:
    """
    ${text}
    """`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING }
              },
              required: ["name", "quantity", "unit"]
            }
          }
        },
        required: ["name", "ingredients"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Could not parse recipe data from the provided text.");
  }
};

// Parse recipe from image
export const parseRecipeFromImage = async (base64Image: string): Promise<any> => {
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        imagePart,
        { text: "Analyze this image and extract the recipe name and ingredients. Return the data in JSON format with 'name' and 'ingredients' (each ingredient must have 'name', 'quantity', and 'unit')." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING }
              },
              required: ["name", "quantity", "unit"]
            }
          }
        },
        required: ["name", "ingredients"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Could not parse recipe data from the image.");
  }
};
