import React, { useEffect, useMemo } from 'react';
import { X, ArrowDownLeft, CheckCircle2, Cpu } from 'lucide-react';
import { useForm } from '@inertiajs/react';

export function WarehouseStockInModal({
  isOpen,
  onClose,
  items = [],
  suppliers = [],
  assetUnits = [],
}) {
  const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
    item_id: '',
    supplier_id: '',
    quantity: '',
    po_number: '',
    invoice_number: '',
    remarks: '',
    selected_asset_unit_ids: [],
  });

  useEffect(() => {
    if (!isOpen) return;
    clearErrors();
    reset();
  }, [isOpen]);

  const matchingSerials = useMemo(() => {
    if (!data.item_id) return [];
    return assetUnits.filter(
      (unit) =>
        String(unit.item_id) === String(data.item_id) &&
        (unit.status ?? 'Available') === 'Available'
    );
  }, [assetUnits, data.item_id]);

  const showSerialList = Boolean(data.item_id) && matchingSerials.length > 0;
  const hasSelectedSerials = data.selected_asset_unit_ids.length > 0;

  if (!isOpen) return null;

  const handleItemChange = (nextItemId) => {
    setData((prev) => ({
      ...prev,
      item_id: nextItemId,
      selected_asset_unit_ids: [],
      quantity: '',
    }));
  };

  const handleToggleSerial = (unitId) => {
    setData((prev) => {
      const exists = prev.selected_asset_unit_ids.includes(unitId);
      const nextIds = exists
        ? prev.selected_asset_unit_ids.filter((id) => id !== unitId)
        : [...prev.selected_asset_unit_ids, unitId];

      return {
        ...prev,
        selected_asset_unit_ids: nextIds,
        quantity: nextIds.length > 0 ? nextIds.length : '',
      };
    });
  };

  const handleSelectAllSerials = () => {
    const allIds = matchingSerials.map((u) => u.id);
    const allSelected =
      allIds.length > 0 && allIds.every((id) => data.selected_asset_unit_ids.includes(id));

    setData((prev) => ({
      ...prev,
      selected_asset_unit_ids: allSelected ? [] : allIds,
      quantity: allSelected ? '' : allIds.length,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm max-h-[85vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Catalog Item (SKU / Name) *
            </label>
            <select
              value={data.item_id}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
              required
            >
              <option value="">Select Catalog Item...</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.sku} - {i.item_name}
                </option>
              ))}
            </select>
            {errors.item_id && <span className="text-xs text-rose-500 mt-1 block">{errors.item_id}</span>}
          </div>

          {showSerialList && (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900 uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  Registered Serial Numbers ({matchingSerials.length} Available)
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllSerials}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                >
                  {matchingSerials.every((u) => data.selected_asset_unit_ids.includes(u.id))
                    ? 'Clear selection'
                    : 'Select all'}
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto divide-y divide-emerald-100 bg-white rounded-lg border border-emerald-100">
                {matchingSerials.map((unit) => {
                  const checked = data.selected_asset_unit_ids.includes(unit.id);
                  return (
                    <label
                      key={unit.id}
                      className="flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleSerial(unit.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-mono font-semibold text-slate-800">{unit.serial_number}</span>
                      </div>
                      <span className="text-slate-400">{unit.property_name || 'Central Warehouse'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

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
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
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
                readOnly={hasSelectedSerials}
                onChange={(e) => setData('quantity', e.target.value)}
                placeholder="e.g. 50"
                className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 font-bold text-emerald-600 ${
                  hasSelectedSerials ? 'bg-slate-100 cursor-not-allowed' : ''
                }`}
                required
              />
              {hasSelectedSerials && (
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  Synced ({data.selected_asset_unit_ids.length} serials)
                </span>
              )}
              {errors.quantity && <span className="text-xs text-rose-500 mt-1 block">{errors.quantity}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                RF Number *
              </label>
              <input
                type="text"
                value={data.po_number}
                onChange={(e) => setData('po_number', e.target.value)}
                placeholder="e.g. RF-123"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 font-mono text-xs"
                required
              />
              {errors.po_number && <span className="text-xs text-rose-500 mt-1 block">{errors.po_number}</span>}
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
              {errors.invoice_number && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.invoice_number}</span>
              )}
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