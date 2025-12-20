
import React, { useMemo, useState } from 'react';
import { ProductionRecord, SalesOrder, StockTransaction, PackingStockItem } from '../types';
import { ClipboardList, AlertTriangle, CheckCircle2, Factory, Package, ArrowRight, User, TrendingUp, Info, Printer, Eye, X, Calendar } from 'lucide-react';
import { getStockTransactions } from '../services/storageService';

// Master Data required for calculations
const MASTER_FG_OPENING = [
  { product: 'SPARKWELD 6013', size: '2.6 x 350', opening: 2214 },
  { product: 'SPARKWELD 6013', size: '3.2 x 350', opening: 4204 },
  { product: 'SPARKWELD 6013', size: '4.0 x 350', opening: 3388 },
  { product: 'SPARKWELD 6013', size: '4.0 x 400', opening: 1575 },
  { product: 'SPARKWELD 6013', size: '5.0 x 350', opening: 148 },
  { product: 'SPARKWELD 7018', size: '2.5 x 350', opening: 2465 },
  { product: 'SPARKWELD 7018', size: '3.2 X 350', opening: 725 },
  { product: 'SPARKWELD 7018', size: '3.2 x 450', opening: 2265 },
  { product: 'SPARKWELD 7018', size: '4.0 X 350', opening: 2220 },
  { product: 'SPARKWELD 7018', size: '5.0 x 350', opening: 235 },
  { product: 'SPARKWELD 7018', size: '5.0 x 450', opening: 135 },
];

const MASTER_PACKING_LIST: PackingStockItem[] = [
  { id: 'PD1001', itemNo: '101458CD004', name: 'PACKETS 6013 - 50 X 70 X 360', openingStock: 30974, unit: 'PCS' },
  { id: 'PD1002', itemNo: '2700011918', name: 'PACKETS 7018 - 60 X 75 X 360 (5.0 KG)', openingStock: 6581, unit: 'PCS' },
  { id: 'PD1004', itemNo: '101458CD003', name: 'PACKETS 7018 - 40 X 60 X 360 (2.5 KG)', openingStock: 16500, unit: 'PCS' },
  { id: 'PD1006', itemNo: '101458CD005', name: 'PLAIN Vac-PACKETS - 50 X 3.5 X 360', openingStock: 15616, unit: 'PCS' },
  { id: 'PC1003', itemNo: '101458CC004', name: 'CARTON - 6013 - 70 X 22 X 370', openingStock: 13229, unit: 'PCS' },
  { id: 'PC1002', itemNo: '101458CC001', name: 'CARTON - 7018 - 90 X 25 X 370', openingStock: 5678, unit: 'PCS' },
  { id: 'PC1005', itemNo: '101458CC007', name: 'CARTON - VACCUM - 30.2X39X8', openingStock: 13019, unit: 'PCS' },
  { id: 'VP1002', itemNo: '', name: 'VACUUM Aluminium FOIL BAG', openingStock: 0, unit: 'PCS' },
  { id: 'PB1001', itemNo: '', name: 'Plastic container Silver colour NiFe', openingStock: 5793, unit: 'PCS' },
  { id: 'PB1002', itemNo: '', name: 'Plastic container Gold colour Ni', openingStock: 2827, unit: 'PCS' }
];

interface ProductionPlanningProps {
  records: ProductionRecord[];
  orders: SalesOrder[];
}

