import React, { useMemo, useState } from 'react';
import { ProductionRecord } from '../types';
import { Truck, Search, Calendar, Package, ArrowRight, AlertCircle, Layers } from 'lucide-react';

interface DispatchAssistantProps {
  records: ProductionRecord[];
}

interface ProductQueue {
  productKey: string;
  productName: string;
  size: string;
  totalStockCtn: number;
  totalStockWeight: number; // Added to track weight for pallet calc
  batches: {
    batchNo: string;
    date: string;
    cartons: number;
    weight: number;
  }[];
}

export const DispatchAssistant: React.FC<DispatchAssistantProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const fifoQueues = useMemo(() => {
    // 1. Group records by Product + Size
    const grouped = new Map<string, ProductQueue>();

    records.forEach(r => {
      const key = `${r.productName}|${r.size}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          productKey: key,
          productName: r.productName,
          size: r.size,
          totalStockCtn: 0,
          totalStockWeight: 0,
          batches: []
        });
      }

      const group = grouped.get(key)!;
      
      // Check if batch already exists in this group to aggregate cartons
      const existingBatchIndex = group.batches.findIndex(b => b.batchNo === r.batchNo);
      
      if (existingBatchIndex >= 0) {
        group.batches[existingBatchIndex].cartons += r.cartonCtn;
        group.batches[existingBatchIndex].weight += r.weightKg;
        // Keep the earliest date for the batch if multiple entries exist
        if (new Date(r.date) < new Date(group.batches[existingBatchIndex].date)) {
           group.batches[existingBatchIndex].date = r.date;
        }
      } else {
        group.batches.push({
          batchNo: r.batchNo,
          date: r.date,
          cartons: r.cartonCtn,
          weight: r.weightKg
        });
      }

      group.totalStockCtn += r.cartonCtn;
      group.totalStockWeight += r.weightKg;
    });

    // 2. Sort batches within each product by Date (FIFO - Oldest First)
    const sortedGroups = Array.from(grouped.values()).map(group => {
      group.batches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return group;
    });

    // 3. Filter out products with 0 stock (optional, but cleaner)
    return sortedGroups.filter(g => g.totalStockCtn > 0);

  }, [records]);

  // Filter based on search
  const filteredQueues = fifoQueues.filter(q => 
    q.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.size.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
       {/* Header with Search */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="bg-green-50 p-3 rounded-lg text-green-600">
          <Truck size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">Dispatch Assistant (FIFO)</h2>
          <p className="text-sm text-gray-500">
            Recommended dispatch order based on First-In-First-Out logic.
          </p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search product..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQueues.map((item) => {
          const priorityBatch = item.batches[0];
          const queueBatches = item.batches.slice(1);
          const totalPallets = (item.totalStockWeight / 1000).toFixed(1);

          return (
            <div key={item.productKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              
              {/* Card Header: Product Info */}
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{item.productName}</h3>
                    <span className="inline-block mt-1 px-2 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-md font-mono">
                      {item.size}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Stock</p>
                    <p className="text-xl font-bold text-gray-800">{item.totalStockCtn} <span className="text-sm font-normal text-gray-500">ctn</span></p>
                    <p className="text-xs font-medium text-green-600 flex items-center justify-end gap-1">
                      <Layers size={12} /> {totalPallets} Pallets
                    </p>
                  </div>
                </div>
              </div>

              {/* Priority Section (FIFO Winner) */}
              <div className="p-5 bg-green-50/50 border-b border-green-100">
                <div className="flex items-center gap-2 mb-3 text-green-700 font-bold text-sm uppercase tracking-wide">
                  <ArrowRight size={16} />
                  Dispatch This First
                </div>
                
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-mono font-bold text-gray-800">{priorityBatch.batchNo}</span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">PRIORITY</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Calendar size={14}/> {priorityBatch.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-bold text-gray-900">{priorityBatch.cartons}</span>
                    <span className="text-xs text-gray-500">CTN Available</span>
                  </div>
                </div>
              </div>

              {/* The Queue (Next in line) */}
              {queueBatches.length > 0 && (
                <div className="p-5 bg-white flex-1">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package size={14} />
                    Up Next in Queue
                  </h4>
                  <div className="space-y-2">
                    {queueBatches.slice(0, 3).map((b, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                           <span className="text-gray-400 font-mono text-sm w-4">#{idx + 2}</span>
                           <div>
                              <p className="font-mono font-medium text-gray-700">{b.batchNo}</p>
                              <p className="text-xs text-gray-400">{b.date}</p>
                           </div>
                        </div>
                        <div className="font-medium text-gray-600 text-sm">
                          {b.cartons} ctn
                        </div>
                      </div>
                    ))}
                    {queueBatches.length > 3 && (
                      <p className="text-center text-xs text-gray-400 italic pt-2">
                        + {queueBatches.length - 3} more batches in queue
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {queueBatches.length === 0 && (
                <div className="p-5 flex-1 flex items-center justify-center text-gray-400 text-sm italic">
                  No other batches in queue.
                </div>
              )}

            </div>
          );
        })}
      </div>

      {filteredQueues.length === 0 && (
        <div className="text-center py-12">
           <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
             <AlertCircle className="text-gray-400" size={32} />
           </div>
           <h3 className="text-lg font-medium text-gray-900">No Inventory Found</h3>
           <p className="text-gray-500">Start adding production entries to see the dispatch queue.</p>
        </div>
      )}
    </div>
  );
};