import { GoogleGenAI, Type } from "@google/genai";
import { ReportType, AnalysisResult, MetaAnalysis, StrategicDossiers } from "../types";
import { SheetRow } from "./googleSheetsService";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    insights: { type: Type.ARRAY, items: { type: Type.STRING } },
    metrics: {
      type: Type.OBJECT,
      properties: {
        conversionProbability: { type: Type.NUMBER },
        customerSentiment: { type: Type.NUMBER },
        dealSizeEstimate: { type: Type.NUMBER },
        resolutionTimeMinutes: { type: Type.NUMBER },
        churnRisk: { type: Type.NUMBER }
      },
      required: ["conversionProbability", "customerSentiment", "churnRisk"]
    }
  },
  required: ["summary", "insights", "metrics"]
};

export const analyzeTranscript = async (
  text: string, 
  fileName: string, 
  type: ReportType
): Promise<AnalysisResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this ${type} record. Extract metrics and summarize: \n\n ${text}`,
    config: {
      systemInstruction: "You are a world-class Business Intelligence Analyst. Extract data objectively.",
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });

  const rawJson = JSON.parse(response.text || '{}');

  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    fileName,
    summary: rawJson.summary,
    insights: rawJson.insights,
    metrics: rawJson.metrics,
    rawText: text
  };
};

export const generateStrategicDossiers = async (reports: AnalysisResult[]): Promise<StrategicDossiers> => {
  if (reports.length === 0) return { yesNo: '', oppsThreats: '', actNow: [] };

  const dataString = reports.map(r => `Sentiment: ${r.metrics.customerSentiment}%, Summary: ${r.summary}`).join('\n---\n');

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Synthesize this intelligence into strategic dossiers:\n\n${dataString}`,
    config: {
      systemInstruction: `You are the Lead Strategic Consultant. Produce: 
      1. Why customers say Yes or No. 
      2. Opportunities and Threats. 
      3. Act Now (6-8 items).`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          yesNo: { type: Type.STRING },
          oppsThreats: { type: Type.STRING },
          actNow: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["yesNo", "oppsThreats", "actNow"]
      }
    }
  });

  return JSON.parse(response.text || '{"yesNo": "", "oppsThreats": "", "actNow": []}');
};

export const generateMetaAnalysis = async (reports: AnalysisResult[], userPrompt?: string): Promise<MetaAnalysis> => {
  if (reports.length === 0) return { topFeatures: [], executiveNarrative: "No data." };

  const formattedData = reports.map(r => `Summary: ${r.summary}`).join('\n---');

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `${userPrompt || "General analysis"}\n\nDATA:\n${formattedData}`,
    config: {
      systemInstruction: `You are a Chief Product Officer. Analyze patterns and requested features.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topFeatures: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                impactScore: { type: Type.NUMBER }
              },
              required: ["title", "description", "impactScore"]
            }
          },
          executiveNarrative: { type: Type.STRING }
        },
        required: ["topFeatures", "executiveNarrative"]
      }
    }
  });

  return JSON.parse(response.text || '{"topFeatures": [], "executiveNarrative": ""}');
};

export const generateCustomerInsightSummaries = async (sheetRows: SheetRow[]): Promise<{
  overall: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  features_requested: string;
}> => {
  if (sheetRows.length === 0) {
    return {
      overall: 'No customer data available.',
      strengths: 'No data.',
      weaknesses: 'No data.',
      opportunities: 'No data.',
      threats: 'No data.',
      features_requested: 'No data.'
    };
  }

  const customerCount = sheetRows.length;

  // Generate summaries for each category
  const categories = [
    { key: 'strengths', name: 'Strengths' },
    { key: 'weaknesses', name: 'Weaknesses' },
    { key: 'opportunities', name: 'Opportunities' },
    { key: 'threats', name: 'Threats' },
    { key: 'features_requested', name: 'Features Requested' }
  ];

  const summaries: any = {};

  // Generate category summaries
  for (const category of categories) {
    const allResponses = sheetRows
      .map((row, i) => `Customer ${i + 1}: ${row[category.key] || 'No data'}`)
      .join('\n');

    const prompt = `You are analysing customer feedback about Mak, an AI-powered HR platform.

Below are responses from ${customerCount} customers about ${category.name}.

Identify the 3-5 key themes. Note how frequently each theme appears (e.g., "mentioned by X customers"). Highlight any standout insights. Keep it under 150 words. Be specific and actionable.

${allResponses}

Provide a clear, concise summary:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        systemInstruction: "You are a product analyst. Extract themes and patterns from customer feedback."
      }
    });

    summaries[category.key] = response.text || 'No summary generated.';
  }

  // Generate overall summary
  let fullContext = `Customer feedback analysis for Mak (AI-powered HR platform) from ${customerCount} customers:\n\n`;

  sheetRows.forEach((row, index) => {
    fullContext += `CUSTOMER ${index + 1}:\n`;
    fullContext += `Strengths: ${row.strengths || 'N/A'}\n`;
    fullContext += `Weaknesses: ${row.weaknesses || 'N/A'}\n`;
    fullContext += `Opportunities: ${row.opportunities || 'N/A'}\n`;
    fullContext += `Threats: ${row.threats || 'N/A'}\n`;
    fullContext += `Features Requested: ${row.features_requested || 'N/A'}\n`;
    fullContext += `Overall Sentiment: ${row.overall_sentiment || 'N/A'}\n\n`;
  });

  const overallPrompt = `${fullContext}

Provide a concise executive summary (200-250 words) of the key insights across all categories. Focus on:
1. The most critical patterns and themes
2. Top priorities for product development
3. Relationship health and retention risks
4. Strategic opportunities

Be specific and actionable:`;

  const overallResponse = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: overallPrompt,
    config: {
      systemInstruction: "You are a Chief Product Officer synthesising customer intelligence."
    }
  });

  summaries.overall = overallResponse.text || 'No overall summary generated.';

  return summaries;
};
