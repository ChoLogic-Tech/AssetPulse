import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ArrowDownLeft,
  CheckCircle2,
  Cpu,
  PlusCircle,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getRawUom = (item) => item?.uom_name || item?.uom || item?.uom_code || 'Unit';

const pluralizeUom = (label, count) => {
  const clean = String(label || 'Unit').trim();
  if (!clean) return 'Units';
  if (Math.abs(Number(count)) === 1) return clean;

  const isAllUpper = clean === clean.toUpperCase() && /[A-Z]/.test(clean);
  const lower = clean.toLowerCase();

  if (
    lower.endsWith('s') &&
    !lower.endsWith('ss') &&
    !['box', 'pcs'].includes(lower)
  ) {
    return clean;
  }

  if (
    lower.endsWith('x') ||
    lower.endsWith('z') ||
    lower.endsWith('ch') ||
    lower.endsWith('sh') ||
    lower.endsWith('ss')
  ) {
    return isAllUpper ? `${clean}ES` : `${clean}es`;
  }

  if (lower.endsWith('ce')) {
    return isAllUpper ? `${clean}S` : `${clean}s`;
  }

  return isAllUpper ? `${clean}S` : `${clean}s`;
};

function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
  required = false,
  getOptionValue = (opt) => opt.id,
  getOptionLabel = (opt) => opt.name,
  getOptionSubLabel = null,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const label = String(getOptionLabel(opt) ?? '').toLowerCase();
      const sub = getOptionSubLabel ? String(getOptionSubLabel(opt) ?? '').toLowerCase() : '';
      return label.includes(q) || sub.includes(q);
    });
  }, [options, query, getOptionLabel, getOptionSubLabel]);

  const selectedOption = options.find((opt) => String(getOptionValue(opt)) === String(value));

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {required && (
        <input
          type="text"
          tabIndex={-1}
          value={value ?? ''}
          onChange={() => {}}
          required
          aria-hidden="true"
          className="sr-only"
        />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`w-full px-3 py-1.5 sm:py-2 text-sm border rounded-lg outline-none flex items-center justify-between gap-2 text-left transition ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
            : open
            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/15'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
        }`}
      >
        <span className={`truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            open ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const optVal = getOptionValue(opt);
                const isSelected = String(optVal) === String(value);
                const subLabel = getOptionSubLabel ? getOptionSubLabel(opt) : null;

                return (
                  <button
                    key={String(optVal)}
                    type="button"
                    onClick={() => handleSelect(optVal)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{getOptionLabel(opt)}</div>
                      {subLabel && (
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          {subLabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function WarehouseStockInModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  isViewOnly = false,
  items = [],
  suppliers = [],
  assetUnits = [],  
  lastSuppliers = {},
}) {
  const [serialMode, setSerialMode] = useState('existing');
  const [newSerialsText, setNewSerialsText] = useState('');

  const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
    item_id: '',
    supplier_id: '',
    property_id: '',
    quantity: '',
    rf_number: '',
    invoice_number: '',
    received_date: getTodayDate(),
    remarks: '',
    selected_asset_unit_ids: [],
    new_serial_numbers: [],
  });

  useEffect(() => {
    if (!isOpen) return;
    clearErrors();
    setSerialMode('existing');
    setNewSerialsText('');

    if (mode === 'edit' && initialData) {
      setData({
        item_id: initialData.item_id ?? '',
        supplier_id: initialData.supplier_id ?? '',
        property_id: initialData.property_id ?? '',
        quantity: initialData.quantity ?? '',
        rf_number: initialData.rf_number ?? '',
        invoice_number: initialData.invoice_number ?? '',
        received_date: initialData.received_date
          ? String(initialData.received_date).split('T')[0]
          : getTodayDate(),
        remarks: initialData.remarks ?? '',
        selected_asset_unit_ids: [],
        new_serial_numbers: [],
      });
    } else {
      reset();
      setData('property_id', '');
      setData('received_date', getTodayDate());
    }
  }, [isOpen, mode, initialData]);

  const matchingSerials = useMemo(() => {
    console.log('Selected item_id:', data.item_id, 'Total assetUnits:', assetUnits);
    if (!data.item_id || !Array.isArray(assetUnits)) return [];
    return assetUnits.filter(
      (unit) =>
        unit &&
        String(unit.item_id) === String(data.item_id) &&
        (unit.status ?? 'Available') === 'Available' &&
        !unit.stock_in_log_id
    );
  }, [assetUnits, data.item_id]);

  const selectedExistingUnits = useMemo(() => {
    if (serialMode !== 'existing' || data.selected_asset_unit_ids.length === 0) {
      return [];
    }
    return matchingSerials.filter((u) =>
      data.selected_asset_unit_ids.some((id) => String(id) === String(u.id))
    );
  }, [serialMode, data.selected_asset_unit_ids, matchingSerials]);

  const distinctSelectedSupplierIds = useMemo(() => {
    const ids = selectedExistingUnits
      .map((u) => u.supplier_id)
      .filter((id) => id !== null && id !== undefined && id !== '')
      .map((id) => String(id));
    return Array.from(new Set(ids));
  }, [selectedExistingUnits]);

  const hasMixedUnitSuppliers = distinctSelectedSupplierIds.length > 1;
  const lockedSupplierId =
    distinctSelectedSupplierIds.length === 1 ? distinctSelectedSupplierIds[0] : '';

  useEffect(() => {
    if (serialMode !== 'existing' || data.selected_asset_unit_ids.length === 0) {
      return;
    }

    if (lockedSupplierId !== '' && String(data.supplier_id ?? '') !== lockedSupplierId) {
      setData('supplier_id', lockedSupplierId);
    } else if (hasMixedUnitSuppliers) {
      setData('supplier_id', '');
    }
  }, [
    serialMode,
    data.selected_asset_unit_ids,
    lockedSupplierId,
    hasMixedUnitSuppliers,
    data.supplier_id,
    setData,
  ]);

  const parsedNewSerials = useMemo(() => {
    return Array.from(
      new Set(
        newSerialsText
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
  }, [newSerialsText]);

  const supplierOptions = useMemo(
    () => [{ id: '', name: 'Select Supplier (Optional)...' }, ...suppliers],
    [suppliers]
  );

  const supplierNameMap = useMemo(() => {
    const map = new Map();
    suppliers.forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [suppliers]);

  const suggestedSupplier = useMemo(() => {
    if (!data.item_id || !lastSuppliers) return null;
    const entry =
      lastSuppliers[data.item_id] ?? lastSuppliers[String(data.item_id)];
    if (!entry?.supplier_id) return null;

    const foundName = supplierNameMap.get(String(entry.supplier_id));
    return {
      id: entry.supplier_id,
      name: entry.supplier_name || foundName || 'Previous Supplier',
    };
  }, [data.item_id, lastSuppliers, supplierNameMap]);

  const showExistingSerials =
    Boolean(data.item_id) && serialMode === 'existing' && matchingSerials.length > 0;
  const hasSelectedExisting =
    serialMode === 'existing' && data.selected_asset_unit_ids.length > 0;
  const hasNewSerials = serialMode === 'new' && parsedNewSerials.length > 0;
  const isQuantityAutoSynced = hasSelectedExisting || hasNewSerials;

  if (!isOpen) return null;

  const selectedItem = items.find((i) => String(i.id) === String(data.item_id));
  const baseUom = getRawUom(selectedItem);
  const qtyCount = Number(data.quantity === '' ? 2 : data.quantity);
  const displayQtyUom = pluralizeUom(baseUom, qtyCount);
  const selectedCount = data.selected_asset_unit_ids.length;
  const newSerialCount = parsedNewSerials.length;

  const itemLabel = selectedItem
    ? `${selectedItem.item_name}${selectedItem.sku ? ` (${selectedItem.sku})` : ''}`
    : data.rf_number || 'Stock-In';

  const handleItemChange = (nextItemId) => {
    setNewSerialsText('');
    setData((prev) => ({
      ...prev,
      item_id: nextItemId,
      supplier_id: '',
      selected_asset_unit_ids: [],
      new_serial_numbers: [],
      quantity: '',
    }));
  };

  const handleSwitchSerialMode = (nextMode) => {
    setSerialMode(nextMode);
    setNewSerialsText('');
    setData((prev) => ({
      ...prev,
      supplier_id: '',
      selected_asset_unit_ids: [],
      new_serial_numbers: [],
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
        new_serial_numbers: [],
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
      new_serial_numbers: [],
      quantity: allSelected ? '' : allIds.length,
    }));
  };

  const handleNewSerialsChange = (value) => {
    setNewSerialsText(value);
    const cleaned = Array.from(
      new Set(
        value
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

    setData((prev) => ({
      ...prev,
      selected_asset_unit_ids: [],
      new_serial_numbers: cleaned,
      quantity: cleaned.length > 0 ? cleaned.length : '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly || processing) return;

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('warehousestockins.store'), {
          preserveScroll: true,
          onSuccess: () => {
            reset();
            setNewSerialsText('');
            onClose();
            resolve({ name: itemLabel });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Recording stock-in...',
        success: (res) => `Stock-in for "${res.name}" recorded.`,
        error: 'Failed to record stock-in. Please check the form for errors.',
      });
    } else {
      if (!initialData?.id) return;

      const updatePromise = new Promise((resolve, reject) => {
        put(route('warehousestockins.update', initialData.id), {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            resolve({ name: itemLabel });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(updatePromise, {
        loading: 'Updating stock-in...',
        success: (res) => `Stock-in for "${res.name}" updated.`,
        error: 'Failed to update stock-in. Please check the form for errors.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[94dvh] flex flex-col overflow-visible animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl shrink-0">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>{mode === 'edit' ? 'Edit Warehouse Stock-In' : 'Manual Warehouse Stock-In'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 text-sm"
        >
          <div className="p-4 sm:px-6 sm:py-4 space-y-3 sm:space-y-3.5 overflow-y-auto flex-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Catalog Item (Name / SKU / UOM) *
              </label>
              <SearchableSelect
                value={data.item_id}
                disabled={isViewOnly}
                required
                options={items}
                placeholder="Select Catalog Item..."
                searchPlaceholder="Search by item name, SKU, or UOM..."
                onChange={handleItemChange}
                getOptionValue={(i) => i.id}
                getOptionLabel={(i) => i.item_name}
                getOptionSubLabel={(i) => {
                  const uomLabel = getRawUom(i);
                  const codeTag = i.uom_code ? ` (${i.uom_code})` : '';
                  return `${i.sku} • ${uomLabel}${codeTag}`;
                }}
              />
              {errors.item_id && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.item_id}</span>
              )}
            </div>

            {Boolean(data.item_id) && !isViewOnly && (
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-emerald-900 uppercase flex items-center gap-1.5 min-w-0 truncate">
                    <Cpu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Warehouse Serialized Units ({matchingSerials.length} Available)
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                    {matchingSerials.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSwitchSerialMode('existing')}
                        className={`px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                          serialMode === 'existing'
                            ? 'bg-emerald-600 text-white'
                            : 'text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        Existing
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSwitchSerialMode('new')}
                      className={`px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 whitespace-nowrap ${
                        serialMode === 'new' || matchingSerials.length === 0
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <PlusCircle className="w-3 h-3 shrink-0" />
                      New Serials
                    </button>
                  </div>
                </div>

                {showExistingSerials ? (
                  <>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-800">
                        {selectedCount} selected
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectAllSerials}
                        className="font-medium text-emerald-700 hover:text-emerald-900 whitespace-nowrap"
                      >
                        {matchingSerials.every((u) => data.selected_asset_unit_ids.includes(u.id))
                          ? 'Clear selection'
                          : 'Select all'}
                      </button>
                    </div>
                    <div className="max-h-24 sm:max-h-28 overflow-y-auto divide-y divide-emerald-100 bg-white rounded-lg border border-emerald-100">
                      {matchingSerials.map((unit) => {
                        const checked = data.selected_asset_unit_ids.includes(unit.id);
                        const unitSupplierName = unit.supplier_id
                          ? supplierNameMap.get(String(unit.supplier_id)) ?? 'Supplier'
                          : 'No Supplier';

                        return (
                          <label
                            key={unit.id}
                            className="flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer hover:bg-slate-50 gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleSerial(unit.id)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="font-mono font-semibold text-slate-800 truncate">
                                {unit.serial_number}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 truncate">
                              {unitSupplierName}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div>
                    <textarea
                      rows="2"
                      value={newSerialsText}
                      onChange={(e) => handleNewSerialsChange(e.target.value)}
                      placeholder="Enter new serial numbers (one per line or comma-separated)..."
                      className="w-full px-3 py-1.5 text-xs font-mono border border-emerald-200 rounded-lg bg-white outline-none focus:border-emerald-600"
                    />
                    <span className="text-[11px] text-emerald-800 mt-1 block">
                      {newSerialCount} {pluralizeUom(baseUom, newSerialCount)} ready to add to asset_units
                    </span>
                  </div>
                )}
                {errors.new_serial_numbers && (
                  <span className="text-xs text-rose-500 block">{errors.new_serial_numbers}</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Supplier / Vendor
                </label>
                <SearchableSelect
                  value={data.supplier_id}
                  disabled={isViewOnly || lockedSupplierId !== ''}
                  options={supplierOptions}
                  placeholder={
                    hasMixedUnitSuppliers
                      ? 'Mixed suppliers — optional override...'
                      : 'Select Supplier (Optional)...'
                  }
                  searchPlaceholder="Search supplier..."
                  onChange={(val) => setData('supplier_id', val)}
                  getOptionValue={(s) => s.id}
                  getOptionLabel={(s) => s.name}
                />
                {lockedSupplierId !== '' && !isViewOnly && (
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Locked to selected unit(s)&apos; supplier.
                  </span>
                )}
                {hasMixedUnitSuppliers && !isViewOnly && (
                  <span className="text-[11px] text-amber-700 leading-tight mt-0.5 block">
                    Mixed suppliers on selected units; each keeps its own supplier unless overridden.
                  </span>
                )}
                {lockedSupplierId === '' && suggestedSupplier && !isViewOnly && (
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Last used:{' '}
                    <button
                      type="button"
                      onClick={() => setData('supplier_id', suggestedSupplier.id)}
                      className="font-semibold text-indigo-600 hover:underline"
                    >
                      {suggestedSupplier.name}
                    </button>
                  </span>
                )}
                {errors.supplier_id && (
                  <span className="text-xs text-rose-500 mt-0.5 block">{errors.supplier_id}</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Destination
                </label>
                <div className="w-full px-3 py-1.5 sm:py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium">
                  Central Warehouse
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Quantity ({displayQtyUom}) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={data.quantity}
                  readOnly={isQuantityAutoSynced || isViewOnly}
                  onChange={(e) => setData('quantity', e.target.value)}
                  placeholder="e.g. 50"
                  className={`w-full px-3 py-1.5 sm:py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 font-mono ${
                    isQuantityAutoSynced || isViewOnly ? 'bg-slate-100 cursor-not-allowed' : ''
                  }`}
                  required
                />
                {hasSelectedExisting && (
                  <span className="text-[11px] text-emerald-700 mt-0.5 block">
                    Synced ({selectedCount} {pluralizeUom(baseUom, selectedCount)})
                  </span>
                )}
                {hasNewSerials && (
                  <span className="text-[11px] text-emerald-700 mt-0.5 block">
                    Synced ({newSerialCount} {pluralizeUom(baseUom, newSerialCount)})
                  </span>
                )}
                {errors.quantity && (
                  <span className="text-xs text-rose-500 mt-0.5 block">{errors.quantity}</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Received Date *
                </label>
                <input
                  type="date"
                  value={data.received_date}
                  disabled={isViewOnly}
                  onChange={(e) => setData('received_date', e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 disabled:bg-slate-100"
                  required
                />
                {errors.received_date && (
                  <span className="text-xs text-rose-500 mt-0.5 block">{errors.received_date}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  RF Number *
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={data.rf_number}
                  readOnly={isViewOnly}
                  onChange={(e) => setData('rf_number', e.target.value)}
                  placeholder="e.g. RF-123"
                  className="w-full px-3 py-1.5 sm:py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 font-mono text-xs read-only:bg-slate-100"
                  required
                />
                {errors.rf_number && (
                  <span className="text-xs text-rose-500 mt-0.5 block">{errors.rf_number}</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Invoice No.
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={data.invoice_number}
                  readOnly={isViewOnly}
                  onChange={(e) => setData('invoice_number', e.target.value)}
                  placeholder="INV-992"
                  className="w-full px-3 py-1.5 sm:py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 font-mono text-xs read-only:bg-slate-100"
                />
                {errors.invoice_number && (
                  <span className="text-xs text-rose-500 mt-0.5 block">{errors.invoice_number}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Remarks / Delivery Notes
              </label>
              <textarea
                rows="2"
                value={data.remarks}
                readOnly={isViewOnly}
                onChange={(e) => setData('remarks', e.target.value)}
                placeholder="Delivery conditions or par stock reorder remarks..."
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 resize-none read-only:bg-slate-100"
              />
              {errors.remarks && (
                <span className="text-xs text-rose-500 mt-0.5 block">{errors.remarks}</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3 border-t border-slate-100 bg-white rounded-b-2xl shrink-0">
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
                disabled={processing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {processing
                  ? mode === 'edit'
                    ? 'Updating...'
                    : 'Saving Stock-In...'
                  : mode === 'edit'
                  ? 'Update Stock-In'
                  : 'Record Stock-In'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}