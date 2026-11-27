import React, { useMemo, useState } from 'react';
// Main authenticated shell with sidebar and top navigation
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
// Inertia helpers for browser page title
import { Head } from '@inertiajs/react';
import { History, Search } from 'lucide-react';
// Reusable audit log table component
import AuditLogsTable from '@/Components/Dashboard/AuditLogsTable';

// Normalize audit log fields into a consistent shape for AuditLogsTable
function normalizeAuditLogRow(row) {
    if (!row || typeof row !== 'object') return row;

    const rawDate = row.timestamp ?? row.created_at;
    const parsedDate = rawDate ? new Date(rawDate) : null;
    const formattedTimestamp =
        parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleString()
            : String(rawDate ?? '—');

    const rawTable = String(row.targetType ?? row.table_name ?? 'System');
    const targetType = row.targetType
        ? row.targetType
        : rawTable
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (char) => char.toUpperCase());

    // Normalize underscores and casing so action badges stay readable
    const rawAction = String(row.action ?? row.action_type ?? 'UPDATE')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

    return {
        ...row,
        id: row.id ?? '—',
        timestamp: formattedTimestamp,
        user: row.user ?? row.user_name ?? row.username ?? 'System',
        action: rawAction,
        targetType,
        description: row.description ?? '—',
    };
}

// Match badge colors across create, update, release, and delete actions
function getAuditActionBadge(action) {
    switch (action) {
        case 'CREATE':
        case 'STOCK IN CREATE':
        case 'STOCK_IN_CREATE':
        case 'PARSTOCK CREATE':
        case 'PARSTOCK_CREATE':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'UPDATE':
        case 'STOCK IN UPDATE':
        case 'STOCK_IN_UPDATE':
        case 'PARSTOCK UPDATE':
        case 'PARSTOCK_UPDATE':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'RELEASE':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'DELETE':
        case 'STOCK IN DELETE':
        case 'STOCK_IN_DELETE':
            return 'bg-red-50 text-red-700 border-red-200';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

// Full Audit Trail page rendered at /audit-trail
export default function AuditTrailIndex({ auditLogs = [] }) {
    const [search, setSearch] = useState('');

    // Support both plain arrays and Laravel paginator objects ({ data: [...] })
    const rawList = Array.isArray(auditLogs)
        ? auditLogs
        : Array.isArray(auditLogs?.data)
          ? auditLogs.data
          : [];

    const normalizedLogs = useMemo(() => rawList.map(normalizeAuditLogRow), [rawList]);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                        System Audit Trail
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Complete history of stock movements, par stock adjustments, and user activity
                    </p>
                </div>
            }
        >
            <Head title="Audit Trail" />

            <div className="py-4 sm:py-6">
                <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm min-w-0">
                        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600">
                                    <History className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                                        Audit Log Entries
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Showing {normalizedLogs.length} loaded records
                                    </p>
                                </div>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search audit logs..."
                                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <AuditLogsTable
                            logs={normalizedLogs}
                            search={search}
                            getAuditActionBadge={getAuditActionBadge}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}