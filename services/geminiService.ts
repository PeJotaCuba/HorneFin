import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Implemented parseRecipeFromText using Gemini AI with structured JSON output via responseSchema.
export const parseRecipeFromText = async (text: string): Promise<any> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse the following recipe text and extract the name and a list of ingredients. 
    Each ingredient should have a name, quantity (as a number), and unit. 
    If a unit is unclear, use 'u' (units), 'g' (grams), or 'ml' (milliliters) as appropriate.
    
    Text: ${text}`,
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

// Fix: Implemented parseRecipeFromImage using Gemini AI vision capabilities with structured output.
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
