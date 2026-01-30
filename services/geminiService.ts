
import { GoogleGenAI, Type } from "@google/genai";
import { ReportType, AnalysisResult, MetaAnalysis, StrategicDossiers, ColumnSummary } from "../types";
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

export const generateColumnSummary = async (
  rows: SheetRow[], 
  columnIndices: number[],
  columnNames: string[]
): Promise<ColumnSummary> => {
  if (rows.length === 0) {
    return { keyThemes: [], summary: "No data available.", insights: [] };
  }

  // Extract data from specified columns (C=2, D=3, F=5, G=6)
  const selectedColumnNames = columnIndices.map(idx => columnNames[idx] || `Column ${String.fromCharCode(65 + idx)}`);
  
  const columnData = rows.map((row, rowIndex) => {
    const rowData: { [key: string]: string } = {};
    columnIndices.forEach((colIndex) => {
      const colName = columnNames[colIndex] || `Column ${String.fromCharCode(65 + colIndex)}`;
      // Access the row by column name (SheetRow is a dictionary with column names as keys)
      const cellValue = row[colName] || '';
      rowData[colName] = cellValue;
    });
    return `Row ${rowIndex + 1}:\n${Object.entries(rowData).map(([key, value]) => `${key}: ${value}`).join('\n')}`;
  }).join('\n\n');

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze the following data from columns ${selectedColumnNames.join(', ')} (columns C, D, F, G) and identify key themes, patterns, and insights across all ${rows.length} rows:\n\n${columnData}\n\nProvide a comprehensive analysis focusing on:\n1. Key themes that emerge across the data\n2. A high-level summary of the overall patterns\n3. Actionable insights that can be derived from this data`,
    config: {
      systemInstruction: "You are a Chief Product Officer. Analyze patterns and high level themes to provide a summary of the feedback.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keyThemes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          summary: { type: Type.STRING },
          insights: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["keyThemes", "summary", "insights"]
      }
    }
  });

  return JSON.parse(response.text || '{"keyThemes": [], "summary": "", "insights": []}');
};
