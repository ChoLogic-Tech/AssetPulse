import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Building2, MapPin, Warehouse, ArrowRight } from 'lucide-react';

// Displays serialized asset counts per property and central warehouse
export default function PropertyDistributionCard({ propertyDistribution = [] }) {
  const maxPropertyAssets = useMemo(() => {
    if (!Array.isArray(propertyDistribution) || propertyDistribution.length === 0) return 1;
    return Math.max(...propertyDistribution.map((p) => Number(p.assets ?? 0)), 1);
  }, [propertyDistribution]);

  return (
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
          href={route('master-data.assetunits.index')}
          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
        >
          View all asset units
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}