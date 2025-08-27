'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Wallet, Clock, Shield, ChevronRight, Trash2 } from 'lucide-react'
import { useWallet } from '@/components/providers/wallet-provider'
import { toast } from 'sonner'

interface WalletData {
  id: string
  name: string
  address: string
  createdAt: string
  encryptedPrivateKey: string
}

interface WalletSelectorProps {
  onWalletSelect: (wallet: WalletData) => void
  selectedWalletId?: string
}

export default function WalletSelector({ onWalletSelect, selectedWalletId }: WalletSelectorProps) {
  const { getAllWallets } = useWallet()
  const [wallets] = useState<WalletData[]>(getAllWallets())

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getWalletInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const deleteWallet = (walletId: string, walletName: string) => {
    if (confirm(`Are you sure you want to delete "${walletName}"? This action cannot be undone.`)) {
      try {
        // Remove from wallets list
        const updatedWallets = wallets.filter(w => w.id !== walletId)
        localStorage.setItem('chainvanguard_wallets', JSON.stringify(updatedWallets))
        
        // Remove wallet-specific data
        localStorage.removeItem(`wallet_${walletId}_password`)
        localStorage.removeItem(`wallet_${walletId}_recovery`)
        localStorage.removeItem(`wallet_${walletId}_balance`)
        localStorage.removeItem(`wallet_${walletId}_transactions`)
        localStorage.removeItem(`profile_${wallets.find(w => w.id === walletId)?.address}`)
        
        // Refresh component (in real app, use state management)
        window.location.reload()
        
        toast.success(`Wallet "${walletName}" deleted successfully`)
      } catch (error) {
        toast.error('Failed to delete wallet')
      }
    }
  }

  if (wallets.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Wallets Found</h3>
          <p className="text-muted-foreground text-center mb-6">
            You havent created any wallets yet. Create your first wallet to get started with ChainVanguard.
          </p>
          <Button onClick={() => window.location.href = '/register'}>
            <Wallet className="mr-2 h-4 w-4" />
            Create Your First Wallet
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Available Wallets ({wallets.length})
        </h3>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {wallets.map((wallet) => (
          <Card 
            key={wallet.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedWalletId === wallet.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-muted-foreground/50'
            }`}
            onClick={() => onWalletSelect(wallet)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getWalletInitials(wallet.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{wallet.name}</h4>
                      {selectedWalletId === wallet.id && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        <span className="font-mono text-xs">
                          {formatAddress(wallet.address)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {formatDate(wallet.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteWallet(wallet.id, wallet.name)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              {selectedWalletId === wallet.id && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Wallet ready for connection</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="pt-2 border-t">
        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={() => window.location.href = '/register'}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Create New Wallet
        </Button>
      </div>
    </div>
  )
}