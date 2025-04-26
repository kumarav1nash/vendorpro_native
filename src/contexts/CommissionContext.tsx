import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import {
  Commission,
  CommissionRule,
  CreateCommissionDto,
  CreateCommissionRuleDto,
  AssignCommissionRuleDto,
  CommissionDateRangeResult
} from '../types/commission';
import {
  createCommission,
  getAllCommissions,
  getCommissionById,
  createCommissionRule,
  getAllCommissionRules,
  assignCommissionRule,
  getCommissionsBySalesman,
  getCommissionsByShop,
  markCommissionAsPaid,
  getCommissionsByDateRange
} from '../services/commission.service';

interface CommissionContextType {
  commission: Commission | null;
  commissions: Commission[];
  rules: CommissionRule[];
  dateRangeResult: CommissionDateRangeResult | null;
  loading: boolean;
  error: string | null;
  fetchAllCommissions: () => Promise<void>;
  fetchCommissionById: (id: string) => Promise<void>;
  createCommission: (data: CreateCommissionDto) => Promise<void>;
  createCommissionRule: (data: CreateCommissionRuleDto) => Promise<void>;
  fetchAllCommissionRules: () => Promise<void>;
  assignCommissionRule: (data: AssignCommissionRuleDto) => Promise<void>;
  fetchCommissionsBySalesman: (salesmanId: string) => Promise<void>;
  fetchCommissionsByShop: (shopId: string) => Promise<void>;
  markCommissionAsPaid: (commissionId: string) => Promise<void>;
  fetchCommissionsByDateRange: (params: { startDate: string; endDate: string; salesmanId?: string; shopId?: string }) => Promise<void>;
}

const CommissionContext = createContext<CommissionContextType | undefined>(undefined);

export const useCommission = () => {
  const context = useContext(CommissionContext);
  if (!context) {
    throw new Error('useCommission must be used within a CommissionProvider');
  }
  return context;
};

export const CommissionProvider = ({ children }: { children: ReactNode }) => {
  const [commission, setCommission] = useState<Commission | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [dateRangeResult, setDateRangeResult] = useState<CommissionDateRangeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCommissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCommissions();
      setCommissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCommissionById(id);
      setCommission(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commission by id');
    } finally {
      setLoading(false);
    }
  };

  const createCommissionContext = async (data: CreateCommissionDto) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createCommission(data);
      setCommission(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create commission');
    } finally {
      setLoading(false);
    }
  };

  const createCommissionRuleContext = async (data: CreateCommissionRuleDto) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createCommissionRule(data);
      setRules((prev) => [...prev, created]);
    } catch (err: any) {
      setError(err.message || 'Failed to create commission rule');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCommissionRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCommissionRules();
      setRules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commission rules');
    } finally {
      setLoading(false);
    }
  };

  const assignCommissionRuleContext = async (data: AssignCommissionRuleDto) => {
    setLoading(true);
    setError(null);
    try {
      await assignCommissionRule(data);
    } catch (err: any) {
      setError(err.message || 'Failed to assign commission rule');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionsBySalesman = async (salesmanId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCommissionsBySalesman(salesmanId);
      setCommissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commissions by salesman');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionsByShop = async (shopId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCommissionsByShop(shopId);
      setCommissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commissions by shop');
    } finally {
      setLoading(false);
    }
  };

  const markCommissionAsPaidContext = async (commissionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await markCommissionAsPaid(commissionId);
      setCommission(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to mark commission as paid');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionsByDateRange = async (params: { startDate: string; endDate: string; salesmanId?: string; shopId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCommissionsByDateRange(params);
      setDateRangeResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commissions by date range');
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    commission,
    commissions,
    rules,
    dateRangeResult,
    loading,
    error,
    fetchAllCommissions,
    fetchCommissionById,
    createCommission: createCommissionContext,
    createCommissionRule: createCommissionRuleContext,
    fetchAllCommissionRules,
    assignCommissionRule: assignCommissionRuleContext,
    fetchCommissionsBySalesman,
    fetchCommissionsByShop,
    markCommissionAsPaid: markCommissionAsPaidContext,
    fetchCommissionsByDateRange,
  }), [commission, commissions, rules, dateRangeResult, loading, error]);

  return (
    <CommissionContext.Provider value={value}>
      {children}
    </CommissionContext.Provider>
  );
}; 