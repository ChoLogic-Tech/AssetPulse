import React, { useState } from 'react';
import { 
  Building2, Search, Plus, MapPin, 
  Edit3, Trash2, CheckCircle2 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PropertyModal } from '@/Components/Modals/PropertyModal';

export default function Properties({ properties = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'

  const handleOpenCreate = () => {
    setSelectedProperty(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (property) => {
    setSelectedProperty(property);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (propertyId, propertyName) => {
    if (confirm(`Are you sure you want to delete property "${propertyName}"? This may affect assigned users and local inventories.`)) {
      router.delete(route('properties.destroy', propertyId));
    }
  };

  const filteredProperties = properties.filter(property => 
    property.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedLayout pageTitle={["Settings", "Organization", "Properties & Branches"]}>
      <Head title="Properties Directory" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Properties & Remote Branches
            </h1>
            <p className="text-sm text-slate-500">
              Manage company-owned properties, resorts, offices, and operational hubs.
            </p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Property
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Property Name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Property / Branch Name</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProperties.length > 0 ? (
                  filteredProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          {property.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">ID: #{property.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button 
                          onClick={() => handleOpenEdit(property)}
                          title="Edit Property" 
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(property.id, property.name)}
                          title="Delete Property" 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="py-8 text-center text-slate-400 text-sm">
                      No properties found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Property Modal Component */}
        <PropertyModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          property={selectedProperty}
        />

      </div>
    </AuthenticatedLayout>
  );
}