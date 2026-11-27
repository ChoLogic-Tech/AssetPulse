import React, { useMemo, useState } from 'react';
// Main authenticated page shell that wraps the dashboard with navigation and header layout
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
// Inertia helpers for setting the browser <title>, reading shared auth props, and rendering SPA links
import { Head, Link, usePage } from '@inertiajs/react';
import { Package, Warehouse, Search, History, FileSpreadsheet, Building2 } from 'lucide-react';
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
const PROPERTY_PAR_OVERVIEW_LIMIT = 10;

// Ordered palette matching the pin/bar colors shown in "Assets by Property"
const PROPERTY_COLOR_THEMES = [
  'bg-cyan-50 text-cyan-800 border-cyan-200',       // 1st property (teal/cyan)
  'bg-amber-50 text-amber-800 border-amber-200',    // 2nd property (amber/orange)
  'bg-lime-50 text-lime-800 border-lime-200',       // 3rd property (olive/lime)
  'bg-blue-50 text-blue-800 border-blue-200',       // 4th property (blue)
  'bg-orange-50 text-orange-800 border-orange-200', // 5th property (orange)
  'bg-rose-50 text-rose-800 border-rose-200',       // 6th property (rose)
  'bg-stone-100 text-stone-700 border-stone-300',   // 7th property (stone/taupe)
];

// Explicit property-name color map so the badge matches the property's pin/bar even if list order changes
const PROPERTY_NAME_THEME_MAP = {
  'henann palm': 'bg-cyan-50 text-cyan-800 border-cyan-200',
  'henann crystal': 'bg-amber-50 text-amber-800 border-amber-200',
  'henann garden': 'bg-lime-50 text-lime-800 border-lime-200',
  'henann lagoon': 'bg-blue-50 text-blue-800 border-blue-200',
  'henann park': 'bg-orange-50 text-orange-800 border-orange-200',
  'henann prime': 'bg-rose-50 text-rose-800 border-rose-200',
  'henann regency': 'bg-stone-100 text-stone-700 border-stone-300',
  'central warehouse': 'bg-slate-100 text-slate-800 border-slate-300',
};

// Pick the badge class matching the property's color in PropertyDistributionCard
function getPropertyBadgeClass(propertyName, propertyId, propertyDistribution = []) {
  const normalizedName = String(propertyName ?? '').trim().toLowerCase();

  if (normalizedName && PROPERTY_NAME_THEME_MAP[normalizedName]) {
    return PROPERTY_NAME_THEME_MAP[normalizedName];
  }

  const list = Array.isArray(propertyDistribution) ? propertyDistribution : [];
  const matchedIndex = list.findIndex((item) => {
    if (propertyId !== null && propertyId !== undefined && item?.id !== undefined) {
      if (String(item.id) === String(propertyId)) return true;
    }
    if (normalizedName && item?.name) {
      return String(item.name).trim().toLowerCase() === normalizedName;
    }
    return false;
  });

  if (matchedIndex >= 0) {
    return PROPERTY_COLOR_THEMES[matchedIndex % PROPERTY_COLOR_THEMES.length];
  }

  return 'bg-slate-100 text-slate-700 border-slate-200';
}

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

  // Remove parentheses and duplicate "SN:" prefixes so log descriptions read smoothly
  const cleanDescription = String(row.description ?? '—')
    .replace(/\s*\(([^)]+)\)/g, ' — $1')
    .replace(/[()]/g, '')
    .replace(/\bSN:\s*(?=SN[-\s])/gi, '')
    .replace(/(?:\s*—\s*){2,}/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    ...row,
    id: row.id ?? '—',
    timestamp: formattedTimestamp,
    user: row.user ?? row.user_name ?? row.username ?? 'System',
    action: rawAction,
    targetType,
    description: cleanDescription || '—',
  };
}

