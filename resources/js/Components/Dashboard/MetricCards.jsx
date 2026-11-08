import React from 'react';
import { Package, Clock, Tag, AlertTriangle } from 'lucide-react';

export default function MetricCards({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Item Masterlist Data</p>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{metrics.totalMasterlist} Items</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{metrics.categoriesCount} Categories • {metrics.brandsCount} Brands</span>
        </div>
        <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
          <Package className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Requisitions</p>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">{metrics.pendingRequests} Requests</span>
          <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded inline-block mt-0.5 font-medium">Action Required</span>
        </div>
        <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Serialized Units</p>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{metrics.totalAssets} Units</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Across 7 property locations</span>
        </div>
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
          <Tag className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Stock / Shortages</p>
          <span className="text-2xl font-bold text-red-600 mt-1 block">{metrics.lowStockItems} Items</span>
          <span className="text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded inline-block mt-0.5 font-medium">Below Minimum Limit</span>
        </div>
        <div className="p-2 bg-red-50 text-red-600 rounded-md">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}