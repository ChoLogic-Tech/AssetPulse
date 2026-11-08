import React from 'react';

export default function AuditLogsTable({ logs, search, getAuditActionBadge }) {
  const filtered = logs.filter(log => 
    log.id.toLowerCase().includes(search.toLowerCase()) ||
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
          <tr>
            <th className="px-5 py-3">Log ID / Timestamp</th>
            <th className="px-5 py-3">User</th>
            <th className="px-5 py-3">Action</th>
            <th className="px-5 py-3">Target Category</th>
            <th className="px-5 py-3">Description / Activity Log</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium">
          {filtered.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3.5">
                <div className="font-mono font-bold text-slate-900">{log.id}</div>
                <div className="text-[11px] text-slate-400">{log.timestamp}</div>
              </td>
              <td className="px-5 py-3.5 font-semibold text-blue-600">{log.user}</td>
              <td className="px-5 py-3.5">
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getAuditActionBadge(log.action)}`}>
                  {log.action}
                </span>
              </td>
              <td className="px-5 py-3.5 text-slate-700 font-medium">{log.targetType}</td>
              <td className="px-5 py-3.5 text-slate-800">{log.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}