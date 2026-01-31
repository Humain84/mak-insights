
export enum ReportType {
  SALES_CALL = 'Sales Call',
  CUSTOMER_FEEDBACK = 'Customer Feedback',
  PROCESS_AUDIT = 'Process Audit'
}

export interface MetricData {
  conversionProbability: number;
  customerSentiment: number; // 0 to 100
  dealSizeEstimate?: number;
  resolutionTimeMinutes?: number;
  churnRisk: number; // 0 to 100
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  type: ReportType;
  fileName: string;
  summary: string;
  insights: string[];
  metrics: MetricData;
  rawText: string;
}

export interface SheetConfig {
  spreadsheetId: string;
  sheetName: string;
  lastSync?: string;
  isConnected: boolean;
  analysisPrompt?: string; 
}

export interface MetaAnalysis {
  topFeatures: {
    title: string;
    description: string;
    impactScore: number;
  }[];
  executiveNarrative: string;
}

export interface StrategicDossiers {
  yesNo: string;
  oppsThreats: string;
  actNow: string[];
}
