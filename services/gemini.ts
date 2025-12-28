
import { GoogleGenAI, Type } from "@google/genai";

export const getMealPlanInsight = async (selection: Record<string, string[]>): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const selectionSummary = Object.entries(selection).map(([day, meals]) => {
    return `${day}: ${meals.join(', ')}`;
  }).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O usuário montou o seguinte kit semanal de marmitas congeladas organizado por dias da semana:
      ${selectionSummary}
      
      Como um nutricionista especialista, dê um feedback curto e motivador sobre esse planejamento semanal em português brasileiro. 
      Analise se a distribuição das refeições ao longo dos dias está variada e equilibrada.
      Mantenha o tom profissional mas acolhedor. No máximo 3 parágrafos curtos.`,
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });
    
    return response.text || "Seu planejamento semanal está excelente! Uma jornada nutritiva e saborosa te espera.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Sua escolha foi excelente! Equilíbrio e sabor para todos os seus dias.";
  }
};
