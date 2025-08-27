/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building2,
  ArrowUpDown,
  Globe,
  Factory,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Warehouse,
  BarChart3,
  ArrowRight,
  ShoppingCart,
  TrendingDown
} from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { Product } from '@/types'
import { toast } from 'sonner'

interface DashboardMetrics {
  totalProducts: number
  totalVendors: number
  totalTransactions: number
  totalRevenue: number
  totalOrders: number
  activeProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  pendingVendors: number
  completedTransactions: number
  totalInventoryValue: number
}

interface RecentActivity {
  id: string
  type: 'product_added' | 'order_received' | 'vendor_added' | 'stock_low'
  title: string
  description: string
  timestamp: string
  status?: 'success' | 'warning' | 'info'
}

export default function SupplierDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [user?.id])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load products
      const savedProducts = localStorage.getItem(`supplier_${user?.id}_products`)
      const productsData = savedProducts ? JSON.parse(savedProducts) : []
      
      // Load vendors
      const savedVendors = localStorage.getItem(`supplier_${user?.id}_vendors`)
      const vendorsData = savedVendors ? JSON.parse(savedVendors) : []
      
      // Load transactions
      const savedTransactions = localStorage.getItem(`supplier_${user?.id}_transactions`)
      const transactionsData = savedTransactions ? JSON.parse(savedTransactions) : []

      setProducts(productsData)
      setVendors(vendorsData)
      setTransactions(transactionsData)

      // Generate recent activity
      generateRecentActivity(productsData, vendorsData, transactionsData)
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecentActivity = (products: Product[], vendors: any[], transactions: any[]) => {
    const activities: RecentActivity[] = []

    // Recent products
    const recentProducts = products
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)

    recentProducts.forEach(product => {
      activities.push({
        id: `product_${product.id}`,
        type: 'product_added',
        title: 'New Product Added',
        description: `Added ${product.name} to supply catalog`,
        timestamp: product.createdAt,
        status: 'success'
      })
    })

    // Recent vendors
    const recentVendors = vendors
      .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
      .slice(0, 1)

    recentVendors.forEach(vendor => {
      activities.push({
        id: `vendor_${vendor.id}`,
        type: 'vendor_added',
        title: 'New Vendor Partnership',
        description: `${vendor.name} joined as vendor partner`,
        timestamp: vendor.joinedDate,
        status: 'info'
      })
    })

    // Low stock alerts
    const lowStockProducts = products.filter(p => p.quantity < (p.minimumOrderQuantity || 10) * 2)
    if (lowStockProducts.length > 0) {
      activities.push({
        id: 'low_stock',
        type: 'stock_low',
        title: 'Low Stock Alert',
        description: `${lowStockProducts.length} products running low on stock`,
        timestamp: new Date().toISOString(),
        status: 'warning'
      })
    }

    // Recent transactions
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 1)

    recentTransactions.forEach(transaction => {
      activities.push({
        id: `transaction_${transaction.id}`,
        type: 'order_received',
        title: 'New Order',
        description: `${transaction.type} order from ${transaction.counterparty}`,
        timestamp: transaction.date,
        status: 'success'
      })
    })

    // Sort by most recent
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setRecentActivity(activities.slice(0, 5))
  }

  // Calculate comprehensive metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.status === 'active').length
    const lowStockProducts = products.filter(p => p.quantity < (p.minimumOrderQuantity || 10) * 2).length
    const outOfStockProducts = products.filter(p => p.quantity === 0).length
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)

    const totalVendors = vendors.length
    const pendingVendors = vendors.filter(v => v.status === 'pending').length

    const totalTransactions = transactions.length
    const completedTransactions = transactions.filter(t => t.status === 'completed').length
    const totalRevenue = transactions
      .filter(t => t.type === 'sale' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalOrders = transactions.filter(t => t.type === 'sale').length

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue,
      totalVendors,
      pendingVendors,
      totalTransactions,
      completedTransactions,
      totalRevenue,
      totalOrders
    }
  }, [products, vendors, transactions])

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId)
    setProducts(updatedProducts)
    localStorage.setItem(`supplier_${user?.id}_products`, JSON.stringify(updatedProducts))
    toast.success('Product deleted successfully')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      case 'out-of-stock': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product_added': return <Package className="h-4 w-4" />
      case 'order_received': return <ShoppingCart className="h-4 w-4" />
      case 'vendor_added': return <Users className="h-4 w-4" />
      case 'stock_low': return <AlertTriangle className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const getActivityColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Supply Chain Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}. Here is your supply chain overview.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/supplier/analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
          <Button onClick={() => router.push('/supplier/add-product')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{metrics.activeProducts}</span> active
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {metrics.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Vendor Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalVendors}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingVendors > 0 && (
                <span className="text-yellow-600">{metrics.pendingVendors} pending</span>
              )}
              {metrics.pendingVendors === 0 && "All active"}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Inventory Value</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${metrics.totalInventoryValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.lowStockProducts > 0 && (
                <span className="text-yellow-600">{metrics.lowStockProducts} low stock</span>
              )}
              {metrics.lowStockProducts === 0 && "Stock levels good"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(metrics.lowStockProducts > 0 || metrics.outOfStockProducts > 0 || metrics.pendingVendors > 0) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.outOfStockProducts > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800 dark:text-red-300">{metrics.outOfStockProducts} products out of stock</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/supplier/inventory')}>
                    Manage Inventory
                  </Button>
                </div>
              )}
              {metrics.lowStockProducts > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-800 dark:text-yellow-300">{metrics.lowStockProducts} products running low</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/supplier/inventory')}>
                    Restock Items
                  </Button>
                </div>
              )}
              {metrics.pendingVendors > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800 dark:text-blue-300">{metrics.pendingVendors} vendor applications pending</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/supplier/vendors')}>
                    Review Vendors
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">
              Latest updates in your supply chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Stats</CardTitle>
            <CardDescription className="text-muted-foreground">
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-foreground">Completed Transactions</span>
                </div>
                <span className="text-sm font-medium text-foreground">{metrics.completedTransactions}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-foreground">Total Transactions</span>
                </div>
                <span className="text-sm font-medium text-foreground">{metrics.totalTransactions}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-foreground">Success Rate</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {metrics.totalTransactions > 0 
                    ? Math.round((metrics.completedTransactions / metrics.totalTransactions) * 100)
                    : 0}%
                </span>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Inventory Health</span>
                  <span>{Math.round(((metrics.totalProducts - metrics.lowStockProducts - metrics.outOfStockProducts) / Math.max(metrics.totalProducts, 1)) * 100)}%</span>
                </div>
                <Progress 
                  value={((metrics.totalProducts - metrics.lowStockProducts - metrics.outOfStockProducts) / Math.max(metrics.totalProducts, 1)) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Common supply chain tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => router.push('/supplier/add-product')}
              >
                <div className="flex items-center gap-3">
                  <Factory className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Add Supply Product</div>
                    <div className="text-xs text-muted-foreground">Expand your catalog</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => router.push('/supplier/vendors')}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Manage Vendors</div>
                    <div className="text-xs text-muted-foreground">Partner relationships</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => router.push('/supplier/inventory')}
              >
                <div className="flex items-center gap-3">
                  <Warehouse className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Check Inventory</div>
                    <div className="text-xs text-muted-foreground">Stock levels & alerts</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4"
                onClick={() => router.push('/supplier/analytics')}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">View Analytics</div>
                    <div className="text-xs text-muted-foreground">Performance insights</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      {products.length > 0 && (
        <Card className="border border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Recent Products</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your latest supply products
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push('/supplier/products')}>
                View All Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        <Badge className={`text-xs ${getStatusColor(product.status)}`} variant="secondary">
                          {product.status}
                        </Badge>
                        {product.origin && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Globe className="h-2 w-2" />
                            {product.origin}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${product.price}</p>
                      <p className="text-sm text-muted-foreground">Stock: {product.quantity}</p>
                      {product.minimumOrderQuantity && (
                        <p className="text-xs text-muted-foreground">Min: {product.minimumOrderQuantity}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/supplier/products/${product.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}