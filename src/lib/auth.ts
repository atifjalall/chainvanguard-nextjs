import { User, UserRole, RegisterData } from '@/types'

export class AuthService {
  private static instance: AuthService
  
  private constructor() {}
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(walletAddress: string, password: string): Promise<User> {
    try {
      // Get user data from localStorage using wallet address
      const userData = this.getUserByWalletAddress(walletAddress)
      
      if (!userData) {
        throw new Error('Wallet not found. Please register first.')
      }

      // Verify wallet password (in real app, this would verify against encrypted private key)
      const walletData = this.getWalletData(walletAddress)
      if (!walletData || !this.verifyWalletPassword(walletData, password)) {
        throw new Error('Invalid wallet password')
      }
      
      // Set authentication state
      localStorage.setItem('chainvanguard_auth_user', JSON.stringify(userData))
      localStorage.setItem('chainvanguard_auth_token', this.generateAuthToken(userData))
      
      return userData
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed')
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      // Validate required fields
      if (!userData.walletAddress) {
        throw new Error('Wallet address is required for registration')
      }

      // Check if user already exists
      const existingUser = this.getUserByWalletAddress(userData.walletAddress)
      if (existingUser) {
        throw new Error('User with this wallet address already exists')
      }

      // Create new user
      const newUser: User = {
        id: this.generateUserId(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        walletAddress: userData.walletAddress,
        walletName: userData.walletName || 'Default Wallet',
        // Business info for suppliers/vendors
        companyName: userData.companyName,
        businessAddress: userData.businessAddress,
        businessType: userData.businessType,
        registrationNumber: userData.registrationNumber,
        // Hyperledger specific
        networkType: 'hyperledger-fabric',
        organizationMSP: this.getMSPForRole(userData.role),
        isAuthenticated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        loginAt: new Date().toISOString()
      }

      // Save user data
      this.saveUser(newUser)
      
      // Set authentication state
      localStorage.setItem('chainvanguard_auth_user', JSON.stringify(newUser))
      localStorage.setItem('chainvanguard_auth_token', this.generateAuthToken(newUser))

      return newUser
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed')
    }
  }

  logout(): void {
    localStorage.removeItem('chainvanguard_auth_user')
    localStorage.removeItem('chainvanguard_auth_token')
    
    // Clear any cached user data
    const currentUser = this.getCurrentUser()
    if (currentUser) {
      localStorage.removeItem(`chainvanguard_user_${currentUser.walletAddress}`)
    }
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('chainvanguard_auth_user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('chainvanguard_auth_token')
    const user = this.getCurrentUser()
    
    if (!token || !user) {
      return false
    }

    // Check if token is expired (basic check)
    return this.isTokenValid(token)
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  updateUserProfile(updates: Partial<User>): User | null {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      return null
    }

    const updatedUser: User = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Save updated user
    this.saveUser(updatedUser)
    localStorage.setItem('chainvanguard_auth_user', JSON.stringify(updatedUser))

    return updatedUser
  }

  // Private helper methods

  private getUserByWalletAddress(walletAddress: string): User | null {
    try {
      const userDataStr = localStorage.getItem(`chainvanguard_user_${walletAddress}`)
      return userDataStr ? JSON.parse(userDataStr) : null
    } catch {
      return null
    }
  }

  private getWalletData(walletAddress: string) {
    try {
      const walletsStr = localStorage.getItem('chainvanguard_wallets')
      if (!walletsStr) return null
      
      const wallets = JSON.parse(walletsStr)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return wallets.find((w: any) => w.address === walletAddress)
    } catch {
      return null
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private verifyWalletPassword(walletData: any, password: string): boolean {
    // In a real implementation, this would verify against encrypted private key
    // For now, we'll use a simple check against stored password hash
    return walletData.encryptedPrivateKey === password // Simplified for demo
  }

  private saveUser(user: User): void {
    // Save user data indexed by wallet address for easy lookup
    localStorage.setItem(`chainvanguard_user_${user.walletAddress}`, JSON.stringify(user))
    
    // Also maintain a list of all users for admin purposes
    try {
      const allUsersStr = localStorage.getItem('chainvanguard_all_users')
      const allUsers = allUsersStr ? JSON.parse(allUsersStr) : []
      
      // Update or add user
      const existingIndex = allUsers.findIndex((u: User) => u.walletAddress === user.walletAddress)
      if (existingIndex >= 0) {
        allUsers[existingIndex] = user
      } else {
        allUsers.push(user)
      }
      
      localStorage.setItem('chainvanguard_all_users', JSON.stringify(allUsers))
    } catch (error) {
      console.error('Failed to update user list:', error)
    }
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAuthToken(user: User): string {
    // In a real implementation, this would be a proper JWT token
    const tokenData = {
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    }
    
    return btoa(JSON.stringify(tokenData))
  }

  private isTokenValid(token: string): boolean {
    try {
      const tokenData = JSON.parse(atob(token))
      return tokenData.expiresAt > Date.now()
    } catch {
      return false
    }
  }

  private getMSPForRole(role: UserRole): string {
    const mspMappings = {
      supplier: 'SupplierMSP',
      vendor: 'VendorMSP',
      customer: 'CustomerMSP',
      'blockchain-expert': 'AdminMSP'
    }
    return mspMappings[role]
  }

  // Admin methods for blockchain experts
  
  getAllUsers(): User[] {
    try {
      const allUsersStr = localStorage.getItem('chainvanguard_all_users')
      return allUsersStr ? JSON.parse(allUsersStr) : []
    } catch {
      return []
    }
  }

  getUsersByRole(role: UserRole): User[] {
    return this.getAllUsers().filter(user => user.role === role)
  }

  getTotalUserCount(): number {
    return this.getAllUsers().length
  }

  // Network and wallet integration methods

  async connectToHyperledgerNetwork(user: User): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Load the user's identity from the wallet
      // 2. Connect to the Hyperledger Fabric network
      // 3. Initialize the channel and chaincode connections
      // 4. Verify the user's organization membership
      
      console.log(`Connecting ${user.name} to Hyperledger Fabric network`)
      console.log(`Organization: ${user.organizationMSP}`)
      console.log(`Wallet Address: ${user.walletAddress}`)
      
      // Simulate network connection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return true
    } catch (error) {
      console.error('Failed to connect to Hyperledger network:', error)
      return false
    }
  }

  async disconnectFromNetwork(): Promise<void> {
    // In a real implementation, this would properly close network connections
    console.log('Disconnected from Hyperledger Fabric network')
  }
}