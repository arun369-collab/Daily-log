
import React, { useMemo } from 'react';
import { ProductionRecord, SalesOrder, StockTransaction, PackingStockItem } from '../types';
import { ClipboardList, AlertTriangle, CheckCircle2, Factory, Package, ArrowRight, User, TrendingUp, Info } from 'lucide-react';
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
  // ... and others
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
  const transactions = useMemo(() => getStockTransactions(), []);

  // 1. Calculate Real-time FG Stock
  const fgStock = useMemo(() => {
    const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '');
    const stockMap = new Map<string, number>();

    // Initial Master Data
    MASTER_FG_OPENING.forEach(item => {
      const key = `${normalize(item.product)}|${normalize(item.size)}`;
      stockMap.set(key, item.opening);
    });

    // Plus Production/Returns
    records.forEach(r => {
      const key = `${normalize(r.productName)}|${normalize(r.size)}`;
      const current = stockMap.get(key) || 0;
      if (r.isReturn || (!r.isDispatch && !r.isReturn)) {
        stockMap.set(key, current + r.weightKg);
      } else if (r.isDispatch) {
        stockMap.set(key, current - r.weightKg);
      }
    });

    // Minus Dispatched Orders
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

    // Transactions
    transactions.forEach(txn => {
      const current = stockMap.get(txn.itemId) || 0;
      stockMap.set(txn.itemId, current + txn.qty);
    });

    // Deduct from Production
    records.forEach(r => {
      if (r.isReturn || r.isDispatch) return;
      const prodName = r.productName.toUpperCase();
      const approxPktWeight = r.duplesPkt > 0 ? (r.weightKg / r.duplesPkt) : 0;

      // Logic derived from PackingStock component
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
              firstOrderDate: order.orderDate
            });
          }
          const s = shortfallMap.get(key)!;
          s.totalNeeded += item.calculatedWeightKg;
          s.shortfall = Math.max(0, s.totalNeeded - available);
        }
      });

      orderDetails.push({ order, isReady: orderReady, shortfallItems: orderShortfalls });
    });

    // Material Check (PD/PC/PB) for the shortfalls
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Priority Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-indigo-600 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp size={18} /> Production Priority (FIFO)
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
                    <th className="px-6 py-3 font-medium text-center">First Order</th>
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
                            {p.firstOrderDate.split('-').reverse().join('/')}
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
                           <p className="text-xs text-gray-500">Rep: {order.salesPerson} | PO: {order.poNumber} | {order.orderDate}</p>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-bold text-indigo-600">{order.totalWeightKg.toLocaleString()} Kg</div>
                           <div className="text-[10px] text-gray-400">{order.items.length} Product(s)</div>
                        </div>
                     </div>
                     
                     {!isReady && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 mt-2">
                           <p className="text-[10px] font-bold text-red-600 uppercase mb-2 flex items-center gap-1">
                              <AlertTriangle size={12} /> Shortfall Alert:
                           </p>
                           <div className="space-y-1">
                              {shortfallItems.map((item, iIdx) => (
                                <div key={iIdx} className="flex justify-between text-xs">
                                   <span className="text-red-800">{item.productName} ({item.size})</span>
                                   <span className="font-bold text-red-900">Missing {(item.calculatedWeightKg - item.available).toLocaleString()} Kg</span>
                                </div>
                              ))}
                           </div>
                        </div>
                     )}
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
