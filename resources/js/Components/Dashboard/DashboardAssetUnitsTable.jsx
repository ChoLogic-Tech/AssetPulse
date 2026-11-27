import React, { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Search, ArrowRight } from 'lucide-react';

const OVERVIEW_ASSET_LIMIT = 10;

// Matches status badge colors and dot styles on the Serialized Asset Units page
const ASSET_STATUS_STYLES = {
  Available: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Deployed: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  'Under Repair': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  Damage: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  'Back Load (Iloilo)': {
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
  },
  Decommissioned: {
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
    dot: 'bg-slate-400',
  },
};

const DEFAULT_ASSET_STATUS_STYLE = {
  badge: 'bg-slate-50 text-slate-700 border-slate-200',
  dot: 'bg-slate-400',
};

function getAssetStatusStyle(status) {
  return ASSET_STATUS_STYLES[status] ?? DEFAULT_ASSET_STATUS_STYLE;
}

// Displays latest serialized asset units with search and status filtering
export default function DashboardAssetUnitsTable({ assetUnits = [] }) {
  const [assetSearch, setAssetSearch] = useState('');
  const [assetStatusFilter, setAssetStatusFilter] = useState('ALL');

  const filteredAssets = useMemo(() => {
    const list = Array.isArray(assetUnits) ? assetUnits : [];
    return list.filter((unit) => {
      const serial = String(unit.serial_number ?? '');
      const name = String(unit.item_name ?? '');
      const prop = String(unit.property_name ?? 'Central Warehouse');
      const loc = String(unit.location_name ?? '');
      const status = String(unit.status ?? unit.asset_status ?? '');

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

  return (
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
            <option value="Deployed">Deployed</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Damage">Damage</option>
            <option value="Back Load (Iloilo)">Back Load (Iloilo)</option>
            <option value="Decommissioned">Decommissioned</option>
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
              displayedAssets.map((unit) => {
                const statusValue = unit.status ?? unit.asset_status ?? 'Available';
                const statusStyle = getAssetStatusStyle(statusValue);

                return (
                  <tr
                    key={unit.id}
                    onClick={() => router.visit(route('master-data.assetunits.index'))}
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
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                        {statusValue}
                      </span>
                    </td>
                  </tr>
                );
              })
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
          href={route('master-data.assetunits.index')}
          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
        >
          Full Asset Units List
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}