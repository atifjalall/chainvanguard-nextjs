"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  TrendingUp,
  Activity,
  Hash,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  CreditCard,
  Users,
  ShieldCheck,
  FileText,
  MoreHorizontal,
  Copy,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

interface Transaction {
  id: string;
  txId: string;
  blockNumber: number;
  channelName: string;
  chaincodeName: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  type: 'product-creation' | 'product-transfer' | 'payment' | 'consensus' | 'audit';
  status: 'confirmed' | 'pending' | 'failed';
  productId?: string;
  productName?: string;
  gasUsed?: number;
  endorsements?: number;
}

const AllTransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Transaction statistics
  const [stats, setStats] = useState({
    totalTransactions: 0,
    confirmedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
  });

  // Generate mock Hyperledger Fabric transactions
  useEffect(() => {
    generateMockTransactions();
  }, []);

  const generateMockTransactions = () => {
    const transactionTypes: Transaction['type'][] = [
      'product-creation',
      'product-transfer', 
      'payment',
      'consensus',
      'audit',
    ];
    
    const statuses: Transaction['status'][] = ['confirmed', 'pending', 'failed'];
    const roles = ['supplier', 'vendor', 'customer', 'ministry'];
    const channels = ['supply-chain-channel', 'payment-channel', 'audit-channel'];
    const chaincodes = ['supply-contract', 'payment-contract', 'audit-contract'];
    
    const mockTransactions: Transaction[] = Array.from({ length: 150 }, (_, index) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const fromRole = roles[Math.floor(Math.random() * roles.length)];
      const toRole = roles[Math.floor(Math.random() * roles.length)];
      
      return {
        id: `tx_${(150 - index).toString().padStart(6, '0')}`,
        txId: `${Math.random().toString(36).substr(2, 16)}${Date.now().toString(36)}`,
        blockNumber: 15000 + (150 - index),
        channelName: channels[Math.floor(Math.random() * channels.length)],
        chaincodeName: chaincodes[Math.floor(Math.random() * chaincodes.length)],
        type,
        status,
        from: `${fromRole}_${Math.random().toString(36).substr(2, 8)}`,
        to: `${toRole}_${Math.random().toString(36).substr(2, 8)}`,
        value: (Math.random() * 1000).toFixed(2) + ' HLFC', // Hyperledger Fabric Coins
        gasUsed: Math.floor(Math.random() * 100000) + 21000,
        endorsements: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date(Date.now() - index * 60000).toISOString(),
        productId: type === 'product-creation' || type === 'product-transfer' 
          ? `prod_${Math.random().toString(36).substr(2, 8)}` 
          : undefined,
        productName: type === 'product-creation' || type === 'product-transfer'
          ? ['Organic Rice 25kg', 'Fresh Apples 5kg', 'Wheat Flour 50kg', 'Premium Coffee 1kg'][Math.floor(Math.random() * 4)]
          : undefined,
      };
    });

    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
    
    // Calculate stats
    const confirmed = mockTransactions.filter(tx => tx.status === 'confirmed').length;
    const pending = mockTransactions.filter(tx => tx.status === 'pending').length;
    const failed = mockTransactions.filter(tx => tx.status === 'failed').length;
    
    setStats({
      totalTransactions: mockTransactions.length,
      confirmedTransactions: confirmed,
      pendingTransactions: pending,
      failedTransactions: failed,
    });
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.txId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.channelName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }

    // Apply time range filter
    const now = new Date();
    let timeThreshold: Date | null = null;
    
    switch (selectedTimeRange) {
      case '1h':
        timeThreshold = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeThreshold = null;
    }

    if (timeThreshold) {
      filtered = filtered.filter(tx => new Date(tx.timestamp) >= timeThreshold);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus, selectedTimeRange, transactions]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      generateMockTransactions();
      setIsLoading(false);
    }, 1000);
  };

  const exportTransactions = () => {
    const csv = [
      ['Transaction ID', 'Tx Hash', 'Block', 'Channel', 'Type', 'Status', 'From', 'To', 'Value', 'Endorsements', 'Timestamp'],
      ...filteredTransactions.map(tx => [
        tx.id,
        tx.txId,
        tx.blockNumber,
        tx.channelName,
        tx.type,
        tx.status,
        tx.from,
        tx.to,
        tx.value,
        tx.endorsements || 0,
        tx.timestamp
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hyperledger_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
      failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300',
    };

    const icons = {
      confirmed: CheckCircle,
      pending: Clock,
      failed: AlertCircle,
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type: Transaction['type']) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'product-creation':
        return <Package className={`${iconClass} text-blue-600`} />;
      case 'product-transfer':
        return <ArrowUpRight className={`${iconClass} text-green-600`} />;
      case 'payment':
        return <CreditCard className={`${iconClass} text-purple-600`} />;
      case 'consensus':
        return <Users className={`${iconClass} text-orange-600`} />;
      case 'audit':
        return <ShieldCheck className={`${iconClass} text-red-600`} />;
      default:
        return <FileText className={`${iconClass} text-gray-600`} />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Add toast notification here if needed
  };

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Transactions</h1>
          <p className="text-muted-foreground">
            Monitor all Hyperledger Fabric transactions across the network
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={handleRefresh} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmedTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.confirmedTransactions / stats.totalTransactions) * 100).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Hash className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.failedTransactions / stats.totalTransactions) * 100).toFixed(1)}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by ID, hash, address, or channel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product-creation">Product Creation</SelectItem>
                <SelectItem value="product-transfer">Product Transfer</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="consensus">Consensus</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showFilters && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                  Live: {filteredTransactions.filter(tx => tx.status === 'pending').length} pending
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Page {currentPage} of {totalPages} • {filteredTransactions.length} total results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(transaction.type)}
                        <span className="text-sm capitalize font-medium">
                          {transaction.type.replace('-', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {transaction.id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(transaction.txId)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.channelName}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-mono">
                          {transaction.from.slice(0, 15)}...
                        </div>
                        <div className="text-xs text-muted-foreground">↓</div>
                        <div className="text-sm font-mono">
                          {transaction.to.slice(0, 15)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.productName ? (
                        <div className="text-sm">{transaction.productName}</div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{transaction.value}</span>
                      {transaction.endorsements && (
                        <div className="text-xs text-muted-foreground">
                          {transaction.endorsements} endorsements
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{transaction.blockNumber}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(transaction.timestamp)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyToClipboard(transaction.txId)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Tx Hash
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                  if (page <= totalPages) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  }
                  return null;
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Transaction Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live Transaction Stream
          </CardTitle>
          <CardDescription>Recent Hyperledger Fabric transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(transaction.type)}
                  <div>
                    <div className="font-mono text-sm font-medium">{transaction.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {transaction.channelName} • {transaction.from} → {transaction.to}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(transaction.status)}
                  <span className="text-sm font-medium">{transaction.value}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllTransactionsPage;