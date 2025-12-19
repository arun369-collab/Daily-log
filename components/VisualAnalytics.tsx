
import React, { useMemo, useState } from 'react';
import { ProductionRecord } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line 
} from 'recharts';
// Added missing AlertTriangle icon to the lucide-react imports
import { Filter, PieChart as PieIcon, BarChart3, TrendingUp, Calendar, Truck, Factory, Package, AlertTriangle } from 'lucide-react';

interface VisualAnalyticsProps {
  records: ProductionRecord[];
}

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0891b2', '#db2777'];

type TimeRange = '7days' | '30days' | '90days' | 'all';
type AnalyticsView = 'production' | 'despatch';

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ records }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [viewTab, setViewTab] = useState<AnalyticsView>('production');

  // Filter records based on time range
  const filteredRecords = useMemo(() => {
    if (timeRange === 'all') return records;
    
    const now = new Date();
    const daysToSubtract = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract)).toISOString().split('T')[0];
    
    return records.filter(r => r.date >= cutoffDate);
  }, [records, timeRange]);

  // Split data for separate analysis
  const productionRecords = useMemo(() => filteredRecords.filter(r => !r.isDispatch && !r.isReturn), [filteredRecords]);
  const despatchRecords = useMemo(() => filteredRecords.filter(r => r.isDispatch), [filteredRecords]);

  // --- PRODUCTION CALCULATIONS ---

  // 1. Production Trend
  const prodTrendData = useMemo(() => {
    const grouped = productionRecords.reduce((acc, curr) => {
      const existing = acc.find(item => item.date === curr.date);
      if (existing) {
        existing.production += curr.weightKg;
        existing.rejection += curr.rejectedKg;
      } else {
        acc.push({ date: curr.date, production: curr.weightKg, rejection: curr.rejectedKg });
      }
      return acc;
    }, [] as { date: string, production: number, rejection: number }[]);
    
    return grouped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [productionRecords]);

  // 2. Production Mix (Pie)
  const familyData = useMemo(() => {
    const grouped = productionRecords.reduce<Record<string, number>>((acc, curr) => {
      let family = "Other";
      if (curr.productName.includes("6013")) family = "6013";
      else if (curr.productName.includes("7018")) family = "7018";
      else if (curr.productName.includes("Ni")) family = "Ni/NiFe";
      else if (curr.productName.includes("7024")) family = "7024";
      else family = curr.productName.split(' ')[0];

      acc[family] = (acc[family] || 0) + curr.weightKg;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [productionRecords]);

  // 3. Rejection by Product
  const rejectionByProduct = useMemo(() => {
    type ProductStats = { name: string, rejected: number, production: number };
    const grouped = productionRecords.reduce<Record<string, ProductStats>>((acc, curr) => {
      const name = curr.productName;
      if (!acc[name]) acc[name] = { name, rejected: 0, production: 0 };
      acc[name].rejected += curr.rejectedKg;
      acc[name].production += curr.weightKg;
      return acc;
    }, {});

    return (Object.values(grouped) as ProductStats[])
      .filter((i) => i.rejected > 0)
      .sort((a, b) => b.rejected - a.rejected)
      .slice(0, 8);
  }, [productionRecords]);

  // --- DESPATCH CALCULATIONS ---

  // 4. Despatch Trend
  const despatchTrendData = useMemo(() => {
    const grouped = despatchRecords.reduce((acc, curr) => {
      const existing = acc.find(item => item.date === curr.date);
      if (existing) {
        existing.weight += curr.weightKg;
      } else {
        acc.push({ date: curr.date, weight: curr.weightKg });
      }
      return acc;
    }, [] as { date: string, weight: number }[]);
    
    return grouped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [despatchRecords]);

  // 5. Despatch Destination Mix
  const despatchDestData = useMemo(() => {
    const grouped = despatchRecords.reduce<Record<string, number>>((acc, curr) => {
      // Notes usually contains customer/destination in dispatch entries
      const dest = curr.notes?.split(' ')[0] || "Unknown"; 
      acc[dest] = (acc[dest] || 0) + curr.weightKg;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [despatchRecords]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Controls Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Visual Insights</h2>
            <p className="text-sm text-gray-500">Factory Performance & Logistics</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
            <button
              onClick={() => setViewTab('production')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                viewTab === 'production' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Factory size={16} /> Manufacturing
            </button>
            <button
              onClick={() => setViewTab('despatch')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                viewTab === 'despatch' 
                  ? 'bg-white text-red-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Truck size={16} /> Despatch
            </button>
          </div>

          <div className="w-px h-8 bg-gray-200 hidden lg:block"></div>

          {/* Time Filter */}
          <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
             {(['7days', '30days', '90days', 'all'] as TimeRange[]).map((range) => (
               <button
                 key={range}
                 onClick={() => setTimeRange(range)}
                 className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                   timeRange === range 
                     ? 'bg-white text-purple-700 shadow-sm' 
                     : 'text-gray-500 hover:text-gray-700'
                 }`}
               >
                 {range === '7days' ? '7D' : range === '30days' ? '30D' : range === '90days' ? '3M' : 'ALL'}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* MANUFACTURING VIEW */}
      {viewTab === 'production' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* 1. Production Trend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <Factory size={18} className="text-blue-600" /> Manufacturing Trend
               </h3>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">Daily Output (Kg)</span>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prodTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRej" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="production" name="Good Production" stroke="#2563eb" fillOpacity={1} fill="url(#colorProd)" />
                  <Area type="monotone" dataKey="rejection" name="Rejected Material" stroke="#dc2626" fillOpacity={1} fill="url(#colorRej)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Product Mix */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <PieIcon size={18} className="text-green-600" /> Production Mix by Family
               </h3>
             </div>
             <div className="h-64 w-full flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={familyData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {familyData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(value: number) => `${value.toLocaleString()} Kg`} />
                   <Legend layout="vertical" verticalAlign="middle" align="right" />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* 3. Top Rejections */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <AlertTriangle size={18} className="text-red-600" /> Rejection Intensity
               </h3>
               <span className="text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 font-bold uppercase">QA Focus</span>
             </div>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={rejectionByProduct} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9}} />
                   <Tooltip />
                   <Bar dataKey="rejected" name="Rejected Kg" fill="#dc2626" radius={[0, 4, 4, 0]} />
                 </ComposedChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {/* DESPATCH VIEW */}
      {viewTab === 'despatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* 1. Despatch Outflow Trend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <Truck size={18} className="text-red-600" /> Despatch Outflow Trend
               </h3>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100 uppercase">Outbound Load</span>
               </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={despatchTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="weight" name="Dispatched Weight (Kg)" stroke="#dc2626" fillOpacity={1} fill="url(#colorDesp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Volume by Recipient */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <Package size={18} className="text-blue-600" /> Outbound Volume Distribution
               </h3>
             </div>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={despatchDestData} layout="vertical" margin={{ left: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fontWeight: 'bold'}} />
                   <Tooltip formatter={(value: number) => `${value.toLocaleString()} Kg`} />
                   <Bar dataKey="value" name="Total Dispatched" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* 3. Quick Logistics Stats */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
             <h3 className="font-bold text-gray-800 mb-6">Logistics Performance</h3>
             <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Truck size={20} /></div>
                      <span className="text-sm font-medium text-gray-600">Total Despatch Weight</span>
                   </div>
                   <span className="text-lg font-bold text-blue-700">{despatchRecords.reduce((acc, r) => acc + r.weightKg, 0).toLocaleString()} Kg</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Package size={20} /></div>
                      <span className="text-sm font-medium text-gray-600">Despatch Entries</span>
                   </div>
                   <span className="text-lg font-bold text-red-700">{despatchRecords.length} Loads</span>
                </div>
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Calendar size={20} /></div>
                      <span className="text-sm font-medium text-gray-600">Avg. Load Weight</span>
                   </div>
                   <span className="text-lg font-bold text-green-700">
                     {despatchRecords.length > 0 
                        ? (despatchRecords.reduce((acc, r) => acc + r.weightKg, 0) / despatchRecords.length).toFixed(0) 
                        : 0} Kg
                   </span>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Calendar size={32} />
           </div>
           <p className="text-gray-400 font-medium">No analytics data available for the selected period.</p>
        </div>
      )}
    </div>
  );
};
