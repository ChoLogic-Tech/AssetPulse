import React from 'react';

// Renders the filtered system audit trail rows inside the Dashboard audit card
export default function AuditLogsTable({ logs = [], search = '', getAuditActionBadge }) {
  const q = String(search ?? '').trim().toLowerCase();

  // Cast fields to String so numeric DB IDs or null values don't throw on .toLowerCase()
  const filtered = (Array.isArray(logs) ? logs : []).filter((log) => {
    if (!q) return true;
    return (
      String(log.id ?? '').toLowerCase().includes(q) ||
      String(log.timestamp ?? '').toLowerCase().includes(q) ||
      String(log.user ?? '').toLowerCase().includes(q) ||
      String(log.action ?? '').toLowerCase().includes(q) ||
      String(log.targetType ?? '').toLowerCase().includes(q) ||
      String(log.description ?? '').toLowerCase().includes(q)
    );
  });

  const resolveBadgeClass = (action) => {
    if (typeof getAuditActionBadge === 'function') {
      return getAuditActionBadge(action);
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 text-[10px] sm:text-xs">
          <tr>
            <th className="px-3 py-3 sm:px-5 whitespace-nowrap">Log ID / Timestamp</th>
            <th className="px-3 py-3 sm:px-5 whitespace-nowrap">User</th>
            <th className="px-3 py-3 sm:px-5 whitespace-nowrap">Action</th>
            <th className="px-3 py-3 sm:px-5 whitespace-nowrap">Target Category</th>
            <th className="px-3 py-3 sm:px-5">Description / Activity Log</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium">
          {filtered.length > 0 ? (
            filtered.map((log, idx) => (
              <tr
                key={log.id ?? `${log.timestamp}-${idx}`}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-3 py-3 sm:px-5 sm:py-3.5 whitespace-nowrap">
                  {/* Prefix numeric IDs with LOG- for consistent display */}
                  <div className="font-mono font-bold text-slate-900">
                    {typeof log.id === 'number' ? `LOG-${log.id}` : log.id}
                  </div>
                  <div className="text-[11px] text-slate-400">{log.timestamp}</div>
                </td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5 font-semibold text-blue-600 whitespace-nowrap">
                  {log.user}
                </td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5 whitespace-nowrap">
                  <span
                    className={`inline-block whitespace-nowrap px-2 py-0.5 rounded border text-[10px] font-bold ${resolveBadgeClass(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5 text-slate-700 font-medium whitespace-nowrap">
                  {log.targetType}
                </td>
                <td className="px-3 py-3 sm:px-5 sm:py-3.5 text-slate-800 min-w-[220px]">
                  {log.description}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                No audit logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}