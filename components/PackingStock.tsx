
import React, { useState, useMemo } from 'react';
import { ProductionRecord, PackingStockItem, StockTransaction } from '../types';
import { getStockTransactions, saveStockTransaction } from '../services/storageService';
import { Package, Plus, ArrowDown, Search, Calendar } from 'lucide-react';

// --- Configuration ---
// Records before this date will NOT be deducted from the Opening Stock.
// This ensures the "Opening Stock" acts as the balance "As of Morning of Dec 10th".
const STOCK_CALCULATION_START_DATE = '2025-12-10';

// --- Master Data from Excel ---
const MASTER_STOCK_LIST: PackingStockItem[] = [
  // Packets (PD)
  { id: 'PD1001', itemNo: '101458CD004', name: 'PACKETS 6013 - 50 X 70 X 360', openingStock: 28669, unit: 'PCS', remark: 'Each Carton 300pcs 4.0kg' },
  { id: 'PD1002', itemNo: '2700011918', name: 'PACKETS 7018 - 60 X 75 X 360 (5.0 KG)', openingStock: 5378, unit: 'PCS', remark: 'Each Carton 350pcs 5.0kg', lowStockThreshold: 5400 },
  { id: 'PD1003', itemNo: '', name: 'PACKETS 7018 - 50 X 75 X 460', openingStock: 11193, unit: 'PCS', remark: 'Each Carton 200pcs 5.0kg' },
  { id: 'PD1004', itemNo: '101458CD003', name: 'PACKETS 7018 - 40 X 60 X 360 (2.5 KG)', openingStock: 16500, unit: 'PCS', remark: 'Each Carton 300pcs 2.5kg' },
  { id: 'PD1005', itemNo: '101458CD005', name: 'PACKETS 6013 - 50 X 3.5 X 360', openingStock: 46011, unit: 'PCS', remark: 'Each Carton 375pcs 2.0kg' },
  { id: 'PD1006', itemNo: '101458CD005', name: 'PLAIN Vac-PACKETS - 50 X 3.5 X 360', openingStock: 12750, unit: 'PCS', remark: 'Each Carton 300pcs 2.0kg', lowStockThreshold: 12500 },
  { id: 'PD1007', itemNo: '101458CD006', name: 'PACKETS 6013 - 50 X 65 X 400', openingStock: 6785, unit: 'PCS', remark: 'Each Carton 250pcs 5.0kg' },
  { id: 'PD1008', itemNo: '', name: 'PLAIN PACKETS - 50 X 70 X 460', openingStock: 5700, unit: 'PCS', remark: 'Each Carton 200pcs 5.0kg' },
  
  // Cartons (PC)
  { id: 'PC1001', itemNo: '101458CC002', name: 'CARTON - 7018 - 80 X 28 X 470', openingStock: 0, unit: 'PCS', remark: 'Each Carton 60pcs', lowStockThreshold: 10 },
  { id: 'PC1002', itemNo: '101458CC001', name: 'CARTON - 7018 - 90 X 25 X 370', openingStock: 5376, unit: 'PCS', remark: 'Each Carton 50pcs' },
  { id: 'PC1003', itemNo: '101458CC004', name: 'CARTON - 6013 - 70 X 22 X 370', openingStock: 12631, unit: 'PCS', remark: 'F14 - Shared by 6013 & Ni Containers' },
  { id: 'PC1004', itemNo: '101458CC005', name: 'CARTON - 7018 - 70 X 22 X 470', openingStock: 7150, unit: 'PCS', remark: 'Each Carton 50pcs' },
  { id: 'PC1005', itemNo: '101458CC007', name: 'CARTON - VACCUM - 30.2X39X8', openingStock: 12732, unit: 'PCS', remark: 'Each Carton 50pcs' },
  { id: 'PC1006', itemNo: '101458CD001', name: 'CARTON - 6013 - 70 X 213 X 420 (20KG)', openingStock: 2250, unit: 'PCS', remark: 'Each Carton 50pcs' },

  // Vacuum Foil (VP)
  { id: 'VP1001', itemNo: '', name: 'VACUUM FOIL BAG 20K pcs', openingStock: 18200, unit: 'PCS', remark: '' },
  { id: 'VP1002', itemNo: '', name: 'VACUUM Aluminium FOIL BAG 20K pcs', openingStock: 2434, unit: 'PCS', remark: 'Each Carton 1200 bags' },

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
  
  // Transactions State
  const [transactions, setTransactions] = useState<StockTransaction[]>(getStockTransactions());

  // --- Auto-Calculation Logic ---
  const stockData = useMemo(() => {
    // 1. Calculate Issued Qty from Production Records
    const issuedMap = new Map<string, number>();
    
    records.forEach(r => {
      // DATE FILTER: Ignore records before the stock take date (Dec 10th)
      if (r.date < STOCK_CALCULATION_START_DATE) return;

      // Determine which Packing Material was used based on Product Name & Type
      const name = r.productName.toUpperCase();
      
      // Determine Type
      // STRICT LOGIC: Only strictly VACUUM or 7024 are treated as Vacuum.
      // SPARKWELD 7018-1 (Normal) MUST fall to the 'else' block.
      const isVacuum = name.includes('VACUUM') || name.includes('7024'); 
      const is6013 = name.includes('6013');
      const isContainer = name.includes('CONTAINER') || name.includes('NI');
      
      let packetId = '';
      let cartonId = '';
      
      // Logic mapping
      if (is6013) {
        packetId = 'PD1001'; // Default 6013 Packet
        cartonId = 'PC1003'; // Default 6013 Carton (F14)
      } else if (isVacuum) {
        packetId = 'PD1006'; // Plain Vac-PACKETS (G9)
        cartonId = 'PC1005'; // CARTON - VACCUM
        
        // SPECIAL RULE: "Whatever number we enter in F9 (PD1006) same data we enter on F27 (VP1002)"
        // So we increment Foil Bag usage too
        const currentFoil = issuedMap.get('VP1002') || 0;
        issuedMap.set('VP1002', currentFoil + r.duplesPkt);
      } else if (isContainer) {
        // Handle Containers
        // NiFe -> Silver (PB1001)
        // Ni   -> Gold (PB1002) [F29]
        packetId = name.includes('NIFE') ? 'PB1001' : 'PB1002';
        
        // SHARED RESOURCE RULE:
        // Ni/NiFe products are packed in Containers (PacketID above)
        // BUT they are placed inside 6013 Cartons (PC1003) [F14]
        cartonId = 'PC1003'; 
      } else {
        // Fallback for 7018 Normal, 7018-1 Normal, 8018 Normal
        // Default to PD1002 (Main 7018 Packet) as primary default
        packetId = 'PD1002';
        cartonId = 'PC1002';
      }

      // Add Packets Used
      if (packetId) {
        const currentPkt = issuedMap.get(packetId) || 0;
        issuedMap.set(packetId, currentPkt + r.duplesPkt);
      }

      // Add Cartons Used
      if (cartonId) {
        const currentCtn = issuedMap.get(cartonId) || 0;
        issuedMap.set(cartonId, currentCtn + r.cartonCtn);
      }
    });

    // 2. Calculate Inwards from Transactions
    const inwardMap = new Map<string, number>();
    transactions.forEach(t => {
      // Inwards are manual additions, usually done AFTER stock take, so we assume they are valid
      const current = inwardMap.get(t.itemId) || 0;
      inwardMap.set(t.itemId, current + t.qty);
    });

    // 3. Combine All
    return MASTER_STOCK_LIST.map(item => {
      const inward = inwardMap.get(item.id) || 0;
      const issued = issuedMap.get(item.id) || 0;
      const available = item.openingStock + inward - issued;
      
      return {
        ...item,
        inward,
        issued,
        available,
        isLow: item.lowStockThreshold ? available <= item.lowStockThreshold : available <= 0
      };
    });

  }, [records, transactions]);

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
          <div className="flex items-center gap-2 text-sm text-gray-500">
             <span>Tracking from:</span>
             <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700 flex items-center gap-1">
               <Calendar size={12} /> {STOCK_CALCULATION_START_DATE}
             </span>
          </div>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text" 
             placeholder="Search items..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full outline-none focus:ring-2 focus:ring-amber-500"
           />
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
                <th className="px-4 py-3 text-right bg-gray-700">BF Qty<br/>(Opening)</th>
                <th className="px-4 py-3 text-right bg-green-900 text-green-100">Inward<br/>(Added)</th>
                <th className="px-4 py-3 text-right bg-red-900 text-red-100">Issue Qty<br/>(Used)</th>
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
                  <td className="px-4 py-3 text-right font-bold text-green-700 bg-green-50">{item.inward > 0 ? `+${item.inward.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600 bg-red-50">{item.issued > 0 ? `-${item.issued.toLocaleString()}` : '-'}</td>
                  <td className={`px-4 py-3 text-right font-bold text-lg ${item.isLow ? 'text-red-600' : 'text-gray-800'} bg-amber-50`}>
                    {item.available.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.remark}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => setInwardModalItem(item)}
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
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

      {/* Inward Modal */}
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
