import React from 'react';

export function ModelModal({ isOpen, onClose, mode = 'create', initialData = null }) {
  if (!isOpen) return null;

  const isViewOnly = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">
            {mode === 'create' && 'Add New Model'}
            {mode === 'edit' && 'Edit Model Record'}
            {mode === 'view' && 'Model Details'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            &times;
          </button>
        </div>

        {/* Modal Form Body */}
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Model Name *
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              placeholder="e.g. Cisco Catalyst 9000, Dell PowerEdge R740, etc."
              defaultValue={initialData?.name || ''}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Brand *
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              placeholder="Seacrh for a brand eg. Cisco, Dell, HP, etc."
              defaultValue={initialData?.brand_id || ''}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              required
              />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                {mode === 'create' ? 'Save Model' : 'Update Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}