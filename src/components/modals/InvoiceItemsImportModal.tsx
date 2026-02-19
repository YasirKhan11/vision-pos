import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api';
import DataGrid, { Column, Selection, Scrolling } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';

interface InvoiceItemsImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (items: any[], allItems: any[]) => void;
    invoiceNo: string;
}

export const InvoiceItemsImportModal = ({ isOpen, onClose, onImport, invoiceNo }: InvoiceItemsImportModalProps) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && invoiceNo) {
            fetchInvoiceItems();
        }
    }, [isOpen, invoiceNo]);

    const fetchInvoiceItems = async () => {
        setLoading(true);
        try {
            const result = await api.sales.invoices.getOrderDetails(invoiceNo);

            // Double-safety: check if service returned raw object or already extracted array
            const dataArray = Array.isArray(result) ? result : (result as any)?.orderdetails || (result as any)?.detailselectlist || (result as any)?.data || [];

            // Normalize API fields to lowercase
            const normalizedData = dataArray.map((item: any, index: number) => {
                // Use lineno from API, or ORDLINE, or index + 1 as ultimate fallback
                const lineno = item.lineno || item.ORDLINENO || item.ORDLINE || (index + 1);

                return {
                    lineno: lineno,
                    stockcode: item.stockcode || item.ORDSTKCODE || item.stock_code || '',
                    description: item.description || item.description1 || item.ORDDESC || '',
                    quantity: Math.abs(item.quantity || item.ORDQTY || item.qty || 0),
                    price: Math.abs(item.price || item.ORDPRICE || item.unit_price || 0),
                    priceincl: Math.abs(item.priceincl || (item as any).PRICEINCL || 0),
                    priceexcl: Math.abs(item.priceexcl || (item as any).PRICEEXCL || 0),
                    discperc: item.discperc || item.ORDDISCPERC || item.discount || 0,
                    linetotal: Math.abs(item.linetotal || item.ORDLINETOTAL || item.total || 0)
                };
            });
            setItems(normalizedData);
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('Failed to fetch invoice items:', error);
            notify({
                message: 'Failed to load invoice items. Please try again.',
                type: 'error',
                displayTime: 3000,
                position: { at: 'top center', my: 'top center', offset: '0 50' }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImportSelected = () => {
        if (selectedRowKeys.length === 0) {
            notify({
                message: 'Please select at least one item to import.',
                type: 'warning',
                displayTime: 2000,
                position: { at: 'top center', my: 'top center', offset: '0 50' }
            });
            return;
        }

        const selectedItems = items.filter(item =>
            selectedRowKeys.includes(item.lineno)
        );
        onImport(selectedItems, items);
        onClose();
    };

    const handleImportAll = () => {
        if (items.length === 0) {
            notify({
                message: 'No items available to import.',
                type: 'warning',
                displayTime: 2000,
                position: { at: 'top center', my: 'top center', offset: '0 50' }
            });
            return;
        }

        onImport(items, items);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Import Items from Invoice: ${invoiceNo}`} size="large">
            <div className="flex flex-col h-full space-y-4">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-blue-900">Import Items</p>
                            <p className="text-xs text-blue-700 mt-1">
                                Select specific items to import or click "Import All" to add all items to your cart.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Grid */}
                <div className="flex-1 min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                <p className="mt-4 text-sm text-slate-600 font-medium">Loading invoice items...</p>
                            </div>
                        </div>
                    ) : (
                        <DataGrid
                            dataSource={items}
                            keyExpr="lineno"
                            showBorders={true}
                            showRowLines={true}
                            showColumnLines={true}
                            rowAlternationEnabled={true}
                            hoverStateEnabled={true}
                            selectedRowKeys={selectedRowKeys}
                            onSelectionChanged={(e) => setSelectedRowKeys(e.selectedRowKeys)}
                            height="100%"
                        >
                            <Selection mode="multiple" showCheckBoxesMode="always" />
                            <Scrolling mode="virtual" />

                            <Column
                                dataField="lineno"
                                caption="#"
                                width={60}
                                alignment="center"
                                allowEditing={false}
                            />
                            <Column
                                dataField="stockcode"
                                caption="Stock Code"
                                width={140}
                                allowEditing={false}
                            />
                            <Column
                                dataField="description"
                                caption="Description"
                                minWidth={200}
                                allowEditing={false}
                            />
                            <Column
                                dataField="quantity"
                                caption="Qty"
                                width={80}
                                alignment="center"
                                dataType="number"
                                allowEditing={false}
                            />
                            <Column
                                dataField="price"
                                caption="Net Price"
                                width={100}
                                dataType="number"
                                format={{ type: 'fixedPoint', precision: 2 }}
                                allowEditing={false}
                            />
                            <Column
                                dataField="priceexcl"
                                caption="Price (Excl)"
                                width={110}
                                dataType="number"
                                format={{ type: 'fixedPoint', precision: 2 }}
                                allowEditing={false}
                            />
                            <Column
                                dataField="priceincl"
                                caption="Price (Incl)"
                                width={110}
                                dataType="number"
                                format={{ type: 'fixedPoint', precision: 2 }}
                                allowEditing={false}
                            />
                            <Column
                                dataField="linetotal"
                                caption="Total"
                                width={110}
                                dataType="number"
                                format={{ type: 'fixedPoint', precision: 2 }}
                                allowEditing={false}
                            />
                        </DataGrid>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="text-sm text-slate-600">
                        <span className="font-bold">{items.length}</span> item{items.length !== 1 ? 's' : ''} available
                        {selectedRowKeys.length > 0 && (
                            <span className="ml-2">
                                • <span className="font-bold text-primary">{selectedRowKeys.length}</span> selected
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImportAll}
                            disabled={loading || items.length === 0}
                            className={`px-6 py-2.5 font-bold rounded-xl transition-all ${loading || items.length === 0
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                                }`}
                        >
                            Import All ({items.length})
                        </button>
                        <button
                            onClick={handleImportSelected}
                            disabled={loading || selectedRowKeys.length === 0}
                            className={`px-8 py-2.5 font-bold rounded-xl transition-all ${loading || selectedRowKeys.length === 0
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                                }`}
                        >
                            Import Selected ({selectedRowKeys.length})
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
