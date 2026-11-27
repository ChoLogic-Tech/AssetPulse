import React from 'react';
import { Link } from '@inertiajs/react';
import { Package, Boxes, AlertTriangle, ClipboardList, ArrowRight } from 'lucide-react';

// Renders the 4 top KPI cards on the Dashboard overview
export default function DashboardKpiCards({
  totalAssets = 0,
  lowStockItems = 0,
  pendingRequests = 0,
  totalMasterlist = 0,
  categoriesCount = 0,
  brandsCount = 0,
  suppliersCount = 0,
}) {
  const kpiCards = [
    {
      title: 'Total Asset Units',
      value: totalAssets,
      subtitle: 'Serialized hardware tracked',
      icon: Package,
      accent: 'text-blue-600 bg-blue-50 border-blue-100',
      href: route('master-data.assetunits.index'),
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
      href: route('master-data.item_masterlist.index'),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiCards.map((card) => {
        const Icon = card.icon;
        const isAnchor = String(card.href).startsWith('#');

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

        if (isAnchor) {
          return (
            <a key={card.title} href={card.href} className="block">
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
  );
}