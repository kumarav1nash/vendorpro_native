import { User } from "./user";

export interface Commission {
  id: string;
  saleId: string;
  salesmanId: string;
  shopId: string;
  amount: string;
  isPaid: boolean;
  commissionRuleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSummary {
  totalCommission: number;
  approvedSalesCommission: number;
  pendingSalesCommission: number;
}

export interface SalesCommissionResponse {
  totalCommission: CommissionSummary;
  sales: Array<{
    id: string;
    product: {
      id: string;
      productName: string;
      basePrice: string;
      sellingPrice: string;
      stockQuantity: number;
      productImageUrl?: string;
      createdAt: string;
      updatedAt: string;
    };
    quantity: number;
    salePrice: string | number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
  }>;
  commissionRule: CommissionRule;
}

export interface CommissionRule {
  id: string;
  type: 'PERCENTAGE_OF_SALES' | 'FIXED_AMOUNT' | 'PERCENTAGE_ON_DIFFERENCE';
  value: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface SalesmanCommissionRule {
  id: string;
  ownerId: string;
  isActive: boolean;
  salesman: User;
  commissionRule: CommissionRule;
  createdAt: string;
  updatedAt: string;
}


export interface CreateCommissionDto {
  amount: number;
  salesmanId: string;
  shopId: string;
  commissionRuleId: string;
}

export interface CreateCommissionRuleDto {
  type: 'PERCENTAGE_OF_SALES' | 'FIXED_AMOUNT' | 'PERCENTAGE_ON_DIFFERENCE';
  value: number;
  description: string;
  isActive: boolean;
}

export interface AssignCommissionRuleDto {
  salesmanId: string;
  commissionRuleId: string;
} 

export interface CommissionDateRangeResult {
    totalCommission: number;
    commissions: Commission[];
}