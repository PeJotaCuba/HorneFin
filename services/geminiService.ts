import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    recipeName: { type: Type.STRING, description: "The name of the recipe" },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the ingredient (normalized, lowercase, e.g., 'harina')" },
          quantity: { type: Type.NUMBER, description: "Numeric quantity" },
          unit: { type: Type.STRING, description: "Unit of measurement (e.g., g, ml, kg, lb)" }
        },
        required: ["name", "quantity", "unit"]
      }
    }
  },
  required: ["recipeName", "ingredients"]
};

export const parseRecipeFromText = async (text: string): Promise<{ name: string; ingredients: Ingredient[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract recipe details. Normalize ingredient names to simple spanish terms (e.g., use 'harina' instead of 'harina de trigo marca x').
      
      Recipe Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      name: result.recipeName || "Receta Nueva",
      ingredients: result.ingredients || []
    };
  } catch (error) {
    console.error("Gemini Text Error:", error);
    throw new Error("No se pudo leer la receta.");
  }
};

export const parseRecipeFromImage = async (base64Image: string): Promise<{ name: string; ingredients: Ingredient[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Extract the recipe name and ingredients from this image. Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      name: result.recipeName || "Receta Escaneada",
      ingredients: result.ingredients || []
    };
  } catch (error) {
    console.error("Gemini Image Error:", error);
    throw new Error("No se pudo analizar la imagen.");
  }
};