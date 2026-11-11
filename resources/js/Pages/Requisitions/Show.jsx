import React from 'react';
import { 
  FileText, Building2, Calendar, User, 
  ArrowLeft, Cpu, CheckCircle2, Truck 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ requisition = {}, lineItems = [], releaseLogs = [] }) {
  // Safe guard fallback if requisition data is loading or empty
  if (!requisition || Object.keys(requisition).length === 0) {
    return (
      <AuthenticatedLayout pageTitle={["Requisitions", "Details"]}>
        <Head title="Loading Requisition..." />
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading requisition records...
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout pageTitle={["Requisitions", `RF: ${requisition.rf_number}`]}>
      <Head title={`Requisition - ${requisition.rf_number}`} />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={route('requisitions.index')}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white border border-slate-200 rounded-xl shadow-sm transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                Requisition #{requisition.rf_number}
              </h1>
              <p className="text-sm text-slate-500">
                Detailed stock queue audit and dispatch release ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Requesting Property</span>
              <span className="font-semibold text-slate-900">{requisition.property_name || requisition.property?.name || 'N/A'}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Requested By</span>
              <span className="font-semibold text-slate-900">{requisition.requested_by_name || 'System User'}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Request Date</span>
              <span className="font-semibold text-slate-900">{requisition.request_date || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-5">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Requisitioned Line Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Item Details</th>
                  <th className="py-3.5 px-4">Requested Qty</th>
                  <th className="py-3.5 px-4">Fulfilled Qty</th>
                  <th className="py-3.5 px-4">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lineItems.length > 0 ? (
                  lineItems.map((item) => {
                    const remaining = item.requested_qty - item.fulfilled_qty;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{item.item_name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{item.requested_qty} units</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">{item.fulfilled_qty} units</td>
                        <td className="py-3.5 px-4">
                          <span className={`font-bold ${remaining > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {remaining} units
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400 text-sm">
                      No line items recorded for this requisition.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispatch & Release History Log */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            Warehouse Dispatch & Serial Release Logs
          </h3>

          {releaseLogs.length > 0 ? (
            <div className="space-y-3">
              {releaseLogs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Released Quantity: {log.released_qty} units
                    </div>
                    {log.serial_number && (
                      <div className="text-xs font-mono text-indigo-600 mt-1 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        Dispatched S/N: {log.serial_number}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">
                      Released By: {log.released_by_name || 'Admin'} • {log.released_date}
                    </div>
                  </div>
                  {log.remarks && (
                    <div className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-200 max-w-md">
                      "{log.remarks}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No releases or serial assignments recorded for this requisition yet.
            </div>
          )}
        </div>

      </div>
    </AuthenticatedLayout>
  );
}