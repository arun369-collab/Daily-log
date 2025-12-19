
import React, { useState, useMemo } from 'react';
import { ProductionRecord } from '../types';
import { FileText, Printer, Calendar, Filter, ArrowRight, Eye, X, Check } from 'lucide-react';

interface LedgerSheetProps {
  records: ProductionRecord[];
}

type ReportType = 'all' | 'daily' | 'weekly' | 'monthly' | 'custom';

export const LedgerSheet: React.FC<LedgerSheetProps> = ({ records }) => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [isPreview, setIsPreview] = useState(false);
  
  // Date State defaults
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Week State default (Current week)
  const getCurrentWeek = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  };
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());

  // Custom Range State
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  // Helper: Get Date Range from Week String (YYYY-Www)
  const getWeekRange = (weekStr: string) => {
    const [year, week] = weekStr.split('-W').map(Number);
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const isoWeekStart = simple;
    if (dayOfWeek <= 4)
        isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else 
        isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const isoWeekEnd = new Date(isoWeekStart);
    isoWeekEnd.setDate(isoWeekStart.getDate() + 6);
    
    return {
      start: isoWeekStart.toISOString().split('T')[0],
      end: isoWeekEnd.toISOString().split('T')[0]
    };
  };

  // Filter records based on selection
  const filteredRecords = useMemo(() => {
    let filtered = records;

    if (reportType === 'daily') {
      filtered = records.filter(r => r.date === selectedDate);
    } 
    else if (reportType === 'weekly') {
      if (selectedWeek) {
        const { start, end } = getWeekRange(selectedWeek);
        filtered = records.filter(r => r.date >= start && r.date <= end);
      }
    }
    else if (reportType === 'monthly') {
      filtered = records.filter(r => r.date.startsWith(selectedMonth));
    }
    else if (reportType === 'custom') {
      filtered = records.filter(r => r.date >= customStart && r.date <= customEnd);
    }

    // Sort descending (newest first) for display
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, reportType, selectedDate, selectedMonth, selectedWeek, customStart, customEnd]);

  // Dynamic Title for the Report
  const reportTitle = useMemo(() => {
    if (reportType === 'daily') {
      return `Production Report of ${selectedDate}`;
    } else if (reportType === 'monthly') {
      const [year, month] = selectedMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
      return `Production Report of ${monthName} ${year}`;
    } else if (reportType === 'weekly') {
       const { start, end } = getWeekRange(selectedWeek);
       return `Production Report: ${start} to ${end}`;
    } else if (reportType === 'custom') {
      return `Production Report: ${customStart} to ${customEnd}`;
    }
    return 'Production Ledger (All Time)';
  }, [reportType, selectedDate, selectedMonth, selectedWeek, customStart, customEnd]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls - Hidden on Print */}
      <div className="print:hidden space-y-4">
        
        {/* Normal Header (Hidden in Preview) */}
        {!isPreview && (
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Ledger Reports</h2>
              <p className="text-sm text-gray-500">Generate and print production reports.</p>
            </div>
          </div>
        )}

        {/* Preview Toolbar (Visible only in Preview) */}
        {isPreview && (
          <div className="bg-gray-800 text-white p-4 rounded-xl flex justify-between items-center shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-blue-300" />
              <div>
                <h3 className="font-bold">Print Preview Mode</h3>
                <p className="text-xs text-gray-400">Review your report before printing</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsPreview(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <X size={16} /> Exit Preview
              </button>
              <button 
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/50 transition-colors"
              >
                <Printer size={16} /> Print Now
              </button>
            </div>
          </div>
        )}

        {/* Report Filter Controls (Hidden in Preview) */}
        {!isPreview && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 xl:items-end justify-between">
            <div className="flex flex-col md:flex-row gap-4 w-full">
              
              {/* Report Type Selector */}
              <div className="w-full md:w-48 flex-shrink-0">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Report Period</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Date Range</option>
                    <option value="all">Till Date (All)</option>
                  </select>
                </div>
              </div>

              {/* Date Pickers based on Type */}
              <div className="flex-1 animate-fadeIn">
                {reportType === 'daily' && (
                  <div className="w-full md:w-48">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {reportType === 'weekly' && (
                  <div className="w-full md:w-56">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Week</label>
                    <input
                      type="week"
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {reportType === 'monthly' && (
                  <div className="w-full md:w-48">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Month</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {reportType === 'custom' && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <ArrowRight className="text-gray-400 mt-5" size={16} />
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full xl:w-auto mt-4 xl:mt-0">
               <button
                type="button"
                onClick={() => setIsPreview(true)}
                className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              >
                <Eye size={18} />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-black transition-all shadow-md active:scale-95"
              >
                <Printer size={18} />
                <span>Print</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Container - Styles adapt for Preview Mode */}
      <div className={`transition-all duration-300 ${isPreview ? 'p-8 bg-white shadow-2xl border border-gray-200 max-w-5xl mx-auto min-h-[1123px]' : ''}`}>
        
        {/* Report Title - Visible on Print OR in Preview Mode */}
        <div className={`hidden print:block text-center mb-4 border-b-2 border-black pb-2 ${isPreview ? '!block' : ''}`}>
          <h1 className="text-2xl font-bold text-black uppercase tracking-wider">{reportTitle}</h1>
        </div>

        {/* Table Container */}
        <div className={`bg-white shadow-lg overflow-hidden border border-gray-300 print:shadow-none print:border-none print:overflow-visible ${isPreview ? 'shadow-none border-none' : ''}`}>
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-sm text-left border-collapse print:table-fixed print:text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-800 border-b-2 border-gray-400 font-bold uppercase text-xs tracking-wider print:bg-white print:border-black print:text-[10px]">
                  <th className="px-3 py-4 border-r border-gray-300 w-24 print:border-black print:py-1 print:px-1">Date</th>
                  <th className="px-3 py-4 border-r border-gray-300 print:border-black print:py-1 print:px-1">Product Name</th>
                  <th className="px-3 py-4 border-r border-gray-300 w-24 print:border-black print:py-1 print:px-1">Batch No</th>
                  <th className="px-3 py-4 border-r border-gray-300 w-24 print:border-black print:py-1 print:px-1">Size</th>
                  <th className="px-3 py-4 border-r border-gray-300 text-right w-24 bg-blue-50 print:bg-white print:border-black print:py-1 print:px-1">Weight<br/><span className="text-[10px] print:text-[8px]">K.G.S</span></th>
                  <th className="px-3 py-4 border-r border-gray-300 text-right w-24 text-red-700 bg-red-50 print:bg-white print:text-black print:border-black print:py-1 print:px-1">Rej-Weight<br/><span className="text-[10px] print:text-[8px]">K.G.S</span></th>
                  <th className="px-3 py-4 border-r border-gray-300 text-right w-20 print:border-black print:py-1 print:px-1">Duplex<br/><span className="text-[10px] print:text-[8px]">(PCS/PKT)</span></th>
                  <th className="px-3 py-4 text-right w-20 print:border-black print:py-1 print:px-1">Cartoon<br/><span className="text-[10px] print:text-[8px]">(CTN)</span></th>
                </tr>
              </thead>
              <tbody className="text-gray-900 font-medium print:text-[10px]">
                {filteredRecords.map((r, index) => (
                  <tr 
                    key={r.id} 
                    className={`border-b border-gray-300 hover:bg-yellow-50 transition-colors print:border-black print:break-inside-avoid print:h-8 ${index % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}
                  >
                    <td className="px-3 py-3 border-r border-gray-300 whitespace-nowrap print:border-black print:py-1 print:px-1">{r.date}</td>
                    <td className="px-3 py-3 border-r border-gray-300 print:border-black print:py-1 print:px-1">
                      <span className="block truncate">
                        {r.productName}
                        {r.isReturn && <span className="ml-1 text-[10px] font-bold text-orange-600 uppercase border border-orange-200 px-1 rounded bg-orange-50">(Return)</span>}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-300 font-mono text-xs print:border-black print:py-1 print:px-1 print:text-[10px]">{r.batchNo}</td>
                    <td className="px-3 py-3 border-r border-gray-300 whitespace-nowrap print:border-black print:py-1 print:px-1">{r.size}</td>
                    <td className="px-3 py-3 border-r border-gray-300 text-right font-bold text-blue-700 bg-blue-50/30 print:bg-white print:text-black print:border-black print:py-1 print:px-1">
                      {r.weightKg.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 border-r border-gray-300 text-right text-red-600 bg-red-50/30 print:bg-white print:text-black print:border-black print:py-1 print:px-1">
                      {r.rejectedKg > 0 ? r.rejectedKg.toFixed(2) : '-'}
                    </td>
                    <td className="px-3 py-3 border-r border-gray-300 text-right print:border-black print:py-1 print:px-1">{r.duplesPkt}</td>
                    <td className="px-3 py-3 text-right font-bold print:border-black print:py-1 print:px-1">{r.cartonCtn}</td>
                  </tr>
                ))}
                
                {/* Add empty rows only in Preview, hide in Print to save space */}
                {filteredRecords.length < 5 && isPreview && Array.from({ length: 5 - filteredRecords.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-gray-200 h-12">
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200"></td>
                    <td className="border-r border-gray-200 bg-blue-50/10"></td>
                    <td className="border-r border-gray-200 bg-red-50/10"></td>
                    <td className="border-r border-gray-200"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
              
              {/* Totals Footer - Visible on Print OR in Preview Mode */}
              {filteredRecords.length > 0 && (
                <tfoot className={`hidden print:table-footer-group bg-gray-100 border-t-2 border-black font-bold print:text-[10px] ${isPreview ? '!table-footer-group' : ''}`}>
                   <tr>
                      <td colSpan={4} className="px-3 py-3 text-right border-r border-black print:py-1 print:px-1">TOTALS:</td>
                      <td className="px-3 py-3 text-right border-r border-black print:py-1 print:px-1">
                        {filteredRecords.reduce((sum, r) => sum + r.weightKg, 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right border-r border-black print:py-1 print:px-1">
                        {filteredRecords.reduce((sum, r) => sum + r.rejectedKg, 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right border-r border-black print:py-1 print:px-1">
                         {filteredRecords.reduce((sum, r) => sum + r.duplesPkt, 0)}
                      </td>
                      <td className="px-3 py-3 text-right print:py-1 print:px-1">
                         {filteredRecords.reduce((sum, r) => sum + r.cartonCtn, 0)}
                      </td>
                   </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
      
      {filteredRecords.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No records found for the selected period.</p>
        </div>
      )}
    </div>
  );
};
