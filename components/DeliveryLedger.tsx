
import React, { useState, useMemo } from 'react';
import { SalesOrder, ProductionRecord } from '../types';
import { Printer, X, Check, ArrowRight, Layers, Truck, Calendar, Plus, Trash2 } from 'lucide-react';
import { PRODUCT_CATALOG } from '../data/products';

interface DeliveryLedgerProps {
  orders: SalesOrder[];
  productionRecords: ProductionRecord[];
  onClose: () => void;
  onSaveUpdates: (updatedOrders: SalesOrder[]) => void;
}

export const DeliveryLedger: React.FC<DeliveryLedgerProps> = ({ orders, productionRecords, onClose, onSaveUpdates }) => {
  // Local state to manage batch assignments before saving/printing
  const [localOrders, setLocalOrders] = useState<SalesOrder[]>(JSON.parse(JSON.stringify(orders)));
  const [viewMode, setViewMode] = useState<'edit' | 'print'>('edit');

  // Helper to get FIFO batches for a product
  const getFifoBatches = (productName: string, size: string) => {
    // Filter records for this product/size
    const relevantRecords = productionRecords.filter(
      r => r.productName === productName && r.size === size
    );
    
    // Group by batch to get totals (mock inventory check)
    const batches = new Map<string, { date: string, totalWeight: number }>();
    relevantRecords.forEach(r => {
      if (!batches.has(r.batchNo)) {
        batches.set(r.batchNo, { date: r.date, totalWeight: 0 });
      }
      batches.get(r.batchNo)!.totalWeight += r.weightKg;
    });

    // Convert to array and sort by Date (Oldest First)
    return Array.from(batches.entries())
      .map(([batchNo, data]) => ({ batchNo, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleBatchChange = (orderIndex: number, itemIndex: number, val: string) => {
    const updated = [...localOrders];
    updated[orderIndex].items[itemIndex].assignedBatch = val;
    setLocalOrders(updated);
  };

  const handleQuantityChange = (orderIndex: number, itemIndex: number, newQty: number) => {
    const updated = [...localOrders];
    const item = updated[orderIndex].items[itemIndex];
    
    // Recalculate Weight based on product definition
    const def = PRODUCT_CATALOG.find(p => p.displayName === item.productName);
    let weight = 0;
    
    if (def) {
        const ctnWeight = def.getCtnWeight(item.size);
        weight = newQty * ctnWeight;
    } else {
        // Fallback: estimate from current ratio if possible
        if (item.quantityCtn > 0 && item.calculatedWeightKg > 0) {
            const unit = item.calculatedWeightKg / item.quantityCtn;
            weight = newQty * unit;
        }
    }

    item.quantityCtn = newQty;
    item.calculatedWeightKg = weight;
    
    // Update total order weight for summary
    updated[orderIndex].totalWeightKg = updated[orderIndex].items.reduce((sum, i) => sum + i.calculatedWeightKg, 0);

    setLocalOrders(updated);
  };

  const handleSplitItem = (orderIndex: number, itemIndex: number) => {
    const updated = [...localOrders];
    const itemToClone = updated[orderIndex].items[itemIndex];
    
    // Create clone with reset values
    const newItem = { 
        ...itemToClone, 
        productId: crypto.randomUUID(), // New Unique ID
        assignedBatch: '', // Reset batch
        quantityCtn: 0, // Reset qty to force user input
        calculatedWeightKg: 0,
        itemValue: 0
    };
    
    // Insert after current item
    updated[orderIndex].items.splice(itemIndex + 1, 0, newItem);
    setLocalOrders(updated);
  };

  const handleDeleteItem = (orderIndex: number, itemIndex: number) => {
      const updated = [...localOrders];
      // Prevent deleting if it's the only item for this product? 
      // User might want to remove it entirely from delivery manifest, so allow delete.
      if (updated[orderIndex].items.length <= 1) {
          alert("Cannot remove the last item from an order. Cancel the delivery preparation instead.");
          return;
      }
      updated[orderIndex].items.splice(itemIndex, 1);
      
      // Update total order weight
      updated[orderIndex].totalWeightKg = updated[orderIndex].items.reduce((sum, i) => sum + i.calculatedWeightKg, 0);
      
      setLocalOrders(updated);
  };

  const handlePrint = () => {
    onSaveUpdates(localOrders); // Save assignments before printing
    setTimeout(() => window.print(), 100);
  };

  const totalTruckWeight = localOrders.reduce((acc, o) => acc + o.totalWeightKg, 0);
  const totalTruckLayers = totalTruckWeight / 1000;

  if (viewMode === 'edit') {
    return (
      <div className="fixed inset-0 z-[60] bg-gray-100 flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-white px-6 py-4 shadow-sm border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Truck className="text-blue-600" /> Prepare Delivery Ledger
            </h2>
            <p className="text-sm text-gray-500">Assign batches (FIFO) and verify load details</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => setViewMode('print')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-colors"
            >
              Generate Ledger <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-6">
          
          {/* Summary Card */}
          <div className="bg-blue-900 text-white p-6 rounded-xl shadow-md flex justify-between items-center">
            <div>
              <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Total Load Summary</p>
              <h3 className="text-3xl font-bold">{localOrders.length} Orders</h3>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{totalTruckWeight.toLocaleString()} <span className="text-lg font-normal text-blue-300">kg</span></p>
              <p className="text-blue-200 font-mono mt-1 flex items-center justify-end gap-2">
                 <Layers size={16} /> {totalTruckLayers.toFixed(2)} Pallets (Layers)
              </p>
            </div>
          </div>

          {/* Orders List */}
          {localOrders.map((order, oIdx) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <div>
                   <span className="font-bold text-gray-800">{order.customerName}</span>
                   <span className="text-sm text-gray-500 ml-2">({order.city})</span>
                </div>
                <div className="text-xs font-mono text-gray-500 bg-white border px-2 py-1 rounded">
                   PO: {order.poNumber}
                </div>
              </div>
              
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-left">Size</th>
                      <th className="px-4 py-2 text-right w-24">Qty (Ctn)</th>
                      <th className="px-4 py-2 text-right">Weight (Kg)</th>
                      <th className="px-4 py-2 text-left w-80">Assigned Batch (FIFO Hint)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, iIdx) => {
                      const fifoOptions = getFifoBatches(item.productName, item.size);
                      
                      return (
                        <tr key={item.productId || iIdx}>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-gray-600">{item.size}</td>
                          <td className="px-4 py-3 text-right">
                             <input 
                               type="number"
                               min="0"
                               value={item.quantityCtn}
                               onChange={(e) => handleQuantityChange(oIdx, iIdx, Number(e.target.value))}
                               className="w-20 px-2 py-1 border border-gray-300 rounded text-right font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                             />
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800">{item.calculatedWeightKg.toFixed(0)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <input 
                                  list={`fifo-${order.id}-${iIdx}`}
                                  type="text"
                                  value={item.assignedBatch || ''}
                                  onChange={(e) => handleBatchChange(oIdx, iIdx, e.target.value)}
                                  placeholder="Scan/Type Batch..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                />
                                <datalist id={`fifo-${order.id}-${iIdx}`}>
                                  {fifoOptions.map(opt => (
                                    <option key={opt.batchNo} value={opt.batchNo}>
                                      {opt.batchNo} ({opt.date}) - Avail: {opt.totalWeight}kg
                                    </option>
                                  ))}
                                </datalist>
                                {fifoOptions.length > 0 && !item.assignedBatch && (
                                  <div className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                                    <Calendar size={10} /> Oldest: {fifoOptions[0].batchNo}
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons: Split / Delete */}
                              <button 
                                onClick={() => handleSplitItem(oIdx, iIdx)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-200 transition-colors"
                                title="Split Item (Create duplicate row)"
                              >
                                <Plus size={16} />
                              </button>
                              
                              <button 
                                onClick={() => handleDeleteItem(oIdx, iIdx)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Row"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PRINT MODE
  return (
    <div className="fixed inset-0 z-[70] bg-white overflow-auto">
      {/* Print Toolbar */}
      <div className="print:hidden bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 shadow-md">
        <h2 className="font-bold">Delivery Ledger Preview</h2>
        <div className="flex gap-3">
          <button onClick={() => setViewMode('edit')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Back to Edit</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold flex items-center gap-2">
            <Printer size={16} /> Print Ledger
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"><X size={16}/></button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 print:p-0 print:max-w-none min-h-screen">
        
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-wider text-black">Delivery Ledger</h1>
              <p className="text-sm text-gray-600 mt-1">Load Manifest & Dispatch Control</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">Total Orders: {localOrders.length}</p>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100 print:bg-gray-200">
              <th className="border border-black px-2 py-2 text-left w-24">Customer / Location</th>
              <th className="border border-black px-2 py-2 text-left w-24">Sales Rep</th>
              <th className="border border-black px-2 py-2 text-left">Product Details</th>
              <th className="border border-black px-2 py-2 text-left w-16">Batch No</th>
              <th className="border border-black px-2 py-2 text-right w-16">Weight<br/>(Kg)</th>
              <th className="border border-black px-2 py-2 text-right w-16">Layers<br/>(Pallets)</th>
            </tr>
          </thead>
          <tbody>
            {localOrders.map((order) => {
              // Recalculate Total Layers for this Order based on the *current* items (including splits)
              const orderTotalLayers = order.items.reduce((acc, item) => acc + (item.calculatedWeightKg / 1000), 0);
              
              return (
              <React.Fragment key={order.id}>
                {order.items.map((item, idx) => {
                   const isFirst = idx === 0;
                   const layers = item.calculatedWeightKg / 1000;
                   return (
                     <tr key={`${order.id}-${idx}`} className="break-inside-avoid">
                       {/* Group Customer Columns */}
                       {isFirst && (
                         <>
                           <td className="border border-black px-2 py-2 align-top" rowSpan={order.items.length}>
                             <div className="font-bold text-black">{order.customerName}</div>
                             <div className="text-xs text-gray-600">{order.city}</div>
                             <div className="text-[10px] mt-1">PO: {order.poNumber}</div>
                           </td>
                           <td className="border border-black px-2 py-2 align-top" rowSpan={order.items.length}>
                             {order.salesPerson}
                           </td>
                         </>
                       )}
                       
                       <td className="border border-black px-2 py-1">
                         <span className="font-medium text-black">{item.productName}</span>
                         <span className="text-xs ml-1 font-bold text-black">({item.size})</span>
                         <div className="text-xs font-bold text-black mt-1">{item.quantityCtn} CTN</div>
                       </td>
                       <td className="border border-black px-2 py-1 font-mono text-center font-bold text-black">
                         {item.assignedBatch || '_________'}
                       </td>
                       <td className="border border-black px-2 py-1 text-right">
                         {item.calculatedWeightKg.toFixed(0)}
                       </td>
                       <td className="border border-black px-2 py-1 text-right font-medium">
                         {layers.toFixed(2)}
                       </td>
                     </tr>
                   );
                })}
                {/* Order Total Row */}
                <tr className="bg-gray-50 print:bg-gray-100 font-bold">
                   <td colSpan={4} className="border border-black px-2 py-1 text-right text-xs uppercase">Order Total:</td>
                   <td className="border border-black px-2 py-1 text-right">{order.totalWeightKg.toLocaleString()}</td>
                   <td className="border border-black px-2 py-1 text-right">{orderTotalLayers.toFixed(2)}</td>
                </tr>
              </React.Fragment>
            );
            })}
          </tbody>
          <tfoot>
             <tr className="bg-black text-white print:bg-black print:text-white font-bold text-base">
                <td colSpan={4} className="border border-black px-4 py-2 text-right">GRAND TOTAL LOAD:</td>
                <td className="border border-black px-2 py-2 text-right">{totalTruckWeight.toLocaleString()} kg</td>
                <td className="border border-black px-2 py-2 text-right">{totalTruckLayers.toFixed(2)}</td>
             </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="mt-12 flex justify-between text-xs pt-4 border-t border-black">
          <div>
            <p className="mb-8">Prepared By:</p>
            <div className="border-b border-black w-48"></div>
          </div>
          <div>
            <p className="mb-8">Driver Signature:</p>
            <div className="border-b border-black w-48"></div>
          </div>
          <div>
            <p className="mb-8">Security Check:</p>
            <div className="border-b border-black w-48"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
