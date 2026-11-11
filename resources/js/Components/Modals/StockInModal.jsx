import React from 'react';
import { X, Building2, Package, FileText, CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';

export function StockInModal({ isOpen, onClose, mode = 'create', initialData = null, properties = [], items = [] }) {
  if (!isOpen) return null;

  const isView = mode === 'view';

  // Inertia form hook mapped directly to stock_in_logs attributes
  const { data, setData, post, processing, errors, reset } = useForm({
    property_id: initialData?.property_id || '',
    item_id: initialData?.item_id || '',
    quantity: initialData?.quantity || '',
    supplier_id: initialData?.supplier_id || '',
    po_number: initialData?.po_number || '',
    invoice_number: initialData?.invoice_number || '',
    remarks: initialData?.remarks || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Adjust route as needed for your backend controller endpoint
    post(route('inventory.propertystockin.store'), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            {isView ? 'Stock-In Record Details' : 'Manual Property Stock-In'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isView ? (
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">Property / Branch</span>
                <span className="font-medium text-slate-900">{initialData?.property_name}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">Quantity Added</span>
                <span className="font-semibold text-emerald-600">+{initialData?.quantity} units</span>
              </div>
            </div>

            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Item Name & SKU</span>
              <span className="font-medium text-slate-900">{initialData?.item_name}</span>
              <span className="block text-xs font-mono text-slate-500">{initialData?.sku}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">RF Number</span>
                <span className="font-mono text-slate-800">{initialData?.rf_number || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">Invoice Number</span>
                <span className="font-mono text-slate-800">{initialData?.invoice_number || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Supplier</span>
              <span className="text-slate-800">{initialData?.supplier_name || 'N/A'}</span>
            </div>

            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Remarks / Notes</span>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
                {initialData?.remarks || 'No remarks provided.'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Destination Property</label>
              <input
                type="text"
                value={data.property_id}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 bg-white cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Item (From Master Catalog)</label>
              <select
                value={data.item_id}
                onChange={(e) => setData('item_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                required
              >
                <option value="">Select Catalog Item (SKU)...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.sku} - {item.item_name}</option>
                ))}
              </select>
              {errors.item_id && <span className="text-xs text-rose-500 mt-1 block">{errors.item_id}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Quantity Purchased</label>
                <input
                  type="number"
                  min="1"
                  value={data.quantity}
                  onChange={(e) => setData('quantity', e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                {errors.quantity && <span className="text-xs text-rose-500 mt-1 block">{errors.quantity}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">RF Number *</label>
                <input
                  type="text"
                  value={data.po_number}
                  onChange={(e) => setData('po_number', e.target.value)}
                  placeholder="e.g. RF-6561"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={data.invoice_number}
                  onChange={(e) => setData('invoice_number', e.target.value)}
                  placeholder="e.g. INV-9921"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Vendor/Supplier</label>
                <input
                  type="text"
                  value={data.supplier_id}
                  onChange={(e) => setData('supplier_id', e.target.value)}
                  placeholder="Supplier Reference"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Remarks</label>
              <textarea
                rows="2"
                value={data.remarks}
                onChange={(e) => setData('remarks', e.target.value)}
                placeholder="Optional notes or context..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {processing ? 'Saving...' : 'Save Stock-In Record'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}