import React, { useMemo, useState } from 'react';
import { ProductionRecord } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line 
} from 'recharts';
import { Filter, PieChart as PieIcon, BarChart3, TrendingUp, Calendar } from 'lucide-react';

interface VisualAnalyticsProps {
  records: ProductionRecord[];
}

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0891b2', '#db2777'];

type TimeRange = '7days' | '30days' | '90days' | 'all';

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ records }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');

  // Filter records based on time range
  const filteredRecords = useMemo(() => {
    if (timeRange === 'all') return records;
    
    const now = new Date();
    const daysToSubtract = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract)).toISOString().split('T')[0];
    
    return records.filter(r => r.date >= cutoffDate);
  }, [records, timeRange]);

  // 1. Production Trend (Area Chart)
  const trendData = useMemo(() => {
    const grouped = filteredRecords.reduce((acc, curr) => {
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
  }, [filteredRecords]);

  // 2. Product Family Mix (Pie Chart)
  const familyData = useMemo(() => {
    const grouped = filteredRecords.reduce<Record<string, number>>((acc, curr) => {
      // Extract family (e.g., "SPARKWELD 6013" -> "6013", "VACUUM 7018" -> "7018")
      // Simple heuristic: check catalog keywords or splits
      let family = "Other";
      if (curr.productName.includes("6013")) family = "6013";
      else if (curr.productName.includes("7018")) family = "7018";
      else if (curr.productName.includes("Ni")) family = "Ni/NiFe";
      else if (curr.productName.includes("7024")) family = "7024";
      else family = curr.productName.split(' ')[0]; // Fallback

      acc[family] = (acc[family] || 0) + curr.weightKg;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // 3. Rejection by Product (Bar Chart)
  const rejectionByProduct = useMemo(() => {
    type ProductStats = { name: string, rejected: number, production: number };
    const grouped = filteredRecords.reduce<Record<string, ProductStats>>((acc, curr) => {
      const name = curr.productName;
      if (!acc[name]) acc[name] = { name, rejected: 0, production: 0 };
      acc[name].rejected += curr.rejectedKg;
      acc[name].production += curr.weightKg;
      return acc;
    }, {});

    return Object.values(grouped)
      .filter((i) => i.rejected > 0)
      .sort((a, b) => b.rejected - a.rejected)
      .slice(0, 8); // Top 8
  }, [filteredRecords]);

  // 4. Size Distribution (Donut)
  const sizeData = useMemo(() => {
    const grouped = filteredRecords.reduce<Record<string, number>>((acc, curr) => {
      // Normalize size string if needed
      const size = curr.size;
      acc[size] = (acc[size] || 0) + curr.weightKg;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Controls Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Production Analytics</h2>
            <p className="text-sm text-gray-500">Visual insights into factory performance</p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
           {(['7days', '30days', '90days', 'all'] as TimeRange[]).map((range) => (
             <button
               key={range}
               onClick={() => setTimeRange(range)}
               className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                 timeRange === range 
                   ? 'bg-white text-purple-700 shadow-sm' 
                   : 'text-gray-500 hover:text-gray-700'
               }`}
             >
               {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : range === '90days' ? '3 Months' : 'All Time'}
             </button>
           ))}
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Production Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
               <TrendingUp size={18} className="text-blue-600" /> Production Trend
             </h3>
             <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">Weight (Kg)</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                <Area type="monotone" dataKey="production" name="Good Production (Kg)" stroke="#2563eb" fillOpacity={1} fill="url(#colorProd)" />
                <Area type="monotone" dataKey="rejection" name="Rejected (Kg)" stroke="#dc2626" fillOpacity={1} fill="url(#colorRej)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Product Mix */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
               <PieIcon size={18} className="text-green-600" /> Product Family Mix
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

        {/* 3. Size Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
               <BarChart3 size={18} className="text-amber-600" /> Production by Size
             </h3>
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={sizeData} layout="vertical" margin={{ left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} />
                 <Tooltip formatter={(value: number) => `${value.toLocaleString()} Kg`} />
                 <Bar dataKey="value" name="Weight (Kg)" fill="#d97706" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* 4. Top Rejections */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
               <TrendingUp size={18} className="text-red-600" /> Top Rejections by Product
             </h3>
             <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 font-medium">Focus Areas</span>
           </div>
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={rejectionByProduct} margin={{ bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" tick={{fontSize: 10}} angle={-15} textAnchor="end" interval={0} height={60} />
                 <YAxis yAxisId="left" orientation="left" stroke="#dc2626" label={{ value: 'Rejected (Kg)', angle: -90, position: 'insideLeft' }} />
                 <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" label={{ value: 'Total Prod (Kg)', angle: 90, position: 'insideRight' }} />
                 <Tooltip />
                 <Legend />
                 <Bar yAxisId="left" dataKey="rejected" name="Rejected Kg" fill="#dc2626" barSize={30} radius={[4, 4, 0, 0]} />
                 <Line yAxisId="right" type="monotone" dataKey="production" name="Total Production Kg" stroke="#94a3b8" strokeWidth={2} dot={{r: 4}} />
               </ComposedChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>
    </div>
  );
};
