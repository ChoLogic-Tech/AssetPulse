import React, { useMemo, useState } from 'react';
// Main authenticated page shell that wraps the dashboard with navigation and header layout
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
// Inertia helpers for setting the browser <title> and rendering SPA links
import { Head, Link } from '@inertiajs/react';
import { Package, Warehouse, Search, History, FileSpreadsheet } from 'lucide-react';
// Top summary KPI cards component (Total Assets, Low/Out Stock, Pending Requests, Masterlist)
import DashboardKpiCards from '@/Components/Dashboard/DashboardKpiCards';
// Quick module shortcut buttons component for fast navigation across inventory modules
import DashboardQuickLinks from '@/Components/Dashboard/DashboardQuickLinks';
// Responsive Warehouse Par Stock Overview table component sorted by stock-to-par urgency
import ParStockOverviewTable from '@/Components/Dashboard/ParStockOverviewTable';
// Property & Central Warehouse serialized asset count breakdown card
import PropertyDistributionCard from '@/Components/Dashboard/PropertyDistributionCard';
// Pending requisitions and open stock transactions overview table
import PendingTransactionsTable from '@/Components/Dashboard/PendingTransactionsTable';
// Latest serialized asset units table with search, status filter, and status badge colors
import DashboardAssetUnitsTable from '@/Components/Dashboard/DashboardAssetUnitsTable';
// System audit trail log table component that renders filtered activity entries
import AuditLogsTable from '@/Components/Dashboard/AuditLogsTable';

const OVERVIEW_AUDIT_LOG_LIMIT = 10;

// Normalize DB audit log fields into the shape expected by AuditLogsTable
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

  // Convert underscores to spaces so action badges read cleanly
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

export default function Dashboard({ dashboard = {} }) {
  const {
    totalAssets = 0,
    pendingRequests = 0,
    totalMasterlist = 0,
    categoriesCount = 0,
    brandsCount = 0,
    suppliersCount = 0,
    parStock = [],
    lowStockItems = 0,
    pendingTransactions = [],
    assetUnits = [],
    propertyDistribution = [],
    auditLogs = [],
  } = dashboard;

  const [auditSearch, setAuditSearch] = useState('');

  const normalizedAuditLogs = useMemo(() => {
    const list = Array.isArray(auditLogs) ? auditLogs : [];
    return list.map(normalizeAuditLogRow).slice(0, OVERVIEW_AUDIT_LOG_LIMIT);
  }, [auditLogs]);

  // Match both spaced and underscored variants so stock-in badges have clear colors
  const getAuditActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
      case 'STOCK IN CREATE':
      case 'STOCK_IN_CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
      case 'STOCK IN UPDATE':
      case 'STOCK_IN_UPDATE':
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
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              IT Inventory &amp; Asset Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Central warehouse par levels, pending transactions, serialized units, property distribution, and audit trail
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={route('inventory.warehousestockin.index')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              <Warehouse className="h-3.5 w-3.5" />
              Warehouse Stock In
            </Link>
            <Link
              href={route('master-data.assetunits.index')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Package className="h-3.5 w-3.5" />
              Manage Assets
            </Link>
          </div>
        </div>
      }
    >
      <Head title="Dashboard" />

      <div className="py-4 sm:py-6">
        <div className="mx-auto max-w-7xl space-y-6 px-3 sm:px-6 lg:px-8">
          {/* Top KPI summary cards */}
          <DashboardKpiCards
            totalAssets={totalAssets}
            lowStockItems={lowStockItems}
            pendingRequests={pendingRequests}
            totalMasterlist={totalMasterlist}
            categoriesCount={categoriesCount}
            brandsCount={brandsCount}
            suppliersCount={suppliersCount}
          />

          {/* Quick navigation strip to main inventory and master-data pages */}
          <DashboardQuickLinks />

          {/* Main grid: min-w-0 prevents horizontal overflow inside CSS grid tracks */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 min-w-0">
            <ParStockOverviewTable parStock={parStock} />
            <PropertyDistributionCard propertyDistribution={propertyDistribution} />
          </div>

          {/* Pending requisitions and open stock transactions overview table */}
          <PendingTransactionsTable transactions={pendingTransactions} />

          {/* Serialized asset units overview table */}
          <DashboardAssetUnitsTable assetUnits={assetUnits} />

          {/* System audit trail log */}
          <div
            id="audit-trail"
            className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm min-w-0"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 shrink-0">
                  <History className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                    System Audit Trail Log (Latest {OVERVIEW_AUDIT_LOG_LIMIT})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing the {OVERVIEW_AUDIT_LOG_LIMIT} most recent system activity entries
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Filter table..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <AuditLogsTable
              logs={normalizedAuditLogs}
              search={auditSearch}
              getAuditActionBadge={getAuditActionBadge}
            />

            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 sm:px-5 py-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                Audit records are captured automatically on stock and asset changes
              </span>
              <span className="whitespace-nowrap">Capped at {OVERVIEW_AUDIT_LOG_LIMIT} rows on overview</span>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}