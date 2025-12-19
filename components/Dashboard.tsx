
import React, { useMemo, useState } from 'react';
import { ProductionRecord } from '../types';
import { generateProductionInsight } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { StatCard } from './StatCard';
import { Package, AlertTriangle, Activity, Scale, Sparkles, Loader2, Box, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  records: ProductionRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const stats = useMemo(() => {
    const prodRecords = records.filter(r => !r.isDispatch && !r.isReturn);
    const totalWeight = prodRecords.reduce((acc, r) => acc + r.weightKg, 0);
    const totalRejected = prodRecords.reduce((acc, r) => acc + r.rejectedKg, 0);
    const totalCartons = prodRecords.reduce((acc, r) => acc + r.cartonCtn, 0);
    const totalPallets = totalWeight / 1000;
    const totalProcessed = totalWeight + totalRejected;
    const rejectionRate = totalProcessed > 0 ? ((totalRejected / totalProcessed) * 100).toFixed(2) : "0.00";
    const uniqueBatches = new Set(prodRecords.map(r => r.batchNo)).size;
    return { totalWeight, totalRejected, totalCartons, rejectionRate, uniqueBatches, totalPallets };
  }, [records]);

  const chartData = useMemo(() => {
    const prodRecords = records.filter(r => !r.isDispatch && !r.isReturn);
    const grouped = prodRecords.reduce((acc, curr) => {
      const existing = acc.find(item => item.date === curr.date);
      if (existing) {
        existing.weightKg += curr.weightKg;
        existing.rejectedKg += curr.rejectedKg;
      } else {
        acc.push({ date: curr.date, weightKg: curr.weightKg, rejectedKg: curr.rejectedKg });
      }
      return acc;
    }, [] as { date: string, weightKg: number, rejectedKg: number }[]);
    return grouped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
  }, [records]);

  // Ascending Sorted display list from Dec 1st
  const sortedDisplayList = useMemo(() => {
    return [...records]
      .filter(r => r.date >= '2025-12-01')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const insight = await generateProductionInsight(records.filter(r => !r.isDispatch));
    setAiSummary(insight);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Production (Kg)" 
          value={stats.totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
          icon={Scale} 
          colorClass="text-blue-600"
          trend="Net Good Weight Produced"
        />
        <StatCard 
          title="Total Pallets" 
          value={stats.totalPallets.toFixed(1)} 
          icon={Layers} 
          colorClass="text-green-600"
          trend="1 Pallet = 1000 Kg"
        />
        <StatCard 
          title="Total Cartons (CTN)" 
          value={stats.totalCartons.toLocaleString()} 
          icon={Box} 
          colorClass="text-amber-500"
          trend="Final Packed Units"
        />
        <StatCard 
          title="Rejection Rate" 
          value={`${stats.rejectionRate}%`} 
          icon={AlertTriangle} 
          colorClass="text-red-500"
          trend={`Total: ${stats.totalRejected.toFixed(2)} Kg`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Production Weight vs Rejections</h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">Last 7 Days (Manufacturing Only)</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weightKg" name="Good Weight (Kg)" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} />
                  <Line type="monotone" dataKey="rejectedKg" name="Rejected (Kg)" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Floor Entries (Ascending)</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500">
                   <tr>
                     <th className="px-6 py-3 font-medium">Date</th>
                     <th className="px-6 py-3 font-medium">Ref/Batch</th>
                     <th className="px-6 py-3 font-medium">Type</th>
                     <th className="px-6 py-3 font-medium">Product</th>
                     <th className="px-6 py-3 font-medium text-right">Weight (Kg)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {sortedDisplayList.slice(0, 15).map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{formatDisplayDate(r.date)}</td>
                        <td className="px-6 py-3 font-mono text-xs text-gray-600">{r.batchNo}</td>
                        <td className="px-6 py-3">
                           {r.isDispatch ? (
                             <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">DISPATCH</span>
                           ) : r.isReturn ? (
                             <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">RETURN</span>
                           ) : (
                             <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">PROD</span>
                           )}
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {r.productName} 
                          <span className="ml-2 text-xs text-gray-400">({r.size})</span>
                        </td>
                        <td className="px-6 py-3 text-right font-bold">{r.weightKg.toFixed(2)}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl shadow-lg text-white p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-yellow-400" />
              <h3 className="text-xl font-bold">Daily Summary AI</h3>
            </div>
            <p className="text-indigo-200 text-sm mb-6">Analyze performance since Dec 1st.</p>
            <div className="flex-1 bg-white/10 rounded-lg p-4 text-sm leading-relaxed overflow-y-auto max-h-[400px]">
              {loadingAi ? (
                <div className="flex flex-col items-center justify-center h-full text-indigo-200 gap-2">
                  <Loader2 className="animate-spin w-8 h-8" />
                  <span>Analyzing ledger...</span>
                </div>
              ) : aiSummary ? (
                <div className="prose prose-invert prose-sm">
                   <ReactMarkdown>{aiSummary}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-indigo-300 opacity-60">
                  <span className="text-center">Click below to summarize manufacturing performance.</span>
                </div>
              )}
            </div>
            <button
              onClick={handleGenerateInsight}
              disabled={loadingAi || records.length === 0}
              className="mt-6 w-full py-3 bg-white text-indigo-900 rounded-lg font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loadingAi ? 'Thinking...' : 'Generate Performance Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
