import React, { useState } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Eye, 
  Truck, Layers, AlertTriangle, Phone, Mail 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { VendorModal } from '@/Components/Modals/VendorModal';

export default function Vendors() {
  // Mock data mapping to the vendors/suppliers table structure
  const [vendors, setVendors] = useState([
    {
      id: 1,
      name: 'TechGlobal Solutions Inc.',
      contact_person: 'Maria Santos',
      email: 'm.santos@techglobal.ph',
      phone: '+63 917 555 0192',
      items_count: 54,
      updated_at: '2026-11-01 10:30 AM'
    },
    {
      id: 2,
      name: 'Metro IT Distribution',
      contact_person: 'James Reyes',
      email: 'support@metroit.com',
      phone: '+63 922 888 4311',
      items_count: 31,
      updated_at: '2026-10-28 02:15 PM'
    },
    {
      id: 3,
      name: 'Apex Hardware Hub',
      contact_person: 'Sarah Jenkins',
      email: 's.jenkins@apexhub.io',
      phone: '+63 918 333 9021',
      items_count: 17,
      updated_at: '2026-10-15 08:45 AM'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  const { delete: destroy, processing } = useForm();

  const handleOpenCreate = () => {
    setSelectedVendor(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vendor) => {
    setSelectedVendor(vendor);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (vendor) => {
    setSelectedVendor(vendor);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (vendor) => {
    setVendorToDelete(vendor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (vendorToDelete) {
      // If using backend integration, replace this with: destroy(route('vendors.destroy', vendorToDelete.id))
      setVendors(vendors.filter(v => v.id !== vendorToDelete.id));
      setIsDeleteModalOpen(false);
      setVendorToDelete(null);
    }
  };

  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedLayout pageTitle={["Master Data", "Vendors & Suppliers"]}>
        <Head title="Vendors & Suppliers" />
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-6 h-6 text-indigo-600" />
                Vendors & Suppliers Masterlist
            </h1>
            <p className="text-sm text-slate-500">
                Manage hardware providers, procurement partners, and supplier contact directory.
            </p>
            </div>
            <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
            >
            <Plus className="w-4 h-4" />
            Add New Vendor/Supplier
            </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
            <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor, contact, or email..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
            </div>
            
            <div className="text-sm text-slate-500 font-medium">
              Total Vendors: <span className="text-slate-800 font-bold">{filteredVendors.length}</span>
            </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                    <th className="py-3.5 px-4">Vendor / Company</th>
                    <th className="py-3.5 px-4">Contact Information</th>
                    <th className="py-3.5 px-4">Associated Items</th>
                    <th className="py-3.5 px-4">Last Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredVendors.length > 0 ? (
                    filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{vendor.name}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: #{vendor.id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-medium">{vendor.contact_person}</div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{vendor.email}</span>
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{vendor.phone}</span>
                            </div>
                        </td>
                        <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              <Layers className="w-3 h-3 text-slate-500" />
                              {vendor.items_count || 0} items
                            </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                            {vendor.updated_at}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                            <button 
                                onClick={() => handleOpenView(vendor)}
                                title="View Vendor Details" 
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleOpenEdit(vendor)}
                                title="Edit Vendor Record" 
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleOpenDelete(vendor)}
                                title="Delete Vendor" 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition"
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
                            No vendors found. Click "+ Add New Vendor/Supplier" to create one.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* Vendor Modal Component */}
        <VendorModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            mode={modalMode}
            initialData={selectedVendor}
        />

        {/* Custom Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Vendor</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove <span className="font-semibold text-slate-700">"{vendorToDelete?.name}"</span>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {processing ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
    </AuthenticatedLayout>
  );
}