export default function Dashboard({ dashboard = {} }) {
  // Read logged-in user's assigned property from Inertia shared auth props
  const { auth } = usePage().props;
  const userPropertyId = auth?.user?.property_id ?? null;

  const {
    totalAssets = 0,
    pendingRequests = 0,
    totalMasterlist = 0,
    categoriesCount = 0,
    brandsCount = 0,
    suppliersCount = 0,
    parStock = [],
    lowStockItems = 0,
    propertyParStock = [],
    propertyLowStockItems = 0,
    pendingTransactions = [],
    assetUnits = [],
    propertyDistribution = [],
    auditLogs = [],
  } = dashboard;

  const [auditSearch, setAuditSearch] = useState('');
  const [propertyParSearch, setPropertyParSearch] = useState('');
  const [propertyParStatusFilter, setPropertyParStatusFilter] = useState('');

  // Scope property par stock rows to the logged-in user's assigned property (when set)
  const userPropertyParRows = useMemo(() => {
    const list = Array.isArray(propertyParStock) ? propertyParStock : [];
    const hasAssignedProperty =
      userPropertyId !== null &&
      userPropertyId !== undefined &&
      String(userPropertyId) !== '';

    return list.filter((row) => {
      if (Number(row?.parLevel ?? 0) <= 0) return false;
      if (!hasAssignedProperty) return true;
      return String(row?.property_id) === String(userPropertyId);
    });
  }, [propertyParStock, userPropertyId]);

  // Resolve the display label for the user's assigned property
  const userPropertyName = useMemo(() => {
    if (userPropertyParRows[0]?.property_name) {
      return userPropertyParRows[0].property_name;
    }

    if (Array.isArray(propertyDistribution) && userPropertyId !== null) {
      const matched = propertyDistribution.find(
        (p) => String(p.id) === String(userPropertyId)
      );
      if (matched?.name) return matched.name;
    }

    return userPropertyId !== null ? `Property #${userPropertyId}` : 'Your Property';
  }, [userPropertyParRows, propertyDistribution, userPropertyId]);

  // Match badge color to the property's color in Assets by Property
  const userPropertyBadgeClass = useMemo(
    () => getPropertyBadgeClass(userPropertyName, userPropertyId, propertyDistribution),
    [userPropertyName, userPropertyId, propertyDistribution]
  );

  // Count how many items in the user's property are at or below baseline parstock
  const userPropertyLowCount = useMemo(() => {
    if (userPropertyId === null || userPropertyId === undefined || String(userPropertyId) === '') {
      return Number(propertyLowStockItems ?? 0);
    }

    return userPropertyParRows.filter(
      (row) => Number(row?.currentStock ?? 0) <= Number(row?.parLevel ?? 0)
    ).length;
  }, [userPropertyParRows, userPropertyId, propertyLowStockItems]);

  // Rank the user's property items by lowest stock-to-par ratio first
  const prioritizedPropertyParStock = useMemo(() => {
    const q = propertyParSearch.trim().toLowerCase();

    return userPropertyParRows
      .map((row) => {
        const qty = Number(row?.currentStock ?? 0);
        const par = Number(row?.parLevel ?? 1);
        const ratio = par > 0 ? qty / par : 999;
        const status =
          qty === 0 ? 'Out of Stock' : qty < par ? 'Low Stock' : 'Healthy';

        return {
          ...row,
          qty,
          par,
          ratio,
          status,
        };
      })
      .filter((row) => {
        const matchesStatus = propertyParStatusFilter
          ? row.status === propertyParStatusFilter
          : true;

        const matchesSearch =
          !q ||
          row.name?.toLowerCase().includes(q) ||
          row.sku?.toLowerCase().includes(q) ||
          row.property_name?.toLowerCase().includes(q) ||
          row.category?.toLowerCase().includes(q) ||
          row.rf_num?.toLowerCase().includes(q);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (a.ratio !== b.ratio) return a.ratio - b.ratio;
        if (a.qty !== b.qty) return a.qty - b.qty;
        return String(a.name ?? '').localeCompare(String(b.name ?? ''));
      })
      .slice(0, PROPERTY_PAR_OVERVIEW_LIMIT);
  }, [userPropertyParRows, propertyParSearch, propertyParStatusFilter]);

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
              Central warehouse &amp; property par levels, pending transactions, serialized units, property distribution, and audit trail
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
              href={route('inventory.propertystockin.index')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5" />
              Property Stock In
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
            propertyLowStockItems={propertyLowStockItems}
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

          {/* Property Par Stock Overview (Top 10) scoped to user's assigned property */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm min-w-0">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                      Property Par Stock Overview (Top {PROPERTY_PAR_OVERVIEW_LIMIT})
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${userPropertyBadgeClass}`}
                    >
                      {userPropertyName}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                        userPropertyLowCount > 0
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {userPropertyLowCount.toLocaleString()} at/below par
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prioritized by lowest stock-to-par ratio for {userPropertyName}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={propertyParSearch}
                    onChange={(e) => setPropertyParSearch(e.target.value)}
                    placeholder="Search item, SKU, or RF..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
                  />
                </div>

                <select
                  value={propertyParStatusFilter}
                  onChange={(e) => setPropertyParStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-500 focus:outline-none cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Healthy">Healthy</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item / SKU</th>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Stock</th>
                    <th className="py-3 px-4 text-right">Par</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Latest RF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {prioritizedPropertyParStock.length > 0 ? (
                    prioritizedPropertyParStock.map((row) => {
                      const isOut = row.status === 'Out of Stock';
                      const isLow = row.status === 'Low Stock';

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{row.name}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {row.sku || 'NO-SKU'}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {row.property_name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {row.category || 'Uncategorized'}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                            {row.qty.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700 tabular-nums">
                            {row.par.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                isOut
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isOut
                                    ? 'bg-rose-500'
                                    : isLow
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {row.rf_num || 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-6 px-4 text-center text-slate-400">
                        No property items with baseline parstock set for {userPropertyName}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 sm:px-5 py-3 text-xs text-slate-500">
              <span>Set or adjust property baseline parstock from Property Stock Monitor</span>
              <Link
                href={route('inventory.propertyinventory')}
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Open Property Stock Monitor →
              </Link>
            </div>
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