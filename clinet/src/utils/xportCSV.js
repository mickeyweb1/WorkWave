// This function converts an array of objects into a CSV file and downloads it

export const exportToCSV = (data, columns, filename) => {
  if (!data || data.length === 0) {
    alert("No data to export!");
    return;
  }

  // 1. Build the CSV header row
  const headerRow = columns.map(col => col.label).join(',');

  // 2. Build each data row
  const dataRows = data.map(item => {
    return columns.map(col => {
      let value = col.accessor(item); // Get the value using the accessor function
      
      // Clean the value for CSV format
      if (value === null || value === undefined) value = '';
      value = String(value);
      
      // If the value contains commas, quotes, or newlines, wrap it in quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      
      return value;
    }).join(',');
  });

  // 3. Combine header and rows
  const csvContent = [headerRow, ...dataRows].join('\n');

  // 4. Create a Blob and trigger the download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
