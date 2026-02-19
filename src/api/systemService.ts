/**
 * Vision API System Service
 * 
 * Handles all system configuration data:
 * - Branches
 * - Warehouses
 * - Tender types (payment methods)
 * - Departments
 * - Sales reps
 * - System parameters
 * - Users
 */

import { ENDPOINTS } from './config';
import { httpClient } from './httpClient';
import type {
  Branch,
  Warehouse,
  TenderType,
  Department,
  SalesRep,
  SystemParameter,
  SystemVersion,
  BinLocation,
  QueryParams
} from '../types/api.types';

// ============================================
// Branch Service
// ============================================

export const branchService = {
  /**
   * Get all branches
   */
  async getAll(): Promise<Branch[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.BRANCHES);
    const branches = response.data?.data || response.data || [];
    return Array.isArray(branches) ? branches : [];
  },

  /**
   * Get active branches only
   */
  async getActive(): Promise<Branch[]> {
    const branches = await this.getAll();
    return branches.filter(b => b.ACTIVE !== false);
  },

  /**
   * Get branch by code
   */
  async getByCode(branchCode: string): Promise<Branch | null> {
    const branches = await this.getAll();
    return branches.find(b => b.BRANCHCODE === branchCode) || null;
  },
};

// ============================================
// Warehouse Service
// ============================================

export const warehouseService = {
  /**
   * Get all warehouses
   */
  async getAll(): Promise<Warehouse[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.WAREHOUSES);
    const warehouses = response.data?.data || response.data || [];
    return Array.isArray(warehouses) ? warehouses : [];
  },

  /**
   * Get warehouses by branch
   */
  async getByBranch(branchCode: string): Promise<Warehouse[]> {
    const warehouses = await this.getAll();
    return warehouses.filter(w => w.BRANCHCODE === branchCode);
  },

  /**
   * Get warehouse by code
   */
  async getByCode(warehouseCode: string): Promise<Warehouse | null> {
    const warehouses = await this.getAll();
    return warehouses.find(w => w.WHCODE === warehouseCode) || null;
  },

  /**
   * Get bin locations for a warehouse
   */
  async getBinLocations(warehouseCode: string): Promise<BinLocation[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.BIN_LOCATIONS, {
      params: { WHCODE: warehouseCode }
    });
    const locations = response.data?.data || response.data || [];
    return Array.isArray(locations) ? locations : [];
  },
};

// ============================================
// Tender Type Service
// ============================================

export const tenderService = {
  /**
   * Get all tender types (payment methods)
   */
  async getAll(): Promise<TenderType[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.TENDERS);
    const tenders = response.data?.data || response.data || [];
    return Array.isArray(tenders) ? tenders : [];
  },

  /**
   * Get active tender types only
   */
  async getActive(): Promise<TenderType[]> {
    const tenders = await this.getAll();
    return tenders.filter(t => t.ACTIVE !== false);
  },

  /**
   * Get tender by code
   */
  async getByCode(tenderCode: string): Promise<TenderType | null> {
    const tenders = await this.getAll();
    return tenders.find(t => t.TENDERCODE === tenderCode) || null;
  },

  /**
   * Get tenders by type
   */
  async getByType(type: string): Promise<TenderType[]> {
    const tenders = await this.getActive();
    return tenders.filter(t => t.TENDERTYPE === type);
  },
};

// ============================================
// Department Service
// ============================================

export const departmentService = {
  /**
   * Get all departments
   */
  async getAll(): Promise<Department[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.DEPARTMENTS);
    const departments = response.data?.data || response.data || [];
    return Array.isArray(departments) ? departments : [];
  },

  /**
   * Get active departments
   */
  async getActive(): Promise<Department[]> {
    const departments = await this.getAll();
    return departments.filter(d => d.ACTIVE !== false);
  },

  /**
   * Get department by code
   */
  async getByCode(deptCode: string): Promise<Department | null> {
    const departments = await this.getAll();
    return departments.find(d => d.DEPTCODE === deptCode) || null;
  },
};

// ============================================
// Sales Rep Service
// ============================================

export const salesRepService = {
  /**
   * Get all sales reps
   */
  async getAll(): Promise<SalesRep[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.SALES_REPS);
    const reps = response.data?.data || response.data || [];
    return Array.isArray(reps) ? reps : [];
  },

  /**
   * Get active sales reps
   */
  async getActive(): Promise<SalesRep[]> {
    const reps = await this.getAll();
    return reps.filter(r => r.ACTIVE !== false);
  },

  /**
   * Get sales rep by code
   */
  async getByCode(repCode: string): Promise<SalesRep | null> {
    const reps = await this.getAll();
    return reps.find(r => r.REPCODE === repCode) || null;
  },
};

// ============================================
// System Parameter Service
// ============================================

