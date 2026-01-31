async function loadCustomerData(sheetId) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Sheet data. Is the Sheet shared publicly?');
    }
    
    const csvText = await response.text();
    
    // Simple CSV parsing (split by lines and commas)
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    const customers = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const customer = {};
      
      headers.forEach((header, index) => {
        customer[header.trim()] = values[index] ? values[index].trim() : '';
      });
      
      customers.push(customer);
    }
    
    console.log(`✓ Loaded ${customers.length} customers`);
    console.log('\nFirst customer:');
    console.log(customers[0]);
    console.log('\nAll customer IDs:');
    customers.forEach(c => console.log(`- ${c.customer_id}`));
    
    return customers;
    
  } catch (error) {
    console.error('❌ Error loading customer data:', error.message);
    throw error;
  }
}

// Your Sheet ID
const SHEET_ID = '1LLASYbrcXs8GV9ELMpTcXBxTzGwy9q-Mf_SD0FIz2yA';

// Run it
loadCustomerData(SHEET_ID);
