import React from 'react';
import { router } from '@inertiajs/react';
import { X } from 'lucide-react';

export default function AssetDetailsModal({ asset, onClose, getStatusBadge }) {
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-xl p-6 text-slate-800 relative">
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
          <div>
            <span className="text-xs font-semibold text-blue-600">{asset.tag}</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{asset.name}</h3>
            <p className="text-xs text-slate-400 font-mono">SN: {asset.serial}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Current Location:</span>
            <span className="font-semibold text-slate-900">{asset.property}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Assigned User / Slot:</span>
            <span className="font-semibold text-slate-900">{asset.assignedTo}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Category:</span>
            <span className="text-slate-700">{asset.category}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Status:</span>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusBadge(asset.status)}`}>{asset.status}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Purchase Date:</span>
            <span className="text-slate-700">{asset.purchaseDate || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Warranty Expiration:</span>
            <span className="text-slate-700">{asset.warrantyExp || 'N/A'}</span>
          </div>
          <div className="pt-2">
            <span className="text-slate-500 block mb-1">Notes / History:</span>
            <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-[11px]">{asset.notes || 'No records logged.'}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={() => router.visit(`/assets/${asset.serial}/edit`)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm"
          >
            Edit Asset
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}