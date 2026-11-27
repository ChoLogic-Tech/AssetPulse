import React, { useMemo, useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ClipboardList, Search, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

// Badge colors for pending requisition / stock transaction statuses
function getStatusBadge(status) {
  const normalized = String(status ?? 'PENDING').trim().toUpperCase();

  switch (normalized) {
    case 'PENDING':
    case 'PENDING APPROVAL':
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        label: 'Pending',
      };
    case 'FOR RELEASE':
    case 'APPROVED':
      return {
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        label: normalized === 'APPROVED' ? 'Approved' : 'For Release',
      };
    case 'PARTIAL':
    case 'PARTIALLY RELEASED':
      return {
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
        label: 'Partial',
      };
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        label: status || 'Pending',
      };
  }
}

// Normalize incoming transaction/requisition rows into a consistent shape
function normalizeTransactionRow(row, index) {
  const rawDate = row.requested_at ?? row.created_at ?? row.date;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const formattedDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      : String(rawDate ?? '—');

  return {
    id: row.id ?? index,
    referenceNo:
      row.requisition_no ?? row.reference_no ?? row.rf_no ?? `REQ-${row.id ?? index + 1}`,
    property: row.property_name ?? row.property?.name ?? row.location ?? '—',
    requestedBy: row.requested_by ?? row.requester_name ?? row.user?.name ?? '—',
    itemsSummary: row.items_summary ?? row.item_name ?? `${row.items_count ?? 1} item(s)`,
    totalQty: row.total_qty ?? row.quantity ?? '—',
    status: row.status ?? 'PENDING',
    date: formattedDate,
  };
}

// Responsive pending transactions table with search, status filter, and 5-row pagination
export default function PendingTransactionsTable({ transactions = [] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const normalizedRows = useMemo(
    () => (Array.isArray(transactions) ? transactions.map(normalizeTransactionRow) : []),
    [transactions]
  );

  // Filter rows by search term and selected status
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return normalizedRows.filter((row) => {
      const matchesStatus =
        statusFilter === 'ALL' || String(row.status).trim().toUpperCase() === statusFilter;

      const matchesSearch =
        !term ||
        row.referenceNo.toLowerCase().includes(term) ||
        row.property.toLowerCase().includes(term) ||
        row.requestedBy.toLowerCase().includes(term) ||
        row.itemsSummary.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [normalizedRows, search, statusFilter]);

  // Reset pagination to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  return (
    <div
      id="pending-transactions"
      className="scroll-mt-6 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm min-w-0"
    >
      {/* Header with title, search box, and status dropdown */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 shrink-0">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
              Pending Transactions Overview
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Open requisitions and stock transactions awaiting approval or release
            </p>
          </div>
        </div>

        {/* Search and status filter controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref #, property, user..."
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-7 text-xs font-medium text-slate-700 focus:border-slate-500 focus:outline-none"
          >
            <option value="ALL">All Pending</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved / For Release</option>
            <option value="PARTIAL">Partial</option>
          </select>
        </div>
      </div>

      {/* Horizontally scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4 whitespace-nowrap">Reference #</th>
              <th className="py-3 px-4 whitespace-nowrap">Property / Location</th>
              <th className="py-3 px-4 whitespace-nowrap">Items / Summary</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Qty</th>
              <th className="py-3 px-4 whitespace-nowrap">Requested By</th>
              <th className="py-3 px-4 whitespace-nowrap">Date</th>
              <th className="py-3 px-4 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-slate-400">
                  No pending transactions match the current filter.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const statusStyle = getStatusBadge(row.status);
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {row.referenceNo}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {row.property}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {row.itemsSummary}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {row.totalQty}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {row.requestedBy}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                        {statusStyle.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination controls and link to requisitions page */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>
            Showing {paginatedRows.length} of {filteredRows.length} pending transactions
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 font-medium text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <Link
          href="/requisitions/index"
          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          Open Requisitions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}