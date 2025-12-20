
import React from 'react';
import { SalesOrder } from '../types';
import { Factory, Printer, X } from 'lucide-react';

interface POPreviewProps {
  order: SalesOrder;
  onClose: () => void;
  isDialog?: boolean;
}

export const POPreview: React.FC<POPreviewProps> = ({ order, onClose, isDialog = false }) => {
  const handlePrint = () => {
    window.print();
  };

  // If used inside a dialog, we might want different button handling
  const ButtonClass = isDialog 
    ? "w-full py-3 bg-gray-800 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all mt-2"
    : "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors";

  if (isDialog) {
     return (
        <button 
           onClick={() => {
              // In full screen mode via parent component
              onClose(); 
           }}
           className={ButtonClass}
        >
          <Printer size={20} /> View PO Document
        </button>
     );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-auto flex flex-col print:block print:bg-white animate-fadeIn">
      {/* Header Toolbar - Hidden on Print */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center print:hidden sticky top-0 z-10 shadow-md">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Factory size={20} /> Purchase Order Preview
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            <Printer size={18} /> Print Document
          </button>
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            <X size={18} /> Close
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 p-8 max-w-[210mm] mx-auto bg-white w-full print:p-0 print:max-w-none">
        
        {/* Company Header */}
        <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight uppercase">FactoryFlow</h1>
            <p className="text-gray-500 mt-1">Production & Sales Management</p>
            <div className="mt-4 text-sm text-gray-600">
              <p>Industrial Area 12, Shed 45</p>
              <p>Sharjah, UAE</p>
              <p>Phone: +971 50 123 4567</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-400 uppercase">Proforma Invoice</h2>
            <p className="text-gray-800 font-mono font-bold text-lg mt-2">#{order.poNumber || order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-gray-500 text-sm">Order Date: {order.orderDate}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
            <p className="font-bold text-lg text-gray-900">{order.customerName}</p>
            <p className="text-gray-600">{order.city}</p>
            <p className="text-gray-600">{order.mobileNumber}</p>
            <p className="text-gray-600">{order.email}</p>
          </div>
          <div className="text-right">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order Details</h3>
             <p className="text-gray-600"><span className="font-medium text-gray-800">Sales Rep:</span> {order.salesPerson}</p>
             <p className="text-gray-600"><span className="font-medium text-gray-800">PO Ref:</span> {order.poNumber}</p>
             <p className="text-gray-600"><span className="font-medium text-gray-800">PO Date:</span> {order.poDate}</p>
             <p className="text-gray-600"><span className="font-medium text-gray-800">Status:</span> {order.status}</p>
          </div>
        </div>

        {/* Item Table */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 pr-4">Description</th>
              <th className="py-3 px-4 text-center">Qty (Ctn)</th>
              <th className="py-3 px-4 text-right">Weight (Kg)</th>
              <th className="py-3 px-4 text-right">Unit Price (SAR)</th>
              <th className="py-3 pl-4 text-right">Total (SAR)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {order.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-4 pr-4">
                  <p className="font-bold text-gray-900">{item.productName}</p>
                  <p className="text-gray-500 text-xs">Size: {item.size}</p>
                </td>
                <td className="py-4 px-4 text-center text-gray-600">{item.quantityCtn}</td>
                <td className="py-4 px-4 text-right text-gray-600">{item.calculatedWeightKg}</td>
                <td className="py-4 px-4 text-right text-gray-600">{item.pricePerKg?.toFixed(2) || '0.00'}</td>
                <td className="py-4 pl-4 text-right font-medium text-gray-900">{item.itemValue?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Summary */}
        <div className="flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>SAR {order.subTotal?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>VAT (15%):</span>
              <span>SAR {order.vatAmount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t-2 border-gray-800 pt-3">
              <span>Grand Total:</span>
              <span>SAR {order.grandTotal?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated document and valid without signature.</p>
        </div>
      </div>
    </div>
  );
};
