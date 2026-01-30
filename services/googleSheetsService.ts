
export interface SheetRow {
  [key: string]: string;
}

export const fetchSheetData = async (spreadsheetId: string, sheetName: string = 'Sheet1'): Promise<SheetRow[]> => {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    const jsonStr = text.substring(text.indexOf("({") + 1, text.lastIndexOf("})"));
    const data = JSON.parse(jsonStr);
    
    const cols = data.table.cols.map((col: any) => col.label || col.id);
    const rows = data.table.rows.map((row: any) => {
      const rowObj: SheetRow = {};
      row.c.forEach((cell: any, i: number) => {
        rowObj[cols[i]] = cell?.v?.toString() || '';
      });
      return rowObj;
    });
    
    return rows;
  } catch (error) {
    throw new Error('Could not connect to Google Sheet. Check ID and sharing permissions.');
  }
};
