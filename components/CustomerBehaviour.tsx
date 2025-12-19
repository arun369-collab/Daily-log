
import React, { useMemo, useState } from 'react';
import { SalesOrder, Customer } from '../types';
import { Brain, Search, TrendingUp, Calendar, ArrowRight, User, MapPin, Activity, AlertCircle, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { getCustomers } from '../services/storageService';

interface CustomerBehaviourProps {
  orders: SalesOrder[];
}

interface AnalyticsResult {
  customerName: string;
  city: string;
  totalVolumeKg: number;
  orderCount: number;
  lastOrderDate: string;
  avgDaysBetweenOrders: number;
  status: 'Healthy' | 'Drifting' | 'At Risk' | 'New';
  nextExpectedDate: string | null;
  preferredProduct: string;
}

export const CustomerBehaviour: React.FC<CustomerBehaviourProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const customers = useMemo(() => getCustomers(), []);

  const behaviorData = useMemo(() => {
    const results: AnalyticsResult[] = [];
    const today = new Date();

    customers.forEach(customer => {
      // Find all orders for this customer (case-insensitive match on name)
      const customerOrders = orders
        .filter(o => o.customerName.toLowerCase() === customer.name.toLowerCase())
        .sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());

      if (customerOrders.length === 0) return;

      const totalVolume = customerOrders.reduce((sum, o) => sum + o.totalWeightKg, 0);
      const lastOrder = customerOrders[customerOrders.length - 1];
      
      // Calculate Average Frequency (Days between orders)
      let avgFreq = 0;
      if (customerOrders.length > 1) {
        const firstDate = new Date(customerOrders[0].orderDate);
        const lastDate = new Date(lastOrder.orderDate);
        const diffDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);
        avgFreq = Math.round(diffDays / (customerOrders.length - 1));
      }

      // Determine Preferred Product
      const productCounts: Record<string, number> = {};
      customerOrders.forEach(o => {
        o.items.forEach(item => {
          productCounts[item.productName] = (productCounts[item.productName] || 0) + item.calculatedWeightKg;
        });
      });
      const preferred = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Predictive Logic
      const daysSinceLast = Math.round((today.getTime() - new Date(lastOrder.orderDate).getTime()) / (1000 * 3600 * 24));
      
      let status: AnalyticsResult['status'] = 'Healthy';
      let nextDate: string | null = null;

      if (customerOrders.length < 2) {
        status = 'New';
      } else {
        const nextTime = new Date(lastOrder.orderDate);
        nextTime.setDate(nextTime.getDate() + avgFreq);
        nextDate = nextTime.toISOString().split('T')[0];

        if (daysSinceLast > avgFreq * 2) status = 'At Risk';
        else if (daysSinceLast > avgFreq * 1.2) status = 'Drifting';
      }

      results.push({
        customerName: customer.name,
        city: customer.city,
        totalVolumeKg: totalVolume,
        orderCount: customerOrders.length,
        lastOrderDate: lastOrder.orderDate,
        avgDaysBetweenOrders: avgFreq,
        status,
        nextExpectedDate: nextDate,
        preferredProduct: preferred
      });
    });

    return results.sort((a, b) => b.totalVolumeKg - a.totalVolumeKg);
  }, [orders, customers]);

  const filtered = behaviorData.filter(d => 
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-700 shadow-inner">
            <Brain size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Customer Behaviour</h2>
            <p className="text-sm text-gray-500">AI-driven purchase pattern analysis & predictions</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Filter by customer or city..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl w-full outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
          />
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
           <p className="text-xs font-bold text-gray-400 uppercase mb-1">Active Accounts</p>
           <h3 className="text-2xl font-bold text-gray-800">{behaviorData.length}</h3>
        </div>
        <div className="bg-green-50 p-5 rounded-xl border border-green-100 shadow-sm">
           <p className="text-xs font-bold text-green-600 uppercase mb-1">Healthy Cycle</p>
           <h3 className="text-2xl font-bold text-green-700">{behaviorData.filter(d => d.status === 'Healthy').length}</h3>
        </div>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 shadow-sm">
           <p className="text-xs font-bold text-amber-600 uppercase mb-1">Drifting Away</p>
           <h3 className="text-2xl font-bold text-amber-700">{behaviorData.filter(d => d.status === 'Drifting').length}</h3>
        </div>
        <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm">
           <p className="text-xs font-bold text-red-600 uppercase mb-1">Attention Required</p>
           <h3 className="text-2xl font-bold text-red-700">{behaviorData.filter(d => d.status === 'At Risk').length}</h3>
        </div>
      </div>

      {/* Customer Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((data, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{data.customerName}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> {data.city}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                  data.status === 'Healthy' ? 'bg-green-100 text-green-700 border border-green-200' :
                  data.status === 'Drifting' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  data.status === 'At Risk' ? 'bg-red-100 text-red-700 border border-red-200' :
                  'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {data.status}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                   <p className="text-[10px] font-bold text-gray-400 uppercase">Total Weight</p>
                   <p className="text-sm font-bold text-indigo-700">{data.totalVolumeKg.toLocaleString()} Kg</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                   <p className="text-[10px] font-bold text-gray-400 uppercase">Avg Frequency</p>
                   <p className="text-sm font-bold text-gray-700">{data.avgDaysBetweenOrders || '-'} Days</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                   <p className="text-[10px] font-bold text-gray-400 uppercase">Orders</p>
                   <p className="text-sm font-bold text-gray-700">{data.orderCount} Times</p>
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-gray-500">
                     <Calendar size={14} /> <span>Last Purchase:</span>
                   </div>
                   <span className="font-bold text-gray-800">{data.lastOrderDate}</span>
                 </div>
                 
                 {data.nextExpectedDate && (
                    <div className="flex items-center justify-between text-sm bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                      <div className="flex items-center gap-2 text-indigo-600 font-medium">
                        <Sparkles size={14} className="animate-pulse" /> <span>Next Expected:</span>
                      </div>
                      <span className="font-black text-indigo-700">{data.nextExpectedDate}</span>
                    </div>
                 )}

                 <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <TrendingUp size={14} /> <span>Top Product:</span>
                    </div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded max-w-[150px] truncate">
                      {data.preferredProduct}
                    </span>
                 </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center group-hover:bg-indigo-600 transition-colors">
              <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-100 transition-colors">
                {data.status === 'At Risk' ? '⚠️ High Priority Follow-up' : 'Cycle is normal'}
              </span>
              <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 group-hover:text-white transition-colors">
                VIEW HISTORY <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <Activity size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No sales intelligence found. Check order history.</p>
          </div>
        )}
      </div>
    </div>
  );
};
