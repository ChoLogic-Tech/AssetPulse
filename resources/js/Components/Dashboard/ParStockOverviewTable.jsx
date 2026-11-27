import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Search, ArrowRight } from 'lucide-react';

const OVERVIEW_PAR_STOCK_LIMIT = 10;

function getStockBadge(stock, par) {
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
}

// Responsive Warehouse Par Stock Overview table sorted by lowest stock-to-par ratio
export default function ParStockOverviewTable({ parStock = [] }) {
  const [parSearch, setParSearch] = useState('');
  const [parStatusFilter, setParStatusFilter] = useState('ALL');

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
    const q = parSearch.trim().toLowerCase();
    return sortedParStock.filter((item) => {
      const stock = Number(item.currentStock ?? 0);
      const par = Number(item.parLevel ?? 0);

      let status = 'Healthy';
      if (stock <= 0) status = 'Out of Stock';
      else if (stock <= par) status = 'Low Stock';

      const matchesSearch =
        !q ||
        String(item.name ?? '').toLowerCase().includes(q) ||
        String(item.sku ?? '').toLowerCase().includes(q) ||
        String(item.category ?? '').toLowerCase().includes(q);

      const matchesStatus = parStatusFilter === 'ALL' || status === parStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sortedParStock, parSearch, parStatusFilter]);

  const displayedParStock = useMemo(
    () => filteredParStock.slice(0, OVERVIEW_PAR_STOCK_LIMIT),
    [filteredParStock]
  );

  return (
    <div
      id="warehouse-par-stock"
      className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2 min-w-0"
    >
      {/* Header & Responsive Search/Filter Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            Warehouse Par Stock Overview (Top {OVERVIEW_PAR_STOCK_LIMIT})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritized by lowest stock-to-par ratio in central warehouse
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={parSearch}
              onChange={(e) => setParSearch(e.target.value)}
              placeholder="Search item or SKU..."
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={parStatusFilter}
            onChange={(e) => setParStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-500 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Healthy">Healthy</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] sm:text-[11px] font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3 sm:px-4 lg:px-5 whitespace-nowrap">Item / SKU</th>
              <th className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">Category</th>
              <th className="px-2.5 py-3 sm:px-4 text-right whitespace-nowrap">Stock</th>
              <th className="px-2.5 py-3 sm:px-4 text-right whitespace-nowrap">Par</th>
              <th className="px-3 py-3 sm:px-4 whitespace-nowrap">Status</th>
              <th className="px-3 py-3 sm:px-4 lg:px-5 whitespace-nowrap">Latest RF</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-medium">
            {displayedParStock.length > 0 ? (
              displayedParStock.map((item) => {
                const badge = getStockBadge(item.currentStock, item.parLevel);

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 sm:px-4 sm:py-3.5 lg:px-5 min-w-[160px] max-w-[260px]">
                      <div className="font-semibold text-slate-900 break-words leading-snug">
                        {item.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                        {item.sku || 'NO-SKU'}
                      </div>
                      <div className="sm:hidden text-[11px] text-slate-500 mt-0.5">
                        {item.category || '—'}
                      </div>
                    </td>

                    <td className="hidden sm:table-cell px-4 py-3.5 text-slate-600">
                      {item.category || '—'}
                    </td>

                    <td className="px-2.5 py-3 sm:px-4 sm:py-3.5 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {Number(item.currentStock ?? 0).toLocaleString()}
                    </td>

                    <td className="px-2.5 py-3 sm:px-4 sm:py-3.5 text-right text-slate-600 tabular-nums whitespace-nowrap">
                      {Number(item.parLevel ?? 0).toLocaleString()}
                    </td>

                    <td className="px-3 py-3 sm:px-4 sm:py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>

                    <td className="px-3 py-3 sm:px-4 sm:py-3.5 lg:px-5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
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

      {/* Footer */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 sm:px-5 py-3 text-xs text-slate-500">
        <span>
          Showing {displayedParStock.length} of {filteredParStock.length} matching items
        </span>
        <Link
          href={route('inventory.warehousestockin.index')}
          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap"
        >
          Open Stock In
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}