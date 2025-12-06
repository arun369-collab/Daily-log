import React, { useState } from 'react';
import { SalesOrder } from '../types';
import { ShoppingBag, MapPin, FileText, CheckCircle, Clock, Eye, X, MessageCircle, Copy, Share2, Printer } from 'lucide-react';
import { POPreview } from './POPreview';

interface SalesDashboardProps {
  orders: SalesOrder[];
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showPOPreview, setShowPOPreview] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const generateShareText = (order: SalesOrder) => {
    let text = `*Sales Order Details* 📦\n`;
    text += `Customer: ${order.customerName}\n`;
    text += `Mobile: ${order.mobileNumber}\n`;
    text += `Sales Person: ${order.salesPerson}\n`;
    text += `City: ${order.city}\n`;
    if(order.mapLink) text += `Delivery Location: ${order.mapLink}\n`;
    text += `PO No: ${order.poNumber}\n`;
    if(order.poFileName) text += `PO File: ${order.poFileName} (See Attachment)\n`;
    
    text += `\n*Items:* \n`;
    order.items.forEach(item => {
       text += `- ${item.productName} (${item.size}): ${item.quantityCtn} CTN (${item.calculatedWeightKg} Kg)\n`;
    });
    
    text += `\n*Total Weight:* ${order.totalWeightKg.toLocaleString()} Kg`;
    return text;
  };

  const handleShareWhatsapp = (order: SalesOrder) => {
    const text = generateShareText(order);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopy = (order: SalesOrder) => {
    const text = generateShareText(order);
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleNativeShare = async (order: SalesOrder) => {
    const text = generateShareText(order);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order ${order.poNumber}`,
          text: text,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      handleCopy(order);
    }
  };

  // If PO Preview is active, render it overlaying everything
  if (showPOPreview && selectedOrder) {
    return <POPreview order={selectedOrder} onClose={() => setShowPOPreview(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-sm font-medium text-gray-500">Total Orders</p>
           <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-sm font-medium text-gray-500">Pending</p>
           <h3 className="text-2xl font-bold text-amber-500">{orders.filter(o => o.status === 'Pending').length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-sm font-medium text-gray-500">Volume Booked</p>
           <h3 className="text-2xl font-bold text-indigo-600">
             {orders.reduce((acc, o) => acc + o.totalWeightKg, 0).toLocaleString()} <span className="text-sm text-gray-400">Kg</span>
           </h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <ShoppingBag size={18} /> Recent Orders
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">PO Details</th>
                <th className="px-6 py-3 font-medium">Items</th>
                <th className="px-6 py-3 font-medium text-right">Total Weight</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{order.orderDate}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{order.customerName}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                       <MapPin size={12} /> {order.city}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="font-mono text-xs font-bold text-gray-600">{order.poNumber}</div>
                     {order.poFileName && (
                       <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                         <FileText size={10} /> {order.poFileName}
                       </div>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="text-xs text-gray-600">
                          {item.quantityCtn} CTN x {item.productName} ({item.size})
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-xs text-gray-400 italic">
                          + {order.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-600">
                    {order.totalWeightKg.toLocaleString()} Kg
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {order.status === 'Pending' ? <Clock size={12} /> : <CheckCircle size={12} />}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
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
                    <p className="text-sm text-gray-600">Date: {selectedOrder.orderDate}</p>
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
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {selectedOrder.items.map((item, idx) => (
                       <tr key={idx}>
                         <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                         <td className="px-4 py-3 text-right text-gray-500">{item.size}</td>
                         <td className="px-4 py-3 text-right text-gray-600">{item.quantityCtn}</td>
                         <td className="px-4 py-3 text-right font-bold text-indigo-600">{item.calculatedWeightKg}</td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right text-gray-600">Total:</td>
                        <td className="px-4 py-3 text-right text-indigo-700">{selectedOrder.totalWeightKg.toLocaleString()} Kg</td>
                      </tr>
                   </tfoot>
                 </table>
               </div>
               
               <div className="flex gap-3 mb-4 justify-end">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};