import { StockItem as ApiStockItem, Customer as ApiCustomer } from '../types/api.types';
import { Product, Customer } from '../types/domain.types';

export const transformApiProduct = (item: any): Product => ({
    ...item, // Include all raw fields
    id: item.stockcode || item.STKCODE,
    description: item.description1 || item.STKDESC || '',
    price: item.sugsell || item.STKPRICE1 || 0,
    stock: item.qtyonhand || item.STKQTYONHAND || 0,
    barcode: item.barcode || item.STKBARCODE,
    categoryId: item.category1 || item.STKCATEGORY1,
    image: item.imageurl || item.STKIMAGE || 'https://via.placeholder.com/300x300.png?text=' + encodeURIComponent(item.stockcode || item.STKCODE || 'Product'),
    images: item.imageurl ? [item.imageurl] : (item.STKIMAGE ? [item.STKIMAGE] : undefined),
    linkCode: item.linkcode || item.STKLINKCODE || item.LINKCODE || item.STKLINK,
    vatCode: item.vatcode || item.STKVATCODE || item.VATCODE,
});

export const transformApiCustomer = (cust: any): Customer => ({
    ...cust, // Include all raw fields
    id: cust.account || cust.DEBCODE,
    name: cust.name || cust.DEBNAME || '',
    creditLimit: cust.creditlimit || cust.DEBCREDITLIMIT || 0,
    address: [
        cust.busaddress1 || cust.DEBADDR1,
        cust.busaddress2 || cust.DEBADDR2,
        cust.busaddress3 || cust.DEBADDR3,
        cust.busaddress4 || cust.DEBADDR4
    ].filter(Boolean).join('\n'),
    address1: cust.busaddress1 || cust.DEBADDR1,
    address2: cust.busaddress2 || cust.DEBADDR2,
    city: cust.busaddress4 || cust.DEBADDR4,
    state: cust.buspostcode || cust.DEBPOSTCODE,
    email: cust.email || cust.DEBEMAIL || '',
    phone: cust.telephone || cust.telephone1 || cust.DEBPHONE || '',
    phone2: cust.telephone2 || cust.DEBPHONE2 || '',
    cellphone: cust.cellphone || cust.DEBCELLPHONE || '',
    whatsapp: cust.cellphone || cust.DEBCELLPHONE || (cust.DEBPHONE ? `27${cust.DEBPHONE.replace(/\D/g, '').slice(-9)}` : ''),
    contactPerson: cust.contact || cust.DEBCONTACT,
    vatNumber: cust.vatnumber || cust.DEBVATNO,
    balance: cust.balance || cust.DEBBALANCE || 0,
    priceLevel: parseInt(cust.pricecat || '1'),
    priceCategory: cust.pricecat || '01',
    branch: cust.branch || cust.DEBBRANCH || '01',
    vatIndicator: cust.vatindicator || cust.DEBVATINDICATOR || 'I',
});
