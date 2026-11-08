import React from 'react';

export default function RequisitionsTable({ requests, search, getStatusBadge }) {
  const filtered = requests.filter(req => 
    req.id.toLowerCase().includes(search.toLowerCase()) ||
    req.property.toLowerCase().includes(search.toLowerCase()) ||
    req.item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
          <tr>
            <th className="px-5 py-3">Req ID / Date</th>
            <th className="px-5 py-3">Property</th>
            <th className="px-5 py-3">Item / Release Type</th>
            <th className="px-5 py-3 text-center">Qty</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium">
          {filtered.map((req) => (
            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3.5">
                <div className="font-semibold text-blue-600">{req.id}</div>
                <div className="text-[11px] text-slate-400">{req.date}</div>
              </td>
              <td className="px-5 py-3.5">
                <div className="text-slate-900 font-semibold">{req.property}</div>
                <div className="text-[11px] text-slate-500">By: {req.requester}</div>
              </td>
              <td className="px-5 py-3.5">
                <div className="text-slate-800 font-medium">{req.item}</div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono">{req.type}</span>
              </td>
              <td className="px-5 py-3.5 text-center font-bold text-slate-900">{req.qty}</td>
              <td className="px-5 py-3.5">
                <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold ${getStatusBadge(req.status)}`}>
                  {req.status}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                {req.status === 'Pending Approval' && <button className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px]">Approve</button>}
                {req.status === 'Approved' && <button className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px]">Release Item</button>}
                {req.status === 'Ready for Release' && <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px]">Release</button>}
                {req.status === 'Fulfilled' && <span className="text-[11px] text-emerald-600 font-medium">Completed</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}