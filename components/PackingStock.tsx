
import React, { useState, useMemo } from 'react';
import { ProductionRecord, PackingStockItem, StockTransaction } from '../types';
import { getStockTransactions, saveStockTransaction } from '../services/storageService';
import { Package, Plus, ArrowDown, Search, RefreshCw, Lock, AlertTriangle, Info } from 'lucide-react';
import { PRODUCT_CATALOG } from '../data/products';

// --- Configuration ---
// Records ON or AFTER this date will be deducted from Opening Stock.
const STOCK_CALCULATION_START_DATE = '2024-12-01';

// --- Master Data (Opening Balance as of Nov 30th) ---
const MASTER_STOCK_LIST: PackingStockItem[] = [
  // Packets (PD)
  { id: 'PD1001', itemNo: '101458CD004', name: 'PACKETS 6013 - 50 X 70 X 360', openingStock: 30974, unit: 'PCS', remark: 'Each Carton 300pcs 4.0kg (F4)' },
  { id: 'PD1002', itemNo: '2700011918', name: 'PACKETS 7018 - 60 X 75 X 360 (5.0 KG)', openingStock: 6581, unit: 'PCS', remark: 'Each Carton 350pcs 5.0kg' },
  { id: 'PD1003', itemNo: '', name: 'PACKETS 7018 - 50 X 75 X 460', openingStock: 11193, unit: 'PCS', remark: 'Each Carton 200pcs 5.0kg' },
  { id: 'PD1004', itemNo: '101458CD003', name: 'PACKETS 7018 - 40 X 60 X 360 (2.5 KG)', openingStock: 16500, unit: 'PCS', remark: 'Each Carton 300pcs 2.5kg' },
  { id: 'PD1005', itemNo: '101458CD005', name: 'PACKETS 6013 - 50 X 3.5 X 360', openingStock: 46011, unit: 'PCS', remark: 'Each Carton 375pcs 2.0kg' },
  { id: 'PD1006', itemNo: '101458CD005', name: 'PLAIN Vac-PACKETS - 50 X 3.5 X 360', openingStock: 15616, unit: 'PCS', remark: 'Each Carton 300pcs 2.0kg (F9)' },
  { id: 'PD1007', itemNo: '101458CD006', name: 'PACKETS 6013 - 50 X 65 X 400', openingStock: 6785, unit: 'PCS', remark: 'Each Carton 250pcs 5.0kg' },
  { id: 'PD1008', itemNo: '', name: 'PLAIN PACKETS - 50 X 70 X 460', openingStock: 5700, unit: 'PCS', remark: 'Each Carton 200pcs 5.0kg' },
  
  // Cartons (PC)
  { id: 'PC1001', itemNo: '101458CC002', name: 'CARTON - 7018 - 80 X 28 X 470', openingStock: 0, unit: 'PCS', remark: 'Each Carton 60pcs' },
  { id: 'PC1002', itemNo: '101458CC001', name: 'CARTON - 7018 - 90 X 25 X 370', openingStock: 5678, unit: 'PCS', remark: 'Each Carton 50pcs' },
  { id: 'PC1003', itemNo: '101458CC004', name: 'CARTON - 6013 - 70 X 22 X 370', openingStock: 13229, unit: 'PCS', remark: 'Each Carton 50pcs (F14)' },
  { id: 'PC1004', itemNo: '101458CC005', name: 'CARTON - 7018 - 70 X 22 X 470', openingStock: 7150, unit: 'PCS', remark: 'Each Carton 50pcs' },
  { id: 'PC1005', itemNo: '101458CC007', name: 'CARTON - VACCUM - 30.2X39X8', openingStock: 13019, unit: 'PCS', remark: 'Each Carton 50pcs (F16)' },
  { id: 'PC1006', itemNo: '101458CD001', name: 'CARTON - 6013 - 70 X 213 X 420 (20KG)', openingStock: 2250, unit: 'PCS', remark: 'Each Carton 50pcs' },

  // New Plastic Items (PP)
  { id: 'PP1001', itemNo: '', name: 'PLASTIC PACKETS (80 X 13)', openingStock: 0, unit: 'PCS', remark: 'Each Carton 10KG' },
  { id: 'PP1002', itemNo: '', name: 'PLASTIC PACKETS (60 X 12)', openingStock: 0, unit: 'PCS', remark: 'Each Carton 10KG' },
  { id: 'PP1003', itemNo: '', name: 'PLASTIC PACKETS (60 X 13)', openingStock: 430, unit: 'PCS', remark: 'Each Carton 10KG' },
  { id: 'PP1004', itemNo: '', name: 'PLASTIC PACKETS (60 X 11)', openingStock: 500, unit: 'PCS', remark: 'Each Carton 10KG' },
  { id: 'PP1005', itemNo: '', name: 'PLASTIC PACKETS (75 X 12)', openingStock: 40, unit: 'PCS', remark: 'Each Carton 10KG' },
  { id: 'PP1006', itemNo: '', name: 'PLASTIC PACKETS (60 X 9.5)', openingStock: 520, unit: 'PCS', remark: 'Each Carton 12KG' },
  { id: 'PP1007', itemNo: '', name: 'PLASTIC PACKETS (72 X 13)', openingStock: 30, unit: 'PCS', remark: 'Each Carton 10KG' },
  { id: 'PP1008', itemNo: 'new', name: 'PLASTIC PACKETS (65/63 X 15)', openingStock: 248, unit: 'PCS', remark: 'Each Carton 10KG' },

  // Vacuum Foil (VP)
  { id: 'VP1001', itemNo: '', name: 'VACUUM FOIL BAG 20K pcs', openingStock: 18700, unit: 'PCS', remark: '' },
  { id: 'VP1002', itemNo: '', name: 'VACUUM Aluminium FOIL BAG 20K pcs', openingStock: 0, unit: 'PCS', remark: 'Each Carton 1200 bags (F27)' },

  // Containers (PB)
  { id: 'PB1001', itemNo: '', name: 'Plastic container Silver colour NiFe', openingStock: 5793, unit: 'PCS', remark: 'Each Carton 500 box' },
  { id: 'PB1002', itemNo: '', name: 'Plastic container Gold colour Ni', openingStock: 2827, unit: 'PCS', remark: 'Each Carton 666 box (F29)' }
];

