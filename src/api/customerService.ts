/**
 * Vision API Customer Service
 * 
 * Handles all customer (debtor) related operations:
 * - Customer master
 * - Contacts
 * - Delivery addresses
 */

import { ENDPOINTS } from './config';
import { httpClient } from './httpClient';
import type {
  Customer,
  CustomerContact,
  CustomerAddress,
  QueryParams
} from '../types/api.types';

// ============================================
// Customer Master Service
// ============================================

export const customerService = {
  /**
   * Get all customers with optional filtering
   * 
   * @param params - Query parameters for filtering
   * @example
   * // Get all active customers
   * customerService.getAll({ DEBACTIVE: 1 })
   * 
   * // Search by name
   * customerService.getAll({ DEBNAME: 'John%' })
   */
  async getAll(params?: QueryParams): Promise<Customer[]> {
    const response = await httpClient.get<any>(ENDPOINTS.CUSTOMER.MASTER, { params });
    // Handle nested response structure: { data: { data: [...] } }
    const customers = response.data?.data || response.data || [];
    return Array.isArray(customers) ? customers : [];
  },

  /**
   * Get a single customer by code
   */
  async getByCode(customerCode: string): Promise<Customer | null> {
    const response = await httpClient.get<any>(ENDPOINTS.CUSTOMER.MASTER, {
      params: { DEBCODE: customerCode }
    });
    const customers = response.data?.data || response.data || [];
    const customerArray = Array.isArray(customers) ? customers : [];
    return customerArray.length > 0 ? customerArray[0] : null;
  },

  /**
   * Search customers by name, code, or phone
   */
  async search(searchTerm: string): Promise<Customer[]> {
    // Search by name (most common)
    const response = await httpClient.get<any>(ENDPOINTS.CUSTOMER.MASTER, {
      params: { DEBNAME: `%${searchTerm}%` }
    });
    const customers = response.data?.data || response.data || [];
    return Array.isArray(customers) ? customers : [];
  },

  /**
   * Search by phone number
   */
  async searchByPhone(phone: string): Promise<Customer[]> {
    const response = await httpClient.get<any>(ENDPOINTS.CUSTOMER.MASTER, {
      params: { DEBPHONE: `%${phone}%` }
    });
    const customers = response.data?.data || response.data || [];
    return Array.isArray(customers) ? customers : [];
  },

  /**
   * Search by email
   */
  async searchByEmail(email: string): Promise<Customer[]> {
    const response = await httpClient.get<any>(ENDPOINTS.CUSTOMER.MASTER, {
      params: { DEBEMAIL: `%${email}%` }
    });
    const customers = response.data?.data || response.data || [];
    return Array.isArray(customers) ? customers : [];
  },

  /**
   * Create a new customer
   */
  async create(customer: Omit<Customer, 'DEBCREATEDDATE' | 'DEBMODIFIEDDATE'>): Promise<Customer> {
    const response = await httpClient.post<Customer>(ENDPOINTS.CUSTOMER.MASTER, customer);
    return response.data;
  },

  /**
   * Update an existing customer
   */
  async update(customerCode: string, updates: Partial<Customer>): Promise<Customer> {
    const response = await httpClient.put<Customer>(ENDPOINTS.CUSTOMER.MASTER, {
      DEBCODE: customerCode,
      ...updates,
    });
    return response.data;
  },

  /**
   * Get customers by sales rep
   */
  async getBySalesRep(salesRepCode: string): Promise<Customer[]> {
    return this.getAll({ DEBSALESREP: salesRepCode });
  },

  /**
   * Get customers by category
   */
  async getByCategory(category: string): Promise<Customer[]> {
    return this.getAll({ DEBCATEGORY: category });
  },

  /**
   * Get customers with outstanding balance
   */
  async getWithBalance(): Promise<Customer[]> {
    const customers = await this.getAll({ DEBACTIVE: 1 });
    return customers.filter(c => (c.DEBBALANCE || 0) > 0);
  },

  /**
   * Get customers over credit limit
   */
  async getOverCreditLimit(): Promise<Customer[]> {
    const customers = await this.getAll({ DEBACTIVE: 1 });
    return customers.filter(c =>
      (c.DEBBALANCE || 0) > (c.DEBCREDITLIMIT || 0)
    );
  },

  /**
   * Check if customer has available credit
   */
  async checkCredit(customerCode: string, amount: number): Promise<{
    hasCredit: boolean;
    availableCredit: number;
    currentBalance: number;
    creditLimit: number;
  }> {
    const customer = await this.getByCode(customerCode);

    if (!customer) {
      return {
        hasCredit: false,
        availableCredit: 0,
        currentBalance: 0,
        creditLimit: 0,
      };
    }

    const creditLimit = customer.DEBCREDITLIMIT || 0;
    const currentBalance = customer.DEBBALANCE || 0;
    const availableCredit = creditLimit - currentBalance;

    return {
      hasCredit: availableCredit >= amount,
      availableCredit,
      currentBalance,
      creditLimit,
    };
  },
};

// ============================================
// Customer Contacts Service
// ============================================

export const customerContactService = {
  /**
   * Get contacts for a customer
   */
  async getContacts(customerCode: string): Promise<CustomerContact[]> {
    const response = await httpClient.get<CustomerContact[]>(ENDPOINTS.CUSTOMER.CONTACTS, {
      params: { DEBCODE: customerCode }
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get primary contact for a customer
   */
  async getPrimaryContact(customerCode: string): Promise<CustomerContact | null> {
    const contacts = await this.getContacts(customerCode);
    return contacts.find(c => c.ISPRIMARY) || contacts[0] || null;
  },

  /**
   * Add a contact
   */
  async addContact(contact: CustomerContact): Promise<CustomerContact> {
    const response = await httpClient.post<CustomerContact>(ENDPOINTS.CUSTOMER.CONTACTS, contact);
    return response.data;
  },

  /**
   * Update a contact
   */
  async updateContact(contact: Partial<CustomerContact> & { DEBCODE: string; CONTACTID: number }): Promise<CustomerContact> {
    const response = await httpClient.put<CustomerContact>(ENDPOINTS.CUSTOMER.CONTACTS, contact);
    return response.data;
  },
};

// ============================================
// Customer Addresses Service
// ============================================

export const customerAddressService = {
  /**
   * Get addresses for a customer
   */
  async getAddresses(customerCode: string): Promise<CustomerAddress[]> {
    const response = await httpClient.get<CustomerAddress[]>(ENDPOINTS.CUSTOMER.ADDRESSES, {
      params: { DEBCODE: customerCode }
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get delivery addresses only
   */
  async getDeliveryAddresses(customerCode: string): Promise<CustomerAddress[]> {
    const addresses = await this.getAddresses(customerCode);
    return addresses.filter(a => a.ADDRESSTYPE === 'DELIVERY');
  },

  /**
   * Get default delivery address
   */
  async getDefaultDeliveryAddress(customerCode: string): Promise<CustomerAddress | null> {
    const addresses = await this.getDeliveryAddresses(customerCode);
    return addresses.find(a => a.ISDEFAULT) || addresses[0] || null;
  },

  /**
   * Add an address
   */
  async addAddress(address: CustomerAddress): Promise<CustomerAddress> {
    const response = await httpClient.post<CustomerAddress>(ENDPOINTS.CUSTOMER.ADDRESSES, address);
    return response.data;
  },
};

// ============================================
// Export all as unified API
// ============================================

export const customerApi = {
  customers: customerService,
  contacts: customerContactService,
  addresses: customerAddressService,
};

export default customerApi;
