
import React, { useState, useMemo } from 'react';
import { ProductionRecord, PackingStockItem, StockTransaction } from '../types';
import { getStockTransactions, saveStockTransaction, deleteStockTransaction } from '../services/storageService';
import { Package, Plus, ArrowDown, Search, RefreshCw, Lock, AlertTriangle, Calendar, History, Trash2, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCT_CATALOG } from '../data/products';

// Records ON or AFTER this date will be deducted from Opening Stock.
const STOCK_CALCULATION_START_DATE = '2025-12-01';

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [inwardModalItem, setInwardModalItem] = useState<PackingStockItem | null>(null);
  const [inwardQty, setInwardQty] = useState('');
  const [inwardDate, setInwardDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [hoveredBreakdown, setHoveredBreakdown] = useState<{
    x: number;
    y: number;
    data: BreakdownItem[];
    itemName: string;
    type: 'INWARD' | 'ISSUE';
  } | null>(null);
  
  const [transactions, setTransactions] = useState<StockTransaction[]>(getStockTransactions());

  // FIXED MAPPING LOGIC FOR 6013
  const resolveMaterialIds = (record: ProductionRecord): { packetId: string | null, cartonId: string | null } => {
    const prodName = record.productName.toUpperCase();
    const size = record.size;
    const approxPktWeight = record.duplesPkt > 0 ? (record.weightKg / record.duplesPkt) : 0;

    let packetId: string | null = null;
    let cartonId: string | null = null;

    if (prodName.includes('NI') || prodName.includes('NIFE')) {
        if (prodName.includes('NIFE')) packetId = 'PB1001';
        else packetId = 'PB1002';
        cartonId = 'PC1003'; 
    } 
    else if (prodName.includes('VACUUM')) {
        if (prodName.includes('7018') && size.includes('350')) {
             packetId = 'PD1006';
             cartonId = 'PC1005';
        } else {
             if (approxPktWeight >= 1.5 && approxPktWeight <= 2.5) packetId = 'PD1006';
             cartonId = 'PC1005';
        }
    } 
    else {
        if (prodName.includes('6013')) {
           cartonId = 'PC1003';
           // Fixed: Ensure 6013 always maps to PD1001 unless it's a specific instruction for something else
           // We removed the threshold check that was causing drift into PD1005
           packetId = 'PD1001';
        }
        else if (prodName.includes('7018')) {
           cartonId = 'PC1002';
           if (approxPktWeight > 4.5) packetId = 'PD1002';
           else if (approxPktWeight > 2.0 && approxPktWeight < 3.0) packetId = 'PD1004';
           else packetId = 'PD1002';
        }
    }
    return { packetId, cartonId };
  };

  const { stockData } = useMemo(() => {
    const calculatedData = MASTER_STOCK_LIST.map(item => ({
      ...item,
      dynamicOpening: item.openingStock,
      inward: 0,
      issued: 0,
      available: item.openingStock,
      breakdown: [] as BreakdownItem[],
      inwardBreakdown: [] as BreakdownItem[]
    }));

    transactions.forEach(txn => {
        const item = calculatedData.find(i => i.id === txn.itemId);
        if (item) {
            if (txn.date < selectedDate) {
                item.dynamicOpening += txn.qty;
                item.available += txn.qty;
            } else if (txn.date === selectedDate) {
                item.inward += txn.qty;
                item.available += txn.qty;
                item.inwardBreakdown.push({
                  date: txn.date,
                  batch: txn.notes || 'Manual Add',
                  qty: txn.qty
                });
            }
        }
    });

    records.forEach(record => {
        if (record.date < STOCK_CALCULATION_START_DATE || record.isReturn || record.isDispatch) return;
        
        const { packetId, cartonId } = resolveMaterialIds(record);

        if (packetId) {
            const pktItem = calculatedData.find(i => i.id === packetId);
            if (pktItem) {
                if (record.date < selectedDate) {
                    pktItem.dynamicOpening -= record.duplesPkt;
                    pktItem.available -= record.duplesPkt;
                } else if (record.date === selectedDate) {
                    pktItem.issued += record.duplesPkt;
                    pktItem.available -= record.duplesPkt;
                    pktItem.breakdown.push({ date: record.date, batch: record.batchNo, qty: record.duplesPkt });
                }
            }
            if (packetId === 'PD1006') {
                 const foilItem = calculatedData.find(i => i.id === 'VP1002');
                 if (foilItem) {
                     if (record.date < selectedDate) {
                         foilItem.dynamicOpening -= record.duplesPkt;
                         foilItem.available -= record.duplesPkt;
                     } else if (record.date === selectedDate) {
                         foilItem.issued += record.duplesPkt;
                         foilItem.available -= record.duplesPkt;
                         foilItem.breakdown.push({ date: record.date, batch: record.batchNo, qty: record.duplesPkt });
                     }
                 }
            }
        }
        
        if (cartonId) {
            const ctnItem = calculatedData.find(i => i.id === cartonId);
            if (ctnItem) {
                if (record.date < selectedDate) {
                    ctnItem.dynamicOpening -= record.cartonCtn;
                    ctnItem.available -= record.cartonCtn;
                } else if (record.date === selectedDate) {
                    ctnItem.issued += record.cartonCtn;
                    ctnItem.available -= record.cartonCtn;
                    ctnItem.breakdown.push({ date: record.date, batch: record.batchNo, qty: record.cartonCtn });
                }
            }
        }
    });

    return { stockData: calculatedData };
  }, [records, transactions, selectedDate, refreshKey]);

  const handleSaveInward = () => {
    if (!inwardModalItem || !inwardQty || !inwardDate) return;
    const txn: StockTransaction = {
      id: crypto.randomUUID(),
      itemId: inwardModalItem.id,
      date: inwardDate,
      qty: Number(inwardQty),
      type: 'INWARD',
      notes: 'Manual Entry'
    };
    setTransactions(saveStockTransaction(txn));
    setInwardModalItem(null);
    setInwardQty('');
  };

  const adjustDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Delete this inward entry?")) {
        setTransactions(deleteStockTransaction(id));
    }
  };

  const filteredStock = stockData.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const headers = ["ID", "Item No", "Product Name", `Opening (${selectedDate})`, "Daily Inward", "Daily Issues", "Available", "Unit", "Remark"];
    const rows = filteredStock.map(r => [
      r.id, r.itemNo, `"${r.name}"`, r.dynamicOpening, r.inward, r.issued, r.available, r.unit, `"${r.remark}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Packing_Stock_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-amber-100 p-3 rounded-lg text-amber-700">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Packing Stock</h2>
            <p className="text-sm text-gray-500">Inventory Tracking by Date</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Search materials..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full outline-none focus:ring-2 focus:ring-amber-500"
             />
           </div>
           <button 
             onClick={() => setShowHistoryModal(true)}
             className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors shadow-sm"
             title="Inward History Log"
           >
             <History size={20} />
           </button>
           <button 
             onClick={() => setRefreshKey(k => k + 1)}
             className="p-2 bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition-colors shadow-sm"
             title="Refresh Calculations"
           >
             <RefreshCw size={20} />
           </button>
           <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
           >
             <Download size={18} /> <span className="hidden md:inline">Export</span>
           </button>
        </div>
      </div>

      <div className="bg-white shadow-lg border border-gray-300 overflow-hidden">
        <div className="bg-[#4472c4] text-white text-center py-2 font-bold text-lg border-b border-gray-400 uppercase tracking-wider">
          Packing Material Daily Stock Report
        </div>
        
        <div className="bg-white border-b border-black flex justify-between items-center px-4 py-2">
          <div className="flex items-center gap-2">
             <button onClick={() => adjustDate(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors">
               <ChevronLeft size={20} />
             </button>
             <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600" size={16} />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 pr-3 py-1 border border-amber-200 rounded font-bold text-amber-800 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50/30"
                />
             </div>
             <button onClick={() => adjustDate(1)} className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors">
               <ChevronRight size={20} />
             </button>
          </div>
          <div className="bg-yellow-300 border border-black px-4 py-1 font-black text-black text-xs uppercase tracking-tighter">
             Report Date: {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
               <tr className="text-black uppercase">
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-left font-bold w-12">ID</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-left font-bold">Product Name</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-32">BF Qty<br/><span className="text-[10px] font-normal italic">Opening</span></th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-24">Inward</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-24">Issues</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-32 bg-amber-500">Closing</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-center font-bold w-20">Action</th>
               </tr>
            </thead>
            <tbody>
               {filteredStock.map((row) => (
                 <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border border-black px-3 py-1 font-mono text-xs bg-[#e2efda] text-black">
                      {row.id}
                    </td>
                    <td className="border border-black px-3 py-1 font-bold bg-[#e2efda] text-black">
                      {row.name}
                      {row.available <= 500 && (
                        <span className="ml-2 text-[10px] text-red-600 bg-white border border-red-200 px-1 rounded animate-pulse">Low Stock</span>
                      )}
                    </td>
                    <td className="border border-black px-3 py-1 text-right font-bold bg-[#e2efda] text-black">
                      {row.dynamicOpening.toLocaleString()}
                    </td>
                    
                    <td 
                      onMouseEnter={(e) => {
                        if (row.inward <= 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBreakdown({ x: rect.right, y: rect.top, data: row.inwardBreakdown, itemName: row.name, type: 'INWARD' });
                      }}
                      onMouseLeave={() => setHoveredBreakdown(null)}
                      className={`border border-black px-3 py-1 text-right bg-[#e2efda] font-bold transition-colors ${row.inward > 0 ? 'text-green-700 cursor-help hover:bg-blue-50' : 'text-gray-400'}`}
                    >
                      {row.inward > 0 ? `+${row.inward.toLocaleString()}` : '-'}
                    </td>
                    
                    <td 
                      onMouseEnter={(e) => {
                        if (row.issued <= 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBreakdown({ x: rect.right, y: rect.top, data: row.breakdown, itemName: row.name, type: 'ISSUE' });
                      }}
                      onMouseLeave={() => setHoveredBreakdown(null)}
                      className={`border border-black px-3 py-1 text-right bg-[#e2efda] font-bold transition-colors ${row.issued > 0 ? 'text-red-700 cursor-help hover:bg-red-50' : 'text-gray-400'}`}
                    >
                      {row.issued > 0 ? `-${row.issued.toLocaleString()}` : '-'}
                    </td>
                    
                    <td className={`border border-black px-3 py-1 text-right font-bold bg-[#e2efda] text-lg ${row.available <= 500 ? 'text-red-700' : 'text-black'}`}>
                       {row.available.toLocaleString()}
                    </td>

                    <td className="border border-black px-3 py-1 text-center bg-[#e2efda]">
                      <button 
                        onClick={() => { setInwardModalItem(row); setInwardDate(selectedDate); }}
                        className="p-1 bg-white border border-black rounded hover:bg-blue-50 text-blue-700 transition-colors shadow-sm"
                        title="Add Stock"
                      >
                        <Plus size={16} />
                      </button>
                    </td>
                 </tr>
               ))}
               
               <tr className="bg-yellow-100 font-bold border-t-2 border-black text-black">
                  <td className="border border-black px-3 py-2 text-right" colSpan={2}>Grand Daily Activity:</td>
                  <td className="border border-black px-3 py-2 text-right">{filteredStock.reduce((acc, curr) => acc + curr.dynamicOpening, 0).toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right text-green-700">+{filteredStock.reduce((acc, curr) => acc + curr.inward, 0).toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right text-red-700">-{filteredStock.reduce((acc, curr) => acc + curr.issued, 0).toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right text-lg">{filteredStock.reduce((acc, curr) => acc + curr.available, 0).toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 bg-gray-100"></td>
               </tr>
            </tbody>
          </table>
        </div>
      </div>

      {hoveredBreakdown && (
        <div 
          className="fixed z-50 bg-white shadow-2xl border border-black rounded-sm p-0 w-80 text-xs pointer-events-none overflow-hidden animate-fadeIn"
          style={{ 
            left: Math.max(10, hoveredBreakdown.x - 320), 
            top: hoveredBreakdown.y > window.innerHeight / 2 ? 'auto' : hoveredBreakdown.y - 10,
            bottom: hoveredBreakdown.y > window.innerHeight / 2 ? window.innerHeight - hoveredBreakdown.y - 10 : 'auto'
          }}
        >
          <div className={`${hoveredBreakdown.type === 'INWARD' ? 'bg-green-700' : 'bg-red-700'} text-white px-3 py-1.5 font-bold flex justify-between`}>
             <span className="truncate w-48">{hoveredBreakdown.itemName}</span>
             <span>{hoveredBreakdown.type} ON {selectedDate}</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
             <table className="w-full">
                <thead className="bg-gray-100 text-gray-800 border-b border-black">
                   <tr>
                      <th className="px-2 py-1 text-left font-bold">Reference</th>
                      <th className="px-2 py-1 text-right font-bold">Qty</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                   {hoveredBreakdown.data
                     .map((entry, idx) => (
                      <tr key={idx} className="hover:bg-yellow-50">
                         <td className="px-2 py-1 font-mono text-gray-600 truncate">{entry.batch}</td>
                         <td className={`px-2 py-1 text-right font-bold ${hoveredBreakdown.type === 'INWARD' ? 'text-green-700' : 'text-red-700'}`}>{entry.qty.toLocaleString()}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          <div className="bg-gray-50 px-3 py-1 border-t border-black text-right font-bold text-black uppercase tracking-tighter">
             Daily {hoveredBreakdown.type}: {hoveredBreakdown.data.reduce((acc, curr) => acc + curr.qty, 0).toLocaleString()}
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] border border-black">
            <div className="bg-gray-800 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History size={20} /> Inward Transaction History
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1">
               <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-[#70ad47] text-black sticky top-0 border-b-2 border-black">
                   <tr>
                     <th className="px-6 py-3 font-bold">Date</th>
                     <th className="px-6 py-3 font-bold">Item Description</th>
                     <th className="px-6 py-3 font-bold text-right">Qty Added</th>
                     <th className="px-6 py-3 font-bold text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-300">
                   {transactions.map(txn => {
                     const item = MASTER_STOCK_LIST.find(i => i.id === txn.itemId);
                     return (
                       <tr key={txn.id} className="hover:bg-[#e2efda]/50">
                         <td className="px-6 py-3 font-bold text-gray-800 whitespace-nowrap border-r border-gray-200">{txn.date}</td>
                         <td className="px-6 py-3 border-r border-gray-200">
                           <div className="font-bold text-gray-900">{item?.name || txn.itemId}</div>
                           <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Reference: {txn.notes}</div>
                         </td>
                         <td className="px-6 py-3 text-right font-mono font-bold text-green-700 bg-green-50/20 border-r border-gray-200">
                           +{txn.qty.toLocaleString()}
                         </td>
                         <td className="px-6 py-3 text-center">
                           <button 
                             onClick={() => handleDeleteTransaction(txn.id)}
                             className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-200 shadow-sm"
                             title="Delete Inward"
                           >
                             <Trash2 size={16} />
                           </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {inwardModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn border-2 border-black">
            <div className="bg-[#4472c4] px-6 py-4 border-b border-black">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowDown size={20} /> STOCK INWARD
              </h3>
              <p className="text-blue-100 text-[10px] font-bold uppercase truncate mt-1">{inwardModalItem.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Receipt Date</label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                   <input 
                     type="date" 
                     value={inwardDate}
                     onChange={(e) => setInwardDate(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 border border-black rounded focus:ring-1 focus:ring-blue-500 outline-none font-bold text-sm"
                   />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quantity to Add ({inwardModalItem.unit})</label>
                <input 
                  type="number" 
                  autoFocus
                  value={inwardQty}
                  onChange={(e) => setInwardQty(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black rounded focus:ring-0 outline-none text-2xl font-bold text-center"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setInwardModalItem(null)}
                  className="flex-1 py-3 text-gray-600 hover:bg-gray-100 border border-gray-300 rounded font-bold text-sm"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleSaveInward}
                  className="flex-1 py-3 bg-[#70ad47] text-black border border-black rounded font-black text-sm hover:bg-[#5a8a3a] shadow-lg"
                >
                  SAVE INWARD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
