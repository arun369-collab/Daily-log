
import { GoogleGenAI } from "@google/genai";
import { ProductionRecord } from "../types";

// Helper to get the AI client safely
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProductionInsight = async (records: ProductionRecord[]): Promise<string> => {
  const ai = getAiClient();
  
  if (!ai) {
    return "AI Service Unavailable: API Key is missing.";
  }

  if (records.length === 0) {
    return "No ledger data available to analyze.";
  }

  // Filter for recent records (last 7 days to keep context relevant but concise)
  const recentRecords = records.slice(0, 50); 
  
  const dataString = JSON.stringify(recentRecords.map(r => ({
    date: r.date,
    batch: r.batchNo,
    product: r.productName,
    size: r.size,
    weightKg: r.weightKg,
    rejectedKg: r.rejectedKg,
    packets: r.duplesPkt,
    cartons: r.cartonCtn,
    notes: r.notes
  })));

  const prompt = `
    You are a Factory Production Assistant for a Coordinator. Analyze the following daily ledger data (JSON format) collected from the floor supervisor (Yadav).
    
    Data:
    ${dataString}

    Please provide a concise daily summary. Include:
    1. **Production Volume**: Total weight (Kg) produced and carton counts.
    2. **Quality Control**: Identify batches with high rejection weights (Kg).
    3. **Efficiency**: Brief comment on product sizes or batches that performed best.
    4. **Action Items**: Bullet points for the coordinator's daily report.
    
    Keep the tone professional and focused on the metrics provided (Weight, Cartons, Rejection).
  `;

  try {
    // Corrected the model name to 'gemini-3-flash-preview' per task requirements and guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert manufacturing data analyst specialized in factory ledgers.",
      }
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI insight. Please check your API usage or key.";
  }
};
