import React from 'react';
import { X, FileText, Building2, CheckCircle2, Cpu, AlertCircle } from 'lucide-react';
import { useForm } from '@inertiajs/react';

export function FulfillRequisitionModal({ isOpen, onClose, requisition = null, availableAssets = [] }) {
  if (!isOpen || !requisition) return null;

  const { data, setData, post, processing, reset } = useForm({
    requisition_id: requisition.id,
    remarks: '',
    items: requisition.items?.map(item => ({
      item_id: item.item_id,
      item_name: item.item_name,
      sku: item.sku,
      requested_qty: item.requested_qty,
      already_fulfilled: item.fulfilled_qty || 0,
      // Default release amount is whatever is left in the queue
      released_qty: Math.max(0, item.requested_qty - (item.fulfilled_qty || 0)),
      asset_unit_id: '',
    })) || []
  });

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...data.items];
    updatedItems[index][field] = value;
    setData('items', updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('requisitions.fulfill', requisition.id), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Partial / Full Fulfillment: <span className="font-mono text-indigo-600">{requisition.rf_number}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Requesting Branch: <span className="font-medium text-slate-700">{requisition.property_name}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Queue & Line Item Release Breakdown</h4>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {data.items.map((item, index) => {
                const remainingInQueue = item.requested_qty - item.already_fulfilled;

                return (
                  <div key={item.item_id} className="p-4 bg-white space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{item.item_name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Queue Status</span>
                        <span className="text-xs font-medium text-slate-600">
                          Orig: <strong className="text-slate-900">{item.requested_qty}</strong> | Fulfilled: <strong className="text-emerald-600">{item.already_fulfilled}</strong>
                        </span>
                        <div className="text-xs font-bold text-indigo-600">
                          Remaining: {remainingInQueue} units
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Release Now Quantity (Max: {remainingInQueue})
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={remainingInQueue}
                          value={item.released_qty}
                          onChange={(e) => handleItemChange(index, 'released_qty', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-indigo-600" />
                          Assign Serial Number (If Serialized)
                        </label>
                        <select
                          value={item.asset_unit_id}
                          onChange={(e) => handleItemChange(index, 'asset_unit_id', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
                        >
                          <option value="">-- Bulk Item / No Serial Required --</option>
                          {availableAssets
                            .filter(asset => asset.item_id === item.item_id && asset.status === 'Available')
                            .map(asset => (
                              <option key={asset.id} value={asset.id}>
                                S/N: {asset.serial_number} ({asset.status})
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Dispatch Remarks / Notes</label>
            <textarea
              rows="2"
              value={data.remarks}
              onChange={(e) => setData('remarks', e.target.value)}
              placeholder="Explain partial release or mention upcoming backorders..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 resize-none"
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
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {processing ? 'Processing Release...' : 'Confirm Partial Release'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}