import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  MapPin,
  Search,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

// Base status choices without duplicating 'Deployed' and 'In Use'
const BASE_STATUS_OPTIONS = [
  'In Warehouse',
  'In Property',
  'Available',
  'Deployed',
  'Under Repair',
  'Damage',
  'Back Load (Iloilo)',
  'Decommissioned',
];

// Visual badge and indicator dot styles keyed by status label
const STATUS_STYLES = {
  'In Warehouse': {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  'In Property (Available)': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'In Property (In Use)': {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  'In Property': {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  Available: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Deployed: {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    dot: 'bg-cyan-500',
  },
  'Under Repair': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  Damage: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  'Back Load (Iloilo)': {
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
  },
  Decommissioned: {
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
    dot: 'bg-slate-400',
  },
};

const DEFAULT_STATUS_STYLE = {
  badge: 'bg-slate-50 text-slate-700 border-slate-200',
  dot: 'bg-slate-400',
};

// Extract the raw stored status string from an asset unit record
function resolveUnitStatus(record) {
  if (!record || typeof record !== 'object') return 'Available';

  const nestedStatus =
    typeof record.status === 'object' && record.status !== null
      ? record.status.name ?? record.status.label ?? ''
      : '';

  const raw =
    (typeof record.status === 'string' ? record.status : '') ||
    record.asset_status ||
    record.unit_status ||
    record.status_name ||
    nestedStatus ||
    'Available';

  const trimmed = String(raw).trim() || 'Available';
  return trimmed === 'In Use' ? 'Deployed' : trimmed;
}

// Compute the operational label based on status, property, and room assignment:
// - In Property with no location_id -> "In Property (Available)"
// - In Property with a location_id (or Deployed) -> "In Property (In Use)"
function getOperationalStatusLabel({ status, propertyId, locationId }) {
  const cleanStatus = String(status || 'Available').trim();
  const hasProperty = propertyId !== '' && propertyId !== null && propertyId !== undefined;
  const hasLocation = locationId !== '' && locationId !== null && locationId !== undefined;

  if (cleanStatus === 'Deployed') {
    return hasProperty ? 'In Property (In Use)' : 'Deployed';
  }

  if (cleanStatus === 'In Property' || (hasProperty && cleanStatus === 'Available')) {
    return hasLocation ? 'In Property (In Use)' : 'In Property (Available)';
  }

  return cleanStatus;
}

// Match badge styling even when a combined label like "In Property (Available)" is passed
function getStatusStyle(status) {
  if (STATUS_STYLES[status]) {
    return STATUS_STYLES[status];
  }

  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('available')) {
    return STATUS_STYLES.Available;
  }
  if (normalized.includes('in use') || normalized.includes('in property')) {
    return STATUS_STYLES['In Property (In Use)'];
  }
  if (normalized.includes('deployed')) {
    return STATUS_STYLES.Deployed;
  }
  if (normalized.includes('warehouse')) {
    return STATUS_STYLES['In Warehouse'];
  }

  return DEFAULT_STATUS_STYLE;
}

// Pick a clear text color for the "Current state" summary line (green for Available)
function getCurrentStateTextClass(label) {
  const normalized = String(label || '').toLowerCase();

  if (normalized.includes('available')) {
    return 'text-emerald-700 font-semibold';
  }
  if (normalized.includes('in use') || normalized.includes('in property')) {
    return 'text-indigo-700 font-semibold';
  }
  if (normalized.includes('deployed')) {
    return 'text-cyan-700 font-semibold';
  }
  if (normalized.includes('warehouse')) {
    return 'text-sky-700 font-semibold';
  }
  if (normalized.includes('repair')) {
    return 'text-amber-700 font-semibold';
  }
  if (normalized.includes('damage')) {
    return 'text-rose-700 font-semibold';
  }
  if (normalized.includes('back load')) {
    return 'text-violet-700 font-semibold';
  }

  return 'text-slate-700 font-medium';
}

const DEFAULT_VALUES = {
  item_id: '',
  serial_number: '',
  property_id: '',
  location_id: '',
  supplier_id: '',
  status: 'Available',
};

// Resolve SKU code from item fields or the skus lookup array
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

// Searchable dropdown supporting optional status dots and secondary labels
function ScrollableDropdown({
  value,
  onChange,
  options = [],
  getOptionValue = (item) => item.id,
  getOptionLabel = (item) => item.name,
  getOptionSubLabel = null,
  getOptionBadgeClass = null,
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

  const selectedStatusStyle =
    selectedOption && getOptionBadgeClass
      ? getStatusStyle(getOptionValue(selectedOption))
      : null;

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
        <span
          className={`truncate flex items-center gap-2 ${
            !selectedOption ? 'text-slate-400' : 'font-medium'
          }`}
        >
          {selectedStatusStyle && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${selectedStatusStyle.dot}`}
            />
          )}
          <span className="truncate">
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </span>
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
                const badgeClass = getOptionBadgeClass ? getOptionBadgeClass(item) : null;
                const optionStatusStyle = badgeClass ? getStatusStyle(rawVal) : null;

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
                    <div className="min-w-0 flex items-center gap-2">
                      {badgeClass ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${optionStatusStyle.dot}`}
                          />
                          {getOptionLabel(item)}
                        </span>
                      ) : (
                        <div className="truncate">{getOptionLabel(item)}</div>
                      )}
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

  // Hydrate form fields when opening create, edit, or view mode
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
        status: resolveUnitStatus(initialData),
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

  // Ensure the record's current status is always present in the dropdown options
  const currentRecordStatus = resolveUnitStatus(initialData);
  const mergedStatuses = Array.from(
    new Set([
      ...(isEdit || isViewOnly ? [currentRecordStatus] : []),
      ...BASE_STATUS_OPTIONS,
    ])
  );
  const statusOptions = mergedStatuses.map((st) => ({ id: st, name: st }));

  // Filter storage rooms to the selected property when a property is chosen
  const availableLocations = data.property_id
    ? locationList.filter((loc) => String(loc.property_id) === String(data.property_id))
    : locationList;

  // Live operational summary showing whether a property unit is available or in use by room
  const liveOperationalStatus = getOperationalStatusLabel({
    status: data.status,
    propertyId: data.property_id,
    locationId: data.location_id,
  });

  const handleFieldChange = (field, value) => {
    setData(field, value);
    if (errors[field]) {
      clearErrors(field);
    }
  };

  // Clear location_id if it does not belong to the newly chosen property
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

  // Submit create or update request via Inertia and surface status via Sonner toast
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

  // Derived read-only view fields
  const rawViewStatus = resolveUnitStatus(initialData);
  const viewOperationalStatus = getOperationalStatusLabel({
    status: rawViewStatus,
    propertyId: initialData?.property_id,
    locationId: initialData?.location_id,
  });
  const viewStatusStyle = getStatusStyle(viewOperationalStatus);

  const viewProperty =
    initialData?.current_property ??
    initialData?.property_name ??
    propertyList.find((p) => String(p.id) === String(initialData?.property_id))?.name ??
    'Central Warehouse';
  const viewLocation =
    initialData?.room_location ??
    initialData?.location_name ??
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
        {/* Modal header */}
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
          /* Clean, easy-to-scan specification view */
          <div className="p-6 space-y-4 text-sm text-slate-600">
            {/* Serial number & live operational status summary */}
            <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                  Serial Number
                </span>
                <span className="font-mono font-bold text-slate-900 text-base break-all">
                  {initialData?.serial_number}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${viewStatusStyle.badge}`}
              >
                <span className={`w-2 h-2 rounded-full ${viewStatusStyle.dot}`} />
                {viewOperationalStatus}
              </span>
            </div>

            {/* Catalog item & SKU badge */}
            <div className="p-3.5 rounded-xl border border-slate-200/70 bg-white space-y-1.5">
              <span className="block text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                Catalog Item
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 text-sm">{viewItemName}</span>
                {viewSku && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs border border-slate-200">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {viewSku}
                  </span>
                )}
              </div>
            </div>

            {/* Custody and tracking metadata cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200/70 bg-white">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Property
                </span>
                <span className="font-semibold text-slate-800 block truncate">{viewProperty}</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/70 bg-white">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Room / Location
                </span>
                <span className="font-semibold text-slate-800 block truncate">{viewLocation}</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/70 bg-white">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  Supplier
                </span>
                <span className="font-medium text-slate-800 block truncate">{viewSupplier}</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/70 bg-white">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date Received
                </span>
                <span className="font-medium text-slate-800 block">
                  {initialData?.date_received
                    ? new Date(initialData.date_received).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Create / Edit form */
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
                  getOptionBadgeClass={(opt) => getStatusStyle(opt.id).badge}
                  placeholder="Select Status..."
                  searchPlaceholder="Filter status..."
                  hasError={Boolean(errors.status)}
                />
                {/* Color-code current state text so Available stands out clearly in green */}
                <p className="text-[11px] text-slate-500 mt-1">
                  Current state:{' '}
                  <span className={getCurrentStateTextClass(liveOperationalStatus)}>
                    {liveOperationalStatus}
                  </span>
                </p>
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