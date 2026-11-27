// Import React hooks, icons, Inertia form helper, and toast notifications
import React, { useEffect } from 'react';
import {
  X,
  Building2,
  Tag,
  History,
  ArrowDownLeft,
  Cpu,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

// Read UOM label from joined columns with fallback to 'Unit'
const getRawUom = (record) =>
  record?.uom_name || record?.uom_code || record?.uom || 'Unit';

// Read previous RF number across possible field names
const getPreviousRf = (record) =>
  record?.previous_rf_num ||
  record?.prev_rf_num ||
  record?.previous_rf ||
  record?.prev_rf ||
  null;

// Singularize or pluralize UOM label based on quantity count
const pluralizeUom = (label, count) => {
  const clean = String(label || 'Unit').trim();
  if (!clean) return 'Units';
  if (Math.abs(Number(count)) === 1) return clean;

  const isAllUpper = clean === clean.toUpperCase() && /[A-Z]/.test(clean);
  const lower = clean.toLowerCase();

  // Keep words already ending in 's' unchanged (except 'ss', 'box', 'pcs')
  if (
    lower.endsWith('s') &&
    !lower.endsWith('ss') &&
    !['box', 'pcs'].includes(lower)
  ) {
    return clean;
  }

  // Add 'es' for sibilant endings
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

  // Default plural form
  return isAllUpper ? `${clean}S` : `${clean}s`;
};

// Format a count with its UOM label, optionally lowercasing the unit name
const formatCountWithUom = (count, baseUom, { lowercase = false } = {}) => {
  const num = Number(count ?? 0);
  const unitText = pluralizeUom(baseUom, num);
  return `${num.toLocaleString()} ${lowercase ? unitText.toLowerCase() : unitText}`;
};

// Combined details and baseline parstock modal for a property inventory row
export function PropertyItemModal({ isOpen, onClose, initialData = null }) {
  // Initialize Inertia form state for updating parstock
  const { data, setData, transform, put, processing, reset, errors, clearErrors } = useForm({
    parstock: 0,
  });

  // Sync form parstock value whenever modal opens with a new record
  useEffect(() => {
    if (!isOpen || !initialData) return;
    clearErrors();
    setData('parstock', Number(initialData.parstock ?? 0));
  }, [isOpen, initialData]);

  // Close modal on Escape key when not currently submitting
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !processing) {
        clearErrors();
        reset();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, processing, onClose, clearErrors, reset]);

  if (!isOpen || !initialData) return null;

  // Derived display values for stock, parstock, deficit alert, and RF references
  const baseUom = getRawUom(initialData);
  const previousRf = getPreviousRf(initialData);
  const qty = Number(initialData.qty ?? 0);
  const currentPar = Number(data.parstock ?? 0);
  const serializedCount = Number(initialData.serialized_count ?? 0);

  // Flag low stock when a positive baseline parstock target is set and stock is below it
  const isBelowPar = currentPar > 0 && qty < currentPar;
  const deficitQty = Math.max(0, currentPar - qty);

  const availableStockText = formatCountWithUom(qty, baseUom, { lowercase: true });
  const targetParText = formatCountWithUom(currentPar, baseUom, { lowercase: true });
  const deficitText = formatCountWithUom(deficitQty, baseUom, { lowercase: true });
  const parInputLabelUom = pluralizeUom(
    baseUom,
    data.parstock === '' ? 2 : currentPar
  );

  // Reset form state and close modal
  const handleClose = () => {
    clearErrors();
    reset();
    onClose();
  };

  // Convert input to number while allowing empty string while typing
  const handleParstockChange = (e) => {
    const raw = e.target.value;
    setData('parstock', raw === '' ? '' : Number(raw));
  };

  // Submit baseline parstock update via PUT to PropertyInventoryController@updateParstock
  const handleSubmit = (e) => {
    e.preventDefault();
    if (processing || !initialData?.id) return;

    const nextPar = Number(data.parstock);
    if (!Number.isInteger(nextPar) || nextPar < 0) {
      toast.error('Baseline par stock must be a whole number of 0 or higher.');
      return;
    }

    const updatePromise = new Promise((resolve, reject) => {
      transform((formData) => ({
        ...formData,
        parstock: nextPar,
      }));

      put(route('propertyparstocks.update', initialData.id), {
        preserveScroll: true,
        onSuccess: () => {
          reset();
          onClose();
          resolve({ name: initialData.item_name, parstock: nextPar });
        },
        onError: (err) => {
          reject(err);
        },
      });
    });

    toast.promise(updatePromise, {
      loading: 'Updating baseline par stock...',
      success: (res) =>
        `Par stock for "${res.name}" set to ${formatCountWithUom(res.parstock, baseUom, {
          lowercase: true,
        })}.`,
      error: 'Failed to update par stock. Please check the value.',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50">
          <h3
            id="property-modal-title"
            className="font-semibold text-slate-900 text-base flex items-center gap-2.5"
          >
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Building2 className="w-4 h-4" />
            </span>
            Property Stock Details &amp; Par Stock
          </h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Parstock Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm text-slate-700">
          {/* Primary Item, Property & Stock Summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div>
              <span className="block text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Item Name
              </span>
              <p className="font-semibold text-slate-900 text-base leading-snug mt-0.5">
                {initialData.item_name}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="block text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Property
                </span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {initialData.property_name || 'N/A'}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Available Stock
                </span>
                <span
                  className={`font-bold text-base tabular-nums mt-0.5 block ${
                    isBelowPar || qty === 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {availableStockText}
                </span>
              </div>
            </div>
          </div>

          {/* Low Par Stock Warning Banner */}
          {isBelowPar && (
            <div
              role="alert"
              className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-900 text-xs leading-relaxed"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950 block mb-0.5">
                  Below Par Stock Notification
                </span>
                Available stock ({availableStockText}) is {deficitText} below the target par stock
                level ({targetParText}).
              </div>
            </div>
          )}

          {/* SKU & RF Reference Identifiers */}
          <div className="space-y-3 px-1">
            <div>
              <span className="block text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                SKU Code
              </span>
              <span className="font-mono text-xs font-medium text-slate-900 flex items-center gap-1.5 mt-1">
                <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {initialData.sku}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <span className="block text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Current RF Reference
                </span>
                <span className="font-mono text-xs font-medium text-slate-900 mt-1 block">
                  {initialData.rf_num || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Previous RF Reference
                </span>
                <span className="font-mono text-xs font-medium text-slate-700 flex items-center gap-1.5 mt-1">
                  <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {previousRf || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Movement & Saved Par Metrics */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Total Stock In
              </span>
              <span className="font-semibold text-emerald-700 text-sm tabular-nums flex items-center justify-center gap-1 mt-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                {Number(initialData.stockin ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Serialized Units
              </span>
              <span className="font-semibold text-indigo-700 text-sm tabular-nums flex items-center justify-center gap-1 mt-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                {serializedCount.toLocaleString()}
              </span>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Saved Par
              </span>
              <span className="font-semibold text-slate-900 text-sm tabular-nums block mt-1">
                {Number(initialData.parstock ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Editable Baseline Par Stock Input */}
          <div>
            <label
              htmlFor="property-parstock-input"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Baseline Par Stock ({parInputLabelUom}) <span className="text-rose-600">*</span>
            </label>
            <input
              id="property-parstock-input"
              type="number"
              min="0"
              step="1"
              value={data.parstock}
              onChange={handleParstockChange}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono tabular-nums text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
              required
            />
            {errors.parstock && (
              <span className="text-xs font-medium text-rose-700 mt-1.5 block">
                {errors.parstock}
              </span>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {processing ? 'Saving...' : 'Save Par Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}