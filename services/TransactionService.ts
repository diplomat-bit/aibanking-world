import { bankingApiClient } from './BankingApiClient';
import { TransactionDetailsResponse } from '../types';

/**
 * TransactionService handles transaction-related API calls.
 */
export const transactionService = {
  /**
   * Retrieve Transactions for Specific Account
   */
  async getTransactionDetails(accountId: string, fromDate?: string, toDate?: string): Promise<TransactionDetailsResponse> {
    let url = `/v1/accounts/${accountId}/transactions`;
    const params = new URLSearchParams();
    if (fromDate) params.append('transactionFromDate', fromDate);
    if (toDate) params.append('transactionToDate', toDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return bankingApiClient.request<TransactionDetailsResponse>(url);
  }
};
