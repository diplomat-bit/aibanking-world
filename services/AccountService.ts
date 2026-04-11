import { bankingApiClient } from './BankingApiClient';
import { AccountsGroupList, AccountDetailsResponse } from '../types';

/**
 * AccountService handles account-related API calls.
 */
export const accountService = {
  /**
   * Retrieve Summary of All Accounts
   */
  async getAccountSummary(): Promise<AccountsGroupList> {
    return bankingApiClient.request<AccountsGroupList>('/v1/accounts/');
  },

  /**
   * Retrieve Account Details
   */
  async getAccountDetails(accountId: string): Promise<AccountDetailsResponse> {
    return bankingApiClient.request<AccountDetailsResponse>(`/v1/accounts/${accountId}`);
  }
};
