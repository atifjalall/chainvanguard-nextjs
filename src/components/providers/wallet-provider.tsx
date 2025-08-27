'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { WalletData, Transaction } from '@/types/web3'
import { toast } from 'sonner'

interface WalletContextType {
  currentWallet: WalletData | null
  isConnected: boolean
  balance: number
  transactions: Transaction[]
  connectWallet: (walletId: string, password: string) => Promise<boolean>
  disconnectWallet: () => void
  createWallet: (name: string, password: string) => Promise<WalletData>
  getAllWallets: () => WalletData[]
  generateRecoveryPhrase: () => string
  recoverWallet: (recoveryPhrase: string, newPassword: string) => Promise<WalletData>
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [currentWallet, setCurrentWallet] = useState<WalletData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize wallet state from localStorage
  useEffect(() => {
    const savedWallet = localStorage.getItem('chainvanguard_current_wallet')
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet)
        setCurrentWallet(walletData)
        setIsConnected(true)
        loadWalletData(walletData.id)
      } catch (error) {
        console.error('Error parsing saved wallet data:', error)
        localStorage.removeItem('chainvanguard_current_wallet')
      }
    }
  }, [])

  const generateWalletAddress = (): string => {
    const prefix = '0x'
    const address = Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    return prefix + address
  }

  const generateRecoveryPhrase = (): string => {
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'against', 'age',
      'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm',
      'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost',
      'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing',
      'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
      'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna'
    ]
    
    const phrase = []
    for (let i = 0; i < 12; i++) {
      phrase.push(words[Math.floor(Math.random() * words.length)])
    }
    return phrase.join(' ')
  }

  const createWallet = async (name: string, password: string): Promise<WalletData> => {
    setIsLoading(true)
    
    try {
      const walletId = Date.now().toString()
      const walletAddress = generateWalletAddress()
      
      const newWallet: WalletData = {
        id: walletId,
        name: name.trim(),
        address: walletAddress,
        createdAt: new Date().toISOString(),
        encryptedPrivateKey: `encrypted_${walletId}_${Date.now()}`
      }

      // Save to wallets list
      const existingWallets = getAllWallets()
      const updatedWallets = [...existingWallets, newWallet]
      localStorage.setItem('chainvanguard_wallets', JSON.stringify(updatedWallets))
      
      // Save wallet credentials
      localStorage.setItem(`wallet_${walletId}_password`, password)
      
      // Initialize wallet data
      const initialBalance = 1000 + Math.floor(Math.random() * 5000)
      localStorage.setItem(`wallet_${walletId}_balance`, initialBalance.toString())
      localStorage.setItem(`wallet_${walletId}_transactions`, JSON.stringify([]))
      
      return newWallet
    } finally {
      setIsLoading(false)
    }
  }

  const connectWallet = async (walletId: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const wallets = getAllWallets()
      const wallet = wallets.find(w => w.id === walletId)
      
      if (!wallet) {
        throw new Error('Wallet not found')
      }

      // Verify password
      const storedPassword = localStorage.getItem(`wallet_${walletId}_password`)
      if (storedPassword !== password) {
        throw new Error('Invalid password')
      }

      setCurrentWallet(wallet)
      setIsConnected(true)
      localStorage.setItem('chainvanguard_current_wallet', JSON.stringify(wallet))
      
      await loadWalletData(walletId)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet'
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setCurrentWallet(null)
    setIsConnected(false)
    setBalance(0)
    setTransactions([])
    localStorage.removeItem('chainvanguard_current_wallet')
  }

  const getAllWallets = (): WalletData[] => {
    try {
      const wallets = localStorage.getItem('chainvanguard_wallets')
      return wallets ? JSON.parse(wallets) : []
    } catch (error) {
      console.error('Error loading wallets:', error)
      return []
    }
  }

  const loadWalletData = async (walletId: string) => {
    try {
      // Load balance
      const savedBalance = localStorage.getItem(`wallet_${walletId}_balance`)
      const walletBalance = savedBalance ? parseInt(savedBalance) : 0
      setBalance(walletBalance)

      // Load transactions
      const savedTransactions = localStorage.getItem(`wallet_${walletId}_transactions`)
      const walletTransactions = savedTransactions ? JSON.parse(savedTransactions) : []
      setTransactions(walletTransactions)
    } catch (error) {
      console.error('Error loading wallet data:', error)
    }
  }

  const recoverWallet = async (recoveryPhrase: string, newPassword: string): Promise<WalletData> => {
    setIsLoading(true)
    
    try {
      // Validate recovery phrase
      const words = recoveryPhrase.trim().split(/\s+/)
      if (words.length !== 12) {
        throw new Error('Recovery phrase must contain exactly 12 words')
      }

      // Generate new wallet from recovery phrase
      const walletId = Date.now().toString()
      const walletAddress = generateWalletAddress()
      
      const recoveredWallet: WalletData = {
        id: walletId,
        name: `Recovered Wallet ${walletId.slice(-4)}`,
        address: walletAddress,
        createdAt: new Date().toISOString(),
        encryptedPrivateKey: `recovered_${walletId}_${Date.now()}`
      }

      // Save recovered wallet
      const existingWallets = getAllWallets()
      const updatedWallets = [...existingWallets, recoveredWallet]
      localStorage.setItem('chainvanguard_wallets', JSON.stringify(updatedWallets))
      
      // Save new password and recovery phrase
      localStorage.setItem(`wallet_${walletId}_password`, newPassword)
      localStorage.setItem(`wallet_${walletId}_recovery`, recoveryPhrase)
      
      // Initialize with some balance
      const recoveredBalance = Math.floor(Math.random() * 3000) + 500
      localStorage.setItem(`wallet_${walletId}_balance`, recoveredBalance.toString())
      localStorage.setItem(`wallet_${walletId}_transactions`, JSON.stringify([]))
      
      return recoveredWallet
    } finally {
      setIsLoading(false)
    }
  }

  const value: WalletContextType = {
    currentWallet,
    isConnected,
    balance,
    transactions,
    connectWallet,
    disconnectWallet,
    createWallet,
    getAllWallets,
    generateRecoveryPhrase,
    recoverWallet,
    isLoading
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}