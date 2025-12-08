import React, { useMemo, useState } from 'react';
import { ProductionRecord } from '../types';
import { Search, Box, AlertTriangle, Scale, FileSpreadsheet, Pallet } from 'lucide-react';

interface BatchRegistryProps {
  records: ProductionRecord[];
}

interface BatchSummary {
  batchNo: string;
  productName: string;
  size: string;
  totalWeight: number;
  totalRejected: number;
  totalCartons: number;
  lastDate: string;
  entryCount: number;
}

export const BatchRegistry: React.FC<BatchRegistryProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Group records by Batch No
  const batchSummaries = useMemo(() => {
    const map = new Map<string, BatchSummary>();

    records.forEach(record => {
      const normalizedBatch = record.batchNo.trim().toUpperCase();
      
      if (!map.has(normalizedBatch)) {
        map.set(normalizedBatch, {
          batchNo: normalizedBatch,
          productName: record.productName,
          size: record.size,
          totalWeight: 0,
          totalRejected: 0,
          totalCartons: 0,
          lastDate: record.date,
          entryCount: 0
        });
      }

      const summary = map.get(normalizedBatch)!;
      summary.totalWeight += record.weightKg;
      summary.totalRejected += record.rejectedKg;
      summary.totalCartons += record.cartonCtn;
      summary.entryCount += 1;
      
      // Keep the most recent date
      if (new Date(record.date) > new Date(summary.lastDate)) {
        summary.lastDate = record.date;
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
  }, [records]);

  const filteredBatches = batchSummaries.filter(b => 
    b.batchNo.includes(searchTerm.toUpperCase()) || 
    b.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportSummary = () => {
    const headers = [
      "Batch No", 
      "Product Name", 
      "Size", 
      "Total Weight (Kg)", 
      "Total Cartons (CTN)",
      "Pallets (approx)", 
      "Total Rejected (Kg)", 
      "Last Activity Date", 
      "Entry Count"
    ];

    const rows = filteredBatches.map(b => [
      b.batchNo,
      `"${b.productName}"`,
      b.size,
      b.totalWeight.toFixed(2),
      b.totalCartons,
      (b.totalWeight / 1000).toFixed(2),
      b.totalRejected.toFixed(2),
      b.lastDate,
      b.entryCount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Batch_Registry_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search & Export Header - Hidden on Print */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4 print:hidden">
        <div className="bg-blue-50 p-3 rounded-lg text-blue-600 hidden md:block">
          <Box size={24} />
        </div>
        <div className="flex-1 w-full md:w-auto">
          <h2 className="text-lg font-bold text-gray-800 md:hidden mb-2">Batch Registry</h2>
          <p className="text-sm text-gray-500 hidden md:block">Consolidated view of all batches, their sizes, and total output.</p>
          <div className="relative w-full md:w-auto md:hidden">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Search Batch..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
             />
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Batch or Product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
          <button
            onClick={handleExportSummary}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium whitespace-nowrap w-full md:w-auto"
            title="Download Summary CSV"
          >
            <FileSpreadsheet size={16} />
            Export Summary
          </button>
        </div>
      </div>

      {/* Batch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 print:block">
        {filteredBatches.map((batch) => {
          const palletCount = batch.totalWeight / 1000;
          return (
            <div key={batch.batchNo} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden break-inside-avoid print:border-gray-300 print:shadow-none print:mb-4 print:inline-block print:w-[48%] print:mr-[1%] print:align-top">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center print:bg-gray-100">
                <span className="font-mono font-bold text-gray-700 text-lg">{batch.batchNo}</span>
                <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-gray-200 text-gray-500 print:border-gray-300">
                  {batch.lastDate}
                </span>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 leading-tight">{batch.productName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium print:bg-gray-100 print:text-black print:border print:border-gray-300">
                      {batch.size}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium print:hidden">
                       <Pallet size={10} /> {palletCount.toFixed(1)} Pallets
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 print:border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Scale size={14} />
                      <span className="text-xs">Weight</span>
                    </div>
                    <p className="font-bold text-gray-800">{batch.totalWeight.toLocaleString()} <span className="text-xs font-normal">kg</span></p>
                  </div>
                  
                  <div className="text-center border-l border-gray-100 print:border-gray-200">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Box size={14} />
                      <span className="text-xs">Cartons</span>
                    </div>
                    <p className="font-bold text-gray-800">{batch.totalCartons} <span className="text-xs font-normal">ctn</span></p>
                  </div>

                  <div className="text-center border-l border-gray-100 print:border-gray-200">
                    <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                      <AlertTriangle size={14} />
                      <span className="text-xs">Rejected</span>
                    </div>
                    <p className="font-bold text-red-600 print:text-black">{batch.totalRejected.toFixed(1)} <span className="text-xs font-normal">kg</span></p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBatches.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <Box size={48} className="mx-auto mb-4 opacity-50" />
          <p>No batches found matching your search.</p>
        </div>
      )}
    </div>
  );
};