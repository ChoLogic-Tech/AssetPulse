import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  Package,
  Boxes,
  AlertTriangle,
  Warehouse,
  ClipboardList,
  ArrowRight,
  Search,
  Building2,
  MapPin,
  Layers,
  Tag,
  Truck,
  History,
  FileSpreadsheet,
  SlidersHorizontal,
} from 'lucide-react';
import AuditLogsTable from '@/Components/Dashboard/AuditLogsTable';

const OVERVIEW_PAR_STOCK_LIMIT = 10;
const OVERVIEW_ASSET_LIMIT = 10;
const OVERVIEW_AUDIT_LOG_LIMIT = 10;

// Safely resolve Ziggy routes so a missing route name does not crash the dashboard
function safeRoute(name, fallback = '#') {
  try {
    return route(name);
  } catch {
    return fallback;
  }
}

// Navigate safely when a route name exists in Ziggy
function visitSafeRoute(name, fallback = '#') {
  const target = safeRoute(name, fallback);
  if (target && target !== '#') {
    router.visit(target);
  }
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
    assetUnits = [],
    propertyDistribution = [],
    auditLogs = [],
  } = dashboard;

  const [parSearch, setParSearch] = useState('');
  const [parStatusFilter, setParStatusFilter] = useState('ALL');
  const [assetSearch, setAssetSearch] = useState('');
  const [assetStatusFilter, setAssetStatusFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // Sort par stock by urgency (lowest stock/par ratio first)
  const sortedParStock = useMemo(() => {
    const list = Array.isArray(parStock) ? [...parStock] : [];
    return list.sort((a, b) => {
      const aStock = Number(a.currentStock ?? 0);
      const aPar = Number(a.parLevel ?? 0);
      const bStock = Number(b.currentStock ?? 0);
      const bPar = Number(b.parLevel ?? 0);

      const aRatio = aPar > 0 ? aStock / aPar : aStock === 0 ? 0 : 999;
      const bRatio = bPar > 0 ? bStock / bPar : bStock === 0 ? 0 : 999;

      if (aRatio !== bRatio) return aRatio - bRatio;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    });
  }, [parStock]);

  const filteredParStock = useMemo(() => {
    return sortedParStock.filter((item) => {
      const stock = Number(item.currentStock ?? 0);
      const par = Number(item.parLevel ?? 0);

      let status = 'Healthy';
      if (stock <= 0) status = 'Out of Stock';
      else if (stock <= par) status = 'Low Stock';

      const matchesSearch =
        String(item.name ?? '').toLowerCase().includes(parSearch.toLowerCase()) ||
        String(item.sku ?? '').toLowerCase().includes(parSearch.toLowerCase()) ||
        String(item.category ?? '').toLowerCase().includes(parSearch.toLowerCase());

      const matchesStatus = parStatusFilter === 'ALL' || status === parStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sortedParStock, parSearch, parStatusFilter]);

  const displayedParStock = useMemo(
    () => filteredParStock.slice(0, OVERVIEW_PAR_STOCK_LIMIT),
    [filteredParStock]
  );

  const filteredAssets = useMemo(() => {
    const list = Array.isArray(assetUnits) ? assetUnits : [];
    return list.filter((unit) => {
      const serial = String(unit.serial_number ?? '');
      const name = String(unit.item_name ?? '');
      const prop = String(unit.property_name ?? 'Central Warehouse');
      const loc = String(unit.location_name ?? '');
      const status = String(unit.status ?? '');

      const matchesSearch =
        serial.toLowerCase().includes(assetSearch.toLowerCase()) ||
        name.toLowerCase().includes(assetSearch.toLowerCase()) ||
        prop.toLowerCase().includes(assetSearch.toLowerCase()) ||
        loc.toLowerCase().includes(assetSearch.toLowerCase());

      const matchesStatus = assetStatusFilter === 'ALL' || status === assetStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assetUnits, assetSearch, assetStatusFilter]);

  const displayedAssets = useMemo(
    () => filteredAssets.slice(0, OVERVIEW_ASSET_LIMIT),
    [filteredAssets]
  );

  const normalizedAuditLogs = useMemo(() => {
    const list = Array.isArray(auditLogs) ? auditLogs : [];
    return list.map(normalizeAuditLogRow).slice(0, OVERVIEW_AUDIT_LOG_LIMIT);
  }, [auditLogs]);

  const getStockBadge = (stock, par) => {
    const s = Number(stock ?? 0);
    const p = Number(par ?? 0);
    if (s <= 0) {
      return {
        label: 'Out of Stock',
        cls: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
      };
    }
    if (s <= p) {
      return {
        label: 'Low Stock',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    }
    return {
      label: 'Healthy',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    };
  };

  const getAssetStatusBadge = (status) => {
    switch (status) {
      case 'Available':
      case 'In Warehouse':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Deployed':
      case 'Assigned':
      case 'In Use':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Repair':
      case 'Maintenance':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Retired':
      case 'Disposed':
      case 'Lost':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

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

  // Use safeRoute so missing Ziggy route names fall back to '#' instead of throwing
  const kpiCards = [
    {
      title: 'Total Asset Units',
      value: totalAssets,
      subtitle: 'Serialized hardware tracked',
      icon: Package,
      accent: 'text-blue-600 bg-blue-50 border-blue-100',
      href: safeRoute('asset-units.index', '#'),
    },
    {
      title: 'Low / Out of Par Stock',
      value: lowStockItems,
      subtitle: 'Warehouse items at or below par',
      icon: AlertTriangle,
      accent: 'text-amber-600 bg-amber-50 border-amber-100',
      href: '#warehouse-par-stock',
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      subtitle: 'Awaiting approval / release',
      icon: ClipboardList,
      accent: 'text-purple-600 bg-purple-50 border-purple-100',
      href: '#audit-trail',
    },
    {
      title: 'Masterlist Items',
      value: totalMasterlist,
      subtitle: `${categoriesCount} categories • ${brandsCount} brands • ${suppliersCount} suppliers`,
      icon: Boxes,
      accent: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      href: safeRoute('item-masterlist.index', '#'),
    },
  ];

  const quickLinks = [
    { label: 'Item Masterlist', icon: Boxes, href: safeRoute('item-masterlist.index', '#') },
    { label: 'Asset Units', icon: Package, href: safeRoute('asset-units.index', '#') },
    { label: 'Stock In', icon: Warehouse, href: safeRoute('warehouse-stock-in.index', '#') },
    { label: 'Categories', icon: Layers, href: safeRoute('categories.index', '#') },
    { label: 'Brands', icon: Tag, href: safeRoute('brands.index', '#') },
    { label: 'Suppliers', icon: Truck, href: safeRoute('suppliers.index', '#') },
  ];

  const maxPropertyAssets = useMemo(() => {
    if (!Array.isArray(propertyDistribution) || propertyDistribution.length === 0) return 1;
    return Math.max(...propertyDistribution.map((p) => Number(p.assets ?? 0)), 1);
  }, [propertyDistribution]);

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              IT Inventory & Asset Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Central warehouse par levels, serialized units, property distribution, and system audit trail
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={safeRoute('warehouse-stock-in.index', '#')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              <Warehouse className="h-3.5 w-3.5" />
              Warehouse Stock In
            </Link>
            <Link
              href={safeRoute('asset-units.index', '#')}
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

      <div className="py-6">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              const isAnchorOrFallback =
                String(card.href).startsWith('#') || !card.href;

              const content = (
                <div className="group flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {card.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {Number(card.value ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className={`rounded-lg border p-2.5 ${card.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span className="line-clamp-1">{card.subtitle}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
                  </div>
                </div>
              );

              if (isAnchorOrFallback) {
                return (
                  <a key={card.title} href={card.href || '#'} className="block">
                    {content}
                  </a>
                );
              }

              return (
                <Link key={card.title} href={card.href} className="block">
                  {content}
                </Link>
              );
            })}
          </div>

          {/* Quick Navigation Strip */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Quick Modules
              </div>
              <div className="flex flex-wrap gap-2">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Grid: Warehouse Par Stock + Property Asset Distribution */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Warehouse Par Stock Table */}
            <div
              id="warehouse-par-stock"
              className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2"
            >
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Warehouse Par Stock Overview (Top {OVERVIEW_PAR_STOCK_LIMIT})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prioritized by lowest stock-to-par ratio in central warehouse
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={parSearch}
                      onChange={(e) => setParSearch(e.target.value)}
                      placeholder="Search item or SKU..."
                      className="w-44 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none sm:w-52"
                    />
                  </div>
                  <select
                    value={parStatusFilter}
                    onChange={(e) => setParStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-500 focus:outline-none"
                  >
                    <option value="ALL">All Status</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Healthy">Healthy</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Item / SKU</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                      <th className="px-4 py-3 text-right">Par</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3">Latest RF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {displayedParStock.length > 0 ? (
                      displayedParStock.map((item) => {
                        const badge = getStockBadge(item.currentStock, item.parLevel);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-slate-900">{item.name}</div>
                              <div className="font-mono text-[11px] text-slate-400">
                                {item.sku || 'NO-SKU'}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">{item.category || '—'}</td>
                            <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                              {Number(item.currentStock ?? 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-slate-600">
                              {Number(item.parLevel ?? 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">
                              {item.rf_num || '—'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                          No matching warehouse stock items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
                <span>
                  Showing {displayedParStock.length} of {filteredParStock.length} matching items
                </span>
                <Link
                  href={safeRoute('warehouse-stock-in.index', '#')}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                >
                  Open Stock In
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Property Asset Distribution Card */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      Assets by Property
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Serialized units across properties & warehouse
                    </p>
                  </div>
                  <Building2 className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="flex-1 space-y-4 p-5">
                {Array.isArray(propertyDistribution) && propertyDistribution.length > 0 ? (
                  propertyDistribution.map((prop) => {
                    const count = Number(prop.assets ?? 0);
                    const pct = Math.min(100, Math.round((count / maxPropertyAssets) * 100));
                    const isWarehouse = prop.id === 'warehouse';

                    return (
                      <div key={prop.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                            {isWarehouse ? (
                              <Warehouse className="h-3.5 w-3.5 text-slate-500" />
                            ) : (
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            )}
                            {prop.name}
                          </span>
                          <span className="font-mono font-bold text-slate-700">
                            {count.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              isWarehouse ? 'bg-slate-700' : 'bg-blue-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-8 text-center text-xs text-slate-400">
                    No property asset data available.
                  </p>
                )}
              </div>

              <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs">
                <Link
                  href={safeRoute('asset-units.index', '#')}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                >
                  View all asset units
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Serialized Asset Units Overview */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Serialized Asset Units (Latest {OVERVIEW_ASSET_LIMIT})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quick check of serial numbers, statuses, and assigned locations
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    placeholder="Search serial, item, property..."
                    className="w-48 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none sm:w-56"
                  />
                </div>
                <select
                  value={assetStatusFilter}
                  onChange={(e) => setAssetStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-500 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="In Warehouse">In Warehouse</option>
                  <option value="Deployed">Deployed</option>
                  <option value="Under Repair">Under Repair</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Serial Number</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Property / Location</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {displayedAssets.length > 0 ? (
                    displayedAssets.map((unit) => (
                      <tr
                        key={unit.id}
                        onClick={() => visitSafeRoute('asset-units.index', '#')}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                          {unit.serial_number || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800">{unit.item_name || '—'}</td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-800">
                            {unit.property_name || 'Central Warehouse'}
                          </div>
                          {unit.location_name && (
                            <div className="text-[11px] text-slate-400">{unit.location_name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{unit.supplier_name || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getAssetStatusBadge(
                              unit.status
                            )}`}
                          >
                            {unit.status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                        No asset units match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
              <span>
                Showing {displayedAssets.length} of {filteredAssets.length} matching units
              </span>
              <Link
                href={safeRoute('asset-units.index', '#')}
                className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
              >
                Full Asset Units List
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* System Audit Trail Log */}
          <div
            id="audit-trail"
            className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    System Audit Trail Log (Latest {OVERVIEW_AUDIT_LOG_LIMIT})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing the {OVERVIEW_AUDIT_LOG_LIMIT} most recent system activity entries
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Filter table..."
                  className="w-52 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none sm:w-64"
                />
              </div>
            </div>

            <AuditLogsTable
              logs={normalizedAuditLogs}
              search={auditSearch}
              getAuditActionBadge={getAuditActionBadge}
            />

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                Audit records are captured automatically on stock and asset changes
              </span>
              <span>Capped at {OVERVIEW_AUDIT_LOG_LIMIT} rows on overview</span>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}