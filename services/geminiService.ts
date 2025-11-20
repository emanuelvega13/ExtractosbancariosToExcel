import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Movement } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });

const MOVEMENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    movements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          num: { type: Type.STRING, description: "Número de movimiento consecutivo (ej. 1, 2...)" },
          fecha: { type: Type.STRING, description: "Fecha de operación (ej. '09/07')." },
          descripcion: { type: Type.STRING, description: "Descripción detallada del movimiento." },
          suc: { type: Type.STRING, description: "Número o nombre de sucursal (Suc)." },
          refNumerica: { type: Type.STRING, description: "Referencia Numérica." },
          refAlfanumerica: { type: Type.STRING, description: "Referencia Alfanumérica." },
          autorizacion: { type: Type.STRING, description: "Número de autorización." },
          ordenante: { type: Type.STRING, description: "Nombre del ordenante." },
          bancoEmisor: { type: Type.STRING, description: "Banco emisor." },
          depositos: { type: Type.NUMBER, description: "Monto del depósito. 0 si está vacío." },
          retiros: { type: Type.NUMBER, description: "Monto del retiro. 0 si está vacío." },
          saldoMxn: { type: Type.NUMBER, description: "Saldo en MXN después del movimiento." },
        },
        required: ["fecha", "descripcion", "depositos", "retiros", "saldoMxn"],
      },
    },
  },
};

export const extractMovementsFromImages = async (base64Images: string[]): Promise<Movement[]> => {
  let allMovements: Movement[] = [];

  try {
    const parts = base64Images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    }));

    const prompt = `
      Analiza las imágenes de este estado de cuenta bancario (especialmente secciones como "Detalle de movimientos - Depósitos y retiros").
      
      TAREA:
      1. Busca la tabla principal de movimientos detallados.
      2. Extrae cada fila mapeando los datos a las siguientes columnas específicas:
         - Num (número de movimiento)
         - Fecha
         - Descripción (Concepto)
         - Suc (Sucursal)
         - Ref Numérica
         - Ref Alfanumérica
         - Autorización
         - Ordenante
         - Banco Emisor
         - Depósitos
         - Retiros
         - Saldo MXN
      3. Si un campo no existe para una fila, déjalo como cadena vacía "" o 0 si es numérico.
      4. Normaliza los números (elimina '$' y ',' y convierte a float).
      5. Ignora filas de subtotales mensuales si no son movimientos individuales.
      
      Devuelve un JSON estrictamente con la estructura solicitada.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [...parts, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: MOVEMENT_SCHEMA,
        temperature: 0.1, 
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
