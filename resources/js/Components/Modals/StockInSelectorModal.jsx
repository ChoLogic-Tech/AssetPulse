import React, { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Warehouse, Building2, X, ArrowRight } from 'lucide-react';

export default function StockInSelectorModal({
    isOpen,
    onClose,
    warehouseHref = '/warehouse/stock-in',
    propertyHref = '/property/stock-in',
}) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSelect = (href) => {
        onClose();
        router.visit(href);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-in-modal-title"
        >
            <div
                className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2
                            id="stock-in-modal-title"
                            className="text-base font-semibold text-slate-900"
                        >
                            Select Stock In Destination
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Choose where incoming stock or deliveries are being recorded.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Close modal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-5 space-y-3">
                    <button
                        type="button"
                        onClick={() => handleSelect(warehouseHref)}
                        className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                                <Warehouse className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-900">
                                    Warehouse Stock In
                                </div>
                                <div className="text-xs text-slate-500">
                                    Receive stock into central warehouse inventory
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSelect(propertyHref)}
                        className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-900">
                                    Property Stock In
                                </div>
                                <div className="text-xs text-slate-500">
                                    Record direct stock-in for a specific property
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
                    </button>
                </div>

                <div className="mt-5 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}