export const ProductionPlanning: React.FC<ProductionPlanningProps> = ({ records, orders }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'print'>('dashboard');
  const transactions = useMemo(() => getStockTransactions(), []);

  // Date Formatter Helper: YYYY-MM-DD to DD-MM-YYYY
  const formatDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // 1. Calculate Real-time FG Stock
  const fgStock = useMemo(() => {
    const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '');
    const stockMap = new Map<string, number>();

    MASTER_FG_OPENING.forEach(item => {
      const key = `${normalize(item.product)}|${normalize(item.size)}`;
      stockMap.set(key, item.opening);
    });

    records.forEach(r => {
      const key = `${normalize(r.productName)}|${normalize(r.size)}`;
      const current = stockMap.get(key) || 0;
      if (r.isReturn || (!r.isDispatch && !r.isReturn)) {
        stockMap.set(key, current + r.weightKg);
      } else if (r.isDispatch) {
        stockMap.set(key, current - r.weightKg);
      }
    });

    orders.forEach(o => {
      if (o.status === 'Dispatched' || o.status === 'Delivered') {
        o.items.forEach(item => {
          const key = `${normalize(item.productName)}|${normalize(item.size)}`;
          const current = stockMap.get(key) || 0;
          stockMap.set(key, current - item.calculatedWeightKg);
        });
      }
    });

    return stockMap;
  }, [records, orders]);

  // 2. Calculate Real-time Packing Material Stock
  const packingStock = useMemo(() => {
    const stockMap = new Map<string, number>();
    MASTER_PACKING_LIST.forEach(item => stockMap.set(item.id, item.openingStock));

    transactions.forEach(txn => {
      const current = stockMap.get(txn.itemId) || 0;
      stockMap.set(txn.itemId, current + txn.qty);
    });

    records.forEach(r => {
      if (r.isReturn || r.isDispatch) return;
      const prodName = r.productName.toUpperCase();
      const approxPktWeight = r.duplesPkt > 0 ? (r.weightKg / r.duplesPkt) : 0;

      if (prodName.includes('6013')) {
        stockMap.set('PD1001', (stockMap.get('PD1001') || 0) - r.duplesPkt);
        stockMap.set('PC1003', (stockMap.get('PC1003') || 0) - r.cartonCtn);
      } else if (prodName.includes('7018')) {
        if (prodName.includes('VACUUM')) {
          stockMap.set('PD1006', (stockMap.get('PD1006') || 0) - r.duplesPkt);
          stockMap.set('PC1005', (stockMap.get('PC1005') || 0) - r.cartonCtn);
          stockMap.set('VP1002', (stockMap.get('VP1002') || 0) - r.duplesPkt);
        } else {
          const pktId = approxPktWeight > 4.5 ? 'PD1002' : 'PD1004';
          stockMap.set(pktId, (stockMap.get(pktId) || 0) - r.duplesPkt);
          stockMap.set('PC1002', (stockMap.get('PC1002') || 0) - r.cartonCtn);
        }
      } else if (prodName.includes('NIFE')) {
        stockMap.set('PB1001', (stockMap.get('PB1001') || 0) - r.duplesPkt);
        stockMap.set('PC1003', (stockMap.get('PC1003') || 0) - r.cartonCtn);
      } else if (prodName.includes('NI')) {
        stockMap.set('PB1002', (stockMap.get('PB1002') || 0) - r.duplesPkt);
        stockMap.set('PC1003', (stockMap.get('PC1003') || 0) - r.cartonCtn);
      }
    });

    return stockMap;
  }, [records, transactions]);

  // 3. Analyze Pending Orders & Priorities
  const analysis = useMemo(() => {
    const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '');
    const pending = orders.filter(o => o.status === 'Pending' || o.status === 'Processing')
                          .sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());

    const shortfallMap = new Map<string, { productName: string, size: string, totalNeeded: number, available: number, shortfall: number, firstOrderDate: string }>();
    const orderDetails: { order: SalesOrder, isReady: boolean, shortfallItems: any[] }[] = [];

    pending.forEach(order => {
      let orderReady = true;
      const orderShortfalls: any[] = [];

      order.items.forEach(item => {
        const key = `${normalize(item.productName)}|${normalize(item.size)}`;
        const available = fgStock.get(key) || 0;
        
        if (available < item.calculatedWeightKg) {
          orderReady = false;
          orderShortfalls.push({ ...item, available });
          
          if (!shortfallMap.has(key)) {
            shortfallMap.set(key, {
              productName: item.productName,
              size: item.size,
              totalNeeded: 0,
              available,
              shortfall: 0,
              // Use PO Date for planning, fallback to orderDate
              firstOrderDate: order.poDate || order.orderDate
            });
          }
          const s = shortfallMap.get(key)!;
          s.totalNeeded += item.calculatedWeightKg;
          s.shortfall = Math.max(0, s.totalNeeded - available);
        }
      });

      orderDetails.push({ order, isReady: orderReady, shortfallItems: orderShortfalls });
    });

    const materialAlerts: { name: string, stock: number, unit: string }[] = [];
    MASTER_PACKING_LIST.forEach(m => {
       const stock = packingStock.get(m.id) || 0;
       if (stock < 500) {
         materialAlerts.push({ name: m.name, stock, unit: m.unit });
       }
    });

    return {
      priorities: Array.from(shortfallMap.values()).sort((a, b) => new Date(a.firstOrderDate).getTime() - new Date(b.firstOrderDate).getTime()),
      orderDetails,
      materialAlerts
    };
  }, [fgStock, packingStock, orders]);

  const handlePrint = () => {
    window.print();
  };

  if (viewMode === 'print') {
    return (
      <div className="fixed inset-0 z-[70] bg-white overflow-auto print:static print:inset-auto print:z-0 print:overflow-visible print:bg-white">
        <div className="print:hidden bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 shadow-md">
          <h2 className="font-bold flex items-center gap-2"><Printer size={18} /> Production Planning Report</h2>
          <div className="flex gap-3">
            <button onClick={() => setViewMode('dashboard')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Back to View</button>
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold flex items-center gap-2">
              <Printer size={16} /> Print Report
            </button>
            <button onClick={() => setViewMode('dashboard')} className="px-4 py-2 bg-red-600 hover:bg-red-50 rounded-lg text-sm"><X size={16}/></button>
          </div>
        </div>

        <div className="max-w-[210mm] mx-auto bg-white p-8 print:p-0 print:m-0 print:max-w-none min-h-screen print:min-h-0 text-black">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Production Planning Report</h1>
              <p className="text-sm font-medium text-gray-600">Based on Active Sales Orders & Live Inventory</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-black">Date: {formatDDMMYYYY(new Date().toISOString().split('T')[0])}</p>
              <p className="text-xs text-gray-500 font-mono">APP_ENV: PRODUCTION_PLAN_V1</p>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-black p-4 text-center">
              <p className="text-[10px] font-bold uppercase text-gray-500">Pending Orders</p>
              <p className="text-2xl font-black text-black">{analysis.orderDetails.length}</p>
            </div>
            <div className="border border-black p-4 text-center">
              <p className="text-[10px] font-bold uppercase text-gray-500">Prod. Shortfall Items</p>
              <p className="text-2xl font-black text-black">{analysis.priorities.length}</p>
            </div>
            <div className="border border-black p-4 text-center">
              <p className="text-[10px] font-bold uppercase text-gray-500">Critical Materials</p>
              <p className="text-2xl font-black text-red-600">{analysis.materialAlerts.length}</p>
            </div>
          </div>

          {/* Section 1: Priorities */}
          <div className="mb-8 break-inside-avoid">
            <h3 className="bg-black text-white px-3 py-1 text-sm font-bold uppercase mb-3">Priority 01: Production Queue (FIFO PO Date)</h3>
            <table className="w-full border-collapse border border-black text-xs">
               <thead>
                 <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1 text-left text-black">Rank</th>
                    <th className="border border-black px-2 py-1 text-left text-black">Product / Description</th>
                    <th className="border border-black px-2 py-1 text-right text-black">Required (Kg)</th>
                    <th className="border border-black px-2 py-1 text-right text-black">In Stock (Kg)</th>
                    <th className="border border-black px-2 py-1 text-right bg-gray-200 text-black">Production Needed</th>
                    <th className="border border-black px-2 py-1 text-center text-black">First PO Date</th>
                 </tr>
               </thead>
               <tbody>
                  {analysis.priorities.map((p, idx) => (
                    <tr key={idx}>
                       <td className="border border-black px-2 py-1 font-bold text-black">{idx + 1}</td>
                       <td className="border border-black px-2 py-1 text-black">{p.productName} ({p.size})</td>
                       <td className="border border-black px-2 py-1 text-right text-black">{p.totalNeeded.toLocaleString()}</td>
                       <td className="border border-black px-2 py-1 text-right text-black">{p.available.toLocaleString()}</td>
                       <td className="border border-black px-2 py-1 text-right font-black text-red-600">{p.shortfall.toLocaleString()} kg</td>
                       <td className="border border-black px-2 py-1 text-center font-mono text-black">{formatDDMMYYYY(p.firstOrderDate)}</td>
                    </tr>
                  ))}
                  {analysis.priorities.length === 0 && (
                    <tr><td colSpan={6} className="border border-black p-4 text-center italic text-gray-500">No shortfall detected. Stock sufficient for all orders.</td></tr>
                  )}
               </tbody>
            </table>
          </div>

          {/* Section 2: Order Fulfillment */}
          <div className="mb-8">
            <h3 className="bg-black text-white px-3 py-1 text-sm font-bold uppercase mb-3">Priority 02: Sales Order Fulfillment Details</h3>
            <div className="space-y-4">
              {analysis.orderDetails.map(({ order, isReady, shortfallItems }, idx) => (
                <div key={idx} className={`border border-black p-3 break-inside-avoid ${isReady ? 'bg-gray-50' : 'bg-white'}`}>
                   <div className="flex justify-between items-start border-b border-black pb-1 mb-2">
                      <div>
                        <span className="font-black text-sm uppercase text-black">{order.customerName}</span>
                        <span className="ml-2 text-[10px] text-gray-600">PO: {order.poNumber} | PO Date: {formatDDMMYYYY(order.poDate || order.orderDate)} | Rep: {order.salesPerson}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold border border-black ${isReady ? 'bg-black text-white' : 'text-black'}`}>
                        {isReady ? 'READY TO DISPATCH' : 'SHORTAGE DETECTED'}
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2">
                      {isReady ? (
                        order.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex justify-between text-[10px] font-mono border-b border-dotted border-gray-300 text-black">
                             <span>{item.productName} ({item.size})</span>
                             <span className="font-bold text-green-700">{item.calculatedWeightKg.toLocaleString()} kg (OK)</span>
                          </div>
                        ))
                      ) : (
                        shortfallItems.map((item, iIdx) => (
                           <div key={iIdx} className="flex justify-between text-[10px] font-mono border-b border-dotted border-gray-300 text-black">
                             <span>{item.productName} ({item.size})</span>
                             <span className="font-bold text-red-600">Miss: {(item.calculatedWeightKg - item.available).toLocaleString()} kg</span>
                           </div>
                        ))
                      )}
                   </div>
                   {isReady && <p className="text-[8px] mt-2 italic text-gray-400 font-mono">Stock successfully reserved for dispatch.</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Material Check */}
          <div className="break-inside-avoid">
            <h3 className="bg-black text-white px-3 py-1 text-sm font-bold uppercase mb-3">Priority 03: Material Shortage Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
               {analysis.materialAlerts.map((alert, idx) => (
                 <div key={idx} className="border border-black p-2 flex justify-between items-center font-mono text-[10px] text-black">
                    <span className="font-bold uppercase text-black">{alert.name}</span>
                    <span className="text-red-600 font-black">Stock: {alert.stock.toLocaleString()} {alert.unit}</span>
                 </div>
               ))}
               {analysis.materialAlerts.length === 0 && (
                 <div className="col-span-2 border border-black p-4 text-center italic text-[10px] text-gray-500">All essential packing materials are currently within safe operating thresholds.</div>
               )}
            </div>
          </div>

          {/* Footer Signature */}
          <div className="mt-16 flex justify-between text-[10px] border-t-2 border-black pt-4 text-black break-inside-avoid">
             <div className="w-48 text-center">
                <p className="mb-8">Production Manager</p>
                <div className="border-b border-black"></div>
             </div>
             <div className="w-48 text-center">
                <p className="mb-8">Sales Coordinator</p>
                <div className="border-b border-black"></div>
             </div>
             <div className="w-48 text-center">
                <p className="mb-8">Managing Director</p>
                <div className="border-b border-black"></div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><ClipboardList size={24}/></div>
            <div>
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <h3 className="text-2xl font-bold text-gray-900">{analysis.orderDetails.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Factory size={24}/></div>
            <div>
                <p className="text-sm font-medium text-gray-500">Products to Produce</p>
                <h3 className="text-2xl font-bold text-indigo-600">{analysis.priorities.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Package size={24}/></div>
            <div>
                <p className="text-sm font-medium text-gray-500">Packing Shortages</p>
                <h3 className="text-2xl font-bold text-red-600">{analysis.materialAlerts.length}</h3>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setViewMode('print')}
          className="w-full md:w-auto px-6 py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all group"
        >
          <Printer size={20} className="group-hover:scale-110 transition-transform" /> 
          Planning Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Priority Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-indigo-600 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp size={18} /> Production Priority (FIFO PO Date)
            </h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-bold uppercase">Urgent List</span>
          </div>
          <div className="p-0 overflow-y-auto max-h-[600px]">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 sticky top-0">
                 <tr>
                    <th className="px-6 py-3 font-medium">Rank</th>
                    <th className="px-6 py-3 font-medium">Product / Size</th>
                    <th className="px-6 py-3 font-medium text-right">Shortfall (Kg)</th>
                    <th className="px-6 py-3 font-medium text-center">First PO Date</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {analysis.priorities.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {idx + 1}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{p.productName}</div>
                          <div className="text-xs text-gray-500 font-mono">{p.size}</div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="text-red-600 font-black">{p.shortfall.toLocaleString()} Kg</div>
                          <div className="text-[10px] text-gray-400">Needed: {p.totalNeeded} | FG: {p.available}</div>
                       </td>
                       <td className="px-6 py-4 text-center">
                          <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {formatDDMMYYYY(p.firstOrderDate)}
                          </div>
                       </td>
                    </tr>
                  ))}
                  {analysis.priorities.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                         <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
                         All pending orders have sufficient stock in FG.
                      </td>
                    </tr>
                  )}
               </tbody>
             </table>
          </div>
        </div>

        {/* Order Fulfillment Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <User size={18} /> Sales Fulfillment Report
            </h3>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">By Order Date</div>
          </div>
          <div className="p-0 overflow-y-auto max-h-[600px]">
             <div className="divide-y divide-gray-100">
                {analysis.orderDetails.map(({ order, isReady, shortfallItems }, idx) => (
                  <div key={idx} className={`p-6 transition-colors ${isReady ? 'bg-green-50/30' : 'bg-white'}`}>
                     <div className="flex justify-between items-start mb-3">
                        <div>
                           <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900">{order.customerName}</h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${isReady ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isReady ? 'Ready' : 'Incomplete'}
                              </span>
                           </div>
                           <p className="text-xs text-gray-500">Rep: {order.salesPerson} | PO: {order.poNumber} | PO Date: {formatDDMMYYYY(order.poDate || order.orderDate)}</p>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-bold text-indigo-600">{order.totalWeightKg.toLocaleString()} Kg</div>
                           <div className="text-[10px] text-gray-400">{order.items.length} Product(s)</div>
                        </div>
                     </div>
                     
                     <div className={`p-3 rounded-lg border mt-2 ${isReady ? 'bg-green-100/30 border-green-200' : 'bg-red-50 border-red-100'}`}>
                        <p className={`text-[10px] font-bold uppercase mb-2 flex items-center gap-1 ${isReady ? 'text-green-700' : 'text-red-600'}`}>
                           {isReady ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />} 
                           {isReady ? 'Order Inventory Status (OK):' : 'Shortfall Alert:'}
                        </p>
                        <div className="space-y-1">
                           {isReady ? (
                             order.items.map((item, iIdx) => (
                               <div key={iIdx} className="flex justify-between text-xs text-green-900">
                                  <span>{item.productName} ({item.size})</span>
                                  <span className="font-bold">{item.calculatedWeightKg.toLocaleString()} Kg</span>
                               </div>
                             ))
                           ) : (
                             shortfallItems.map((item, iIdx) => (
                               <div key={iIdx} className="flex justify-between text-xs text-red-800">
                                  <span>{item.productName} ({item.size})</span>
                                  <span className="font-bold">Missing {(item.calculatedWeightKg - item.available).toLocaleString()} Kg</span>
                               </div>
                             ))
                           )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Raw/Packing Material Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Info size={20}/></div>
            <div>
               <h3 className="font-bold text-gray-800 text-lg">Material Inventory Insights</h3>
               <p className="text-sm text-gray-500">Current packing material availability for upcoming production.</p>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysis.materialAlerts.map((alert, idx) => (
               <div key={idx} className="p-4 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                  <div>
                     <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide truncate w-32">{alert.name}</p>
                     <h4 className="text-xl font-black text-red-700">{alert.stock.toLocaleString()}</h4>
                  </div>
                  <div className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded shadow-sm">
                    {alert.unit}
                  </div>
               </div>
            ))}
            {analysis.materialAlerts.length === 0 && (
               <div className="col-span-full py-6 text-center bg-green-50 rounded-xl border border-green-100 text-green-700 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 size={20} /> All packing materials are above critical threshold.
               </div>
            )}
         </div>
         
         <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-4">
               <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg"><AlertTriangle size={20}/></div>
               <div>
                  <h4 className="font-bold text-indigo-900">Future Raw Material Integration</h4>
                  <p className="text-sm text-indigo-700 mt-1">Chemicals and wire stock analysis will be available soon. The current model prioritize based on Order Age and Finished Good shortfall.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
