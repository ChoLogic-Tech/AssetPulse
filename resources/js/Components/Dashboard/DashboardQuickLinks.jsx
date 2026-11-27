import React from 'react';
import { Link } from '@inertiajs/react';
import { Boxes, Package, Warehouse, Layers, Tag, Truck, SlidersHorizontal } from 'lucide-react';

// Renders quick module shortcuts below the KPI cards
export default function DashboardQuickLinks() {
  const quickLinks = [
    { label: 'Item Masterlist', icon: Boxes, href: route('master-data.item_masterlist.index') },
    { label: 'Asset Units', icon: Package, href: route('master-data.assetunits.index') },
    { label: 'Stock In', icon: Warehouse, href: route('inventory.warehousestockin.index') },
    { label: 'Categories', icon: Layers, href: route('master-data.categories.index') },
    { label: 'Brands', icon: Tag, href: route('master-data.brands.index') },
    { label: 'Suppliers', icon: Truck, href: route('master-data.suppliers.index') },
  ];

  return (
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
  );
}