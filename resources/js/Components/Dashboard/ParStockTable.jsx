import React from 'react';

export default function ParStockTable({ items, search, getStatusBadge }) {
  const filtered = items.filter(item => 
    item.id.toLowerCase().includes(search.toLowerCase()) ||
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
          <tr>
            <th className="px-5 py-3">Item ID</th>
            <th className="px-5 py-3">Description</th>
            <th className="px-5 py-3 text-center">Stock</th>
            <th className="px-5 py-3 text-center">Par</th>
            <th className="px-5 py-3">Variance</th>
            <th className="px-5 py-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium">
          {filtered.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3.5 font-semibold text-slate-900">{item.id}</td>
              <td className="px-5 py-3.5 font-semibold text-slate-800">{item.name}</td>
              <td className="px-5 py-3.5 text-center font-bold text-slate-900">{item.currentStock}</td>
              <td className="px-5 py-3.5 text-center text-slate-500">{item.parLevel}</td>
              <td className={`px-5 py-3.5 font-bold ${item.variance.includes('+') ? 'text-emerald-600' : 'text-red-600'}`}>{item.variance}</td>
              <td className="px-5 py-3.5 text-right">
                <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold ${getStatusBadge(item.status)}`}>{item.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}