export const parameterService = {
  /**
   * Get all system parameters
   */
  async getAll(): Promise<SystemParameter[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.PARAMETERS);
    const params = response.data?.data || response.data || [];
    return Array.isArray(params) ? params : [];
  },

  /**
   * Get parameter by code
   */
  async getByCode(paramCode: string): Promise<string | null> {
    const params = await this.getAll();
    const param = params.find(p => p.PARAMCODE === paramCode);
    return param?.PARAMVALUE || null;
  },

  /**
   * Get multiple parameters as object
   */
  async getMany(paramCodes: string[]): Promise<Record<string, string>> {
    const params = await this.getAll();
    const result: Record<string, string> = {};

    paramCodes.forEach(code => {
      const param = params.find(p => p.PARAMCODE === code);
      if (param) {
        result[code] = param.PARAMVALUE;
      }
    });

    return result;
  },

  /**
   * Common parameter helpers
   */
  async getVATRate(): Promise<number> {
    const value = await this.getByCode('VATRATE');
    return value ? parseFloat(value) : 15; // Default 15%
  },

  async getCompanyName(): Promise<string> {
    return (await this.getByCode('COMPANYNAME')) || '';
  },

  async getDefaultWarehouse(): Promise<string> {
    return (await this.getByCode('DEFAULTWH')) || '';
  },

  async getCashCustomerCode(): Promise<string> {
    return (await this.getByCode('CASHCUSTOMER')) || 'CASH';
  },
};

// ============================================
// User Service
// ============================================

export const userService = {
  /**
   * Get all users
   */
  async getAll(): Promise<any[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.USERS);
    const users = response.data?.data || response.data || [];
    return Array.isArray(users) ? users : [];
  },

  /**
   * Get user forms/permissions
   */
  async getUserForms(userId: string): Promise<any[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.USER_FORMS, {
      params: { USERID: userId }
    });
    const forms = response.data?.data || response.data || [];
    return Array.isArray(forms) ? forms : [];
  },

  /**
   * Get user access rights
   */
  async getUserAccess(userId: string): Promise<any[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.USER_ACCESS, {
      params: { USERID: userId }
    });
    const access = response.data?.data || response.data || [];
    return Array.isArray(access) ? access : [];
  },

  /**
   * Get group access rights
   */
  async getGroupAccess(groupId: string): Promise<any[]> {
    const response = await httpClient.get<any>(ENDPOINTS.SYSTEM.GROUP_ACCESS, {
      params: { GROUPID: groupId }
    });
    const access = response.data?.data || response.data || [];
    return Array.isArray(access) ? access : [];
  },

  /**
   * Get user by code/username
   */
  async getByCode(userCode: string): Promise<any | null> {
    const users = await this.getAll();
    // Assuming the user object has a property that matches userCode, likely 'UserName' or similar based on usage
    // The original code used api.users.getByCode(userCode) and expected 'UserName' on the result.
    // Since we don't know the exact API schema for users (typed as any), we'll check common fields.
    // Based on usage: user.UserName || userCode

    // We'll try to find a match by UserName (case-insensitive) as a best guess for "Code"
    return users.find(u =>
      (u.UserName && u.UserName.toLowerCase() === userCode.toLowerCase()) ||
      (u.USERCODE && u.USERCODE.toLowerCase() === userCode.toLowerCase())
    ) || null;
  },
};


// ============================================
// Version Service
// ============================================

export const versionService = {
  /**
   * Get system version
   */
  async getVersion(): Promise<SystemVersion> {
    const response = await httpClient.get<SystemVersion>(ENDPOINTS.HEALTH.VERSION, {
      skipAuth: true
    });
    return response.data;
  },
};

// ============================================
// Cached System Data Helper
// ============================================

interface SystemCache {
  branches: Branch[] | null;
  warehouses: Warehouse[] | null;
  tenders: TenderType[] | null;
  departments: Department[] | null;
  salesReps: SalesRep[] | null;
  parameters: SystemParameter[] | null;
  lastLoaded: number | null;
}

const cache: SystemCache = {
  branches: null,
  warehouses: null,
  tenders: null,
  departments: null,
  salesReps: null,
  parameters: null,
  lastLoaded: null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const systemCache = {
  /**
   * Load all system data into cache
   */
  async loadAll(): Promise<void> {
    const [branches, warehouses, tenders, departments, salesReps, parameters] = await Promise.all([
      branchService.getAll(),
      warehouseService.getAll(),
      tenderService.getAll(),
      departmentService.getAll(),
      salesRepService.getAll(),
      parameterService.getAll(),
    ]);

    cache.branches = branches;
    cache.warehouses = warehouses;
    cache.tenders = tenders;
    cache.departments = departments;
    cache.salesReps = salesReps;
    cache.parameters = parameters;
    cache.lastLoaded = Date.now();
  },

  /**
   * Check if cache is valid
   */
  isValid(): boolean {
    if (!cache.lastLoaded) return false;
    return Date.now() - cache.lastLoaded < CACHE_DURATION;
  },

  /**
   * Get cached data or load if needed
   */
  async get(): Promise<SystemCache> {
    if (!this.isValid()) {
      await this.loadAll();
    }
    return cache;
  },

  /**
   * Clear cache
   */
  clear(): void {
    cache.branches = null;
    cache.warehouses = null;
    cache.tenders = null;
    cache.departments = null;
    cache.salesReps = null;
    cache.parameters = null;
    cache.lastLoaded = null;
  },
};

// ============================================
// Export all as unified API
// ============================================

export const systemApi = {
  branches: branchService,
  warehouses: warehouseService,
  tenders: tenderService,
  departments: departmentService,
  salesReps: salesRepService,
  parameters: parameterService,
  users: userService,
  version: versionService,
  cache: systemCache,
};

export default systemApi;
