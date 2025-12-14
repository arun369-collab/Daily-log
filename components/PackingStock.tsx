
import React, { useState, useMemo } from 'react';
import { ProductionRecord, PackingStockItem, StockTransaction } from '../types';
import { getStockTransactions, saveStockTransaction } from '../services/storageService';
import { Package, Plus, ArrowDown, Search, Calendar, RefreshCw, Filter, Lock } from 'lucide-react';

// --- Configuration ---
// Records before this date will NOT be deducted from the Opening Stock.
const STOCK_CALCULATION_START_DATE = '2024-12-11';

// --- Master Data from Excel ---
const MASTER_STOCK_LIST: PackingStockItem[] = [
  // Packets (PD)
  { id: 'PD1001', itemNo: '101458CD004', name: 'PACKETS 6013 - 50 X 70 X 360', openingStock: 28669, unit: 'PCS', remark: 'F4 - Each Carton 300pcs 4.0kg' },
  { id: 'PD1002', itemNo: '2700011918', name: 'PACKETS 7018 - 60 X 75 X 360 (5.0 KG)', openingStock: 5378, unit: 'PCS', remark: 'F5 - Each Carton 350pcs 5.0kg', lowStockThreshold: 5400 },
  { id: 'PD1003', itemNo: '', name: 'PACKETS 7018 - 50 X 75 X 460', openingStock: 11193, unit: 'PCS', remark: 'Each Carton 200pcs 5.0kg' },
  { id: 'PD1004', itemNo: '101458CD003', name: 'PACKETS 7018 - 40 X 60 X 360 (2.5 KG)', openingStock: 16500, unit: 'PCS', remark: 'Each Carton 300pcs 2.5kg' },
  { id: 'PD1005', itemNo: '101458CD005', name: 'PACKETS 6013 - 50 X 3.5 X 360', openingStock: 46011, unit: 'PCS', remark: 'Each Carton 375pcs 2.0kg' },
  { id: 'PD1006', itemNo: '101458CD005', name: 'PLAIN Vac-PACKETS - 50 X 3.5 X 360', openingStock: 12750, unit: 'PCS', remark: 'F9 - Each Carton 300pcs 2.0kg', lowStockThreshold: 12500 },
  { id: 'PD1007', itemNo: '101458CD006', name: 'PACKETS 6013 - 50 X 65 X 400', openingStock: 6785, unit: 'PCS', remark: 'Each Carton 250pcs 5.0kg' },
  { id: 'PD1008', itemNo: '', name: 'PLAIN PACKETS - 50 X 70 X 460', openingStock: 5700, unit: 'PCS', remark: 'Each Carton 200pcs 5.0kg' },
  
  // Cartons (PC)
  { id: 'PC1001', itemNo: '101458CC002', name: 'CARTON - 7018 - 80 X 28 X 470', openingStock: 0, unit: 'PCS', remark: 'Each Carton 60pcs', lowStockThreshold: 10 },
  { id: 'PC1002', itemNo: '101458CC001', name: 'CARTON - 7018 - 90 X 25 X 370', openingStock: 5376, unit: 'PCS', remark: 'F13 - Each Carton 50pcs' },
  { id: 'PC1003', itemNo: '101458CC004', name: 'CARTON - 6013 - 70 X 22 X 370', openingStock: 12631, unit: 'PCS', remark: 'F14 - Shared by 6013 & Ni Containers' },
  { id: 'PC1004', itemNo: '101458CC005', name: 'CARTON - 7018 - 70 X 22 X 470', openingStock: 7150, unit: 'PCS', remark: 'Each Carton 50pcs' },
  { id: 'PC1005', itemNo: '101458CC007', name: 'CARTON - VACCUM - 30.2X39X8', openingStock: 12732, unit: 'PCS', remark: 'F16 - Each Carton 50pcs' },
  { id: 'PC1006', itemNo: '101458CD001', name: 'CARTON - 6013 - 70 X 213 X 420 (20KG)', openingStock: 2250, unit: 'PCS', remark: 'Each Carton 50pcs' },

  // Vacuum Foil (VP)
  { id: 'VP1001', itemNo: '', name: 'VACUUM FOIL BAG 20K pcs', openingStock: 18200, unit: 'PCS', remark: '' },
  { id: 'VP1002', itemNo: '', name: 'VACUUM Aluminium FOIL BAG 20K pcs', openingStock: 2434, unit: 'PCS', remark: 'F27 - Matches F9 usage' },

  // Containers (PB)
  { id: 'PB1001', itemNo: '', name: 'Plastic container Silver colour NiFe', openingStock: 5793, unit: 'PCS', remark: 'Each Carton 500 box' },
  { id: 'PB1002', itemNo: '', name: 'Plastic container Gold colour Ni', openingStock: 2620, unit: 'PCS', remark: 'F29 - Each Carton 666 box' }
];

