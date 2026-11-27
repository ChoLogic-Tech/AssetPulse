import React, { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  Boxes,
  Package,
  Warehouse,
  Building2,
  Layers,
  Tag,
  Truck,
  SlidersHorizontal,
  X,
  ArrowRight,
} from 'lucide-react';

// Renders quick module shortcuts below the KPI cards
export default function DashboardQuickLinks() {
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);

  const warehouseStockInHref = route('inventory.warehousestockin.index');
  const propertyStockInHref = route('inventory.propertystockin.index');

  const quickLinks = [
    { label: 'Item Masterlist', icon: Boxes, href: route('master-data.item_masterlist.index') },
    { label: 'Asset Units', icon: Package, href: route('master-data.assetunits.index') },
    { label: 'Stock In', icon: Warehouse, onClick: () => setIsStockInModalOpen(true) },
    { label: 'Categories', icon: Layers, href: route('master-data.categories.index') },
    { label: 'Brands', icon: Tag, href: route('master-data.brands.index') },
    { label: 'Suppliers', icon: Truck, href: route('master-data.suppliers.index') },
  ];

  useEffect(() => {
    if (!isStockInModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsStockInModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStockInModalOpen]);

  const handleNavigate = (href) => {
    setIsStockInModalOpen(false);
    router.visit(href);
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Quick Modules
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              const className =
                'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors';

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className={className}
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-500" />
                    {item.label}
                  </button>
                );
              }

              return (
                <Link key={item.label} href={item.href} className={className}>
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {isStockInModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
          onClick={() => setIsStockInModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stock-in-selector-title"
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="stock-in-selector-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Select Stock In Type
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose whether to record incoming stock for the warehouse or a property.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStockInModalOpen(false)}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => handleNavigate(warehouseStockInHref)}
                className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                    <Warehouse className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Warehouse Stock In
                    </div>
                    <div className="text-xs text-slate-500">
                      Receive stock into central warehouse inventory
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
              </button>

              <button
                type="button"
                onClick={() => handleNavigate(propertyStockInHref)}
                className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Property Stock In
                    </div>
                    <div className="text-xs text-slate-500">
                      Record incoming stock directly for a property
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStockInModalOpen(false)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}