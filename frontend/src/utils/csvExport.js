/**
 * Utility to export data to CSV and trigger a download in the browser.
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file (e.g., 'users-export')
 */
export const exportToCSV = (data, filename) => {
    if (!data || !data.length) {
        return;
    }

    // Extract headers from the first object
    const headers = Object.keys(data[0]);

    // Create CSV rows
    const csvRows = [];

    // Add headers row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            // Handle null/undefined
            if (val === null || val === undefined) return '';
            // Escape quotes and wrap in quotes if contains commas
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    // Create a blob and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