interface PackingStockProps {
  records: ProductionRecord[];
}

export const PackingStock: React.FC<PackingStockProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inwardModalItem, setInwardModalItem] = useState<PackingStockItem | null>(null);
  const [inwardQty, setInwardQty] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Force re-calc
  
  // Transactions State
  const [transactions, setTransactions] = useState<StockTransaction[]>(getStockTransactions());

  // --- Auto-Calculation Logic ---
  const { stockData, includedCount, excludedCount } = useMemo(() => {
    // ---------------------------------------------------------
    // MANUAL OVERRIDE: CALCULATIONS PAUSED
    // Just showing Master List Opening Stock (as of Dec 10th)
    // ---------------------------------------------------------

    const data = MASTER_STOCK_LIST.map(item => {
      // Force 0 for dynamic values to show snapshot only
      const inward = 0;
      const issued = 0;
      const available = item.openingStock;
      
      return {
        ...item,
        inward,
        issued,
        available,
        isLow: item.lowStockThreshold ? available <= item.lowStockThreshold : available <= 0
      };
    });

    return { stockData: data, includedCount: 0, excludedCount: 0 };

    /* 
    // PREVIOUS LOGIC (DISABLED)
    // 1. Calculate Issued Qty from Production Records
    const issuedMap = new Map<string, number>();
    let incCount = 0;
    let excCount = 0;
    
    // Strict Date Comparison
    const startObj = new Date(STOCK_CALCULATION_START_DATE);
    startObj.setHours(0,0,0,0);

    records.forEach(r => {
      // ... existing logic ...
    });
    // ...
    */

  }, [records, transactions, refreshKey]);

  const handleSaveInward = () => {
    if (!inwardModalItem || !inwardQty) return;
    
    const txn: StockTransaction = {
      id: crypto.randomUUID(),
      itemId: inwardModalItem.id,
      date: new Date().toISOString().split('T')[0],
      qty: Number(inwardQty),
      type: 'INWARD',
      notes: 'Manual Entry'
    };

    const updated = saveStockTransaction(txn);
    setTransactions(updated);
    setInwardModalItem(null);
    setInwardQty('');
  };

  const filteredStock = stockData.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
        <div className="bg-amber-100 p-3 rounded-lg text-amber-700">
          <Package size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">Packing Material Stock</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm mt-1">
             <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                <Lock size={14} /> 
                <span><strong>Snapshot Mode:</strong> Data fixed as of 10th Dec (No Calculations)</span>
             </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Search items..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full outline-none focus:ring-2 focus:ring-amber-500"
             />
          </div>
          <button 
             onClick={() => setRefreshKey(k => k + 1)}
             className="p-2 text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-not-allowed opacity-50"
             title="Calculations Disabled"
             disabled
          >
             <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3">S.NO</th>
                <th className="px-4 py-3">Item No</th>
                <th className="px-4 py-3 w-1/3">Product Name</th>
                <th className="px-4 py-3 text-right bg-gray-700">BF Qty<br/>(10th Dec)</th>
                <th className="px-4 py-3 text-right bg-green-900 text-green-100 opacity-50">Inward<br/>(Paused)</th>
                <th className="px-4 py-3 text-right bg-red-900 text-red-100 opacity-50">Issue Qty<br/>(Paused)</th>
                <th className="px-4 py-3 text-right font-bold bg-amber-600">Available<br/>Stock</th>
                <th className="px-4 py-3">Remark</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStock.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.isLow ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.itemNo || '-'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-600 bg-gray-50">{item.openingStock.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-400 bg-gray-50/50">-</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-400 bg-gray-50/50">-</td>
                  <td className={`px-4 py-3 text-right font-bold text-lg text-gray-800 bg-amber-50`}>
                    {item.available.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.remark}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => setInwardModalItem(item)}
                      className="p-1.5 text-gray-300 hover:text-gray-400 cursor-not-allowed"
                      title="Stock Updates Disabled"
                      disabled
                    >
                      <Plus size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inward Modal - Disabled/Hidden mostly, but kept code structure if enabled later */}
      {inwardModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowDown size={20} /> Add Stock Inward
              </h3>
              <p className="text-green-100 text-sm truncate">{inwardModalItem.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add ({inwardModalItem.unit})</label>
                <input 
                  type="number" 
                  autoFocus
                  value={inwardQty}
                  onChange={(e) => setInwardQty(e.target.value)}
                  className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-lg font-bold"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setInwardModalItem(null)}
                  className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveInward}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200"
                >
                  Save Inward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
