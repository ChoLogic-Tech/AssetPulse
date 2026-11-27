// Import React hooks and portal helper for rendering floating dropdowns outside scroll containers
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// Import icons for modal actions, serial tracking, and dropdown controls
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
// Import Inertia form helper and Sonner toast notifications
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

// Return today's date in YYYY-MM-DD format for date input defaults
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Extract the base UOM text from an item object with sensible fallbacks
const getRawUom = (item) => item?.uom_name || item?.uom || item?.uom_code || 'Unit';

// Convert a UOM label to singular or plural based on count while keeping uppercase style if needed
const pluralizeUom = (label, count) => {
  // Trim whitespace and default to 'Units' if empty
  const clean = String(label || 'Unit').trim();
  if (!clean) return 'Units';

  // Keep singular label when count is 1 or -1
  if (Math.abs(Number(count)) === 1) return clean;

  // Detect if the label is written in all capital letters
  const isAllUpper = clean === clean.toUpperCase() && /[A-Z]/.test(clean);
  const lower = clean.toLowerCase();

  // Avoid double-pluralizing words that already end in 's' (except 'ss', 'box', 'pcs')
  if (
    lower.endsWith('s') &&
    !lower.endsWith('ss') &&
    !['box', 'pcs'].includes(lower)
  ) {
    return clean;
  }

  // Add 'es' for words ending in sibilant sounds
  if (
    lower.endsWith('x') ||
    lower.endsWith('z') ||
    lower.endsWith('ch') ||
    lower.endsWith('sh') ||
    lower.endsWith('ss')
  ) {
    return isAllUpper ? `${clean}ES` : `${clean}es`;
  }

  // Add 's' for words ending in 'ce'
  if (lower.endsWith('ce')) {
    return isAllUpper ? `${clean}S` : `${clean}s`;
  }

  // Default pluralization by appending 's' or 'S'
  return isAllUpper ? `${clean}S` : `${clean}s`;
};

