import React from 'react';
import { Link } from '@inertiajs/react';
import {
  Boxes,
  AlertTriangle,
  ClipboardList,
  FolderKanban,
  ArrowRight,
} from 'lucide-react';

// Smoothly scroll to an anchor element on the current page without triggering an Inertia visit
function scrollToAnchor(e, anchorId) {
  const target = document.getElementById(anchorId);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Top KPI summary cards row for the IT Inventory & Asset Dashboard
export default function DashboardKpiCards({
  totalAssets = 0,
  lowStockItems = 0,
  pendingRequests = 0,
  totalMasterlist = 0,
  categoriesCount = 0,
  brandsCount = 0,
  suppliersCount = 0,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Serialized Asset Units */}
      <Link
        href={route('master-data.assetunits.index')}
        className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow transition-all min-w-0"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Asset Units
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {Number(totalAssets ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2.5 text-indigo-600 shrink-0">
            <Boxes className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">Serialized hardware tracked</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 transition-all shrink-0" />
        </div>
      </Link>

      {/* Low or Out of Par Stock */}
      <Link
        href={route('inventory.warehouse')}
        className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow transition-all min-w-0"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Low / Out of Par Stock
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {Number(lowStockItems ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-amber-600 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">Warehouse items at or below par</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 transition-all shrink-0" />
        </div>
      </Link>

      {/* Pending Requests — scrolls directly to the Pending Transactions Overview table */}
      <a
        href="#pending-transactions"
        onClick={(e) => scrollToAnchor(e, 'pending-transactions')}
        className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow transition-all min-w-0"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Requests
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {Number(pendingRequests ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-2.5 text-purple-600 shrink-0">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">Awaiting approval / release</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 transition-all shrink-0" />
        </div>
      </a>

      {/* Masterlist Items */}
      <Link
        href={route('master-data.item_masterlist.index')}
        className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow transition-all min-w-0"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Masterlist Items
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {Number(totalMasterlist ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-600 shrink-0">
            <FolderKanban className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">
            {categoriesCount} categories • {brandsCount} brands • {suppliersCount} suppliers
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 transition-all shrink-0" />
        </div>
      </Link>
    </div>
  );
}