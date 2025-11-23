/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";

// ========================
// INTERFACES
// ========================
export interface WalletBalance {
  balance: number;
  currency: string;
  dailyWithdrawalLimit: number;
  dailyWithdrawn: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalSpent: number;
  totalReceived: number;
}

export interface BackendTransaction {
  _id: string;
  type: "deposit" | "withdrawal" | "payment" | "transfer_in" | "transfer_out" | "sale" | "refund";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: "pending" | "completed" | "failed";
  relatedUserId?: string;
  relatedOrderId?: string;
  timestamp: string;
  metadata?: {
    txHash?: string;
    category?: string;
    recipientName?: string;
    senderName?: string;
    recipientEmail?: string;
    senderEmail?: string;
    recipientWallet?: string;
    senderWallet?: string;
    buyerName?: string;
    buyerWalletAddress?: string;
    sellerName?: string;
    sellerWalletAddress?: string;
    orderReference?: string;
    blockchainTxId?: string;
    [key: string]: any;
  };
}

export interface AddFundsData {
  amount: number;
  paymentMethod: string;
  metadata?: {
    cardLast4?: string;
    cardType?: string;
    bankAccount?: string;
    currency?: string;
    originalAmount?: number;
  };
}

export interface TransferData {
  toUserId: string;
  amount: number;
  description?: string;
}

export interface WithdrawData {
  amount: number;
  withdrawalMethod: string;
  accountDetails: {
    accountNumber?: string;
    bankName?: string;
    accountHolderName?: string;
    routingNumber?: string;
  };
}

export interface WalletApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ========================
// API CALLS
// ========================

// Get wallet balance
export const getWalletBalance = async (): Promise<
  WalletApiResponse<WalletBalance>
> => {
  return await apiClient.get("/wallet/balance");
};

// Get transaction history
// Note: Backend returns transactions array directly in 'data', not nested in 'data.transactions'
export const getTransactionHistory = async (
  page: number = 1,
  limit: number = 20
): Promise<{
  success: boolean;
  data: BackendTransaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    currentBalance: number;
    currency: string;
    totalTransactions: number;
    statistics: {
      totalDeposited: number;
      totalWithdrawn: number;
      totalSpent: number;
      totalReceived: number;
    };
  };
}> => {
  return await apiClient.get(
    `/wallet/transactions?page=${page}&limit=${limit}`
  );
};

// Add funds to wallet
export const addFunds = async (
  data: AddFundsData
): Promise<WalletApiResponse<any>> => {
  return await apiClient.post("/wallet/add-funds", data);
};

// Transfer credits to another user
export const transferCredits = async (
  data: TransferData
): Promise<WalletApiResponse<any>> => {
  return await apiClient.post("/wallet/transfer", data);
};

// Withdraw funds
export const withdrawFunds = async (
  data: WithdrawData
): Promise<WalletApiResponse<any>> => {
  return await apiClient.post("/wallet/withdraw", data);
};

// Get wallet info (alternative to balance)
export const getWalletInfo = async (): Promise<WalletApiResponse<any>> => {
  return await apiClient.get("/wallet/info");
};

// Search users for transfer (if your backend supports it)
export const searchUsers = async (
  query: string
): Promise<WalletApiResponse<any>> => {
  return await apiClient.get(`/wallet/search-users?q=${query}`);
};

// Create Stripe payment intent
export const createPaymentIntent = async (
  amount: number
): Promise<WalletApiResponse<{
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}>> => {
  return await apiClient.post("/wallet/create-payment-intent", { amount });
};

// Confirm Stripe payment
export const confirmPayment = async (
  paymentIntentId: string,
  amount: number
): Promise<WalletApiResponse<any>> => {
  return await apiClient.post("/wallet/confirm-payment", {
    paymentIntentId,
    amount,
  });
};
