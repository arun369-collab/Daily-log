
import React, { useMemo, useState } from 'react';
import { ProductionRecord, SalesOrder, StockTransaction, PackingStockItem } from '../types';
import { ClipboardList, AlertTriangle, CheckCircle2, Factory, Package, ArrowRight, User, TrendingUp, Info, Printer, Eye, X, Calendar, Box, Layers, Gauge, ToggleLeft, ToggleRight } from 'lucide-react';
import { getStockTransactions } from '../services/storageService';

// Master Data synchronized with FinishedGoodsStock for 100% consistency
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
  const [includeCapacity, setIncludeCapacity] = useState(true);
  const transactions = useMemo(() => getStockTransactions(), []);

  const formatDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

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

  const canPackAnalysis = useMemo(() => {
    const getS = (id: string) => packingStock.get(id) || 0;
    return [
      {
        line: '6013 Normal',
        capacityKg: Math.min(getS('PD1001') * 4, getS('PC1003') * 16),
        bottleneck: (getS('PD1001') * 4 < getS('PC1003') * 16) ? 'Packets' : 'Cartons',
        details: `Pkts: ${getS('PD1001').toLocaleString()} | Ctns: ${getS('PC1003').toLocaleString()}`
      },
      {
        line: '7018 Normal (5kg)',
        capacityKg: Math.min(getS('PD1002') * 5, getS('PC1002') * 20),
        bottleneck: (getS('PD1002') * 5 < getS('PC1002') * 20) ? 'Packets' : 'Cartons',
        details: `Pkts: ${getS('PD1002').toLocaleString()} | Ctns: ${getS('PC1002').toLocaleString()}`
      },
      {
        line: '7018 Vacuum',
        capacityKg: Math.min(getS('PD1006') * 2, getS('PC1005') * 20, (getS('VP1002') || 0) * 2),
        bottleneck: (getS('PD1006') * 2 <= getS('PC1005') * 20) ? 'Packets' : 'Cartons',
        details: `Vac: ${getS('PD1006').toLocaleString()} | Foil: ${getS('VP1002').toLocaleString()}`
      },
      {
        line: 'Ni / NiFe Containers',
        capacityKg: Math.min((getS('PB1001') + getS('PB1002')) * 1, getS('PC1003') * 10),
        bottleneck: ((getS('PB1001') + getS('PB1002')) * 1 < getS('PC1003') * 10) ? 'Containers' : 'Cartons',
        details: `Boxes: ${(getS('PB1001') + getS('PB1002')).toLocaleString()} | Ctns: ${getS('PC1003').toLocaleString()}`
      }
    ];
  }, [packingStock]);

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
               </tbody>
            </table>
          </div>

          {/* Section 2: Capacity Analysis (Conditional) */}
          {includeCapacity && (
            <div className="mb-8 break-inside-avoid">
              <h3 className="bg-black text-white px-3 py-1 text-sm font-bold uppercase mb-3">Priority 02: Material-Based Packing Capacity</h3>
              <div className="grid grid-cols-2 gap-4">
                {canPackAnalysis.map((item, idx) => (
                  <div key={idx} className="border border-black p-3 font-mono bg-gray-50/50">
                     <div className="font-black text-xs uppercase mb-1">{item.line}</div>
                     <div className="flex justify-between items-center text-[10px]">
                        <span>Max Potential:</span>
                        <span className="font-black">{(item.capacityKg / 1000).toFixed(1)} TONS ({item.capacityKg.toLocaleString()} Kg)</span>
                     </div>
                     <div className="text-[8px] text-gray-500 mt-1 italic font-bold">Bottleneck: {item.bottleneck} | {item.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: RESTORED Order Fulfillment Details */}
          <div className="mb-8">
            <h3 className="bg-black text-white px-3 py-1 text-sm font-bold uppercase mb-3">Priority 03: Sales Order Fulfillment Breakdown</h3>
            <div className="space-y-4">
              {analysis.orderDetails.map(({ order, isReady, shortfallItems }, idx) => (
                <div key={idx} className={`border border-black p-3 break-inside-avoid ${isReady ? 'bg-gray-50' : 'bg-white'}`}>
                   <div className="flex justify-between items-start border-b border-black pb-1 mb-2">
                      <div>
                        <span className="font-black text-sm uppercase text-black">{order.customerName}</span>
                        <span className="ml-2 text-[10px] text-gray-600">PO: {order.poNumber} | PO Date: {formatDDMMYYYY(order.poDate || order.orderDate)}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold border border-black ${isReady ? 'bg-black text-white' : 'text-black'}`}>
                        {isReady ? 'READY TO DISPATCH' : 'INCOMPLETE - MISSING STOCK'}
                      </div>
                   </div>
                   
                   <div className="space-y-1">
                      {isReady ? (
                        order.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex justify-between text-[10px] font-mono border-b border-dotted border-gray-300 text-black py-0.5 last:border-0">
                             <span className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[8px] font-bold">{iIdx + 1}</span>
                                {item.productName} ({item.size})
                             </span>
                             <span className="font-bold text-green-700">{item.calculatedWeightKg.toLocaleString()} kg (IN-STOCK)</span>
                          </div>
                        ))
                      ) : (
                        order.items.map((item, iIdx) => {
                           const key = `${item.productName.toLowerCase().replace(/\s/g, '')}|${item.size.toLowerCase().replace(/\s/g, '')}`;
                           const available = fgStock.get(key) || 0;
                           const isItemReady = available >= item.calculatedWeightKg;
                           return (
                             <div key={iIdx} className="flex justify-between text-[10px] font-mono border-b border-dotted border-gray-300 text-black py-0.5 last:border-0">
                               <span className="flex items-center gap-1.5">
                                  <span className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[8px] font-bold">{iIdx + 1}</span>
                                  {item.productName} ({item.size})
                               </span>
                               {isItemReady ? (
                                 <span className="font-bold text-green-700">{item.calculatedWeightKg.toLocaleString()} kg (OK)</span>
                               ) : (
                                 <span className="font-bold text-red-600">Miss: {(item.calculatedWeightKg - available).toLocaleString()} kg</span>
                               )}
                             </div>
                           );
                        })
                      )}
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Signature */}
          <div className="mt-16 flex justify-between text-[10px] border-t-2 border-black pt-4 text-black break-inside-avoid">
             <div className="w-48 text-center">
                <p className="mb-8">Production Manager</p>
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
                <p className="text-sm font-medium text-gray-500">Shortage Items</p>
                <h3 className="text-2xl font-bold text-indigo-600">{analysis.priorities.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Package size={24}/></div>
            <div>
                <p className="text-sm font-medium text-gray-500">Packing Alerts</p>
                <h3 className="text-2xl font-bold text-red-600">{analysis.materialAlerts.length}</h3>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          {/* Include Capacity Toggle Tab */}
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
             <button 
              onClick={() => setIncludeCapacity(true)}
              className={`flex-1 md:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${includeCapacity ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               <Layers size={14}/> With Capacity
             </button>
             <button 
              onClick={() => setIncludeCapacity(false)}
              className={`flex-1 md:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${!includeCapacity ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               <Layers size={14}/> Orders Only
             </button>
          </div>
          
          <button 
            onClick={() => setViewMode('print')}
            className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all group"
          >
            <Printer size={20} className="group-hover:scale-110 transition-transform" /> 
            Planning Report
          </button>
        </div>
      </div>

      {/* CAN-PACK CAPACITY ANALYZER - Controlled by Tab/Toggle */}
      {includeCapacity && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
           <div className="px-6 py-4 border-b border-gray-100 bg-emerald-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <Gauge size={20} />
                 <h3 className="font-bold">Can-Pack Analysis (Material Bottlenecks)</h3>
              </div>
              <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold uppercase">Based on Packing Stock</div>
           </div>
           <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {canPackAnalysis.map((item, idx) => (
                   <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col justify-between hover:border-emerald-300 transition-colors">
                      <div>
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{item.line}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.capacityKg > 5000 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {item.capacityKg > 0 ? 'Packing Possible' : 'Material Empty'}
                            </span>
                         </div>
                         <div className="text-2xl font-black text-gray-900">{(item.capacityKg / 1000).toFixed(1)} <span className="text-sm font-normal text-gray-400 uppercase">Tons</span></div>
                         <div className="mt-1 text-[10px] text-gray-500 font-mono">{item.details}</div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                         <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="text-gray-400">Limiting Factor:</span>
                            <span className="font-bold text-red-600 uppercase flex items-center gap-1">
                              <AlertTriangle size={10}/> {item.bottleneck}
                            </span>
                         </div>
                         <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full ${item.capacityKg > 5000 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                              style={{ width: `${Math.min(100, (item.capacityKg / 15000) * 100)}%` }}
                            />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Priority Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-indigo-600 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp size={18} /> Production Priority (FIFO PO Date)
            </h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">FIFO Required</span>
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
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
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
                          <div className="text-[10px] text-gray-400">Total Need: {p.totalNeeded.toLocaleString()}</div>
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
                         All pending orders have sufficient finished goods stock.
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
              <User size={18} /> Sales Fulfillment Details
            </h3>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Checklist</div>
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
                                {isReady ? 'Ready' : 'Shortage'}
                              </span>
                           </div>
                           <p className="text-xs text-gray-500 mt-0.5">PO: {order.poNumber} | PO Date: {formatDDMMYYYY(order.poDate || order.orderDate)}</p>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-bold text-indigo-600">{order.totalWeightKg.toLocaleString()} Kg</div>
                           <div className="text-[10px] text-gray-400 uppercase font-bold">{order.items.length} Lines</div>
                        </div>
                     </div>
                     
                     <div className={`p-3 rounded-lg border mt-2 ${isReady ? 'bg-green-100/30 border-green-200' : 'bg-red-50 border-red-100'}`}>
                        <div className="space-y-1.5">
                           {order.items.map((item, iIdx) => {
                             const key = `${item.productName.toLowerCase().replace(/\s/g, '')}|${item.size.toLowerCase().replace(/\s/g, '')}`;
                             const available = fgStock.get(key) || 0;
                             const ok = available >= item.calculatedWeightKg;
                             return (
                               <div key={iIdx} className={`flex justify-between text-xs py-1 border-b last:border-0 ${ok ? 'text-green-900 border-green-100/50' : 'text-red-800 border-red-100/50'}`}>
                                  <span className="flex items-center gap-1.5">
                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-bold ${ok ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}`}>{iIdx + 1}</span>
                                    {item.productName} ({item.size})
                                  </span>
                                  <span className="font-bold">{ok ? `${item.calculatedWeightKg.toLocaleString()} Kg (OK)` : `Missing ${(item.calculatedWeightKg - available).toLocaleString()} Kg`}</span>
                               </div>
                             );
                           })}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
