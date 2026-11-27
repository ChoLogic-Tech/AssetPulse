import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  MapPin,
  Building2,
  Edit3,
  CheckCircle2,
  ChevronDown,
  Check,
  Search,
} from 'lucide-react';
import { useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

// Known branch/property prefix codes for automatic location naming
const PROPERTY_CODES = {
  'henann palm': 'HPM',
  'henann regency': 'HRB',
  'henann lagoon': 'HLB',
  'henann garden': 'HGB',
  'henann park': 'HPK',
  'henann crystal': 'HCS',
  'henann prime': 'HPB',
};

const KNOWN_CODES = Object.values(PROPERTY_CODES);

// Resolve a property's short code from its fields or known branch name
function getPropertyCode(property) {
  if (!property) return '';
  if (property.code || property.abbreviation) {
    return String(property.code || property.abbreviation)
      .trim()
      .toUpperCase()
      .replace(/\s*-\s*$/, '');
  }
  const sourceName = String(property.name || '').trim().toLowerCase();
  const matchedKey = Object.keys(PROPERTY_CODES).find((key) =>
    sourceName.includes(key)
  );
  return matchedKey ? PROPERTY_CODES[matchedKey] : '';
}

// Swap or apply a branch prefix on the location name without duplicating codes
function applyPropertyPrefix(currentName, nextCode, previousCode = '') {
  const codesToStrip = Array.from(
    new Set([previousCode, ...KNOWN_CODES].filter(Boolean))
  );

  let baseName = String(currentName ?? '').trimStart();

  for (const code of codesToStrip) {
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixRegex = new RegExp(`^${escaped}(\\s*[-–:]\\s*|\\s+)`, 'i');
    if (prefixRegex.test(baseName)) {
      baseName = baseName.replace(prefixRegex, '').trimStart();
      break;
    }
  }

  if (!nextCode) {
    return baseName;
  }

  return baseName ? `${nextCode} - ${baseName}` : `${nextCode} - `;
}

// Searchable dropdown for picking a property or branch
function ScrollablePropertyDropdown({
  value,
  onChange,
  options = [],
  disabled = false,
  hasError = false,
  allowUnassigned = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const propertyList = Array.isArray(options) ? options : [];
  const selectedProperty = propertyList.find((p) => String(p.id) === String(value));

  const filteredProperties = propertyList.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return String(p.name ?? '').toLowerCase().includes(q);
  });

  // Close dropdown on outside click or Escape key and focus search box on open
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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

  const handleSelect = (nextVal) => {
    onChange(nextVal);
    setIsOpen(false);
    setQuery('');
  };

  if (disabled) {
    return (
      <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed">
        {selectedProperty?.name || 'Assigned Property'}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3 py-2 text-sm text-left border rounded-lg flex items-center justify-between gap-2 outline-none transition bg-white ${
          hasError
            ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
        }`}
      >
        <span
          className={`truncate ${
            !selectedProperty ? 'text-slate-600 font-medium' : 'text-slate-800 font-medium'
          }`}
        >
          {selectedProperty ? selectedProperty.name : 'Central / Unassigned'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search property or branch..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
            {allowUnassigned && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-slate-50 transition ${
                  String(value ?? '') === ''
                    ? 'text-indigo-600 font-semibold bg-indigo-50/50'
                    : 'text-slate-500'
                }`}
              >
                <span>Central / Unassigned</span>
                {String(value ?? '') === '' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            )}

            {filteredProperties.length > 0 ? (
              filteredProperties.map((prop) => {
                const isSelected = String(prop.id) === String(value);
                return (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => handleSelect(prop.id)}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 hover:bg-slate-50 transition ${
                      isSelected ? 'bg-indigo-50/60 text-indigo-700 font-medium' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{prop.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">
                No matching properties found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function LocationModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  properties = [],
  canSelectAnyProperty = false,
  userPropertyId = '',
}) {
  const { auth } = usePage().props;
  const isEdit = mode === 'edit';
  const isView = mode === 'view';
  const lastCodeRef = useRef('');

  // Prefer the prop passed from the parent page, falling back to the logged-in user's property_id
  const resolvedUserPropertyId =
    userPropertyId !== '' && userPropertyId !== null && userPropertyId !== undefined
      ? String(userPropertyId)
      : auth?.user?.property_id !== undefined && auth?.user?.property_id !== null
      ? String(auth.user.property_id)
      : '';

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    property_id: '',
  });

  // Auto-select the user's property when creating (or when editing a record without a property)
  useEffect(() => {
    if (!isOpen) return;
    clearErrors();

    const propertyList = Array.isArray(properties) ? properties : [];

    if ((isEdit || isView) && initialData) {
      const initialPropId =
        initialData.property_id !== undefined && initialData.property_id !== null
          ? String(initialData.property_id)
          : isEdit && resolvedUserPropertyId
          ? resolvedUserPropertyId
          : '';
      const matchedProperty = propertyList.find((p) => String(p.id) === initialPropId);

      lastCodeRef.current = getPropertyCode(matchedProperty);
      setData({
        name: initialData.name ?? '',
        property_id: initialPropId,
      });
    } else {
      // Auto-select the user's property so it is pre-selected in the dropdown while allowing changes
      const defaultPropertyId = resolvedUserPropertyId;
      const defaultProperty = propertyList.find(
        (p) => String(p.id) === String(defaultPropertyId)
      );
      const defaultCode = getPropertyCode(defaultProperty);
      lastCodeRef.current = defaultCode;

      setData({
        name: defaultCode ? `${defaultCode} - ` : '',
        property_id: defaultPropertyId,
      });
    }
  }, [isOpen, mode, initialData, resolvedUserPropertyId, properties]);

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setData(field, value);
    if (errors[field]) {
      clearErrors(field);
    }
  };

  // Update property_id and sync the branch prefix in create mode
  const handlePropertySelect = (nextPropertyId) => {
    handleFieldChange('property_id', nextPropertyId);

    if (isEdit || isView) return;

    const nextProperty = properties.find(
      (p) => String(p.id) === String(nextPropertyId)
    );
    const nextCode = getPropertyCode(nextProperty);
    const nextName = applyPropertyPrefix(data.name, nextCode, lastCodeRef.current);

    lastCodeRef.current = nextCode;
    setData('name', nextName);
  };

  // Submit create or update request via Inertia and show Sonner toast feedback
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isView || processing) return;

    const locationName = data.name.trim();

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('locations.store'), {
          preserveScroll: true,
          onSuccess: () => {
            reset();
            onClose();
            setTimeout(() => resolve({ name: locationName }), 500);
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding location...',
        success: (res) => `Location "${res.name}" successfully created.`,
        error: 'Failed to create location. Please check the form for errors.',
      });
    } else {
      if (!initialData?.id) return;

      const updatePromise = new Promise((resolve, reject) => {
        put(route('locations.update', initialData.id), {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            resolve({ name: locationName });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(updatePromise, {
        loading: 'Updating location...',
        success: (res) => `Location "${res.name}" successfully updated.`,
        error: 'Failed to update location. Please check the form for errors.',
      });
    }
  };

  const viewPropertyLabel =
    initialData?.property?.name ?? initialData?.property_name ?? 'Central / Unassigned';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-visible my-8 animate-in fade-in zoom-in duration-200">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            {isEdit ? (
              <Edit3 className="w-5 h-5 text-indigo-600" />
            ) : (
              <MapPin className="w-5 h-5 text-indigo-600" />
            )}
            {isView
              ? 'Location Details'
              : isEdit
              ? 'Update Location'
              : 'Add New Location'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        {isView ? (
          /* Clean, easy-to-scan location details view */
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                Location / Storage Room
              </span>
              <div className="font-bold text-slate-900 text-base">
                {initialData?.name || '—'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Property / Branch
              </span>
              <div className="font-semibold text-slate-800">
                {viewPropertyLabel}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm" noValidate>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Property / Branch
              </label>
              {/* Dropdown auto-selects the user's property while allowing switching when permitted */}
              <ScrollablePropertyDropdown
                value={data.property_id}
                onChange={handlePropertySelect}
                options={properties}
                disabled={!canSelectAnyProperty}
                hasError={Boolean(errors.property_id)}
                allowUnassigned={canSelectAnyProperty}
              />
              {errors.property_id && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.property_id}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Location / Storage Room Name *
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g. Server Room, North Perimeter Gate, Housekeeping Closet"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition ${
                  errors.name
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                }`}
                required
              />
              {errors.name && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.name}</span>
              )}
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
                {processing ? 'Saving...' : isEdit ? 'Update Location' : 'Save Location'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}