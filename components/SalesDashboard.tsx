
import React, { useState, useMemo } from 'react';
import { SalesOrder, UserRole, ProductionRecord } from '../types';
import { ShoppingBag, MapPin, FileText, CheckCircle, Clock, Eye, X, MessageCircle, Copy, Share2, Printer, ExternalLink, Pencil, Truck, Package, RefreshCw, ClipboardList, Plus, Trash2, AlertCircle, CheckCircle2, Box, RotateCcw } from 'lucide-react';
import { POPreview } from './POPreview';
import { DeliveryLedger } from './DeliveryLedger';
import { saveSalesOrder, deleteSalesOrder, deleteSalesOrders } from '../services/storageService';

// Synchronized Master Inventory Data
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

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
};

interface SalesDashboardProps {
  orders: SalesOrder[];
  productionRecords: ProductionRecord[];
  onEditOrder: (order: SalesOrder | null) => void;
  userRole: UserRole;
  onRefreshData: () => void;
  onManualRefresh: () => void;
}

interface PackabilityStatus {
  status: 'Ready' | 'Partial' | 'Out of Stock';
  missingItems: { product: string; size: string; missingKg: number }[];
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ orders, productionRecords, onEditOrder, userRole, onRefreshData, onManualRefresh }) => {
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showPOPreview, setShowPOPreview] = useState(false);
  const [showDeliveryLedger, setShowDeliveryLedger] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [packFilter, setPackFilter] = useState<'all' | 'ready'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '');

  const inventorySnapshot = useMemo(() => {
    const stockMap = new Map<string, number>();
    MASTER_FG_OPENING.forEach(item => {
      const key = `${normalize(item.product)}|${normalize(item.size)}`;
      stockMap.set(key, item.opening);
    });

    productionRecords.forEach(r => {
      if (r.date < '2025-12-01') return;
      const key = `${normalize(r.productName)}|${normalize(r.size)}`;
      const current = stockMap.get(key) || 0;
      if (r.isReturn || (!r.isDispatch && !r.isReturn)) {
        stockMap.set(key, current + r.weightKg);
      } else if (r.isDispatch) {
        stockMap.set(key, current - r.weightKg);
      }
    });

    orders.forEach(o => {
      if (o.orderDate < '2025-12-01') return;
      if (o.status === 'Dispatched' || o.status === 'Delivered') {
        o.items.forEach(item => {
          const key = `${normalize(item.productName)}|${normalize(item.size)}`;
          const current = stockMap.get(key) || 0;
          stockMap.set(key, current - item.calculatedWeightKg);
        });
      }
    });

    return stockMap;
  }, [productionRecords, orders]);

  const getPackability = (order: SalesOrder): PackabilityStatus => {
    const missingItems: PackabilityStatus['missingItems'] = [];
    let availableCount = 0;

    order.items.forEach(item => {
      const key = `${normalize(item.productName)}|${normalize(item.size)}`;
      const available = inventorySnapshot.get(key) || 0;
      
      if (available >= item.calculatedWeightKg) {
        availableCount++;
      } else {
        missingItems.push({
          product: item.productName,
          size: item.size,
          missingKg: item.calculatedWeightKg - available
        });
      }
    });

    if (availableCount === order.items.length) return { status: 'Ready', missingItems: [] };
    if (availableCount > 0) return { status: 'Partial', missingItems };
    return { status: 'Out of Stock', missingItems };
  };

  const sortedOrders = useMemo(() => {
    let list = [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    if (packFilter === 'ready' && userRole === 'admin') {
      list = list.filter(o => o.status === 'Pending' && getPackability(o).status === 'Ready');
    }
    return list;
  }, [orders, inventorySnapshot, packFilter]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedOrders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedOrders.map(o => o.id)));
  };

  const handleBulkStatusUpdate = (newStatus: SalesOrder['status']) => {
    if (selectedIds.size === 0) return;
    sortedOrders.forEach(order => {
      if (selectedIds.has(order.id)) {
        saveSalesOrder({ ...order, status: newStatus });
      }
    });
    onRefreshData();
    setSelectedIds(new Set());
  };
  
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} orders?`)) {
      deleteSalesOrders(Array.from(selectedIds));
      setSelectedIds(new Set());
      onRefreshData();
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this order?")) {
      deleteSalesOrder(id);
      onRefreshData();
    }
  };

  const generateShareText = (order: SalesOrder) => {
    const fmt = (d: string) => {
      if (!d) return 'N/A';
      const pts = d.split('-');
      return pts.length === 3 ? `${pts[2]}-${pts[1]}-${pts[0]}` : d;
    };
    let text = `*Sales Order Details* 📦\nCustomer: ${order.customerName}\nMobile: ${order.mobileNumber}\nCity: ${order.city}\nPO No: ${order.poNumber}\nPO Date: ${fmt(order.poDate)}\n\n*Items:* \n`;
    order.items.forEach(item => { text += `- ${item.productName} (${item.size}): ${item.quantityCtn} CTN (${item.calculatedWeightKg} Kg)\n`; });
    text += `\n*Total Weight:* ${order.totalWeightKg.toLocaleString()} Kg`;
    return text;
  };

  const handleViewPOFile = (order: SalesOrder) => {
    if (!order.poFileData) return;
    const win = window.open();
    if (win) win.document.write(`<iframe src="${order.poFileData}" frameborder="0" style="width:100%; height:100%;"></iframe>`);
  };

  const handleCopy = async (order: SalesOrder) => {
    try {
      await navigator.clipboard.writeText(generateShareText(order));
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {}
  };

  const handleNativeShare = async (order: SalesOrder) => {
    const text = generateShareText(order);
    const shareData: any = { title: 'Sales Order', text };
    if (order.poFileData && order.poFileName) {
      try {
        const file = dataURLtoFile(order.poFileData, order.poFileName);
        if (navigator.canShare && navigator.canShare({ files: [file] })) shareData.files = [file];
      } catch (e) {}
    }
    if (navigator.share) await navigator.share(shareData);
    else handleCopy(order);
  };

  const handleShareWhatsapp = async (order: SalesOrder) => {
    const text = generateShareText(order);
    if (order.poFileData && order.poFileName && navigator.share) {
       try {
         const file = dataURLtoFile(order.poFileData, order.poFileName);
         if (navigator.canShare && navigator.canShare({ files: [file], text })) {
            await navigator.clipboard.writeText(text);
            setShowPasteHint(true);
            setTimeout(() => setShowPasteHint(false), 8000);
            await navigator.share({ files: [file], text });
            return;
         }
       } catch (e) {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (showPOPreview && selectedOrder) return <POPreview order={selectedOrder} onClose={() => setShowPOPreview(false)} />;
  if (showDeliveryLedger) return <DeliveryLedger orders={sortedOrders.filter(o => selectedIds.has(o.id))} productionRecords={productionRecords} onClose={() => setShowDeliveryLedger(false)} onSaveUpdates={(upd) => { upd.forEach(o => saveSalesOrder(o)); onRefreshData(); }} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><ShoppingBag size={24}/></div>
           <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock size={24}/></div>
           <div>
              <p className="text-sm font-medium text-gray-500">Pending Pack</p>
              <h3 className="text-2xl font-bold text-amber-500">{orders.filter(o => o.status === 'Pending').length}</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={24}/></div>
           <div>
              <p className="text-sm font-medium text-gray-500">Ready to Load</p>
              <h3 className="text-2xl font-bold text-emerald-600">{orders.filter(o => o.status === 'Pending' && getPackability(o).status === 'Ready').length}</h3>
           </div>
        </div>
      </div>

      {selectedIds.size > 0 && userRole === 'admin' && (
        <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-md flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="font-bold flex items-center gap-2"><CheckCircle size={20} className="text-green-400" /> {selectedIds.size} Selected</div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowDeliveryLedger(true)} className="px-4 py-2 bg-white text-indigo-900 rounded-lg text-sm font-bold">Prepare Delivery</button>
            <button onClick={() => handleBulkStatusUpdate('Pending')} className="px-3 py-2 bg-amber-600 rounded-lg text-sm">Set Pending</button>
            <button onClick={() => handleBulkStatusUpdate('Processing')} className="px-3 py-2 bg-indigo-700 rounded-lg text-sm">Processing</button>
            <button onClick={() => handleBulkStatusUpdate('Dispatched')} className="px-3 py-2 bg-blue-600 rounded-lg text-sm">Dispatched</button>
            <button onClick={handleBulkDelete} className="px-3 py-2 bg-red-600 rounded-lg text-sm">Delete</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2"><ShoppingBag size={18} /> Recent Orders</h3>
          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <div className="flex bg-white border rounded-lg p-1">
                 <button onClick={() => setPackFilter('all')} className={`px-3 py-1 text-xs font-bold rounded ${packFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>All</button>
                 <button onClick={() => setPackFilter('ready')} className={`px-3 py-1 text-xs font-bold rounded ${packFilter === 'ready' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>Ready</button>
              </div>
            )}
            <button onClick={() => onEditOrder(null)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm">New Order</button>
            <button onClick={onManualRefresh} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"><RefreshCw size={18} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                {userRole === 'admin' && <th className="px-4 py-3"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === sortedOrders.length} className="rounded" /></th>}
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                {userRole === 'admin' && <th className="px-6 py-3 text-center">Pack Hint</th>}
                <th className="px-6 py-3 font-medium">PO Ref</th>
                <th className="px-6 py-3 text-right">Weight</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedOrders.map((order) => {
                const pack = userRole === 'admin' ? getPackability(order) : null;
                return (
                  <tr key={order.id} className={selectedIds.has(order.id) ? 'bg-indigo-50/50' : ''}>
                    {userRole === 'admin' && <td className="px-4 py-4 text-center"><input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelection(order.id)} className="rounded" /></td>}
                    <td className="px-6 py-4 whitespace-nowrap">{order.orderDate.split('-').reverse().join('-')}</td>
                    <td className="px-6 py-4"><div className="font-bold">{order.customerName}</div><div className="text-xs text-gray-500">{order.city}</div></td>
                    {userRole === 'admin' && (
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${pack?.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : pack?.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {pack?.status}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 font-mono text-xs">{order.poNumber}</td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">{order.totalWeightKg.toLocaleString()} Kg</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${order.status === 'Pending' ? 'bg-amber-100' : order.status === 'Processing' ? 'bg-blue-100' : 'bg-green-100'}`}>{order.status}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        {userRole === 'admin' && <button onClick={() => onEditOrder(order)} className="p-2 text-gray-400 hover:text-blue-600"><Pencil size={18} /></button>}
                        <button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-400 hover:text-indigo-600"><Eye size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <div><h3 className="text-lg font-bold">Order Details</h3><p className="text-sm text-gray-500">PO: {selectedOrder.poNumber}</p></div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-6 mb-6">
                 <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase">Customer</h4>
                    <p className="font-bold">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.mobileNumber}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.city}</p>
                 </div>
                 <div className="text-right">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase">Rep</h4>
                    <p className="text-sm">{selectedOrder.salesPerson}</p>
                    <p className="text-sm">Date: {selectedOrder.orderDate.split('-').reverse().join('-')}</p>
                 </div>
               </div>
               <div className="border rounded-lg overflow-hidden mb-6">
                 <table className="w-full text-sm">
                   <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Product</th><th className="px-4 py-2 text-right">Size</th><th className="px-4 py-2 text-right">Kg</th></tr></thead>
                   <tbody>{selectedOrder.items.map((it, ix) => (<tr key={ix} className="border-b"><td className="px-4 py-3 font-medium">{it.productName}</td><td className="px-4 py-3 text-right">{it.size}</td><td className="px-4 py-3 text-right font-bold">{it.calculatedWeightKg}</td></tr>))}</tbody>
                 </table>
               </div>
               <div className="flex gap-3 flex-wrap justify-end mb-4">
                  {selectedOrder.poFileData && <button onClick={() => handleViewPOFile(selectedOrder)} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">View PO File</button>}
                  <button onClick={() => setShowPOPreview(true)} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold">Print PO Document</button>
               </div>
               <div className="grid grid-cols-2 gap-3 mb-3">
                 <button onClick={() => handleCopy(selectedOrder)} className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${copyFeedback ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>{copyFeedback ? <CheckCircle size={18} /> : <Copy size={18} />} Copy Text</button>
                 <button onClick={() => handleNativeShare(selectedOrder)} className="py-3 bg-blue-100 text-blue-700 rounded-xl font-bold">Share</button>
               </div>
               <button onClick={() => handleShareWhatsapp(selectedOrder)} className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold flex justify-center items-center gap-2"><MessageCircle size={20} /> Share via WhatsApp</button>
               {showPasteHint && <p className="text-[10px] text-center text-green-700 mt-2 font-bold uppercase animate-pulse">Text copied! Please Paste in WhatsApp if empty.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
