
import React, { useState, useMemo } from 'react';
import { ProductionRecord } from '../types';
import { FileText, Printer, Calendar, Filter, ArrowRight, Eye, X, Check, Factory, RotateCcw, Truck, List } from 'lucide-react';

interface LedgerSheetProps {
  records: ProductionRecord[];
}

type ReportType = 'all' | 'daily' | 'weekly' | 'monthly' | 'custom';
type EntryFilterType = 'all' | 'production' | 'return' | 'dispatch';

export const LedgerSheet: React.FC<LedgerSheetProps> = ({ records }) => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [entryFilter, setEntryFilter] = useState<EntryFilterType>('all');
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

  // Helper to format date for display: YYYY-MM-DD -> DD-MM-YYYY
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

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

    // 1. Filter by Date Period
    if (reportType === 'daily') {
      filtered = filtered.filter(r => r.date === selectedDate);
    } 
    else if (reportType === 'weekly') {
      if (selectedWeek) {
        const { start, end } = getWeekRange(selectedWeek);
        filtered = filtered.filter(r => r.date >= start && r.date <= end);
      }
    }
    else if (reportType === 'monthly') {
      filtered = filtered.filter(r => r.date.startsWith(selectedMonth));
    }
    else if (reportType === 'custom') {
      filtered = filtered.filter(r => r.date >= customStart && r.date <= customEnd);
    }

    // 2. Filter by Record Type
    if (entryFilter === 'production') {
      filtered = filtered.filter(r => !r.isReturn && !r.isDispatch);
    } else if (entryFilter === 'return') {
      filtered = filtered.filter(r => r.isReturn);
    } else if (entryFilter === 'dispatch') {
      filtered = filtered.filter(r => r.isDispatch);
    }

    // Ascending Sort (1st of the month at top)
    return [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records, reportType, entryFilter, selectedDate, selectedMonth, selectedWeek, customStart, customEnd]);

  // Dynamic Title for the Report
  const reportTitle = useMemo(() => {
    const typeLabel = entryFilter === 'production' ? 'Production' : 
                      entryFilter === 'return' ? 'Returns' : 
                      entryFilter === 'dispatch' ? 'Dispatch' : 'Combined';
    
    let periodLabel = '';
    if (reportType === 'daily') {
      periodLabel = `of ${formatDisplayDate(selectedDate)}`;
    } else if (reportType === 'monthly') {
      const [year, month] = selectedMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
      periodLabel = `of ${monthName} ${year}`;
    } else if (reportType === 'weekly') {
       const { start, end } = getWeekRange(selectedWeek);
       periodLabel = `Report: ${formatDisplayDate(start)} to ${formatDisplayDate(end)}`;
    } else if (reportType === 'custom') {
      periodLabel = `Report: ${formatDisplayDate(customStart)} to ${formatDisplayDate(customEnd)}`;
    } else {
      periodLabel = '(All Time)';
    }

    return `${typeLabel} Ledger ${periodLabel}`;
  }, [reportType, entryFilter, selectedDate, selectedMonth, selectedWeek, customStart, customEnd]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls - Hidden on Print */}
      <div className="print:hidden space-y-4">
        {!isPreview && (
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Daily Ledger Report</h2>
              <p className="text-sm text-gray-500">Filter, review, and print floor activity reports.</p>
            </div>
          </div>
        )}

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

        {!isPreview && (
          <div className="space-y-4">
            {/* Main Control Panel */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 xl:items-end justify-between">
              <div className="flex flex-col md:flex-row gap-4 w-full">
                
                {/* 1. Period Selector */}
                <div className="w-full md:w-48 flex-shrink-0">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time Period</label>
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
                      <option value="custom">Custom Range</option>
                      <option value="all">Full History</option>
                    </select>
                  </div>
                </div>

                {/* 2. Date Pickers */}
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

              {/* Action Buttons */}
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

            {/* Entry Type Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
               <button 
                  onClick={() => setEntryFilter('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                    entryFilter === 'all' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                  }`}
               >
                 <List size={14} /> All Activity
               </button>
               <button 
                  onClick={() => setEntryFilter('production')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                    entryFilter === 'production' 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  }`}
               >
                 <Factory size={14} /> Production
               </button>
               <button 
                  onClick={() => setEntryFilter('return')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                    entryFilter === 'return' 
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'
                  }`}
               >
                 <RotateCcw size={14} /> Returns
               </button>
               <button 
                  onClick={() => setEntryFilter('dispatch')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                    entryFilter === 'dispatch' 
                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
                  }`}
               >
                 <Truck size={14} /> Despatch
               </button>
            </div>
          </div>
        )}
      </div>

      <div className={`transition-all duration-300 ${isPreview ? 'p-8 bg-white shadow-2xl border border-gray-200 max-w-6xl mx-auto min-h-[1123px]' : ''}`}>
        <div className={`hidden print:block text-center mb-8 pb-4 border-b-2 border-black ${isPreview ? '!block' : ''}`}>
          <h1 className="text-3xl font-black text-black uppercase tracking-[0.1em]">{reportTitle}</h1>
        </div>

        <div className={`bg-white shadow-lg overflow-hidden border border-black print:shadow-none print:border-none print:overflow-visible ${isPreview ? 'shadow-none border-none' : ''}`}>
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-sm text-left border-collapse print:table-fixed print:text-[8pt]">
              <thead>
                <tr className="bg-gray-100 text-black border-b-2 border-black font-bold uppercase text-[9px] tracking-wider print:bg-white print:border-black">
                  <th className="px-1.5 py-4 border-r border-black w-24 text-left print:py-2">Date</th>
                  <th className="px-1.5 py-4 border-r border-black text-left print:py-2 min-w-[140px]">Product Name</th>
                  <th className="px-1.5 py-4 border-r border-black w-16 text-center print:py-2">Batch No</th>
                  <th className="px-1.5 py-4 border-r border-black w-24 text-left print:py-2">Size</th>
                  <th className="px-1.5 py-4 border-r border-black text-right w-20 print:py-2">Weight<br/><span className="text-[7px]">K.G.S</span></th>
                  <th className="px-1.5 py-4 border-r border-black text-right w-20 print:py-2">Rej-Weight<br/><span className="text-[7px]">K.G.S</span></th>
                  <th className="px-1.5 py-4 border-r border-black text-right w-20 print:py-2">Duplex<br/><span className="text-[7px]">(PCS/PKT)</span></th>
                  <th className="px-1.5 py-4 text-right w-20 print:py-2">Cartoon<br/><span className="text-[7px]">(CTN)</span></th>
                </tr>
              </thead>
              <tbody className="text-black font-semibold">
                {filteredRecords.map((r, index) => (
                  <tr 
                    key={r.id} 
                    className={`border-b border-black print:break-inside-avoid print:h-8 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-1.5 py-2 border-r border-black text-left whitespace-nowrap">{formatDisplayDate(r.date)}</td>
                    <td className="px-1.5 py-2 border-r border-black text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="block leading-tight">
                          {r.productName}
                        </span>
                        {r.isReturn && (
                           <span className="px-1.5 py-0.5 text-[8px] font-black bg-[#f26522] text-white rounded-sm uppercase whitespace-nowrap tracking-tighter">Return</span>
                        )}
                        {r.isDispatch && (
                           <span className="px-1.5 py-0.5 text-[8px] font-black bg-red-600 text-white rounded-sm uppercase whitespace-nowrap tracking-tighter">Desp</span>
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 py-2 border-r border-black text-center font-mono text-[8pt]">{r.batchNo}</td>
                    <td className="px-1.5 py-2 border-r border-black text-left whitespace-nowrap">{r.size}</td>
                    <td className="px-1.5 py-2 border-r border-black text-right font-bold">
                      {r.weightKg.toFixed(2)}
                    </td>
                    <td className="px-1.5 py-2 border-r border-black text-right">
                      {r.rejectedKg > 0 ? r.rejectedKg.toFixed(2) : '-'}
                    </td>
                    <td className="px-1.5 py-2 border-r border-black text-right">
                       {(r.isReturn || r.isDispatch) ? '-' : (r.duplesPkt > 0 ? r.duplesPkt : '-')}
                    </td>
                    <td className="px-1.5 py-2 text-right font-bold">
                       {(r.isReturn || r.isDispatch) ? '-' : (r.cartonCtn > 0 ? r.cartonCtn : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
              
              {filteredRecords.length > 0 && (
                <tfoot className={`hidden print:table-footer-group bg-gray-100 border-t-2 border-black font-bold print:bg-white ${isPreview ? '!table-footer-group' : ''}`}>
                   <tr className="print:h-10">
                      <td colSpan={4} className="px-1.5 py-3 text-right border-r border-black uppercase tracking-widest text-[9px]">Grand Totals:</td>
                      <td className="px-1.5 py-3 text-right border-r border-black font-black text-sm print:text-[9pt]">
                        {filteredRecords.reduce((sum, r) => sum + r.weightKg, 0).toFixed(2)}
                      </td>
                      <td className="px-1.5 py-3 text-right border-r border-black print:text-[9pt]">
                        {filteredRecords.reduce((sum, r) => sum + r.rejectedKg, 0).toFixed(2)}
                      </td>
                      <td className="px-1.5 py-3 text-right border-r border-black print:text-[9pt]">
                         {(entryFilter === 'return' || entryFilter === 'dispatch') ? '-' : filteredRecords.reduce((sum, r) => sum + (r.isReturn || r.isDispatch ? 0 : r.duplesPkt), 0).toLocaleString()}
                      </td>
                      <td className="px-1.5 py-3 text-right font-black text-sm print:text-[9pt]">
                         {(entryFilter === 'return' || entryFilter === 'dispatch') ? '-' : filteredRecords.reduce((sum, r) => sum + (r.isReturn || r.isDispatch ? 0 : r.cartonCtn), 0).toLocaleString()}
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
          <p>No records found matching your current filter selection.</p>
        </div>
      )}
    </div>
  );
};
