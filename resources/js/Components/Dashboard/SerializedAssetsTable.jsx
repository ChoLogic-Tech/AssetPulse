import React from 'react';

export default function SerializedAssetsTable({ assets, search, onInspect }) {
  const filtered = assets.filter(asset => 
    asset.tag.toLowerCase().includes(search.toLowerCase()) ||
    asset.serial.toLowerCase().includes(search.toLowerCase()) ||
    asset.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
          <tr>
            <th className="px-5 py-3">Tag / Serial</th>
            <th className="px-5 py-3">Model</th>
            <th className="px-5 py-3">Location</th>
            <th className="px-5 py-3">Assigned To</th>
            <th className="px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium">
          {filtered.map((asset) => (
            <tr key={asset.serial} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3.5">
                <div className="font-semibold text-blue-600">{asset.tag}</div>
                <div className="text-[11px] text-slate-400 font-mono">{asset.serial}</div>
              </td>
              <td className="px-5 py-3.5 font-semibold text-slate-900">{asset.name}</td>
              <td className="px-5 py-3.5 text-slate-600">{asset.property}</td>
              <td className="px-5 py-3.5 text-slate-500">{asset.assignedTo}</td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => onInspect(asset)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-[11px] font-semibold shadow-sm"
                >
                  Inspect
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}