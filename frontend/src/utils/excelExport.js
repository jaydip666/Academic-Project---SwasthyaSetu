import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file with multiple sheets.
 * @param {Object} sheets - An object where keys are sheet names and values are arrays of objects (data).
 * @param {string} fileName - The name of the resulting Excel file.
 */
export const exportToExcel = (sheets, fileName = 'System_Report.xlsx') => {
    try {
        const wb = XLSX.utils.book_new();

        Object.keys(sheets).forEach(sheetName => {
            const data = sheets[sheetName];
            if (data && Array.isArray(data)) {
                const ws = XLSX.utils.json_to_sheet(data);
                
                // Auto-calculate column widths
                if (data.length > 0) {
                    const objectKeys = Object.keys(data[0]);
                    const wscols = objectKeys.map(key => {
                        let max_width = key.length;
                        data.forEach(row => {
                            const val = row[key];
                            const cellValue = val ? val.toString() : "";
                            if (cellValue.length > max_width) max_width = cellValue.length;
                        });
                        return { wch: max_width + 5 }; // Add padding
                    });
                    ws['!cols'] = wscols;
                }

                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            }
        });

        XLSX.writeFile(wb, fileName);
        return true;
    } catch (error) {
        console.error('Excel Export Error:', error);
        return false;
    }
};
