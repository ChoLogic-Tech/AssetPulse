import React from 'react';
import { X, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';

export function WarehouseStockInModal({ isOpen, onClose, items = [], suppliers = [] }) {
  if (!isOpen) return null;

  const { data, setData, post, processing, reset, errors } = useForm({
    item_id: '',
    supplier_id: '',
    quantity: '',
    po_number: '',
    invoice_number: '',
    remarks: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Posts to your central stock-in route, which triggers fn_process_stock_in() in PostgreSQL
    post(route('inventory.warehouse.stock-in.store'), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            Manual Warehouse Stock-In
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Catalog Item (SKU / Name) *
            </label>
            <select
              value={data.item_id}
              onChange={(e) => setData('item_id', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
              required
            >
              <option value="">Select Catalog Item...</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.sku} - {i.item_name}</option>
              ))}
            </select>
            {errors.item_id && <span className="text-xs text-rose-500 mt-1 block">{errors.item_id}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Supplier / Vendor
            </label>
            <select
              value={data.supplier_id}
              onChange={(e) => setData('supplier_id', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
            >
              <option value="">Select Supplier (Optional)...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.supplier_id && <span className="text-xs text-rose-500 mt-1 block">{errors.supplier_id}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={data.quantity}
                onChange={(e) => setData('quantity', e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 font-bold text-emerald-600"
                required
              />
              {errors.quantity && <span className="text-xs text-rose-500 mt-1 block">{errors.quantity}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                RF Number
              </label>
              <input
                type="text"
                value={data.po_number}
                onChange={(e) => setData('po_number', e.target.value)}
                placeholder="e.g. RF-6561"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Invoice No.
              </label>
              <input
                type="text"
                value={data.invoice_number}
                onChange={(e) => setData('invoice_number', e.target.value)}
                placeholder="INV-992"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Remarks / Delivery Notes
            </label>
            <textarea
              rows="2"
              value={data.remarks}
              onChange={(e) => setData('remarks', e.target.value)}
              placeholder="Delivery conditions or par stock reorder remarks..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 resize-none"
            />
          </div>

          {/* Action Footer */}
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
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {processing ? 'Saving Stock-In...' : 'Record Stock-In'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}