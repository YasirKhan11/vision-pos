import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import DataGrid, { Column, Selection, Scrolling, Paging } from 'devextreme-react/data-grid';
import { api } from '../../api';
import { SearchInputModal } from './SearchInputModal';

interface InvoiceLookupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectInvoice: (invoice: any) => void;
    account: string;
    txtp?: string;
}

export const InvoiceLookupModal = ({ isOpen, onClose, onSelectInvoice, account, txtp }: InvoiceLookupModalProps) => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [focusedRowIndex, setFocusedRowIndex] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dataGridRef = useRef<any>(null);

    useEffect(() => {
        if (isOpen && account) {
            const fetchInvoices = async () => {
                setLoading(true);
                try {
                    const data = await api.invoices.listFilteredInvoices(account, txtp, currentPage, searchTerm);
                    setInvoices(Array.isArray(data) ? data : []);
                    setFocusedRowIndex(0);
                } catch (error) {
                    console.error('Failed to fetch invoices:', error);
                    setInvoices([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchInvoices();
        }
    }, [isOpen, account, currentPage, searchTerm]);

    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
            setSearchTerm('');
        }
    }, [isOpen]);

    // Imperative scrolling to follow keyboard focus
    useEffect(() => {
        if (dataGridRef.current && invoices.length > 0) {
            const instance = dataGridRef.current.instance;
            setTimeout(() => {
                if (instance && typeof instance.navigateToRow === 'function') {
                    instance.navigateToRow(focusedRowIndex);
                }
                const scrollable = instance.getScrollable();
                if (scrollable && typeof scrollable.scrollToElement === 'function') {
                    const rowElement = instance.getRowElement(focusedRowIndex);
                    if (rowElement) scrollable.scrollToElement(rowElement);
                }
            }, 10);
        }
    }, [focusedRowIndex, invoices]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen || invoices.length === 0 || searchModalOpen) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedRowIndex(prev => Math.min(prev + 1, invoices.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedRowIndex(prev => Math.max(prev - 1, 0));
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const selected = invoices[focusedRowIndex];
                if (selected) onSelectInvoice(selected);
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                setSearchModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen, invoices, focusedRowIndex, onSelectInvoice, searchModalOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Invoice Lookup: ${account}`}
            size="large"
            bodyClassName="p-0 bg-white"
            disableEscapeKey={searchModalOpen}
        >
            <div className="flex flex-col p-1 space-y-1 h-full">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 pt-0">
                    <div className="flex items-center gap-2">
                        Account: <span className="text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">{account}</span>
                        {searchTerm && (
                            <>
                                <span className="text-slate-300">|</span>
                                <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                                    Filter: {searchTerm}
                                    <button onClick={() => setSearchTerm('')} className="hover:text-orange-800">×</button>
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSearchModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 rounded text-slate-600 hover:text-primary hover:border-primary/30 transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <span className="font-bold text-xs">Search (Ctrl+S)</span>
                        </button>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <span className="text-primary">
                            {invoices.length > 0
                                ? `${(currentPage - 1) * 100 + 1} - ${(currentPage - 1) * 100 + invoices.length}`
                                : '0'}
                        </span> Records
                    </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative bg-white">
                    <DataGrid
                        ref={dataGridRef}
                        dataSource={invoices}
                        keyExpr="docno"
                        showBorders={false}
                        columnAutoWidth={false}
                        width="100%"
                        height={415}
                        focusedRowEnabled={true}
                        autoNavigateToFocusedRow={true}
                        focusedRowIndex={focusedRowIndex}
                        onFocusedRowChanged={(e: any) => setFocusedRowIndex(e.rowIndex)}
                        onRowClick={(e: any) => onSelectInvoice(e.data)}
                        onRowDblClick={(e: any) => onSelectInvoice(e.data)}
                        className="invoice-lookup-grid"
                        hoverStateEnabled={true}
                    >
                        <Selection mode="single" />
                        <Scrolling mode="standard" showScrollbar="always" />
                        <Paging enabled={false} />

                        <Column dataField="docno" caption="Invoice #" width={140} cellRender={(d) => <span className="font-bold text-primary">{d.value}</span>} />
                        <Column dataField="trandate" caption="Date" dataType="date" width={110} />
                        <Column dataField="txtp" caption="TXTP" width={80} alignment="center" />
                        <Column dataField="account" caption="Account" width={100} />
                        <Column dataField="name" caption="Name" />
                    </DataGrid>

                    {loading && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10 p-4">
                            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 min-w-[160px]">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Loading Invoices...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0 mt-3">
                    <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <span>↑↓ Navigate</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>Enter Select</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${currentPage === 1
                                ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary shadow-sm'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>

                        <span className="text-xs font-bold text-slate-600 w-16 text-center">
                            Page {currentPage}
                        </span>

                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={invoices.length < 100 || loading}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${invoices.length < 100
                                ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary shadow-sm'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg transition-all active:scale-[0.98] uppercase tracking-wider border border-slate-200 outline-none"
                    >
                        Close
                    </button>
                </div>
            </div>

            <SearchInputModal
                isOpen={searchModalOpen}
                onClose={() => setSearchModalOpen(false)}
                onSearch={(term) => {
                    setSearchTerm(term);
                    setCurrentPage(1);
                    setSearchModalOpen(false);
                }}
                searchLabel="Invoice Number"
                searchKey="Ctrl+S"
            />
        </Modal>
    );
};
