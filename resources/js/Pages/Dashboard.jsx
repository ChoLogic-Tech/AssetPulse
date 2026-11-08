import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import MetricCards from '@/Components/Dashboard/MetricCards';
import RequisitionsTable from '@/Components/Dashboard/RequisitionsTable';
import ParStockTable from '@/Components/Dashboard/ParStockTable';
import SerializedAssetsTable from '@/Components/Dashboard/SerializedAssetsTable';
import AuditLogsTable from '@/Components/Dashboard/AuditLogsTable';
import AssetDetailsModal from '@/Components/Dashboard/AssetDetailsModal';

export default function Dashboard({ dashboard }) {
  const metrics = dashboard?.metrics || {
    totalAssets: 485,
    pendingRequests: 7,
    totalMasterlist: 124,
    categoriesCount: 12,
    brandsCount: 28,
    suppliersCount: 15,
    lowStockItems: 3,
  };

  const requests = dashboard?.recentRequests || [
    { id: 'REQ-2026-089', date: '2026-11-04', property: 'Henann Regency', requester: 'Jerimy Kirk Eriman', item: 'Cat6 Cable (2m)', type: 'Non-Serialized (Par Stock)', qty: 50, status: 'Pending Approval' },
    { id: 'REQ-2026-088', date: '2026-11-03', property: 'Henann Palm', requester: 'Bine Lopez', item: 'HP LaserJet Toner 85A', type: 'Non-Serialized (Par Stock)', qty: 6, status: 'Approved' },
    { id: 'REQ-2026-087', date: '2026-11-02', property: 'Henann Lagoon', requester: 'Paul Silverio', item: 'Cisco Access Point Wi-Fi 6', type: 'Serialized Hardware', qty: 4, status: 'Ready for Release' },
    { id: 'REQ-2026-086', date: '2026-11-01', property: 'Henann Garden', requester: 'Nikki Talunay', item: 'USB-C Docking Stations', type: 'Non-Serialized (Par Stock)', qty: 10, status: 'Fulfilled' },
  ];

  const parStockInventory = dashboard?.parStock || [
    { id: 'ITM-501', name: 'Cat6 Patch Cable 2m', category: 'Networking', currentStock: 140, parLevel: 300, variance: '-160 pcs (Short)', status: 'Low Stock' },
    { id: 'ITM-502', name: 'Cisco AP 9120 Access Point', category: 'Hardware', currentStock: 6, parLevel: 15, variance: '-9 pcs (Short)', status: 'Critical' },
    { id: 'ITM-503', name: 'Logitech USB Mouse', category: 'Peripherals', currentStock: 45, parLevel: 30, variance: '+15 pcs (Over)', status: 'Optimal' },
    { id: 'ITM-504', name: 'Zebra Thermal Ribbon 85A', category: 'Consumables', currentStock: 25, parLevel: 20, variance: '+5 pcs (Over)', status: 'Optimal' },
  ];

  const serializedAssets = dashboard?.recentAssets || [
    { serial: 'SN-C02G10X9MD81', tag: 'TAG-GH-041', name: 'MacBook Pro 16" M3 Max', category: 'Laptops', property: 'Henann Regency', assignedTo: 'Rachel Adams (GM)', status: 'Assigned', purchaseDate: '2025-02-10', warrantyExp: '2027-02-10', notes: 'Deployed to Executive Office' },
    { serial: 'SN-7X889K2-SRV99', tag: 'TAG-WH-009', name: 'Dell PowerEdge R750 Server', category: 'Servers', property: 'Main Central Warehouse', assignedTo: 'Unassigned (Vault)', status: 'In Warehouse', purchaseDate: '2024-08-15', warrantyExp: '2028-08-15', notes: 'Infrastructure reserve pool' },
  ];

  const mostRequestedItems = [
    { name: 'Cat6 Patch Cable 2m', requests: 42, category: 'Networking' },
    { name: 'HP LaserJet Toner 85A', requests: 28, category: 'Consumables' },
    { name: 'Logitech USB Mouse', requests: 19, category: 'Peripherals' },
    { name: 'USB-C Docking Stations', requests: 14, category: 'Hardware' },
  ];

  const auditLogs = dashboard?.auditLogs || [
    { id: 'LOG-901', timestamp: '2026-11-05 14:22', user: 'sysadmin', action: 'RELEASE', targetType: 'Par Stock Item', description: 'Released 50x Cat6 Cable (2m) for REQ-2026-089 to Henann Regency' },
    { id: 'LOG-900', timestamp: '2026-11-05 11:05', user: 'John Jerald Eriman', action: 'UPDATE', targetType: 'Serialized Asset', description: 'Updated warranty expiration for TAG-BR-112' },
    { id: 'LOG-899', timestamp: '2026-11-04 16:40', user: 'James Marvin Ragas', action: 'CREATE', targetType: 'Serialized Asset', description: 'Registered new asset TAG-GH-041 (MacBook Pro 16")' },
  ];

  const propertyDistribution = [
    { name: 'Henann Regency', assets: 95 },
    { name: 'Henann Palm', assets: 72 },
    { name: 'Henann Lagoon', assets: 68 },
    { name: 'Henann Garden', assets: 60 },
    { name: 'Henann Park', assets: 54 },
    { name: 'Henann Crystal', assets: 45 },
    { name: 'Henann Prime', assets: 41 },
  ];

  const [activeTab, setActiveTab] = useState('requisitions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Fulfilled':
      case 'Assigned':
      case 'Optimal':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending Approval':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Approved':
      case 'Ready for Release':
      case 'In Warehouse':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Low Stock':
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getAuditActionBadge = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RELEASE': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DELETE': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <div className="py-6 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-sans text-slate-800 bg-slate-50 min-h-screen">
        
        {/* Top Header & Actions Banner */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time monitoring for multi-property requisitions, warehouse stock, and serialized assets.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setActiveTab('requisitions')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'requisitions' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>Stock Requests & Releases</button>
              <button onClick={() => setActiveTab('parstock')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'parstock' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>Warehouse Par Stock</button>
              <button onClick={() => setActiveTab('assets')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'assets' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>Serialized Assets</button>
              <button onClick={() => setActiveTab('audit')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>Audit Trail Log</button>
            </div>

            <button onClick={() => router.visit('/requisitions/create')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5">
              <span>+ New Stock Request</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <MetricCards metrics={metrics} />

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Tabbed Tables Container */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {activeTab === 'requisitions' && 'Inter-Property Stock Requisition & Release Queue'}
                  {activeTab === 'parstock' && 'Main Warehouse Par Stock Table'}
                  {activeTab === 'assets' && 'Serialized Hardware Directory'}
                  {activeTab === 'audit' && 'System Audit Trail Log'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage stock requests, item releases, and system activity logs</p>
              </div>
              
              <div className="w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Filter table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {activeTab === 'requisitions' && <RequisitionsTable requests={requests} search={searchTerm} getStatusBadge={getStatusBadge} />}
            {activeTab === 'parstock' && <ParStockTable items={parStockInventory} search={searchTerm} getStatusBadge={getStatusBadge} />}
            {activeTab === 'assets' && <SerializedAssetsTable assets={serializedAssets} search={searchTerm} onInspect={setSelectedAsset} />}
            {activeTab === 'audit' && <AuditLogsTable logs={auditLogs} search={searchTerm} getAuditActionBadge={getAuditActionBadge} />}
          </div>

          {/* Right Column: Summaries */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Most Requested Items</h3>
                <span className="text-[11px] text-slate-400">Top Demand</span>
              </div>
              <div className="space-y-3">
                {mostRequestedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <span className="text-[10px] text-slate-400">{item.category}</span>
                    </div>
                    <span className="font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">{item.requests} reqs</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Property Asset Distribution</h3>
                <span className="text-[11px] text-slate-400">7 Locations</span>
              </div>
              <div className="space-y-2.5">
                {propertyDistribution.map((prop, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700">{prop.name}</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{prop.assets} units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Component */}
        <AssetDetailsModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} getStatusBadge={getStatusBadge} />

      </div>
    </AuthenticatedLayout>
  );
}