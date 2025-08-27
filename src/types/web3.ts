export interface WalletData {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  encryptedPrivateKey: string;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  type: "send" | "receive" | "contract";
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
  description?: string;
}

export type UserRole = "supplier" | "vendor" | "customer" | "blockchain-expert";

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
  createdAt: string; // ✅ Added this
  updatedAt: string; // ✅ Added this

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
