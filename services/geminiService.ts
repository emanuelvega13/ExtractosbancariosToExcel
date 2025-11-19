import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Movement } from "../types";

const ai = new GoogleGenAI({ apiKey: meta.env.VITE_API_KEY });

const MOVEMENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    movements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fecha: { type: Type.STRING, description: "Date of transaction (e.g., '09 JUL')" },
          concepto: { type: Type.STRING, description: "Description or concept of the transaction" },
          origenReferencia: { type: Type.STRING, description: "Origin or Reference number" },
          deposito: { type: Type.NUMBER, description: "Amount deposited. 0 if empty." },
          retiro: { type: Type.NUMBER, description: "Amount withdrawn. 0 if empty." },
          saldo: { type: Type.NUMBER, description: "Balance after transaction." },
        },
        required: ["fecha", "concepto", "deposito", "retiro", "saldo"],
      },
    },
  },
};

export const extractMovementsFromImages = async (base64Images: string[]): Promise<Movement[]> => {
  let allMovements: Movement[] = [];

  // We process pages in batches or individually depending on size. 
  // For simplicity and reliability, we send all images to Gemini 2.5 Flash which has a large context window.
  // However, strict rate limits apply. If many pages, consider splitting. 
  // Here we assume typical statement length (1-5 pages).

  try {
    const parts = base64Images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    }));

    const prompt = `
      Analiza las imágenes de este estado de cuenta bancario (Scotiabank u otro similar).
      
      TAREA:
      1. Busca la tabla o sección titulada "Detalle de tus movimientos" o similar.
      2. Extrae TODAS las filas de movimientos.
      3. Ignora filas de saldos anteriores o subtotales que no sean movimientos explícitos.
      4. Normaliza los datos numéricos (quita símbolos de moneda, convierte a float).
      
      Devuelve un JSON estrictamente con la estructura solicitada.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash is excellent for document extraction
      contents: {
        parts: [...parts, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: MOVEMENT_SCHEMA,
        temperature: 0.1, // Low temperature for factual extraction
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    if (data.movements && Array.isArray(data.movements)) {
      allMovements = data.movements;
    }

    return allMovements;

  } catch (error) {
    console.error("Gemini extraction error:", error);
    throw new Error("Failed to extract data via AI.");
  }
};
