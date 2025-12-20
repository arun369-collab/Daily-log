
import React, { useState, useMemo } from 'react';
import { SalesOrder, UserRole, ProductionRecord } from '../types';
import { ShoppingBag, MapPin, FileText, CheckCircle, Clock, Eye, X, MessageCircle, Copy, Share2, Printer, ExternalLink, Pencil, Truck, Package, RefreshCw, ClipboardList, Plus, Trash2, AlertCircle, CheckCircle2, Box, RotateCcw } from 'lucide-react';
import { POPreview } from './POPreview';
import { DeliveryLedger } from './DeliveryLedger';
import { saveSalesOrder, deleteSalesOrder, deleteSalesOrders } from '../services/storageService';

// Standard Master Inventory Data for initial opening balances
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

// Helper to convert Base64 to File for sharing
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

  // --- INVENTORY SNAPSHOT CALCULATION ---
  const inventorySnapshot = useMemo(() => {
    const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '');
    const stockMap = new Map<string, number>();

    // Start with Master Openings
    MASTER_FG_OPENING.forEach(item => {
      const key = `${normalize(item.product)}|${normalize(item.size)}`;
      stockMap.set(key, item.opening);
    });

    // Add Production and Returns
    productionRecords.forEach(r => {
      if (r.isDispatch) return;
      const key = `${normalize(r.productName)}|${normalize(r.size)}`;
      const current = stockMap.get(key) || 0;
      stockMap.set(key, current + r.weightKg);
    });

    // Subtract Dispatches (Manual and Order-based)
    productionRecords.forEach(r => {
      if (!r.isDispatch) return;
      const key = `${normalize(r.productName)}|${normalize(r.size)}`;
      const current = stockMap.get(key) || 0;
      stockMap.set(key, current - r.weightKg);
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
  }, [productionRecords, orders]);

  // --- PACKABILITY ENGINE ---
  const getPackability = (order: SalesOrder): PackabilityStatus => {
    const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '');
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
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedOrders.map(o => o.id)));
    }
  };

  const handleBulkStatusUpdate = (newStatus: SalesOrder['status']) => {
    if (selectedIds.size === 0) return;
    sortedOrders.forEach(order => {
      if (selectedIds.has(order.id)) {
        const updated = { ...order, status: newStatus };
        saveSalesOrder(updated);
      }
    });
    onRefreshData();
    setSelectedIds(new Set());
    alert(`Updated ${selectedIds.size} orders to ${newStatus}`);
  };
  
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to PERMANENTLY delete ${selectedIds.size} orders?`)) {
      deleteSalesOrders(Array.from(selectedIds));
      setSelectedIds(new Set());
      onRefreshData();
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this order?")) {
      deleteSalesOrder(id);
      onRefreshData();
      if (selectedOrder?.id === id) setSelectedOrder(null);
    }
  };

  const generateShareText = (order: SalesOrder) => {
    const fmt = (d: string) => {
      if (!d) return 'N/A';
      const pts = d.split('-');
      if (pts.length !== 3) return d;
      const mos = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${pts[2]} ${mos[parseInt(pts[1]) - 1]} ${pts[0]}`;
    };

    let text = `*Sales Order Details* 📦\n`;
    text += `Customer: ${order.customerName}\n`;
    text += `Mobile: ${order.mobileNumber}\n`;
    text += `Sales Person: ${order.salesPerson}\n`;
    text += `City: ${order.city}\n`;
    if(order.mapLink) text += `📍 ${order.mapLink}\n`;
    text += `PO No: ${order.poNumber}\n`;
    text += `PO Date: ${fmt(order.poDate)}\n`;
    if(order.poFileName) text += `PO File: ${order.poFileName} (See Attachment)\n`;
    
    text += `\n*Items:* \n`;
    order.items.forEach(item => {
       text += `- ${item.productName} (${item.size}): ${item.quantityCtn} CTN (${item.calculatedWeightKg} Kg)\n`;
    });
    
    text += `\n*Total Weight:* ${order.totalWeightKg.toLocaleString()} Kg`;
    return text;
  };

  // --- MISSING HANDLERS ADDED BELOW ---

  // Handler to view the PO file from base64 data
  const handleViewPOFile = (order: SalesOrder) => {
    if (!order.poFileData) return;
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${order.poFileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  // Handler to copy order summary to clipboard
  const handleCopy = async (order: SalesOrder) => {
    const text = generateShareText(order);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handler for native browser sharing
  const handleNativeShare = async (order: SalesOrder) => {
    const text = generateShareText(order);
    const shareData: any = {
      title: 'Sales Order Details',
      text: text,
    };

    if (order.poFileData && order.poFileName) {
      try {
        const file = dataURLtoFile(order.poFileData, order.poFileName);
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          shareData.files = [file];
          // Backup copy text
          try {
            await navigator.clipboard.writeText(text);
            setShowPasteHint(true);
            setTimeout(() => setShowPasteHint(false), 8000);
          } catch (e) {}
        }
      } catch (e) {
        console.warn("File sharing preparation failed", e);
      }
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      handleCopy(order);
    }
  };

  // Handler to share order summary via WhatsApp
  const handleShareWhatsapp = async (order: SalesOrder) => {
    const text = generateShareText(order);
    
    if (order.poFileData && order.poFileName && navigator.share) {
       try {
         const file = dataURLtoFile(order.poFileData, order.poFileName);
         const shareData = {
           files: [file],
           title: 'Sales Order Details',
           text: text
         };
         
         if (navigator.canShare && navigator.canShare(shareData)) {
            try {
               await navigator.clipboard.writeText(text);
               setShowPasteHint(true);
               setTimeout(() => setShowPasteHint(false), 8000);
            } catch(err) {}

            await navigator.share(shareData);
            return;
         }
       } catch (e) {
         console.warn("File share failed, using URL fallback", e);
       }
    }

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (showPOPreview && selectedOrder) {
    return <POPreview order={selectedOrder} onClose={() => setShowPOPreview(false)} />;
  }

  if (showDeliveryLedger) {
    const selectedOrdersList = sortedOrders.filter(o => selectedIds.has(o.id));
    return (
      <DeliveryLedger 
        orders={selectedOrdersList} 
        productionRecords={productionRecords}
        onClose={() => setShowDeliveryLedger(false)} 
        onSaveUpdates={(updated) => { updated.forEach(o => saveSalesOrder(o)); onRefreshData(); }}
      />
    );
  }

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
              <h3 className="text-2xl font-bold text-emerald-600">
                {orders.filter(o => o.status === 'Pending' && getPackability(o).status === 'Ready').length}
              </h3>
           </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && userRole === 'admin' && (
        <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-md flex flex-col md:flex-row gap-4 justify-between items-center animate-fadeIn">
          <div className="font-bold flex items-center gap-2">
            <CheckCircle className="text-green-400" />
            {selectedIds.size} Orders Selected
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button 
               onClick={() => setShowDeliveryLedger(true)}
               className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
            >
              <ClipboardList size={16} /> Prepare Delivery / Print Ledger
            </button>
            <div className="w-px bg-indigo-700 mx-2 hidden md:block"></div>
            
            {/* REVERSE STATUS OPTION */}
            <button 
              onClick={() => handleBulkStatusUpdate('Pending')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Reverse back to Pending"
            >
              <RotateCcw size={16} /> Set Pending
            </button>

            <button 
              onClick={() => handleBulkStatusUpdate('Processing')}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Package size={16} /> Processing
            </button>
             <button 
              onClick={() => handleBulkStatusUpdate('Dispatched')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Truck size={16} /> Dispatched
            </button>
            <div className="w-px bg-indigo-700 mx-2 hidden md:block"></div>
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50 gap-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <ShoppingBag size={18} /> Recent Orders
          </h3>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            {userRole === 'admin' && (
              <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                 <button 
                  onClick={() => setPackFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded ${packFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                 >
                   All
                 </button>
                 <button 
                  onClick={() => setPackFilter('ready')}
                  className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 ${packFilter === 'ready' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                 >
                   <CheckCircle2 size={12}/> Ready
                 </button>
              </div>
            )}
            <button 
              onClick={() => onEditOrder(null)}
              className="flex-1 md:flex-none px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus size={14} /> New Order
            </button>
            <button 
              onClick={onManualRefresh}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh List"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                {userRole === 'admin' && (
                  <th className="px-4 py-3 w-10">
                    <input 
                      type="checkbox" 
                      onChange={toggleSelectAll} 
                      checked={selectedIds.size > 0 && selectedIds.size === sortedOrders.length}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                    />
                  </th>
                )}
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                {userRole === 'admin' && <th className="px-6 py-3 font-medium text-center">Packing Hint</th>}
                <th className="px-6 py-3 font-medium">PO Details</th>
                <th className="px-6 py-3 font-medium text-right">Weight</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedOrders.map((order) => {
                const packability = userRole === 'admin' ? getPackability(order) : null;
                return (
                <tr key={order.id} className={`hover:bg-gray-50 ${selectedIds.has(order.id) ? 'bg-indigo-50/50' : ''}`}>
                  {userRole === 'admin' && (
                    <td className="px-4 py-4 text-center">
                       <input 
                        type="checkbox" 
                        checked={selectedIds.has(order.id)} 
                        onChange={() => toggleSelection(order.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {order.orderDate.split('-').reverse().join('-')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{order.customerName}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                       <MapPin size={12} /> {order.city}
                    </div>
                  </td>
                  
                  {/* ADMIN PACKING HINT COLUMN */}
                  {userRole === 'admin' && (
                    <td className="px-6 py-4 text-center">
                       {order.status === 'Pending' ? (
                          <div className="group relative inline-block">
                             <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                               packability?.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' :
                               packability?.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                               'bg-red-100 text-red-700'
                             }`}>
                               {packability?.status === 'Ready' && <CheckCircle2 size={12}/>}
                               {packability?.status === 'Partial' && <Box size={12}/>}
                               {packability?.status === 'Out of Stock' && <AlertCircle size={12}/>}
                               {packability?.status}
                             </span>
                             
                             {/* Hint Tooltip */}
                             {packability?.missingItems && packability.missingItems.length > 0 && (
                               <div className="absolute z-50 invisible group-hover:visible bg-gray-900 text-white text-[10px] p-2 rounded-lg shadow-xl w-48 -left-20 top-8 text-left">
                                  <p className="font-bold border-b border-gray-700 pb-1 mb-1 text-red-400">Shortage List:</p>
                                  {packability.missingItems.map((m, idx) => (
                                    <div key={idx} className="flex justify-between py-0.5">
                                      <span className="truncate pr-2">{m.product}</span>
                                      <span className="font-mono text-red-300">{m.missingKg.toFixed(0)}kg</span>
                                    </div>
                                  ))}
                                  <div className="mt-1 pt-1 border-t border-gray-700 italic text-gray-400">
                                    Current FG stock is insufficient.
                                  </div>
                               </div>
                             )}
                          </div>
                       ) : (
                         <span className="text-gray-300 text-[10px]">—</span>
                       )}
                    </td>
                  )}

                  <td className="px-6 py-4">
                     <div className="font-mono text-xs font-bold text-gray-600">{order.poNumber}</div>
                     {order.poFileName && (
                       <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                         <FileText size={10} /> {order.poFileName}
                       </div>
                     )}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-600 whitespace-nowrap">
                    {order.totalWeightKg.toLocaleString()} Kg
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 
                      order.status === 'Dispatched' ? 'bg-purple-100 text-purple-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status === 'Pending' && <Clock size={12} />}
                      {order.status === 'Processing' && <Package size={12} />}
                      {order.status === 'Dispatched' && <Truck size={12} />}
                      {order.status === 'Delivered' && <CheckCircle size={12} />}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                       {userRole === 'admin' && (
                         <>
                            <button 
                               onClick={() => onEditOrder(order)}
                               className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                               title="Edit Order"
                            >
                               <Pencil size={18} />
                            </button>
                            <button 
                               onClick={() => handleDelete(order.id)}
                               className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                               title="Delete Order"
                            >
                               <Trash2 size={18} />
                            </button>
                         </>
                       )}
                       <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {orders.length === 0 && (
                <tr>
                   <td colSpan={userRole === 'admin' ? 8 : 7} className="px-6 py-12 text-center text-gray-400">
                     No orders found.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Order Details</h3>
                <p className="text-sm text-gray-500">PO: {selectedOrder.poNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-white rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-6 mb-6">
                 <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Customer</h4>
                    <p className="font-bold text-gray-800">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.mobileNumber}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.email}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {selectedOrder.city}
                    </p>
                    {selectedOrder.mapLink && (
                      <a href={selectedOrder.mapLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                        View Delivery Location
                      </a>
                    )}
                 </div>
                 <div className="text-right">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Order Info</h4>
                    <p className="text-sm text-gray-600">Date: {selectedOrder.orderDate.split('-').reverse().join('-')}</p>
                    <p className="text-sm text-gray-600">Rep: {selectedOrder.salesPerson}</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${
                      selectedOrder.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedOrder.status}
                    </div>
                 </div>
               </div>

               <div className="border rounded-lg overflow-hidden mb-6">
                 <table className="w-full text-sm">
                   <thead className="bg-gray-50 text-gray-500">
                     <tr>
                       <th className="px-4 py-2 text-left">Product</th>
                       <th className="px-4 py-2 text-right">Size</th>
                       <th className="px-4 py-2 text-right">Cartons</th>
                       <th className="px-4 py-2 text-right">Weight (Kg)</th>
                       {userRole === 'admin' && <th className="px-4 py-2 text-center">In Stock</th>}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {selectedOrder.items.map((item, idx) => {
                       const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '');
                       const key = `${normalize(item.productName)}|${normalize(item.size)}`;
                       const available = inventorySnapshot.get(key) || 0;
                       const isAvail = available >= item.calculatedWeightKg;

                       return (
                       <tr key={idx}>
                         <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                         <td className="px-4 py-3 text-right text-gray-500">{item.size}</td>
                         <td className="px-4 py-3 text-right text-gray-600">{item.quantityCtn}</td>
                         <td className="px-4 py-3 text-right font-bold text-indigo-600">{item.calculatedWeightKg}</td>
                         {userRole === 'admin' && (
                           <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${isAvail ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isAvail ? 'YES' : `NO (${available.toFixed(0)}kg)`}
                              </span>
                           </td>
                         )}
                       </tr>
                     )})}
                   </tbody>
                   <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right text-gray-600">Total:</td>
                        <td className="px-4 py-3 text-right text-indigo-700">{selectedOrder.totalWeightKg.toLocaleString()} Kg</td>
                        {userRole === 'admin' && <td className="bg-gray-50"></td>}
                      </tr>
                   </tfoot>
                 </table>
               </div>
               
               <div className="flex gap-3 mb-4 justify-end flex-wrap">
                   {selectedOrder.poFileData && (
                      <button 
                         onClick={() => handleViewPOFile(selectedOrder)}
                         className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                       >
                         <ExternalLink size={16} /> View Uploaded PO
                       </button>
                   )}
                   <button 
                     onClick={() => setShowPOPreview(true)}
                     className="px-4 py-2 bg-gray-800 hover:bg-black text-white rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                   >
                     <Printer size={16} /> View PO Document
                   </button>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-3">
                 <button 
                  onClick={() => handleCopy(selectedOrder)}
                  className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    copyFeedback ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                 >
                   {copyFeedback ? <CheckCircle size={18} /> : <Copy size={18} />}
                   {copyFeedback ? 'Copied' : 'Copy'}
                 </button>
                 <button
                  onClick={() => handleNativeShare(selectedOrder)} 
                  className="py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                 >
                   <Share2 size={18} /> Share
                 </button>
               </div>

               <button 
                 onClick={() => handleShareWhatsapp(selectedOrder)}
                 className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all"
               >
                 <MessageCircle size={20} /> Share via WhatsApp
               </button>
               {showPasteHint && (
                 <p className="text-xs text-center text-green-600 mt-2 font-medium bg-green-50 p-2 rounded-lg border border-green-200 animate-pulse">
                   Text copied! Paste in WhatsApp if missing.
                 </p>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
