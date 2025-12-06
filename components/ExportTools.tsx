import React from 'react';
import { ProductionRecord } from '../types';
import { FileSpreadsheet, Printer, Download } from 'lucide-react';

interface ExportToolsProps {
  records: ProductionRecord[];
}

export const ExportTools: React.FC<ExportToolsProps> = ({ records }) => {
  
  const handleExportCSV = () => {
    // 1. Define Headers
    const headers = [
      "Date", 
      "Batch No", 
      "Product Name", 
      "Size", 
      "Weight (Kg)", 
      "Rejected (Kg)", 
      "Duples (PKT)", 
      "Cartons (CTN)", 
      "Notes"
    ];

    // 2. Map Data
    const rows = records.map(r => [
      r.date,
      r.batchNo,
      `"${r.productName}"`, // Quote to handle commas in names
      r.size,
      r.weightKg,
      r.rejectedKg,
      r.duplesPkt,
      r.cartonCtn,
      `"${r.notes.replace(/"/g, '""')}"` // Escape quotes in notes
    ]);

    // 3. Construct CSV String
    const csvContent = [
      headers.join(','), 
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 4. Create Blob with BOM for Excel UTF-8 compatibility
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 5. Trigger Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FactoryFlow_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex gap-2 print:hidden">
      <button
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
        title="Download for Excel"
      >
        <FileSpreadsheet size={16} />
        Export to Excel
      </button>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium"
        title="Print or Save as PDF"
      >
        <Printer size={16} />
        Print / PDF
      </button>
    </div>
  );
};