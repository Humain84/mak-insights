
export interface SheetRow {
  [key: string]: string;
}

export interface SheetData {
  rows: SheetRow[];
  columnNames: string[];
}

export const fetchSheetData = async (spreadsheetId: string, sheetName: string = 'Sheet1'): Promise<SheetData> => {
  // Clean the spreadsheet ID (remove any extra characters)
  const cleanId = spreadsheetId.trim();
  
  if (!cleanId) {
    throw new Error('Spreadsheet ID is required. Please enter a valid Google Sheets ID.');
  }

  const url = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Spreadsheet not found. Please check:
1. The Spreadsheet ID is correct (found in the URL: docs.google.com/spreadsheets/d/[ID]/edit)
2. The spreadsheet is set to "Anyone with the link can view"`);
      }
      throw new Error(`Failed to fetch spreadsheet: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Check for access denied or permission errors
    if (text.includes('Access denied') || text.includes('permission denied') || text.includes('Sign in')) {
      throw new Error('Access denied. Please ensure the spreadsheet is set to "Anyone with the link can view" (not just "Anyone in your organization").');
    }
    
    // Extract JSON from the response - Google Sheets wraps it in a callback
    // The response looks like: google.visualization.Query.setResponse({...});
    let jsonStr = '';
    
    // Try to find the JSON object in the response
    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1];
    } else {
      // Fallback: try to find JSON object directly
      const jsonStart = text.indexOf('({');
      const jsonEnd = text.lastIndexOf('})');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Invalid response from Google Sheets. Please check the spreadsheet ID and sharing settings.');
      }
      
      jsonStr = text.substring(jsonStart + 1, jsonEnd);
    }
    
    if (!jsonStr) {
      throw new Error('Could not extract data from Google Sheets response. Please check the spreadsheet ID and sharing settings.');
    }
    
    // Parse the JSON
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      // If JSON parsing fails, it might be due to special characters in the data
      // Try to provide a more helpful error
      if (parseError instanceof SyntaxError) {
        throw new Error(`Error parsing spreadsheet data. This might be due to special characters in your spreadsheet. Please try:
1. Ensure the sheet name is correct (case-sensitive)
2. Check if your spreadsheet contains unusual characters that might cause issues
3. Try creating a test sheet with simple text data first`);
      }
      throw parseError;
    }
    
    // Check for error in the response
    if (data.error) {
      const errorMsg = data.error.message || 'Unknown error from Google Sheets';
      if (errorMsg.includes('sheet') || errorMsg.includes('not found')) {
        throw new Error(`Sheet "${sheetName}" not found. Please check:
1. The sheet/tab name matches exactly (case-sensitive)
2. Common names are: "Sheet1", "Sheet2", etc.
3. Check the exact name in your Google Sheets tabs`);
      }
      throw new Error(`Google Sheets error: ${errorMsg}`);
    }
    
    // Check if we have table data
    if (!data.table || !data.table.cols) {
      throw new Error(`Sheet "${sheetName}" found but contains no data. Please check:
1. The sheet has data in it
2. The sheet name is correct (case-sensitive)`);
    }
    
    const cols = data.table.cols.map((col: any) => col.label || col.id);
    const rows = data.table.rows.map((row: any) => {
      const rowObj: SheetRow = {};
      row.c.forEach((cell: any, i: number) => {
        rowObj[cols[i]] = cell?.v?.toString() || '';
      });
      return rowObj;
    });
    
    if (rows.length === 0) {
      throw new Error(`Sheet "${sheetName}" is empty or only has headers. Please ensure the sheet contains data rows.`);
    }
    
    return { rows, columnNames: cols };
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error instanceof Error && (error.message.includes('Spreadsheet') || error.message.includes('sheet'))) {
      throw error;
    }
    // Otherwise provide a more helpful message
    throw new Error(`Could not connect to Google Sheet: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify:
1. The Spreadsheet ID is correct
2. The Sheet/Tab name matches exactly (case-sensitive)
3. The spreadsheet is shared as "Anyone with the link can view"`);
  }
};
