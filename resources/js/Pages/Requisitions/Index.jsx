import React, { useState } from 'react';
import { 
  FileText, Search, Plus, Building2, 
  CheckCircle2, Clock, Eye, Send, PackageCheck, Layers
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { FulfillRequisitionModal } from '@/Components/Modals/FulfillRequisitionModal';

export default function Index({ requisitions = [], properties = [], availableAssets = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);

  const handleOpenFulfill = (req) => {
    setSelectedRequisition(req);
    setIsFulfillModalOpen(true);
  };

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = 
      req.rf_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.property_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProperty = selectedPropertyFilter 
      ? String(req.property_id) === String(selectedPropertyFilter) 
      : true;

    const matchesStatus = selectedStatusFilter 
      ? String(req.status) === String(selectedStatusFilter) 
      : true;

    return matchesSearch && matchesProperty && matchesStatus;
  });

  const getStatusBadge = (statusName) => {
    switch (statusName?.toLowerCase()) {
      case 'fulfilled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partially fulfilled':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'approved':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <AuthenticatedLayout pageTitle={["Requisitions", "Requisitions & Dispatch"]}>
      <Head title="Stock Requisitions" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Stock Requisitions & Queue Tracker
            </h1>
            <p className="text-sm text-slate-500">
              Manage property hardware/stock requests, assign serial numbers, and process partial or full dispatches.
            </p>
          </div>
          <Link
            href={route('requisitions.create')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Requisition Request
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RF Number or Branch..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600 w-full md:w-56"
            >
              <option value="">All Requesting Properties</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select 
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600 w-full md:w-44"
            >
              <option value="">All Statuses</option>
              <option value="1">Pending Approval</option>
              <option value="2">Approved</option>
              <option value="3">Partially Fulfilled</option>
              <option value="4">Fulfilled / Closed</option>
            </select>
          </div>
        </div>

        {/* Requisitions Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">RF Reference</th>
                  <th className="py-3.5 px-4">Requesting Branch</th>
                  <th className="py-3.5 px-4">Requested By</th>
                  <th className="py-3.5 px-4">Status & Queue</th>
                  <th className="py-3.5 px-4">Request Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequisitions.length > 0 ? (
                  filteredRequisitions.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {req.rf_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {req.property_name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {req.requested_by_name || 'System User'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(req.status_name)}`}>
                          {req.status_name || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {req.request_date}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          href={route('requisitions.show', req.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition inline-flex items-center"
                          title="View Audit Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {req.status_name?.toLowerCase() !== 'fulfilled' && (
                          <button
                            onClick={() => handleOpenFulfill(req)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition inline-flex items-center gap-1"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            Fulfill / Release
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                      No stock requisitions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Standalone Fulfillment Modal */}
        <FulfillRequisitionModal 
          isOpen={isFulfillModalOpen}
          onClose={() => setIsFulfillModalOpen(false)}
          requisition={selectedRequisition}
          availableAssets={availableAssets}
        />

      </div>
    </AuthenticatedLayout>
  );
}