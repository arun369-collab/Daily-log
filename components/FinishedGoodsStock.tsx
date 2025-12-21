
import React, { useState, useMemo } from 'react';
import { Warehouse, Download, Search, Info, Calendar, User, Package, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductionRecord, SalesOrder } from '../types';

interface FGDetail {
  date: string;
  reference: string;
  qty: number;
  info?: string;
}

interface FinishedGoodsStockProps {
  records?: ProductionRecord[];
  orders?: SalesOrder[];
}

const MASTER_FINISHED_GOODS = [
  { product: 'SPARKWELD 6013', size: '2.6 x 350', opening: 2214 },
  { product: 'SPARKWELD 6013', size: '3.2 x 350', opening: 4204 },
  { product: 'SPARKWELD 6013', size: '4.0 x 350', opening: 3388 },
  { product: 'SPARKWELD 6013', size: '4.0 x 400', opening: 1575 },
  { product: 'SPARKWELD 6013', size: '5.0 x 350', opening: 148 },
  { product: 'SPARKWELD 7018', size: '2.5 x 350', opening: 2465 },
  { product: 'SPARKWELD 7018', size: '3.2 X 350', opening: 725 },
  { product: 'SPARKWELD 7018', size: '3.2 x 450', opening: 2265 },
  { product: 'SPARKWELD 7018', size: '4.0 X 350', opening: 2220 },
  { product: 'SPARKWELD 7018', size: '4.0 x 450', opening: 0 },
  { product: 'SPARKWELD 7018', size: '5.0 x 350', opening: 235 },
  { product: 'SPARKWELD 7018', size: '5.0 x 450', opening: 135 },
  { product: 'SPARKWELD 7018-1', size: '2.5 x 350', opening: 0 },
  { product: 'SPARKWELD 7018-1', size: '3.2 x 350', opening: 0 },
  { product: 'SPARKWELD 7018-1', size: '3.2 X 450', opening: 15 },
  { product: 'SPARKWELD 7018-1', size: '4.0 X 350', opening: 265 },
  { product: 'SPARKWELD 7018-1', size: '4.0 X 450', opening: 35 },
  { product: 'SPARKWELD 7018-1', size: '5.0 X 350', opening: 0 },
  { product: 'SPARKWELD 7018-1', size: '5.0 X 450', opening: 0 },
  { product: 'VACUUM 7018', size: '2.5 X 350', opening: 0 },
  { product: 'VACUUM 7018', size: '3.2 X 350', opening: 40 },
  { product: 'VACUUM 7018', size: '4.0 X 350', opening: 154 },
  { product: 'VACUUM 7018', size: '5.0 X 350', opening: 2 },
  { product: 'VACUUM 7018-1', size: '2.5 X 350', opening: 532 },
  { product: 'VACUUM 7018-1', size: '3.2 X 350', opening: 298 },
  { product: 'VACUUM 7018-1', size: '4.0 X 350', opening: 8 },
  { product: 'SPARKWELD Ni', size: '2.5 x 350', opening: 0 },
  { product: 'SPARKWELD Ni', size: '3.2 x 350', opening: 268 },
  { product: 'SPARKWELD Ni', size: '4.0 x 350', opening: 15 },
  { product: 'SPARKWELD NiFe', size: '2.5 x 350', opening: 0 },
  { product: 'SPARKWELD NiFe', size: '3.2 x 350', opening: 156 },
  { product: 'SPARKWELD NiFe', size: '4.0 x 350', opening: 93 },
  { product: 'VACUUM 8018-C3', size: '2.5 x 350', opening: 2 },
  { product: 'VACUUM 8018-C3', size: '3.2 x 350', opening: 2834 },
  { product: 'VACUUM 8018-C3', size: '4.0 x 350', opening: 534 },
  { product: 'SPARKWELD 8018-C3', size: '2.5 x 350', opening: 0 },
  { product: 'SPARKWELD 8018-C3', size: '3.2 x 350', opening: 0 },
  { product: 'SPARKWELD 8018-C3', size: '4.0 x 350', opening: 0 },
  { product: 'SPARKWELD 7024', size: '2.6 x 350', opening: 0 },
  { product: 'SPARKWELD 7024', size: '3.2 x 350', opening: 156 },
  { product: 'SPARKWELD 7024', size: '4.0 x 450', opening: 880 },
  { product: 'SPARKWELD 7024', size: '5.0 x 350', opening: 0 },
  { product: 'VACUUM 8018-B2', size: '2.5 x 350', opening: 0 },
  { product: 'VACUUM 8018-B2', size: '3.2 x 350', opening: 318 },
  { product: 'VACUUM 8018-B2', size: '4.0 x 350', opening: 106 },
  { product: 'VACUUM 10018-M', size: '3.2 x 350', opening: 92 },
  { product: 'VACUUM 10018-G', size: '3.2 x 350', opening: 0 },
  { product: 'VACUUM 10018-D2', size: '4.0 x 350', opening: 30 },
  { product: 'VACUUM 8018-G', size: '2.5 x 350', opening: 106 },
  { product: 'VACUUM 8018-G', size: '3.2 x 350', opening: 86 },
  { product: 'VACUUM 8018-G', size: '4.0 x 350', opening: 284 },
];

