import React, { useEffect } from 'react';
import { X, Cpu } from 'lucide-react';
import { useForm } from '@inertiajs/react';

export function AssetUnitModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  items = [],
  properties = [],
  locations = [],
  suppliers = [],
}) {
  const isView = mode === 'view';

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    item_id: '',
    serial_number: '',
    property_id: '',
    location_id: '',
    supplier_id: '',
    status: 'Available',
  });

  useEffect(() => {
    if (!isOpen) return;
    clearErrors();
    setData({
      item_id: initialData?.item_id ?? '',
      serial_number: initialData?.serial_number ?? '',
      property_id: initialData?.property_id ?? '',
      location_id: initialData?.location_id ?? '',
      supplier_id: initialData?.supplier_id ?? '',
      status: initialData?.status ?? initialData?.asset_status ?? 'Available',
    });
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('master-data.asset-units.store'), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const viewStatus = initialData?.status ?? initialData?.asset_status ?? 'Available';
  const viewProperty = initialData?.property_name ?? initialData?.current_property ?? 'Central Warehouse';
  const viewLocation = initialData?.location_name ?? initialData?.room_location ?? 'Unassigned';
  const viewSupplier = initialData?.supplier_name ?? 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            {isView ? 'Asset Unit Specification' : 'Register Serialized Asset'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isView ? (
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">Serial Number</span>
                <span className="font-mono font-bold text-slate-900 text-base">{initialData?.serial_number}</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {viewStatus}
              </span>
            </div>

            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Item Specification</span>
              <span className="font-semibold text-slate-900">{initialData?.item_name}</span>
              <span className="block text-xs font-mono text-slate-400">{initialData?.sku}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">Assigned Property</span>
                <span className="font-medium text-slate-800">{viewProperty}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">Room / Location</span>
                <span className="font-medium text-slate-800">{viewLocation}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Supplier</span>
              <span className="font-medium text-slate-800">{viewSupplier}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Catalog Item (Masterlist)
              </label>
              <select
                value={data.item_id}
                onChange={(e) => setData('item_id', e.target.value)}
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Manufacturer Serial Number (S/N)
              </label>
              <input
                type="text"
                value={data.serial_number}
                onChange={(e) => setData('serial_number', e.target.value)}
                placeholder="e.g. SN-8839201-X"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono outline-none focus:border-indigo-600"
                required
              />
              {errors.serial_number && <span className="text-xs text-rose-500 mt-1 block">{errors.serial_number}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Initial Location / Branch
                </label>
                <select
                  value={data.property_id}
                  onChange={(e) => setData('property_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="">Central Warehouse</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.property_id && <span className="text-xs text-rose-500 mt-1 block">{errors.property_id}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Specific Storage Room
                </label>
                <select
                  value={data.location_id}
                  onChange={(e) => setData('location_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="">Select Storage Room...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                {errors.location_id && <span className="text-xs text-rose-500 mt-1 block">{errors.location_id}</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Supplier
              </label>
              <select
                value={data.supplier_id}
                onChange={(e) => setData('supplier_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplier_id && <span className="text-xs text-rose-500 mt-1 block">{errors.supplier_id}</span>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {processing ? 'Saving...' : 'Save Unit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}