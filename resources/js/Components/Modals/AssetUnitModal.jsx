import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, ChevronDown, Cpu, Search, X } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['Available', 'Deployed', 'Under Repair', 'Decommissioned'];

const DEFAULT_VALUES = {
  item_id: '',
  serial_number: '',
  property_id: '',
  location_id: '',
  supplier_id: '',
  status: 'Available',
};

function getItemSku(item, skuList = []) {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.sku === 'string' && item.sku.trim()) return item.sku.trim();
  if (typeof item.sku_code === 'string' && item.sku_code.trim()) return item.sku_code.trim();
  if (item.sku && typeof item.sku === 'object' && item.sku.sku_code) {
    return String(item.sku.sku_code).trim();
  }

  const matchedSku = Array.isArray(skuList)
    ? skuList.find(
        (s) =>
          s &&
          ((s.item_id != null && String(s.item_id) === String(item.id)) ||
            (s.item_masterlist_id != null && String(s.item_masterlist_id) === String(item.id)) ||
            (item.sku_id != null && s.id != null && String(s.id) === String(item.sku_id)))
      )
    : null;

  if (matchedSku?.sku_code) {
    return String(matchedSku.sku_code).trim();
  }

  return null;
}

function ScrollableDropdown({
  value,
  onChange,
  options = [],
  getOptionValue = (item) => item.id,
  getOptionLabel = (item) => item.name,
  getOptionSubLabel = null,
  placeholder = 'Select option',
  searchPlaceholder = 'Type to filter...',
  disabled = false,
  hasError = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const safeOptions = Array.isArray(options) ? options : [];

  const selectedOption = safeOptions.find(
    (item) =>
      String(getOptionValue(item) ?? '') === String(value ?? '') &&
      String(value ?? '') !== ''
  );

  const filteredOptions = safeOptions.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const label = String(getOptionLabel(item) ?? '').toLowerCase();
    const subLabel = getOptionSubLabel
      ? String(getOptionSubLabel(item) ?? '').toLowerCase()
      : '';
    return label.includes(q) || subLabel.includes(q);
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) setQuery('');
      return next;
    });
  };

  const handleSelect = (nextVal) => {
    onChange(nextVal);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full px-3 py-2 text-sm text-left border rounded-lg flex items-center justify-between gap-2 outline-none transition ${
          disabled
            ? 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed'
            : hasError
            ? 'bg-white text-slate-800 border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
        }`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'font-medium'}`}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect('');
              }}
              className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-slate-50 transition ${
                String(value ?? '') === ''
                  ? 'text-indigo-600 font-semibold bg-indigo-50/40'
                  : 'text-slate-500'
              }`}
            >
              <span>{placeholder}</span>
              {String(value ?? '') === '' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((item, idx) => {
                const rawVal = getOptionValue(item);
                const optionVal = String(rawVal ?? '');
                const isSelected = optionVal !== '' && optionVal === String(value ?? '');
                const subLabel = getOptionSubLabel ? getOptionSubLabel(item) : null;

                return (
                  <button
                    key={optionVal !== '' ? optionVal : `opt-${idx}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(rawVal);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 hover:bg-slate-50 transition ${
                      isSelected ? 'bg-indigo-50/60 text-indigo-700 font-medium' : 'text-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{getOptionLabel(item)}</div>
                      {subLabel && (
                        <div className="text-[11px] text-slate-400 truncate">{subLabel}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AssetUnitModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  items = [],
  properties = [],
  locations = [],
  suppliers = [],
  skus = [],
}) {
  const isViewOnly = mode === 'view';
  const isEdit = mode === 'edit';

  const { data, setData, post, put, processing, errors, clearErrors } =
    useForm(DEFAULT_VALUES);

  useEffect(() => {
    if (!isOpen) return;
    clearErrors();

    if (initialData && (isEdit || isViewOnly)) {
      setData({
        item_id: initialData.item_id ?? '',
        serial_number: initialData.serial_number ?? '',
        property_id: initialData.property_id ?? '',
        location_id: initialData.location_id ?? '',
        supplier_id: initialData.supplier_id ?? '',
        status: initialData.status ?? initialData.asset_status ?? 'Available',
      });
    } else {
      setData({ ...DEFAULT_VALUES });
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const itemList = Array.isArray(items) ? items : [];
  const skuList = Array.isArray(skus) ? skus : [];
  const propertyList = Array.isArray(properties) ? properties : [];
  const locationList = Array.isArray(locations) ? locations : [];
  const supplierList = Array.isArray(suppliers) ? suppliers : [];

  const statusOptions = STATUS_OPTIONS.map((st) => ({ id: st, name: st }));

  const availableLocations = data.property_id
    ? locationList.filter((loc) => String(loc.property_id) === String(data.property_id))
    : locationList;

  const handleFieldChange = (field, value) => {
    setData(field, value);
    if (errors[field]) {
      clearErrors(field);
    }
  };

  const handlePropertyChange = (nextPropertyId) => {
    const stillValidLocation =
      !nextPropertyId ||
      locationList.some(
        (loc) =>
          String(loc.id) === String(data.location_id) &&
          String(loc.property_id) === String(nextPropertyId)
      );

    setData({
      ...data,
      property_id: nextPropertyId,
      location_id: stillValidLocation ? data.location_id : '',
    });

    if (errors.property_id) clearErrors('property_id');
    if (errors.location_id) clearErrors('location_id');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly || processing) return;

    const serialLabel = data.serial_number.trim() || 'Asset unit';

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('assetunits.store'), {
          preserveScroll: true,
          onSuccess: () => {
            setData({ ...DEFAULT_VALUES });
            onClose();
            resolve({ serial: serialLabel });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Registering asset unit...',
        success: (res) => `Asset unit "${res.serial}" successfully registered.`,
        error: 'Failed to register asset unit. Please check the form for errors.',
      });
    } else {
      const recordId = initialData?.id ?? initialData?.asset_id;
      if (!recordId) return;

      const updatePromise = new Promise((resolve, reject) => {
        put(route('assetunits.update', recordId), {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            resolve({ serial: serialLabel });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(updatePromise, {
        loading: 'Updating asset unit...',
        success: (res) => `Asset unit "${res.serial}" successfully updated.`,
        error: 'Failed to update asset unit. Please check the form for errors.',
      });
    }
  };

  const viewStatus = initialData?.status ?? initialData?.asset_status ?? 'Available';
  const viewProperty =
    initialData?.current_property ??
    propertyList.find((p) => String(p.id) === String(initialData?.property_id))?.name ??
    'Central Warehouse';
  const viewLocation =
    initialData?.room_location ??
    locationList.find((l) => String(l.id) === String(initialData?.location_id))?.name ??
    'Unassigned';
  const viewSupplier =
    initialData?.supplier_name ??
    supplierList.find((s) => String(s.id) === String(initialData?.supplier_id))?.name ??
    'N/A';
  const viewItemName =
    initialData?.item_name ??
    initialData?.item_master?.item_name ??
    itemList.find((i) => String(i.id) === String(initialData?.item_id))?.item_name ??
    'N/A';
  const viewSku =
    initialData?.sku ??
    getItemSku(
      itemList.find((i) => String(i.id) === String(initialData?.item_id)),
      skuList
    ) ??
    '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-visible">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 rounded-t-xl flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            {mode === 'create' && 'Register Serialized Asset'}
            {isEdit && 'Edit Serialized Asset'}
            {isViewOnly && 'Asset Unit Specification'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isViewOnly ? (
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">
                  Serial Number
                </span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  {initialData?.serial_number}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {viewStatus}
              </span>
            </div>

            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">
                Item Specification
              </span>
              <span className="font-semibold text-slate-900">{viewItemName}</span>
              {viewSku && (
                <span className="block text-xs font-mono text-slate-400">{viewSku}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">
                  Assigned Property
                </span>
                <span className="font-medium text-slate-800">{viewProperty}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">
                  Room / Location
                </span>
                <span className="font-medium text-slate-800">{viewLocation}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">
                  Supplier
                </span>
                <span className="font-medium text-slate-800">{viewSupplier}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 uppercase font-semibold">
                  Date Received
                </span>
                <span className="font-medium text-slate-800">
                  {initialData?.date_received
                    ? new Date(initialData.date_received).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm" noValidate>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Catalog Item (Masterlist) *
              </label>
              <ScrollableDropdown
                value={data.item_id}
                onChange={(val) => handleFieldChange('item_id', val)}
                options={itemList}
                getOptionLabel={(item) => item.item_name}
                getOptionSubLabel={(item) => getItemSku(item, skuList) || null}
                placeholder="Select Catalog Item..."
                searchPlaceholder="Search catalog item or SKU..."
                hasError={Boolean(errors.item_id)}
              />
              {errors.item_id && (
                <p className="text-xs text-red-500 mt-1">{errors.item_id}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Serial Number (S/N) *
                </label>
                <input
                  type="text"
                  value={data.serial_number}
                  onChange={(e) => handleFieldChange('serial_number', e.target.value)}
                  placeholder="e.g. SN-8839201-X"
                  className={`w-full px-3 py-2 text-sm border rounded-lg font-mono outline-none transition ${
                    errors.serial_number
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                  }`}
                />
                {errors.serial_number && (
                  <p className="text-xs text-red-500 mt-1">{errors.serial_number}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Status *
                </label>
                <ScrollableDropdown
                  value={data.status}
                  onChange={(val) => handleFieldChange('status', val || 'Available')}
                  options={statusOptions}
                  placeholder="Select Status..."
                  searchPlaceholder="Filter status..."
                  hasError={Boolean(errors.status)}
                />
                {errors.status && (
                  <p className="text-xs text-red-500 mt-1">{errors.status}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Initial Location / Property
                </label>
                <ScrollableDropdown
                  value={data.property_id}
                  onChange={handlePropertyChange}
                  options={propertyList}
                  placeholder="Central Warehouse"
                  searchPlaceholder="Search property..."
                  hasError={Boolean(errors.property_id)}
                />
                {errors.property_id && (
                  <p className="text-xs text-red-500 mt-1">{errors.property_id}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Specific Storage Room
                </label>
                <ScrollableDropdown
                  value={data.location_id}
                  onChange={(val) => handleFieldChange('location_id', val)}
                  options={availableLocations}
                  placeholder="Select Storage Room..."
                  searchPlaceholder="Search storage room..."
                  hasError={Boolean(errors.location_id)}
                />
                {errors.location_id && (
                  <p className="text-xs text-red-500 mt-1">{errors.location_id}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Supplier
              </label>
              <ScrollableDropdown
                value={data.supplier_id}
                onChange={(val) => handleFieldChange('supplier_id', val)}
                options={supplierList}
                placeholder="Select Supplier..."
                searchPlaceholder="Search supplier..."
                hasError={Boolean(errors.supplier_id)}
              />
              {errors.supplier_id && (
                <p className="text-xs text-red-500 mt-1">{errors.supplier_id}</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
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
                {processing
                  ? mode === 'create'
                    ? 'Registering...'
                    : 'Saving...'
                  : mode === 'create'
                  ? 'Save Unit'
                  : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}