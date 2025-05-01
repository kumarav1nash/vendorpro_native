//calculate the commission amount based on the commission rule

import { CommissionRule } from "../types/commission";
import { Sale } from "../types/sales";

enum CommissionType {
    PERCENTAGE_OF_SALES = 'PERCENTAGE_OF_SALES',
    FIXED_AMOUNT = 'FIXED_AMOUNT',
    PERCENTAGE_ON_DIFFERENCE = 'PERCENTAGE_ON_DIFFERENCE'
}

export async function calculateCommission(sale: Sale, commissionRule: CommissionRule): Promise<number> {

    switch (commissionRule.type) {
        case CommissionType.PERCENTAGE_OF_SALES:
            return (sale.totalAmount * commissionRule.value) / 100;
        case CommissionType.FIXED_AMOUNT:
            return commissionRule.value;
        case CommissionType.PERCENTAGE_ON_DIFFERENCE: {
            let salePriceSum = 0;
            sale.items.forEach(item => {
                const salePriceIndividualItem = item.product.sellingPrice*item.quantity;
                salePriceSum+=salePriceIndividualItem; 
            });
            const difference = sale.totalAmount-salePriceSum;
            return difference * commissionRule.value / 100;
        }
        default:
            throw new Error('Invalid commission type');
    }
}