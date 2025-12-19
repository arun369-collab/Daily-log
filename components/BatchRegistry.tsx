
import React, { useMemo, useState } from 'react';
import { ProductionRecord } from '../types';
import { Search, Box, AlertTriangle, Scale, FileSpreadsheet, Layers } from 'lucide-react';

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
  firstDate: string;
  lastDate: string;
  entryCount: number;
}

export const BatchRegistry: React.FC<BatchRegistryProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const batchSummaries = useMemo(() => {
    const map = new Map<string, BatchSummary>();

    records.filter(r => r.date >= '2025-12-01').forEach(record => {
      const normalizedBatch = record.batchNo.trim().toUpperCase();
      
      if (!map.has(normalizedBatch)) {
        map.set(normalizedBatch, {
          batchNo: normalizedBatch,
          productName: record.productName,
          size: record.size,
          totalWeight: 0,
          totalRejected: 0,
          totalCartons: 0,
          firstDate: record.date,
          lastDate: record.date,
          entryCount: 0
        });
      }

      const summary = map.get(normalizedBatch)!;
      summary.totalWeight += record.weightKg;
      summary.totalRejected += record.rejectedKg;
      summary.totalCartons += record.cartonCtn;
      summary.entryCount += 1;
      
      if (new Date(record.date) < new Date(summary.firstDate)) {
        summary.firstDate = record.date;
      }
      if (new Date(record.date) > new Date(summary.lastDate)) {
        summary.lastDate = record.date;
      }
    });

    // Sort by First Date Ascending
    return Array.from(map.values()).sort((a, b) => new Date(a.firstDate).getTime() - new Date(b.firstDate).getTime());
  }, [records]);

  const filteredBatches = batchSummaries.filter(b => 
    b.batchNo.includes(searchTerm.toUpperCase()) || 
    b.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportSummary = () => {
    const headers = ["Batch No", "Product", "Size", "Weight (Kg)", "Cartons", "Rejected (Kg)", "Start Date", "Entries"];
    const rows = filteredBatches.map(b => [
      b.batchNo, `"${b.productName}"`, b.size, b.totalWeight.toFixed(2), b.totalCartons, b.totalRejected.toFixed(2), b.firstDate, b.entryCount
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Batch_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4 print:hidden">
        <div className="bg-blue-50 p-3 rounded-lg text-blue-600 hidden md:block">
          <Box size={24} />
        </div>
        <div className="flex-1 w-full md:w-auto">
          <h2 className="text-lg font-bold text-gray-800 md:hidden mb-2">Batch Registry</h2>
          <p className="text-sm text-gray-500 hidden md:block">Batches active since Dec 1st, sorted chronologically.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Batch..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
          <button
            onClick={handleExportSummary}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm text-sm font-medium w-full md:w-auto"
          >
            <FileSpreadsheet size={16} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:block">
        {filteredBatches.map((batch) => {
          const palletCount = batch.totalWeight / 1000;
          return (
            <div key={batch.batchNo} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden print:mb-4 print:inline-block print:w-[48%]">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-mono font-bold text-gray-700 text-lg">{batch.batchNo}</span>
                <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">
                  {batch.firstDate}
                </span>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 leading-tight">{batch.productName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      {batch.size}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <div className="text-center">
                    <Scale size={14} className="mx-auto mb-1 text-gray-400" />
                    <p className="font-bold text-gray-800">{batch.totalWeight.toFixed(0)} <span className="text-[10px]">kg</span></p>
                  </div>
                  <div className="text-center border-l border-gray-100">
                    <Box size={14} className="mx-auto mb-1 text-gray-400" />
                    <p className="font-bold text-gray-800">{batch.totalCartons}</p>
                  </div>
                  <div className="text-center border-l border-gray-100">
                    <AlertTriangle size={14} className="mx-auto mb-1 text-red-400" />
                    <p className="font-bold text-red-600">{batch.totalRejected.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
