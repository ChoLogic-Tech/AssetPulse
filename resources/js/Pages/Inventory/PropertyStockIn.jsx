import React, { useState } from 'react';
import { Building2, Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { PropertyStockInModal } from '@/Components/Modals/PropertyStockInModal';

export default function PropertyStockIn({
  stockIns = { data: [] },
  items = [],
  suppliers = [],
  properties = [],
  assetUnits = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create',
    initialData: null,
    isViewOnly: false,
  });

  const logs = stockIns?.data ?? [];

  const filteredLogs = logs.filter((row) => {
    const matchesProperty =
      !selectedPropertyFilter || String(row.property_id) === String(selectedPropertyFilter);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      row.item_name?.toLowerCase().includes(q) ||
      row.sku?.toLowerCase().includes(q) ||
      row.rf_number?.toLowerCase().includes(q) ||
      row.property_name?.toLowerCase().includes(q) ||
      row.supplier_name?.toLowerCase().includes(q);

    return matchesProperty && matchesSearch;
  });

  const openCreateModal = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      initialData: null,
      isViewOnly: false,
    });
  };

  const openEditModal = (row) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      initialData: row,
      isViewOnly: false,
    });
  };

  const openViewModal = (row) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      initialData: row,
      isViewOnly: true,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Delete property stock-in record for "${row.item_name}" (${row.rf_number})?`)) {
      return;
    }

    const deletePromise = new Promise((resolve, reject) => {
      router.delete(route('propertystockin.destroy', row.id), {
        preserveScroll: true,
        onSuccess: () => resolve(),
        onError: (err) => reject(err),
      });
    });

    toast.promise(deletePromise, {
      loading: 'Deleting property stock-in...',
      success: 'Property stock-in deleted.',
      error: 'Failed to delete property stock-in.',
    });
  };

  return (
    <AuthenticatedLayout pageTitle={['Inventory', 'Properties', 'Property Stock-In']}>
      <Head title="Property Stock-In" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Property Stock-In & Receipts
            </h1>
            <p className="text-sm text-slate-500">
              Record stock receipts and serialized units directly into property inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Property Stock-In
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, RF #, Property, or Item..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={selectedPropertyFilter}
            onChange={(e) => setSelectedPropertyFilter(e.target.value)}
            className="w-full md:w-60 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Item Details</th>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">RF / Invoice</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{row.item_name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{row.sku || 'NO-SKU'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                        {row.property_name || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="text-slate-800 font-semibold">{row.rf_number}</div>
                        {row.invoice_number && (
                          <div className="text-slate-400">{row.invoice_number}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          +{row.quantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openViewModal(row)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                      No property stock-in records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <PropertyStockInModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          mode={modalState.mode}
          initialData={modalState.initialData}
          isViewOnly={modalState.isViewOnly}
          items={items}
          suppliers={suppliers}
          properties={properties}
          assetUnits={assetUnits}
        />
      </div>
    </AuthenticatedLayout>
  );
}