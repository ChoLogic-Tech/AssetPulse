import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Wrench, Lock, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Maintenance({
  title = 'System Under Maintenance',
  message = 'Scheduled system maintenance is currently in progress. Only Super Admin and authorized users can sign in right now.',
}) {
  const { props } = usePage();
  const appName = props?.name || 'AssetPulse';

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 text-slate-700">
      <Head title={title} />

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {appName}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Wrench className="w-3.5 h-3.5" />
              HTTP 503
            </span>
          </div>

          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-slate-800">{title}</h1>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left flex items-start gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Standard sessions are paused during maintenance. Only Super Admin and authorized accounts can sign in to perform system updates and verification.
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                href="/maintenance-login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
              >
                <Lock className="w-4 h-4" />
                Authorized Login
              </Link>

              <button
                type="button"
                onClick={handleRefresh}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Check Status
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 pt-4">
        {appName} &bull; Maintenance Gate
      </footer>
    </div>
  );
}