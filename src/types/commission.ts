export interface Commission {
  id: string;
  amount: number;
  isPaid: boolean;
  salesmanId: string;
  shopId: string;
  commissionRuleId: string;
  createdAt: string;
  updatedAt: string;
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