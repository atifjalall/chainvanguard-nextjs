import { UserRole, User } from "@/types/web3";

// Role Storage Keys (Multiple backups)
export const ROLE_STORAGE_KEYS = {
  PRIMARY: "chainvanguard_user", // Main user data
  ROLE_BACKUP: "chainvanguard_user_role", // Role-only backup
  WALLET_PROFILE: (address: string) => `profile_${address}`, // Legacy profile
  ROLE_HISTORY: "chainvanguard_role_history", // Historical roles
} as const;

// Role Preservation Utilities
export class RolePreservation {
  // Save role to multiple locations
  static saveRole(
    walletAddress: string,
    role: UserRole,
    userData?: Partial<User>
  ) {
    try {
      // Primary storage - complete user data
      if (userData) {
        const completeData = { ...userData, role, walletAddress };
        localStorage.setItem(
          ROLE_STORAGE_KEYS.PRIMARY,
          JSON.stringify(completeData)
        );
      }

      // Backup 1 - Role only with wallet address
      const roleBackup = {
        walletAddress,
        role,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        ROLE_STORAGE_KEYS.ROLE_BACKUP,
        JSON.stringify(roleBackup)
      );

      // Backup 2 - Legacy profile storage
      const existingProfile = this.getStoredData(
        ROLE_STORAGE_KEYS.WALLET_PROFILE(walletAddress)
      );
      const profileData = { ...existingProfile, role, walletAddress };
      localStorage.setItem(
        ROLE_STORAGE_KEYS.WALLET_PROFILE(walletAddress),
        JSON.stringify(profileData)
      );

      // Backup 3 - Role history (for debugging)
      this.addToRoleHistory(walletAddress, role);

      console.log(
        "[ROLE-PRESERVATION] Role saved to all backup locations:",
        role
      );
    } catch (error) {
      console.error("[ROLE-PRESERVATION] Error saving role:", error);
    }
  }

  // Retrieve role from any available location
  static retrieveRole(walletAddress: string): UserRole | null {
    const sources = [
      // Priority 1: Primary user data
      () => {
        const userData = this.getStoredData(ROLE_STORAGE_KEYS.PRIMARY);
        if (userData?.walletAddress === walletAddress) {
          return userData.role;
        }
        return null;
      },

      // Priority 2: Role backup
      () => {
        const roleBackup = this.getStoredData(ROLE_STORAGE_KEYS.ROLE_BACKUP);
        if (roleBackup?.walletAddress === walletAddress) {
          return roleBackup.role;
        }
        return null;
      },

      // Priority 3: Legacy profile
      () => {
        const profile = this.getStoredData(
          ROLE_STORAGE_KEYS.WALLET_PROFILE(walletAddress)
        );
        return profile?.role || null;
      },

      // Priority 4: Role history (last known role)
      () => {
        const history = this.getRoleHistory();
        const userHistory = history.find(
          (h) => h.walletAddress === walletAddress
        );
        return userHistory?.roles[userHistory.roles.length - 1]?.role || null;
      },
    ];

    for (const getRole of sources) {
      const role = getRole();
      if (role) {
        console.log("[ROLE-PRESERVATION] Role retrieved from backup:", role);
        return role;
      }
    }

    console.warn(
      "[ROLE-PRESERVATION] No role found in any backup location for:",
      walletAddress
    );
    return null;
  }

  // Safely parse stored data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static getStoredData(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(
        "[ROLE-PRESERVATION] Error parsing stored data:",
        key,
        error
      );
      return null;
    }
  }

  // Add to role history for debugging and recovery
  private static addToRoleHistory(walletAddress: string, role: UserRole) {
    try {
      const history = this.getRoleHistory();
      const userIndex = history.findIndex(
        (h) => h.walletAddress === walletAddress
      );

      const roleEntry = { role, timestamp: new Date().toISOString() };

      if (userIndex >= 0) {
        history[userIndex].roles.push(roleEntry);
      } else {
        history.push({
          walletAddress,
          roles: [roleEntry],
        });
      }

      // Keep only last 10 role changes per user
      history.forEach((user) => {
        if (user.roles.length > 10) {
          user.roles = user.roles.slice(-10);
        }
      });

      localStorage.setItem(
        ROLE_STORAGE_KEYS.ROLE_HISTORY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error("[ROLE-PRESERVATION] Error updating role history:", error);
    }
  }

  private static getRoleHistory(): Array<{
    walletAddress: string;
    roles: Array<{ role: UserRole; timestamp: string }>;
  }> {
    try {
      const history = localStorage.getItem(ROLE_STORAGE_KEYS.ROLE_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      return [];
    }
  }

  // Verify role consistency across all storage locations
  static verifyRoleConsistency(walletAddress: string): {
    isConsistent: boolean;
    primaryRole: UserRole | null;
    backupRole: UserRole | null;
    profileRole: UserRole | null;
    historyRole: UserRole | null;
  } {
    const primaryData = this.getStoredData(ROLE_STORAGE_KEYS.PRIMARY);
    const primaryRole =
      primaryData?.walletAddress === walletAddress ? primaryData.role : null;

    const backupData = this.getStoredData(ROLE_STORAGE_KEYS.ROLE_BACKUP);
    const backupRole =
      backupData?.walletAddress === walletAddress ? backupData.role : null;

    const profileRole =
      this.getStoredData(ROLE_STORAGE_KEYS.WALLET_PROFILE(walletAddress))
        ?.role || null;

    const history = this.getRoleHistory();
    const userHistory = history.find((h) => h.walletAddress === walletAddress);
    const historyRole =
      userHistory?.roles[userHistory.roles.length - 1]?.role || null;

    const roles = [primaryRole, backupRole, profileRole, historyRole].filter(
      Boolean
    );
    const isConsistent = new Set(roles).size <= 1;

    return {
      isConsistent,
      primaryRole,
      backupRole,
      profileRole,
      historyRole,
    };
  }

  // Helper function to get wallet name
  static getWalletName(walletAddress: string): string {
    try {
      const currentWallet = localStorage.getItem(
        "chainvanguard_current_wallet"
      );
      if (currentWallet) {
        const walletData = JSON.parse(currentWallet);
        return walletData.name;
      }

      // Fallback: search through all wallets
      const allWallets = localStorage.getItem("chainvanguard_wallets");
      if (allWallets) {
        const wallets = JSON.parse(allWallets);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wallet = wallets.find((w: any) => w.address === walletAddress);
        return wallet?.name || "Unknown Wallet";
      }
    } catch (error) {
      console.error("[ROLE-PRESERVATION] Error getting wallet name:", error);
    }

    return "Unknown Wallet";
  }
}
