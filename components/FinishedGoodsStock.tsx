
import React, { useState } from 'react';
import { Warehouse, Calendar, Download, Search } from 'lucide-react';

// Master Data provided (Opening Balance as of Nov 30)
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
  { product: 'VACCUM 7018', size: '2.5 X 350', opening: 0 },
  { product: 'VACCUM 7018', size: '3.2 X 350', opening: 40 },
  { product: 'VACCUM 7018', size: '4.0 X 350', opening: 154 },
  { product: 'VACCUM 7018', size: '5.0 X 350', opening: 2 },
  { product: 'VACCUM 7018-1', size: '2.5 X 350', opening: 532 },
  { product: 'VACCUM 7018-1', size: '3.2 X 350', opening: 298 },
  { product: 'VACCUM 7018-1', size: '4.0 X 350', opening: 8 },
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
  { product: 'VACCUM 8018-B2', size: '2.5 x 350', opening: 0 },
  { product: 'VACCUM 8018-B2', size: '3.2 x 350', opening: 318 },
  { product: 'VACCUM 8018-B2', size: '4.0 x 350', opening: 106 },
  { product: 'VACUUM 10018-M', size: '3.2 x 350', opening: 92 },
  { product: 'VACUUM 10018-G', size: '3.2 x 350', opening: 0 },
  { product: 'VACUUM 10018-D2', size: '4.0 x 350', opening: 30 },
  { product: 'VACUUM 8018-G', size: '2.5 x 350', opening: 106 },
  { product: 'VACUUM 8018-G', size: '3.2 x 350', opening: 86 },
  { product: 'VACUUM 8018-G', size: '4.0 x 350', opening: 284 },
];

export const FinishedGoodsStock: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Currently, dynamic calculation is disabled as per user request.
  // We strictly show Opening Stock (Nov 30) and placeholders for others.
  const tableData = MASTER_FINISHED_GOODS.map(item => ({
    ...item,
    production: 0,
    return: 0,
    despatch: 0,
    // Stock is essentially Opening + Production + Return - Despatch
    // Since others are 0, Stock = Opening for now.
    currentStock: item.opening 
  }));

  const filteredData = tableData.filter(item => 
    item.product.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.size.includes(searchTerm)
  );

  const totalOpening = filteredData.reduce((acc, curr) => acc + curr.opening, 0);

  const handleExport = () => {
    // Basic CSV Export
    const headers = ["Product", "Size", "Available Qty/kgs (Nov 30)", "Production", "Return", "Despatch", "Stock/kgs"];
    const rows = filteredData.map(r => [
      `"${r.product}"`,
      r.size,
      r.opening,
      r.production,
      r.return,
      r.despatch,
      r.currentStock
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Finished_Goods_Stock_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-700">
            <Warehouse size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Finished Goods Stock</h2>
            <p className="text-sm text-gray-500">Inventory Status as of Nov 30 (Opening)</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Search product or size..." 
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

      {/* Report Container matching the Excel style */}
      <div className="bg-white shadow-lg border border-gray-300 overflow-hidden">
        
        {/* Title Bar */}
        <div className="bg-[#4472c4] text-white text-center py-2 font-bold text-lg border-b border-gray-400">
          Finished Goods Stock Report
        </div>
        
        {/* Date Row */}
        <div className="bg-white border-b border-black flex justify-end px-4 py-1">
          <div className="bg-yellow-300 border border-black px-4 py-1 font-bold text-black flex items-center gap-2">
             Date: 01/12/2025
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
               <tr className="text-black">
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-left font-bold w-1/4">Product</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-center font-bold w-32">Size</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-32">Available Qty/kgs<br/><span className="text-xs font-normal">(Opening)</span></th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-24">Production</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-24">Return</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-24">Despatch</th>
                 <th className="bg-[#70ad47] border border-black px-3 py-2 text-right font-bold w-32">Stock/kgs</th>
               </tr>
            </thead>
            <tbody>
               {filteredData.map((row, idx) => (
                 <tr key={`${row.product}-${row.size}`} className="hover:bg-gray-50">
                    <td className="border border-black px-3 py-1 font-bold bg-[#e2efda] text-black">
                      {row.product}
                    </td>
                    <td className="border border-black px-3 py-1 text-center font-bold bg-[#e2efda] text-black">
                      {row.size}
                    </td>
                    <td className="border border-black px-3 py-1 text-right font-bold bg-[#e2efda] text-black">
                      {row.opening.toLocaleString()}
                    </td>
                    {/* Placeholder Columns */}
                    <td className="border border-black px-3 py-1 text-right bg-[#e2efda] text-gray-400">-</td>
                    <td className="border border-black px-3 py-1 text-right bg-[#e2efda] text-gray-400">-</td>
                    <td className="border border-black px-3 py-1 text-right bg-[#e2efda] text-gray-400">-</td>
                    
                    {/* Closing Stock (Currently equals Opening) */}
                    <td className="border border-black px-3 py-1 text-right font-bold bg-[#e2efda] text-black">
                       {row.currentStock.toLocaleString()}
                    </td>
                 </tr>
               ))}
               
               {/* Total Row */}
               <tr className="bg-yellow-100 font-bold border-t-2 border-black">
                  <td className="border border-black px-3 py-2 text-right" colSpan={2}>Total Opening Stock:</td>
                  <td className="border border-black px-3 py-2 text-right">{totalOpening.toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 bg-gray-100"></td>
                  <td className="border border-black px-3 py-2 bg-gray-100"></td>
                  <td className="border border-black px-3 py-2 bg-gray-100"></td>
                  <td className="border border-black px-3 py-2 text-right">{totalOpening.toLocaleString()}</td>
               </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
