import React from 'react';
import { 
  FileText, Building2, Plus, Trash2, 
  ArrowLeft, CheckCircle2 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ properties = [], items = [] }) {
  const { data, setData, post, processing, errors } = useForm({
    property_id: '',
    notes: '',
    items: [
      { item_id: '', requested_qty: 1 }
    ]
  });

  const handleAddItem = () => {
    setData('items', [...data.items, { item_id: '', requested_qty: 1 }]);
  };

  const handleRemoveItem = (index) => {
    const updated = [...data.items];
    updated.splice(index, 1);
    setData('items', updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...data.items];
    updated[index][field] = value;
    setData('items', updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('requisitions.store'));
  };

  return (
    <AuthenticatedLayout pageTitle={["Requisitions", "Create Request"]}>
      <Head title="Create Requisition" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Navigation & Header */}
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
              New Requisition Request
            </h1>
            <p className="text-sm text-slate-500">
              Submit hardware or bulk inventory requests to the central warehouse queue.
            </p>
          </div>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-4xl">
          
          {/* Destination Property */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Requesting Property
            </label>
            <input
                type="text"
                value={data.property_id}
                placeholder="Select Property..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 cursor-not-allowed bg-slate-50 text-slate-500"
                disabled
            />
          </div>

          {/* Requested Items Dynamic List */}
          <div className="space-y-3">
            <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    RF Number 
                </label>
                <input
                    type="text"
                    value={data.rf_number}
                    onChange={(e) => setData('rf_number', e.target.value)}
                    placeholder="e.g. RF-2024-001"
                    className="w-sm px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
                    required
                />
            </div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Requested Item Lines
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" /> Add Item Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {data.items.map((line, index) => (
                <div key={index} className="p-4 bg-slate-50/50 flex flex-col md:flex-row items-center gap-3">
                  <div className="flex-1 w-full">
                    <input
                        type="text"
                        value={line.item_id}
                        placeholder="Enter Catalog SKU or Item Name..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
                        required
                    />
                  </div>

                  <div className="w-full md:w-36">
                    <input
                      type="number"
                      min="1"
                      value={line.requested_qty}
                      onChange={(e) => handleItemChange(index, 'requested_qty', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
                      placeholder="Qty"
                      required
                    />
                  </div>

                  {data.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Requisition Notes / Justification
            </label>
            <textarea
              rows="3"
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
              placeholder="State department purpose, urgency, or project details..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href={route('requisitions.index')}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {processing ? 'Submitting Request...' : 'Submit Requisition'}
            </button>
          </div>

        </form>

      </div>
    </AuthenticatedLayout>
  );
}