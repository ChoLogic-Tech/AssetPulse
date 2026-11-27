// Import React hook, Inertia Link, and Lucide icons for the property distribution card
import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Building2, MapPin, Warehouse, ArrowRight } from 'lucide-react';

// Color hex values matched to each property banner (with a slightly deepened bar tone where light)
const PROPERTY_COLOR_MAP = {
  'henann regency': {
    barHex: '#B8B098',
    iconHex: '#9A9176',
  },
  'henann palm': {
    barHex: '#7BB4C7',
    iconHex: '#599BB2',
  },
  'henann garden': {
    barHex: '#7E973D',
    iconHex: '#697F31',
  },
  'henann lagoon': {
    barHex: '#5B8FD1',
    iconHex: '#4276BA',
  },
  'henann park': {
    barHex: '#F29A4B',
    iconHex: '#D97E2E',
  },
  'henann crystal sands': {
    barHex: '#A7BD73',
    iconHex: '#88A152',
  },
  'henann prime': {
    barHex: '#D3918B',
    iconHex: '#B9736D',
  },
  'the muse hotel': {
    barHex: '#B2A5C7',
    iconHex: '#9283AB',
  },
};

// Fallback palette for Central Warehouse or any newly added property
const WAREHOUSE_COLOR = {
  barHex: '#475569',
  iconHex: '#64748B',
};

const FALLBACK_PALETTE = [
  { barHex: '#3B82F6', iconHex: '#2563EB' },
  { barHex: '#10B981', iconHex: '#059669' },
  { barHex: '#F59E0B', iconHex: '#D97706' },
  { barHex: '#8B5CF6', iconHex: '#7C3AED' },
];

// Resolve a property's color hex pair by normalized name or fallback hash
function getPropertyColor(prop, index) {
  if (!prop || prop.id === 'warehouse') {
    return WAREHOUSE_COLOR;
  }

  const normalizedName = String(prop.name ?? '').trim().toLowerCase();
  if (PROPERTY_COLOR_MAP[normalizedName]) {
    return PROPERTY_COLOR_MAP[normalizedName];
  }

  const key = normalizedName || String(prop.id ?? index);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

// Displays serialized asset counts per property and central warehouse using property colors
export default function PropertyDistributionCard({ propertyDistribution = [] }) {
  // Compute maximum asset count so bar widths scale proportionally
  const maxPropertyAssets = useMemo(() => {
    if (!Array.isArray(propertyDistribution) || propertyDistribution.length === 0) return 1;
    return Math.max(...propertyDistribution.map((p) => Number(p.assets ?? 0)), 1);
  }, [propertyDistribution]);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Assets by Property
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Serialized units across properties &amp; warehouse
            </p>
          </div>
          <Building2 className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Property & warehouse asset distribution bars */}
      <div className="flex-1 space-y-4 p-5">
        {Array.isArray(propertyDistribution) && propertyDistribution.length > 0 ? (
          propertyDistribution.map((prop, index) => {
            const count = Number(prop.assets ?? 0);
            const pct = Math.min(100, Math.round((count / maxPropertyAssets) * 100));
            const isWarehouse = prop.id === 'warehouse';
            const color = getPropertyColor(prop, index);

            return (
              <div key={prop.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                    {isWarehouse ? (
                      <Warehouse
                        className="h-3.5 w-3.5"
                        style={{ color: color.iconHex }}
                      />
                    ) : (
                      <MapPin
                        className="h-3.5 w-3.5"
                        style={{ color: color.iconHex }}
                      />
                    )}
                    {prop.name}
                  </span>
                  <span className="font-mono font-bold text-slate-700 tabular-nums">
                    {count.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color.barHex,
                    }}
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

      {/* Card footer link to serialized asset units */}
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