interface BreakdownItem {
  date: string;
  batch: string;
  qty: number;
}

interface PackingStockProps {
  records: ProductionRecord[];
}

export const PackingStock: React.FC<PackingStockProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inwardModalItem, setInwardModalItem] = useState<PackingStockItem | null>(null);
  const [inwardQty, setInwardQty] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); 
  
  // Tooltip State
  const [hoveredBreakdown, setHoveredBreakdown] = useState<{
    x: number;
    y: number;
    data: BreakdownItem[];
    itemName: string;
    type: 'INWARD' | 'ISSUE';
  } | null>(null);
  
  // Transactions State
  const [transactions, setTransactions] = useState<StockTransaction[]>(getStockTransactions());

  // --- Logic to Map Production to Packaging Material ---
  const resolveMaterialIds = (record: ProductionRecord): { packetId: string | null, cartonId: string | null } => {
    // Determine Product Definition
    const def = PRODUCT_CATALOG.find(p => p.displayName === record.productName);
    const prodName = record.productName.toUpperCase();
    const size = record.size;

    // Default IDs
    let packetId: string | null = null;
    let cartonId: string | null = null;

    // Calculate approximate packet weight to distinguish variants
    const approxPktWeight = record.duplesPkt > 0 ? (record.weightKg / record.duplesPkt) : 0;

    // --- PACKET MAPPING ---
    if (def?.type === 'Container' || prodName.includes('SPARKWELD NI')) {
        // Ni (Gold) -> F29 (PB1002)
        // NiFe (Silver) -> (PB1001)
        if (def?.family === 'Ni' || prodName === 'SPARKWELD NI') {
             packetId = 'PB1002'; // Gold (F29)
        } else if (def?.family === 'NiFe' || prodName === 'SPARKWELD NIFE') {
             packetId = 'PB1001'; // Silver
        }
        
        // Both use F14 (6013 Carton / PC1003)
        cartonId = 'PC1003'; 
    } 
    else if (def?.type === 'Vacuum' || prodName.includes('VACUUM')) {
        
        // SPECIFIC RULE: Vacuum 7018 with 350mm length
        // Logic: Packet = PD1006 (F9), Carton = PC1005 (F16)
        if (prodName.includes('7018') && size.includes('350')) {
             packetId = 'PD1006';
             cartonId = 'PC1005';
        } 
        else {
             // Fallback Vacuum Logic
             if (approxPktWeight >= 1.5 && approxPktWeight <= 2.5) {
                packetId = 'PD1006'; // Plain Vac 2kg (F9)
             }
             cartonId = 'PC1005'; // Vacuum Carton (F16)
        }
    } 
    else {
        // --- NORMAL PACKETS (6013 / 7018) ---
        
        if (prodName.includes('6013')) {
           cartonId = 'PC1003'; // 6013 Standard Carton (F14)
           
           // Packet Selection based on weight
           if (approxPktWeight > 3.5 && approxPktWeight < 4.5) {
             packetId = 'PD1001'; // 4kg (F4)
           } else if (approxPktWeight > 1.5 && approxPktWeight < 2.5) {
             packetId = 'PD1005'; // 2kg
           } else if (approxPktWeight > 4.5) {
             packetId = 'PD1007'; // 5kg
           } else {
             packetId = 'PD1001'; // Default to 4kg if unclear
           }
        }
        else if (prodName.includes('7018')) {
           cartonId = 'PC1002'; // 7018 Standard Carton
           
           // Packet Selection
           if (approxPktWeight > 4.5) {
             packetId = 'PD1002'; // 5kg
           } else if (approxPktWeight > 2.0 && approxPktWeight < 3.0) {
             packetId = 'PD1004'; // 2.5kg
           } else {
             packetId = 'PD1002'; // Default to 5kg
           }
        }
    }

    return { packetId, cartonId };
  };

  // --- Main Calculation ---
  const { stockData } = useMemo(() => {
    // 1. Initialize with Master List
    const calculatedData = MASTER_STOCK_LIST.map(item => ({
      ...item,
      inward: 0,
      issued: 0,
      available: item.openingStock,
      breakdown: [] as BreakdownItem[], // Track issue sources
      inwardBreakdown: [] as BreakdownItem[] // Track inward sources
    }));

    // 2. Process Inward Transactions (Manual)
    transactions.forEach(txn => {
        const item = calculatedData.find(i => i.id === txn.itemId);
        if (item) {
            item.inward += txn.qty;
            item.available += txn.qty;
            item.inwardBreakdown.push({
              date: txn.date,
              batch: txn.notes || 'Manual Add',
              qty: txn.qty
            });
        }
    });

    // 3. Process Issues (From Production Records) starting Dec 1st
    records.forEach(record => {
        if (record.date < STOCK_CALCULATION_START_DATE) return;

        const { packetId, cartonId } = resolveMaterialIds(record);

        // Deduct Packets
        if (packetId) {
            const pktItem = calculatedData.find(i => i.id === packetId);
            if (pktItem) {
                pktItem.issued += record.duplesPkt;
                pktItem.available -= record.duplesPkt;
                pktItem.breakdown.push({
                  date: record.date,
                  batch: record.batchNo,
                  qty: record.duplesPkt
                });
            }

            // SPECIAL RULE: F27 (VP1002) updates same as F9 (PD1006)
            if (packetId === 'PD1006') {
                 const foilItem = calculatedData.find(i => i.id === 'VP1002');
                 if (foilItem) {
                     foilItem.issued += record.duplesPkt;
                     foilItem.available -= record.duplesPkt;
                     foilItem.breakdown.push({
                       date: record.date,
                       batch: record.batchNo,
                       qty: record.duplesPkt
                     });
                 }
            }
        }

        // Deduct Cartons
        if (cartonId) {
            const ctnItem = calculatedData.find(i => i.id === cartonId);
            if (ctnItem) {
                ctnItem.issued += record.cartonCtn;
                ctnItem.available -= record.cartonCtn;
                ctnItem.breakdown.push({
                  date: record.date,
                  batch: record.batchNo,
                  qty: record.cartonCtn
                });
            }
        }
    });

    // 4. Mark Low Stock
    const finalData = calculatedData.map(item => ({
        ...item,
        isLow: item.lowStockThreshold ? item.available <= item.lowStockThreshold : item.available <= 0
    }));

    return { stockData: finalData };
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
             <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                <RefreshCw size={14} /> 
                <span><strong>Live Calculation:</strong> Auto-deducting issues from Dec 1st</span>
             </div>
             <div className="flex items-center gap-1 text-gray-500">
                <Lock size={14} /> 
                <span>BF Date: Nov 30th</span>
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
             className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
             title="Refresh Calculations"
          >
             <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3">S.NO</th>
                <th className="px-4 py-3">Item No</th>
                <th className="px-4 py-3 w-1/3">Product Name</th>
                <th className="px-4 py-3 text-right bg-gray-700">BF Qty<br/>(Nov 30)</th>
                <th className="px-4 py-3 text-right bg-green-900 text-green-100">Inward<br/>(+)</th>
                <th className="px-4 py-3 text-right bg-red-900 text-red-100">Issue Qty<br/>(-)</th>
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
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.name}
                    {item.isLow && <span className="ml-2 inline-flex text-xs text-red-600 font-bold"><AlertTriangle size={12} /> Low</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-600 bg-gray-50">{item.openingStock.toLocaleString()}</td>
                  <td 
                    className="px-4 py-3 text-right font-bold text-green-600 bg-green-50/30 cursor-pointer hover:bg-green-100 transition-colors relative"
                    onMouseEnter={(e) => {
                       if (item.inward <= 0) return;
                       const rect = e.currentTarget.getBoundingClientRect();
                       setHoveredBreakdown({
                           x: rect.right,
                           y: rect.top,
                           data: item.inwardBreakdown,
                           itemName: item.name,
                           type: 'INWARD'
                       });
                    }}
                    onMouseLeave={() => setHoveredBreakdown(null)}
                  >
                     {item.inward > 0 ? item.inward.toLocaleString() : '-'}
                  </td>
                  <td 
                    className="px-4 py-3 text-right font-bold text-red-600 bg-red-50/30 cursor-pointer hover:bg-red-100 transition-colors relative"
                    onMouseEnter={(e) => {
                       if (item.issued <= 0) return;
                       const rect = e.currentTarget.getBoundingClientRect();
                       setHoveredBreakdown({
                           x: rect.right,
                           y: rect.top,
                           data: item.breakdown,
                           itemName: item.name,
                           type: 'ISSUE'
                       });
                    }}
                    onMouseLeave={() => setHoveredBreakdown(null)}
                  >
                     {item.issued > 0 ? item.issued.toLocaleString() : '-'}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold text-lg ${item.isLow ? 'text-red-600' : 'text-gray-800'} bg-amber-50`}>
                    {item.available.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.remark}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => setInwardModalItem(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Add Inward Stock"
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

      {/* Floating Breakdown Tooltip */}
      {hoveredBreakdown && (() => {
        // Smart Positioning Logic
        const viewportHeight = window.innerHeight;
        const isBottomHalf = hoveredBreakdown.y > viewportHeight / 2;
        
        const style: React.CSSProperties = {
          left: Math.max(10, hoveredBreakdown.x - 300), // Prevent going off-left
        };

        if (isBottomHalf) {
           // Position ABOVE the row
           // 'bottom' is distance from screen bottom to element top
           style.bottom = viewportHeight - hoveredBreakdown.y + 10;
           style.transformOrigin = 'bottom right';
        } else {
           // Position BELOW/OVER the row
           style.top = hoveredBreakdown.y - 10;
           style.transformOrigin = 'top right';
        }

        return (
        <div 
          className="fixed z-50 bg-white shadow-xl border border-gray-200 rounded-lg p-0 w-72 text-sm pointer-events-none overflow-hidden animate-fadeIn"
          style={style}
        >
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 font-bold text-gray-700 text-xs flex justify-between items-center">
             <span className="truncate max-w-[170px]">{hoveredBreakdown.itemName}</span>
             <span className={`px-1.5 py-0.5 rounded border ${
               hoveredBreakdown.type === 'INWARD' 
                 ? 'bg-green-100 text-green-700 border-green-200'
                 : 'bg-red-100 text-red-700 border-red-200'
             }`}>
               {hoveredBreakdown.type === 'INWARD' ? 'Inward History' : 'Issued Breakdown'}
             </span>
          </div>
          <div className="max-h-64 overflow-y-auto">
             <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 sticky top-0">
                   <tr>
                      <th className="px-3 py-1 text-left font-medium">Date</th>
                      <th className="px-2 py-1 text-left font-medium">{hoveredBreakdown.type === 'INWARD' ? 'Ref/Notes' : 'Batch'}</th>
                      <th className="px-3 py-1 text-right font-medium">Qty</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {hoveredBreakdown.data
                     .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                     .map((entry, idx) => (
                      <tr key={idx}>
                         <td className="px-3 py-1 text-gray-600 whitespace-nowrap">{entry.date}</td>
                         <td className="px-2 py-1 font-mono text-gray-800">{entry.batch}</td>
                         <td className={`px-3 py-1 text-right font-bold ${hoveredBreakdown.type === 'INWARD' ? 'text-green-600' : 'text-red-600'}`}>{entry.qty}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 text-right text-xs font-bold text-gray-800">
             Total: {hoveredBreakdown.data.reduce((acc, curr) => acc + curr.qty, 0).toLocaleString()}
          </div>
        </div>
        );
      })()}

      {/* Inward Modal */}
      {inwardModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn">
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
