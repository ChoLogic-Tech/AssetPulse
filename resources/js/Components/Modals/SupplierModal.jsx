import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

function formatPhoneOrLandline(value = '') {
  // Keep only digits and a leading '+'
  const cleaned = String(value).replace(/(?!^\+)[^\d]/g, '');

  // Mobile with +639 -> +639 2130 18712
  if (cleaned.startsWith('+639')) {
    const digits = cleaned.slice(4, 13);
    return ['+639', digits.slice(0, 4), digits.slice(4, 9)]
      .filter(Boolean)
      .join(' ');
  }

  // International landline with +63 -> +63 2 XXXX XXXX or +63 36 XXX XXXX
  if (cleaned.startsWith('+63')) {
    const digits = cleaned.slice(3, 13);
    if (digits.startsWith('2')) {
      return ['+63', digits.slice(0, 1), digits.slice(1, 5), digits.slice(5, 9)]
        .filter(Boolean)
        .join(' ');
    }
    return ['+63', digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9)]
      .filter(Boolean)
      .join(' ');
  }

  // Local mobile 09XX XXX XXXX
  if (cleaned.startsWith('09')) {
    const digits = cleaned.slice(0, 11);
    return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 11)]
      .filter(Boolean)
      .join(' ');
  }

  // Local landline 02 XXXX XXXX or 036 XXX XXXX
  if (cleaned.startsWith('0')) {
    const digits = cleaned.slice(0, 10);
    if (digits.startsWith('02')) {
      return [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 10)]
        .filter(Boolean)
        .join(' ');
    }
    return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)]
      .filter(Boolean)
      .join(' ');
  }

  return cleaned;
}

const inputClass = (hasError) =>
  `w-full px-3 py-2 text-sm border rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-500 ${
    hasError
      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-600'
      : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
  }`;

export function SupplierModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
}) {
  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    clearErrors();

    if (mode === 'create') {
      reset();
      return;
    }

    setData({
      name: initialData?.name || '',
      contact_person: initialData?.contact_person || '',
      phone_number: formatPhoneOrLandline(
        initialData?.phone_number || initialData?.contact_number || initialData?.phone || ''
      ),
      email: initialData?.email || '',
      address: initialData?.address || '',
    });
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const isEdit = mode === 'edit';

  const handleFieldChange = (field, value) => {
    setData(field, value);
    if (errors[field]) {
      clearErrors(field);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly || processing) return;

    const submittedName = data.name.trim();

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('suppliers.store'), {
          preserveScroll: true,
          onSuccess: () => {
            reset();
            onClose();
            resolve({ name: submittedName });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding supplier...',
        success: (res) => `Supplier "${res.name}" successfully created.`,
        error: (err) => err?.name || 'Failed to create supplier. Please check the form for errors.',
      });
    } else {
      if (!initialData?.id) return;

      const updatePromise = new Promise((resolve, reject) => {
        put(route('suppliers.update', initialData.id), {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            resolve({ name: submittedName });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(updatePromise, {
        loading: 'Updating supplier...',
        success: (res) => `Supplier "${res.name}" successfully updated.`,
        error: 'Failed to update supplier. Please check the form for errors.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">
            {mode === 'create' && 'Add New Vendor/Supplier'}
            {mode === 'edit' && 'Edit Vendor/Supplier Record'}
            {mode === 'view' && 'Vendor/Supplier Details'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg"
          >
            &times;
          </button>
        </div>

        {/* Modal Form Body */}
        <form className="p-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Vendor/ Supplier Name *
              </label>
              <input
                type="text"
                name="name"
                value={data.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                disabled={isViewOnly}
                placeholder="e.g. Delsan, Wired Systems, etc."
                className={inputClass(Boolean(errors.name))}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                name="contact_person"
                value={data.contact_person}
                onChange={(e) => handleFieldChange('contact_person', e.target.value)}
                disabled={isViewOnly}
                placeholder="Enter contact person name"
                className={inputClass(Boolean(errors.contact_person))}
              />
              {errors.contact_person && (
                <p className="mt-1 text-xs text-red-600">{errors.contact_person}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Contact Number *
              </label>
              <input
                type="tel"
                name="phone_number"
                value={data.phone_number}
                onChange={(e) =>
                  handleFieldChange('phone_number', formatPhoneOrLandline(e.target.value))
                }
                disabled={isViewOnly}
                placeholder="+639 2130 18712 or 036 288 1234"
                autoComplete="tel"
                title="Enter a valid mobile number (+639 2130 18712 / 09XX XXX XXXX) or landline (+63 36 288 1234 / 036 288 1234)"
                className={inputClass(Boolean(errors.phone_number))}
              />
              {errors.phone_number && (
                <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                disabled={isViewOnly}
                placeholder="Enter contact person email address"
                className={inputClass(Boolean(errors.email))}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Address *
            </label>
            <textarea
              name="address"
              rows="3"
              value={data.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              disabled={isViewOnly}
              placeholder="Enter vendor/supplier address"
              className={inputClass(Boolean(errors.address))}
            />
            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
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
                <CheckCircle2 className="w-4 h-4" />
                {processing
                  ? mode === 'create'
                    ? 'Saving...'
                    : 'Updating...'
                  : mode === 'create'
                  ? 'Save Supplier'
                  : 'Update Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}