// Custom searchable dropdown component that renders its menu in document.body via portal
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
  // Track whether dropdown menu is open, current search text, and fixed screen position
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuStyle, setMenuStyle] = useState({});

  // Refs for detecting outside clicks, measuring trigger position, and focusing search input
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Calculate fixed viewport coordinates so overflow-y-auto modal body never clips the menu
  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = 248;
    const spaceBelow = window.innerHeight - rect.bottom;
    // Flip upward if there is not enough space below and enough space above
    const openAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuStyle({
      position: 'fixed',
      left: `${Math.max(8, rect.left)}px`,
      width: `${rect.width}px`,
      top: openAbove ? 'auto' : `${rect.bottom + 4}px`,
      bottom: openAbove ? `${window.innerHeight - rect.top + 4}px` : 'auto',
      zIndex: 9999,
    });
  }, []);

  // Close the dropdown when the user clicks outside both the button wrapper and portaled menu
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      const clickedInsideTrigger = containerRef.current?.contains(e.target);
      const clickedInsideMenu = dropdownRef.current?.contains(e.target);
      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Reposition menu on scroll/resize and focus the search input whenever opened
  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleViewportChange = () => updateMenuPosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, updateMenuPosition]);

  // Filter options by matching label or optional sub-label against the search query
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const label = String(getOptionLabel(opt) ?? '').toLowerCase();
      const sub = getOptionSubLabel ? String(getOptionSubLabel(opt) ?? '').toLowerCase() : '';
      return label.includes(q) || sub.includes(q);
    });
  }, [options, query, getOptionLabel, getOptionSubLabel]);

  // Find the currently selected option object to show its label on the trigger button
  const selectedOption = options.find((opt) => String(getOptionValue(opt)) === String(value));

  // Commit chosen value, close the dropdown, and clear the search filter
  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden required input so native HTML form validation still works when required=true */}
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

      {/* Main dropdown button showing selected value or placeholder */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!open) updateMenuPosition();
          setOpen((prev) => !prev);
        }}
        className={`w-full px-3 py-1.5 sm:py-2 text-sm border rounded-lg outline-none flex items-center justify-between gap-2 text-left transition ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
            : open
            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/15 cursor-pointer'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 cursor-pointer'
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

      {/* Floating menu rendered into document.body so modal scroll containers cannot clip it */}
      {open &&
        !disabled &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            style={menuStyle}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Search input inside dropdown menu */}
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

            {/* Scrollable list of filtered options */}
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
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
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
          </div>,
          document.body
        )}
    </div>
  );
}

// Modal for creating or editing a property stock-in entry with serial number & property support
export function PropertyStockInModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  isViewOnly = false,
  defaultPropertyId = '',
  items = [],
  suppliers = [],
  properties = [],
  locations = [],
  assetUnits = [],
  lastSuppliers = {},
}) {
  // Toggle between selecting existing available serials ('existing') or typing new ones ('new')
  const [serialMode, setSerialMode] = useState('existing');
  const [newSerialsText, setNewSerialsText] = useState('');

  // Initialize Inertia form state for stock-in submission
  const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
    item_id: '',
    supplier_id: '',
    property_id: '',
    location_id: '',
    quantity: '',
    rf_number: '',
    invoice_number: '',
    received_date: getTodayDate(),
    remarks: '',
    selected_asset_unit_ids: [],
    new_serial_numbers: [],
  });

  // Match the logged-in user's assigned property (e.g., Palm) against available properties
  const matchedUserProperty = useMemo(() => {
    if (defaultPropertyId === null || defaultPropertyId === undefined || defaultPropertyId === '') {
      return null;
    }
    return properties.find((p) => String(p.id) === String(defaultPropertyId)) ?? null;
  }, [defaultPropertyId, properties]);

  // Disable Target Property on create when the user has a valid assigned property
  const isPropertyLocked = mode !== 'edit' && Boolean(matchedUserProperty);

  // Use the user's matched property as default, or fall back to the first property in the list
  const resolvedDefaultPropertyId = useMemo(() => {
    if (matchedUserProperty) return matchedUserProperty.id;
    return properties[0]?.id ?? '';
  }, [matchedUserProperty, properties]);

  // Reset form state for create mode or populate fields for edit mode when modal opens
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
        location_id: initialData.location_id ?? '',
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
      setData('property_id', resolvedDefaultPropertyId);
      setData('location_id', '');
      setData('received_date', getTodayDate());
    }
  }, [isOpen, mode, initialData, resolvedDefaultPropertyId]);

  // Filter room/storage locations so only locations belonging to the selected property appear
  const propertyLocations = useMemo(() => {
    if (!data.property_id) return locations;
    return locations.filter((loc) => String(loc.property_id) === String(data.property_id));
  }, [locations, data.property_id]);

  // Filter available, unlinked serialized units that match the selected item
  const matchingSerials = useMemo(() => {
    if (!data.item_id || !Array.isArray(assetUnits)) return [];
    return assetUnits.filter(
      (unit) =>
        unit &&
        String(unit.item_id) === String(data.item_id) &&
        (unit.status ?? 'Available') === 'Available' &&
        !unit.stock_in_log_id
    );
  }, [assetUnits, data.item_id]);

  // Get full unit objects for currently checked existing serial numbers
  const selectedExistingUnits = useMemo(() => {
    if (serialMode !== 'existing' || data.selected_asset_unit_ids.length === 0) {
      return [];
    }
    return matchingSerials.filter((u) =>
      data.selected_asset_unit_ids.some((id) => String(id) === String(u.id))
    );
  }, [serialMode, data.selected_asset_unit_ids, matchingSerials]);

  // Check if selected serialized units share one supplier or have multiple/mixed suppliers
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

  // Auto-sync supplier_id when all selected units have the same supplier, or clear if mixed
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

  // Parse newline- or comma-separated new serial numbers and remove duplicates
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

  // Build dropdown option arrays with a clear optional placeholder row
  const supplierOptions = useMemo(
    () => [{ id: '', name: 'Select Supplier (Optional)...' }, ...suppliers],
    [suppliers]
  );

  const locationOptions = useMemo(
    () => [{ id: '', name: 'Select Location / Room (Optional)...' }, ...propertyLocations],
    [propertyLocations]
  );

  // Map supplier IDs to supplier names for quick display on serial rows and suggestions
  const supplierNameMap = useMemo(() => {
    const map = new Map();
    suppliers.forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [suppliers]);

  // Look up the most recently used supplier for the selected item
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

  // Flags controlling serial UI sections and read-only quantity syncing
  const showExistingSerials =
    Boolean(data.item_id) && serialMode === 'existing' && matchingSerials.length > 0;
  const hasSelectedExisting =
    serialMode === 'existing' && data.selected_asset_unit_ids.length > 0;
  const hasNewSerials = serialMode === 'new' && parsedNewSerials.length > 0;
  const isQuantityAutoSynced = hasSelectedExisting || hasNewSerials;

  // Do not render anything when the modal is closed
  if (!isOpen) return null;

  // Compute display labels and counts for UOM, serials, and toast messages
  const selectedItem = items.find((i) => String(i.id) === String(data.item_id));
  const baseUom = getRawUom(selectedItem);
  const qtyCount = Number(data.quantity === '' ? 2 : data.quantity);
  const displayQtyUom = pluralizeUom(baseUom, qtyCount);
  const selectedCount = data.selected_asset_unit_ids.length;
  const newSerialCount = parsedNewSerials.length;

  const itemLabel = selectedItem
    ? `${selectedItem.item_name}${selectedItem.sku ? ` (${selectedItem.sku})` : ''}`
    : data.rf_number || 'Property Stock-In';

  // Update property_id (unless locked) and clear location_id so stale rooms don't carry over
  const handlePropertyChange = (nextPropertyId) => {
    if (isPropertyLocked) return;
    setData((prev) => ({
      ...prev,
      property_id: nextPropertyId,
      location_id: '',
    }));
  };

  // Reset serial selections, supplier, and quantity when switching catalog items
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

  // Switch between existing serials and new serials while clearing previous selections
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

  // Toggle a single existing serial unit checkbox and sync quantity to selected count
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

  // Select all available serials for the item or clear all if already selected
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

  // Parse typed serial numbers and sync form.new_serial_numbers + quantity
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

  // Submit create or edit request to Laravel and show Sonner promise toast feedback
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly || processing) return;

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('propertystockins.store'), {
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
        loading: 'Recording property stock-in...',
        success: (res) => `Property stock-in for "${res.name}" recorded.`,
        error: 'Failed to record property stock-in. Please check the form for errors.',
      });
    } else {
      if (!initialData?.id) return;

      const updatePromise = new Promise((resolve, reject) => {
        put(route('propertystockins.update', initialData.id), {
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
        loading: 'Updating property stock-in...',
        success: (res) => `Property stock-in for "${res.name}" updated.`,
        error: 'Failed to update property stock-in. Please check the form for errors.',
      });
    }
  };

  return (
    <>
    {/* Backdrop overlay */}
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-2 sm:p-4">
      {/* Modal card container */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[94dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl shrink-0">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>{mode === 'edit' ? 'Edit Property Stock-In' : 'Manual Property Stock-In'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-sm">
          {/* Scrollable form fields */}
          <div className="p-4 sm:px-6 sm:py-4 space-y-3 sm:space-y-3.5 overflow-y-auto flex-1">
            {/* Target Property (disabled when locked to user's property) & Room/Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Target Property *
                </label>
                <SearchableSelect
                  value={data.property_id}
                  disabled={isViewOnly || isPropertyLocked}
                  required
                  options={properties}
                  placeholder="Select Property..."
                  searchPlaceholder="Search property..."
                  onChange={handlePropertyChange}
                />
                {isPropertyLocked && !isViewOnly && (
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Locked to your assigned property.
                  </span>
                )}
                {errors.property_id && (
                  <span className="text-xs text-rose-500 mt-1 block">{errors.property_id}</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Room / Location (Optional)
                </label>
                <SearchableSelect
                  value={data.location_id}
                  disabled={isViewOnly || !data.property_id}
                  options={locationOptions}
                  placeholder="Select Location / Room..."
                  searchPlaceholder="Search room or location..."
                  onChange={(val) => setData('location_id', val)}
                />
                {errors.location_id && (
                  <span className="text-xs text-rose-500 mt-1 block">{errors.location_id}</span>
                )}
              </div>
            </div>

            {/* Catalog item selector showing name, SKU, and UOM */}
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

            {/* Serialized units box (existing available units or new serial input) */}
            {Boolean(data.item_id) && !isViewOnly && (
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-emerald-900 uppercase flex items-center gap-1.5 min-w-0 truncate">
                    <Cpu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Serialized Units ({matchingSerials.length} Available)
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                    {matchingSerials.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSwitchSerialMode('existing')}
                        className={`px-2 py-0.5 rounded font-medium whitespace-nowrap cursor-pointer ${
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
                      className={`px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 whitespace-nowrap cursor-pointer ${
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
                    {/* Select-all / clear-all bar for existing units */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-800">{selectedCount} selected</span>
                      <button
                        type="button"
                        onClick={handleSelectAllSerials}
                        className="font-medium text-emerald-700 hover:text-emerald-900 whitespace-nowrap cursor-pointer"
                      >
                        {matchingSerials.every((u) => data.selected_asset_unit_ids.includes(u.id))
                          ? 'Clear selection'
                          : 'Select all'}
                      </button>
                    </div>
                    {/* Checklist of available serial numbers */}
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
                  /* Textarea for entering new serial numbers */
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

            {/* Supplier selector and Quantity input */}
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
                      className="font-semibold text-indigo-600 hover:underline cursor-pointer"
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
                  Quantity ({displayQtyUom}) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={data.quantity}
                  readOnly={isQuantityAutoSynced || isViewOnly}
                  onChange={(e) => setData('quantity', e.target.value)}
                  placeholder="e.g. 10"
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
            </div>

            {/* RF Number, Invoice Number, and Received Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  RF Number *
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={data.rf_number}
                  readOnly={isViewOnly}
                  onChange={(e) => setData('rf_number', e.target.value)}
                  placeholder="e.g. RF-205"
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

            {/* Remarks / delivery notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Remarks / Delivery Notes
              </label>
              <textarea
                rows="2"
                value={data.remarks}
                readOnly={isViewOnly}
                onChange={(e) => setData('remarks', e.target.value)}
                placeholder="Property delivery notes or room placement details..."
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 resize-none read-only:bg-slate-100"
              />
              {errors.remarks && (
                <span className="text-xs text-rose-500 mt-0.5 block">{errors.remarks}</span>
              )}
            </div>
          </div>

          {/* Modal footer with Cancel/Close and Submit button */}
          <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3 border-t border-slate-100 bg-white rounded-b-2xl shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
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
    </>
  );
}