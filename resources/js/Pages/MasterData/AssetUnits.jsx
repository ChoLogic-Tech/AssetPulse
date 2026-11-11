import React, { useState } from 'react';
import { 
  Plus, Search, Tag, Building2, Eye, ShieldCheck, 
  Cpu, MapPin, Wrench, CheckCircle2, AlertCircle
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { AssetUnitModal } from '@/Components/Modals/AssetUnitModal';

export default function AssetUnits({ assetUnits = [], properties = [], items = [], locations = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');

  const handleOpenCreate = () => {
    setSelectedAsset(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenView = (asset) => {
    setSelectedAsset(asset);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const filteredAssets = assetUnits.filter(record => {
    const matchesSearch = 
      record.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProperty = selectedPropertyFilter 
      ? String(record.property_id) === String(selectedPropertyFilter) 
      : true;

    const matchesStatus = selectedStatusFilter 
      ? record.status === selectedStatusFilter 
      : true;

    return matchesSearch && matchesProperty && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Deployed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Under Repair':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Decommissioned':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <AuthenticatedLayout pageTitle={["Master Data", "Serialized Asset Units"]}>
      <Head title="Asset Units Directory" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-indigo-600" />
              Serialized Asset Directory
            </h1>
            <p className="text-sm text-slate-500">
              Track physical individual hardware units, serial numbers, custody, and deployment lifecycle.
            </p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Register New Serialized Asset
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
              placeholder="Search Serial Number, Item, or SKU..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600"
            >
              <option value="">All Locations / Properties</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select 
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Deployed">Deployed</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Serial Number / SKU</th>
                  <th className="py-3.5 px-4">Catalog Item & Specs</th>
                  <th className="py-3.5 px-4">Current Custody</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date Received</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{asset.serial_number}</div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3" />
                          {asset.sku}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{asset.item_name}</div>
                        <div className="text-xs text-slate-500">
                          {asset.brand_name} {asset.model_name ? `• ${asset.model_name}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {asset.property_name || 'Central Warehouse'}
                        </div>
                        {asset.location_name && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {asset.location_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(asset.status)}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {asset.date_received}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => handleOpenView(asset)}
                          title="View Asset Details" 
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                      No serialized assets found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Modal */}
        <AssetUnitModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          initialData={selectedAsset}
          items={items}
          properties={properties}
          locations={locations}
        />
      </div>
    </AuthenticatedLayout>
  );
}