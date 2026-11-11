import React from 'react';
import { X, Warehouse as WarehouseIcon, Package, Tag, ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';

export function WarehouseItemModal({ isOpen, onClose, initialData = null }) {
  if (!isOpen || !initialData) return null;

  const isLowStock = initialData.qty < initialData.parstock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-indigo-600" />
            Central Stock Details
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm text-slate-600">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Location</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                Central Warehouse
              </span>
            </div>
            <div className="text-right">
              <span className="block text-xs text-slate-400 uppercase font-semibold">Available Stock</span>
              <span className="font-bold text-indigo-600 text-base">{initialData.qty} units</span>
            </div>
          </div>

          {isLowStock && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Below Par Stock Warning</span>
                Current stock ({initialData.qty}) is lower than the required baseline par stock level ({initialData.parstock}).
              </div>
            </div>
          )}

          <div>
            <span className="block text-xs text-slate-400 uppercase font-semibold">Item Name</span>
            <span className="font-medium text-slate-900 text-base">{initialData.item_name}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">SKU Code</span>
              <span className="font-mono text-slate-800 flex items-center gap-1 mt-0.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {initialData.sku}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">RF Reference</span>
              <span className="font-mono text-slate-800">{initialData.rf_num || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Total Stock In</span>
              <span className="font-semibold text-emerald-600 text-sm flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                {initialData.stockin}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Total Released</span>
              <span className="font-semibold text-amber-600 text-sm flex items-center justify-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {initialData.stockout}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Par Level</span>
              <span className="font-semibold text-slate-700 text-sm block mt-0.5">
                {initialData.parstock}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}