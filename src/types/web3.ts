export interface WalletData {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  encryptedPrivateKey: string;
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "payment" | "received";
  amount: number;
  description: string;
  timestamp: string;
  status: "pending" | "completed" | "failed";
  from: string;
  to: string;
  txHash?: string;
  category?: string;
  counterparty?: string;
}

export type UserRole = "supplier" | "vendor" | "customer" | "expert";

export interface User {
  id: string;
  walletAddress: string;
  walletName: string;
  role?: UserRole;
  name?: string;
  email?: string;
  phone?: string;
  loginAt?: string;
  isAuthenticated: boolean;
  createdAt: string;
  updatedAt: string;

  // Business information (optional, for suppliers/vendors)
  companyName?: string;
  businessAddress?: string;
  businessType?: string;
  registrationNumber?: string;

  // Hyperledger Fabric specific
  networkType?: string;
  organizationMSP?: string;
}

// Wallet Context Type
export interface WalletContextType {
  currentWallet: WalletData | null;
  isConnected: boolean;
  balance: string;
  connectWallet: (walletId: string, password: string) => Promise<boolean>;
  disconnectWallet: () => void;
  createWallet: (name: string, password: string) => Promise<WalletData>;
  getAllWallets: () => WalletData[];
  generateRecoveryPhrase: () => string;
  recoverWallet: (
    recoveryPhrase: string,
    newPassword: string
  ) => Promise<WalletData>;
}

// Auth Context Type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletAddress: string, password: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
  updateProfile: (profileData: Partial<User>) => void;
}
