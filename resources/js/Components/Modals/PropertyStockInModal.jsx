import React, { useEffect, useMemo } from 'react';
import { X, Package, Cpu } from 'lucide-react';
import { useForm } from '@inertiajs/react';

export function PropertyStockInModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  properties = [],
  items = [],
  suppliers = [],
  assetUnits = [],
}) {
  const isView = mode === 'view';

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    property_id: '',
    item_id: '',
    quantity: '',
    supplier_id: '',
    po_number: '',
    invoice_number: '',
    remarks: '',
    selected_asset_unit_ids: [],
  });

  useEffect(() => {
    if (!isOpen) return;
    clearErrors();
    setData({
      property_id: initialData?.property_id ?? (properties[0]?.id ?? ''),
      item_id: initialData?.item_id ?? '',
      quantity: initialData?.quantity ?? '',
      supplier_id: initialData?.supplier_id ?? '',
      po_number: initialData?.po_number ?? initialData?.rf_number ?? '',
      invoice_number: initialData?.invoice_number ?? '',
      remarks: initialData?.remarks ?? '',
      selected_asset_unit_ids: [],
    });
  }, [isOpen, mode, initialData, properties]);

  const matchingSerials = useMemo(() => {
    if (!data.item_id) return [];
    return assetUnits.filter(
      (unit) =>
        String(unit.item_id) === String(data.item_id) &&
        (unit.status ?? 'Available') === 'Available'
    );
  }, [assetUnits, data.item_id]);

  const hasSerials = matchingSerials.length > 0;
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
            type="button"
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
                <span className="font-mono text-slate-800">
                  {initialData?.po_number || initialData?.rf_number || 'N/A'}
                </span>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Destination Property *
              </label>
              <select
                value={data.property_id}
                onChange={(e) => setData('property_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                required
              >
                <option value="">Select Property...</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
              {errors.property_id && <span className="text-xs text-rose-500 mt-1 block">{errors.property_id}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Item (From Master Catalog) *
              </label>
              <select
                value={data.item_id}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                required
              >
                <option value="">Select Catalog Item (SKU)...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} - {item.item_name}
                  </option>
                ))}
              </select>
              {errors.item_id && <span className="text-xs text-rose-500 mt-1 block">{errors.item_id}</span>}
            </div>

            {hasSerials && (
              <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-900 uppercase flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    Registered Serial Numbers ({matchingSerials.length} Available)
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllSerials}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {matchingSerials.every((u) => data.selected_asset_unit_ids.includes(u.id))
                      ? 'Clear selection'
                      : 'Select all'}
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-indigo-100 bg-white rounded-lg border border-indigo-100">
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
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Quantity Purchased *
                </label>
                <input
                  type="number"
                  min="1"
                  value={data.quantity}
                  readOnly={hasSelectedSerials}
                  onChange={(e) => setData('quantity', e.target.value)}
                  placeholder="e.g. 5"
                  className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 ${
                    hasSelectedSerials ? 'bg-slate-100 text-slate-700 font-semibold cursor-not-allowed' : ''
                  }`}
                  required
                />
                {hasSelectedSerials && (
                  <span className="text-[11px] text-indigo-600 mt-1 block">
                    Synced with {data.selected_asset_unit_ids.length} selected serial(s)
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                {errors.po_number && <span className="text-xs text-rose-500 mt-1 block">{errors.po_number}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={data.invoice_number}
                  onChange={(e) => setData('invoice_number', e.target.value)}
                  placeholder="e.g. INV-9921"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
                {errors.invoice_number && (
                  <span className="text-xs text-rose-500 mt-1 block">{errors.invoice_number}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Vendor / Supplier
                </label>
                <select
                  value={data.supplier_id}
                  onChange={(e) => setData('supplier_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="">Select Supplier (Optional)...</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
                {errors.supplier_id && <span className="text-xs text-rose-500 mt-1 block">{errors.supplier_id}</span>}
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