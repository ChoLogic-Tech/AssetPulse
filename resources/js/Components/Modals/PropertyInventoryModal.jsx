import React from 'react';
import { X, Building2, Package, Layers, Tag } from 'lucide-react';

export function PropertyInventoryModal({ isOpen, onClose, initialData = null }) {
  if (!isOpen || !initialData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Property Stock Details
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
              <span className="block text-xs text-slate-400 uppercase font-semibold">Assigned Property</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                {initialData.property_name}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-xs text-slate-400 uppercase font-semibold">On-Hand Stock</span>
              <span className="font-bold text-indigo-600 text-base">{initialData.current_stock} units</span>
            </div>
          </div>

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
              <span className="block text-xs text-slate-400 uppercase font-semibold">Category</span>
              <span className="text-slate-800 font-medium">{initialData.category_name || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Brand</span>
              <span className="text-slate-800">{initialData.brand_name || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Model</span>
              <span className="text-slate-800">{initialData.model_name || 'N/A'}</span>
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