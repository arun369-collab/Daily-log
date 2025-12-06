import React, { useMemo, useState } from 'react';
import { ProductionRecord } from '../types';
import { generateProductionInsight } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { StatCard } from './StatCard';
import { Package, AlertTriangle, Activity, Scale, Sparkles, Loader2, Box } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  records: ProductionRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Memoized computations for performance
  const stats = useMemo(() => {
    const totalWeight = records.reduce((acc, r) => acc + r.weightKg, 0);
    const totalRejected = records.reduce((acc, r) => acc + r.rejectedKg, 0);
    const totalCartons = records.reduce((acc, r) => acc + r.cartonCtn, 0);
    
    // Rejection Rate Calculation: Rejected / (Good + Rejected) or just Rejected / Total Produced if WeightKg is gross.
    // Assuming WeightKg is Good production. If WeightKg includes rejected, formula changes. 
    // Standard: Rate = (Rejected / (Good + Rejected)) * 100.
    // Let's assume WeightKg is 'Net Good Weight' and RejectedKg is separate.
    const totalProcessed = totalWeight + totalRejected;
    const rejectionRate = totalProcessed > 0 ? ((totalRejected / totalProcessed) * 100).toFixed(2) : "0.00";
    
    // Unique Batches
    const uniqueBatches = new Set(records.map(r => r.batchNo)).size;

    return { totalWeight, totalRejected, totalCartons, rejectionRate, uniqueBatches };
  }, [records]);

  const chartData = useMemo(() => {
    // Group by Date for the chart
    const grouped = records.reduce((acc, curr) => {
      const existing = acc.find(item => item.date === curr.date);
      if (existing) {
        existing.weightKg += curr.weightKg;
        existing.rejectedKg += curr.rejectedKg;
      } else {
        acc.push({ date: curr.date, weightKg: curr.weightKg, rejectedKg: curr.rejectedKg });
      }
      return acc;
    }, [] as { date: string, weightKg: number, rejectedKg: number }[]);

    // Sort by date and take last 7 days
    return grouped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
  }, [records]);

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const insight = await generateProductionInsight(records);
    setAiSummary(insight);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Production (Kg)" 
          value={stats.totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
          icon={Scale} 
          colorClass="text-blue-600"
          trend="Net Good Weight"
        />
        <StatCard 
          title="Rejection Rate" 
          value={`${stats.rejectionRate}%`} 
          icon={AlertTriangle} 
          colorClass="text-red-500"
          trend={`Total: ${stats.totalRejected.toFixed(2)} Kg`}
        />
        <StatCard 
          title="Total Cartons (CTN)" 
          value={stats.totalCartons.toLocaleString()} 
          icon={Box} 
          colorClass="text-amber-500"
          trend="Final Packed Units"
        />
        <StatCard 
          title="Batches Processed" 
          value={stats.uniqueBatches} 
          icon={Activity} 
          colorClass="text-purple-500"
          trend={`${records.length} total entries`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Production Trend Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Production Weight vs Rejections (Last 7 Days)</h3>
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
          
          {/* Recent Activity Mini Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Recent Ledger Entries</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500">
                   <tr>
                     <th className="px-6 py-3 font-medium">Date</th>
                     <th className="px-6 py-3 font-medium">Batch No</th>
                     <th className="px-6 py-3 font-medium">Product</th>
                     <th className="px-6 py-3 font-medium text-right">Weight (Kg)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {records.slice(0, 5).map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{r.date}</td>
                        <td className="px-6 py-3 font-mono text-xs text-gray-600">{r.batchNo}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {r.productName} 
                          <span className="ml-2 text-xs text-gray-400">({r.size})</span>
                        </td>
                        <td className="px-6 py-3 text-right">{r.weightKg.toFixed(2)}</td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No ledger entries found.</td>
                      </tr>
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* AI Insight Column */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl shadow-lg text-white p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-yellow-400" />
              <h3 className="text-xl font-bold">Daily Summary AI</h3>
            </div>
            
            <p className="text-indigo-200 text-sm mb-6">
              Generate a summary of Yadav's ledger data. Identifies weight trends, high rejection batches, and packaging totals.
            </p>

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
                  <span className="text-center">Click below to summarize today's ledger.</span>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateInsight}
              disabled={loadingAi || records.length === 0}
              className="mt-6 w-full py-3 bg-white text-indigo-900 rounded-lg font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loadingAi ? 'Thinking...' : 'Generate Ledger Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};