export const FinishedGoodsStock: React.FC<FinishedGoodsStockProps> = ({ records = [], orders = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoveredBreakdown, setHoveredBreakdown] = useState<{
    x: number;
    y: number;
    data: FGDetail[];
    title: string;
    type: 'PRODUCTION' | 'RETURN' | 'DESPATCH';
  } | null>(null);

  const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '');

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    const pts = dateStr.split('-');
    if (pts.length !== 3) return dateStr;
    const mos = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${pts[2]} ${mos[parseInt(pts[1]) - 1]} ${pts[0]}`;
  };

  const tableData = useMemo(() => {
    return MASTER_FINISHED_GOODS.map(item => {
      const normName = normalize(item.product);
      const normSize = normalize(item.size);

      // --- CALCULATE OPENING BALANCE AS OF START OF SELECTED DATE (Dec 1st filter) ---
      const prevProduction = records
        .filter(r => normalize(r.productName) === normName && normalize(r.size) === normSize && !r.isReturn && !r.isDispatch && r.date >= '2025-12-01' && r.date < selectedDate)
        .reduce((sum, r) => sum + r.weightKg, 0);

      const prevReturn = records
        .filter(r => normalize(r.productName) === normName && normalize(r.size) === normSize && r.isReturn && r.date >= '2025-12-01' && r.date < selectedDate)
        .reduce((sum, r) => sum + r.weightKg, 0);

      const prevManualDispatch = records
        .filter(r => normalize(r.productName) === normName && normalize(r.size) === normSize && r.isDispatch && r.date >= '2025-12-01' && r.date < selectedDate)
        .reduce((sum, r) => sum + r.weightKg, 0);

      const prevOrderDispatch = orders
        .filter(o => (o.status === 'Dispatched' || o.status === 'Delivered') && o.orderDate >= '2025-12-01' && o.orderDate < selectedDate)
        .reduce((orderSum, order) => {
           return orderSum + order.items
             .filter(i => normalize(i.productName) === normName && normalize(i.size) === normSize)
             .reduce((iSum, i) => iSum + i.calculatedWeightKg, 0);
        }, 0);

      const openingBalance = item.opening + prevProduction + prevReturn - prevManualDispatch - prevOrderDispatch;

      // --- CALCULATE ACTIVITY FOR EXACT SELECTED DATE ---
      const productionBreakdown: FGDetail[] = records
        .filter(r => normalize(r.productName) === normName && normalize(r.size) === normSize && !r.isReturn && !r.isDispatch && r.date === selectedDate)
        .map(r => ({ date: r.date, reference: r.batchNo, qty: r.weightKg }));

      const productionQty = productionBreakdown.reduce((sum, b) => sum + b.qty, 0);

      const returnBreakdown: FGDetail[] = records
        .filter(r => normalize(r.productName) === normName && normalize(r.size) === normSize && r.isReturn && r.date === selectedDate)
        .map(r => ({ date: r.date, reference: r.batchNo, qty: r.weightKg, info: r.notes }));

      const returnQty = returnBreakdown.reduce((sum, b) => sum + b.qty, 0);

      const manualDispatchBreakdown: FGDetail[] = records
        .filter(r => normalize(r.productName) === normName && normalize(r.size) === normSize && r.isDispatch && r.date === selectedDate)
        .map(r => ({ date: r.date, reference: r.batchNo || 'Manual', qty: r.weightKg, info: r.notes }));

      const orderDispatchBreakdown: FGDetail[] = [];
      orders
        .filter(o => (o.status === 'Dispatched' || o.status === 'Delivered') && o.orderDate === selectedDate)
        .forEach(order => {
           order.items
             .filter(i => normalize(i.productName) === normName && normalize(i.size) === normSize)
             .forEach(i => {
               orderDispatchBreakdown.push({
                 date: order.orderDate,
                 reference: order.poNumber || 'No PO',
                 qty: i.calculatedWeightKg,
                 info: order.customerName
               });
             });
        });

      const despatchBreakdown = [...manualDispatchBreakdown, ...orderDispatchBreakdown];
      const despatchQty = despatchBreakdown.reduce((sum, b) => sum + b.qty, 0);

      return {
        ...item,
        dynamicOpening: openingBalance,
        production: productionQty,
        productionBreakdown,
        return: returnQty,
        returnBreakdown,
        despatch: despatchQty,
        despatchBreakdown,
        currentStock: openingBalance + productionQty + returnQty - despatchQty
      };
    });
  }, [records, orders, selectedDate]);

  const filteredData = tableData.filter(item => 
    item.product.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.size.includes(searchTerm)
  );

  const totalOpening = filteredData.reduce((acc, curr) => acc + curr.dynamicOpening, 0);
  const totalProduction = filteredData.reduce((acc, curr) => acc + curr.production, 0);
  const totalReturn = filteredData.reduce((acc, curr) => acc + curr.return, 0);
  const totalDespatch = filteredData.reduce((acc, curr) => acc + curr.despatch, 0);
  const totalStock = filteredData.reduce((acc, curr) => acc + curr.currentStock, 0);

  const adjustDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleExport = () => {
    const headers = ["Product", "Size", `BF Qty (${selectedDate})`, "Production", "Return", "Despatch", "Closing Stock"];
    const rows = filteredData.map(r => [
      `"${r.product}"`, r.size, r.dynamicOpening, r.production, r.return, r.despatch, r.currentStock
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FG_Stock_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-700">
            <Warehouse size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Finished Goods Stock</h2>
            <p className="text-sm text-gray-500">Live Inventory Performance</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Search product..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full outline-none focus:ring-2 focus:ring-emerald-500"
             />
           </div>
           <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
           >
             <Download size={18} /> <span className="hidden md:inline">Export</span>
           </button>
        </div>
      </div>

      <div className="bg-white shadow-lg border border-gray-300 overflow-hidden relative">
        <div className="bg-[#4472c4] text-white text-center py-2 font-bold text-lg border-b border-gray-400 uppercase tracking-wider">
          Finished Goods Daily Stock Report
        </div>
        
        <div className="bg-white border-b border-black flex justify-between items-center px-4 py-2">
          <div className="flex items-center gap-2">
             <button onClick={() => adjustDate(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors">
               <ChevronLeft size={20} />
             </button>
             <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 pr-3 py-1 border border-emerald-200 rounded font-bold text-emerald-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50/30"
                />
             </div>
             <button onClick={() => adjustDate(1)} className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors">
               <ChevronRight size={20} />
             </button>
          </div>
          <div className="bg-yellow-300 border border-black px-4 py-1 font-black text-black text-xs uppercase tracking-tighter">
             Report Date: {formatFriendlyDate(selectedDate)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
               <tr className="text-black uppercase">
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-left font-bold">Product</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-center font-bold w-32">Size</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-32">BF Qty<br/><span className="text-[10px] font-normal italic">Opening</span></th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-24">Production</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-24">Return</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-24">Despatch</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-32 bg-amber-500">Closing</th>
               </tr>
            </thead>
            <tbody>
               {filteredData.map((row) => (
                 <tr key={`${row.product}-${row.size}`} className="hover:bg-gray-50 group">
                    <td className="border border-black px-3 py-1 font-bold bg-[#e2efda] text-black">
                      {row.product}
                    </td>
                    <td className="border border-black px-3 py-1 text-center font-bold bg-[#e2efda] text-black">
                      {row.size}
                    </td>
                    <td className="border border-black px-3 py-1 text-right font-bold bg-[#e2efda] text-black">
                      {row.dynamicOpening.toLocaleString()}
                    </td>
                    <td 
                      onMouseEnter={(e) => {
                        if (row.production <= 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBreakdown({ x: rect.right, y: rect.top, data: row.productionBreakdown, title: row.product, type: 'PRODUCTION' });
                      }}
                      onMouseLeave={() => setHoveredBreakdown(null)}
                      className={`border border-black px-3 py-1 text-right bg-[#e2efda] font-bold transition-colors ${row.production > 0 ? 'text-blue-700 cursor-help hover:bg-blue-50' : 'text-gray-400'}`}
                    >
                      {row.production > 0 ? `+${row.production.toLocaleString()}` : '-'}
                    </td>
                    <td 
                      onMouseEnter={(e) => {
                        if (row.return <= 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBreakdown({ x: rect.right, y: rect.top, data: row.returnBreakdown, title: row.product, type: 'RETURN' });
                      }}
                      onMouseLeave={() => setHoveredBreakdown(null)}
                      className={`border border-black px-3 py-1 text-right bg-[#e2efda] font-bold transition-colors ${row.return > 0 ? 'text-orange-600 cursor-help hover:bg-orange-50' : 'text-gray-400'}`}
                    >
                      {row.return > 0 ? `+${row.return.toLocaleString()}` : '-'}
                    </td>
                    <td 
                      onMouseEnter={(e) => {
                        if (row.despatch <= 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBreakdown({ x: rect.right, y: rect.top, data: row.despatchBreakdown, title: row.product, type: 'DESPATCH' });
                      }}
                      onMouseLeave={() => setHoveredBreakdown(null)}
                      className={`border border-black px-3 py-1 text-right bg-[#e2efda] font-bold transition-colors ${row.despatch > 0 ? 'text-red-700 cursor-help hover:bg-red-50' : 'text-gray-400'}`}
                    >
                      {row.despatch > 0 ? `-${row.despatch.toLocaleString()}` : '-'}
                    </td>
                    <td className="border border-black px-3 py-1 text-right font-bold bg-[#e2efda] text-black">
                       {row.currentStock.toLocaleString()}
                    </td>
                 </tr>
               ))}
               <tr className="bg-yellow-100 font-bold border-t-2 border-black text-black">
                  <td className="border border-black px-3 py-2 text-right" colSpan={2}>Grand Total Activity:</td>
                  <td className="border border-black px-3 py-2 text-right">{totalOpening.toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right text-blue-700">{totalProduction.toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right text-orange-600">{totalReturn.toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right text-red-700">{totalDespatch.toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right">{totalStock.toLocaleString()}</td>
               </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOAT BREAKDOWN TOOLTIP - UPDATED FOR SCREEN FIT AND DESPATCH DETAILS */}
      {hoveredBreakdown && (
        <div 
          className="fixed z-[100] bg-white border border-gray-300 shadow-2xl rounded-xl overflow-hidden animate-fadeIn min-w-[280px] max-w-[320px]"
          style={{ 
            left: (hoveredBreakdown.x + 300 > window.innerWidth) 
              ? hoveredBreakdown.x - 310 
              : hoveredBreakdown.x + 10, 
            top: hoveredBreakdown.y 
          }}
        >
          <div className={`px-4 py-2 text-[11px] font-black uppercase text-white flex justify-between items-center ${
            hoveredBreakdown.type === 'PRODUCTION' ? 'bg-blue-600' :
            hoveredBreakdown.type === 'RETURN' ? 'bg-orange-600' : 'bg-red-600'
          }`}>
            <span>{hoveredBreakdown.type} Breakdown</span>
            <span className="opacity-70 text-[9px] font-normal">{hoveredBreakdown.data.length} Entry(s)</span>
          </div>
          <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
             {hoveredBreakdown.data.map((b, i) => (
               <div key={i} className="flex justify-between items-start text-[11px] border-b border-gray-100 last:border-0 pb-2">
                  <div className="flex-1 pr-4">
                    <span className="font-bold text-gray-900 block leading-tight">
                      {hoveredBreakdown.type === 'DESPATCH' ? (b.info || 'Manual Transfer') : b.reference}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono mt-0.5 block uppercase">
                      {hoveredBreakdown.type === 'DESPATCH' ? `PO Ref: ${b.reference}` : (b.info || 'Daily Production')}
                    </span>
                  </div>
                  <span className={`font-mono font-black text-xs whitespace-nowrap ${
                    hoveredBreakdown.type === 'DESPATCH' ? 'text-red-600' : 'text-green-700'
                  }`}>
                    {hoveredBreakdown.type === 'DESPATCH' ? '-' : '+'}{b.qty.toLocaleString()} <span className="text-[9px] font-normal opacity-60">kg</span>
                  </span>
               </div>
             ))}
          </div>
          <div className="bg-gray-50 px-4 py-1.5 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
             <span>Sub-Total:</span>
             <span className={hoveredBreakdown.type === 'DESPATCH' ? 'text-red-600' : 'text-green-700'}>
               {hoveredBreakdown.data.reduce((sum, item) => sum + item.qty, 0).toLocaleString()} kg
             </span>
          </div>
        </div>
      )}
    </div>
  );
};
