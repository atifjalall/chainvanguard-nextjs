"use client";

import {
  useState,
  useEffect,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Network,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Database,
  Activity,
  Eye,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Hash,
  Package,
  CreditCard,
  Play,
  Pause,
  RotateCcw,
  Download,
  Lock,
  Key,
  Cpu,
  HardDrive,
  Wifi,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Globe,
  ShieldCheck,
  AlertCircle,
  Info,
  Sparkles,
  Crown,
  Star,
  Target,
} from "lucide-react";

// Type definitions
type StatusType =
  | "online"
  | "offline"
  | "syncing"
  | "confirmed"
  | "pending"
  | "failed"
  | "active"
  | "paused";
type NodeType = "peer" | "orderer" | "ca";
type TransactionType =
  | "product-creation"
  | "product-transfer"
  | "payment"
  | "consensus"
  | "audit";
type AlertType = "warning" | "error" | "info";

export default function EnhancedBlockchainExpertDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    networkHealth: {
      totalNodes: 12,
      onlineNodes: 10,
      syncingNodes: 1,
      offlineNodes: 1,
      averageBlockTime: 2.3,
      transactionThroughput: 1247,
      networkLatency: 45.2,
      consensusHealth: 98.5,
      faultTolerance: 85,
    },
    systemHealth: {
      overallHealth: 94,
      cpuUsage: 45,
      memoryUsage: 68,
      diskUsage: 32,
      networkIO: 128,
      activeChannels: 5,
      connectedPeers: 24,
    },
    transactions: {
      totalTransactions: 45687,
      pending: 12,
      confirmed: 45562,
      failed: 113,
      tps: 247,
      last24h: 3456,
      averageTime: 2.1,
    },
    consensus: {
      algorithm: "RAFT",
      status: "active" as StatusType,
      leaderNode: "peer0.org1",
      consensusTime: 1.8,
      validatorNodes: 7,
      activeProposals: 3,
    },
    security: {
      encryptionLevel: "AES-256",
      certificatesValid: 24,
      certificatesExpiring: 2,
      lastSecurityScan: "2025-08-28T10:30:00Z",
      threatsDetected: 0,
      keyRotation: true,
      accessControlActive: true,
    },
  });

  // Recent transactions mock data
  const [recentTransactions] = useState([
    {
      id: "tx_001",
      txId: "0x1a2b3c4d5e6f789012345678901234567890abcdef",
      blockNumber: 15420,
      from: "0x742d35Cc6634C0532925a3b8D8Df32D23FC47A98",
      to: "0x8ba1f109551bD432803012645Hac136c",
      value: "2.5 ETH",
      timestamp: "2025-08-28T14:30:00Z",
      type: "product-creation" as TransactionType,
      status: "confirmed" as StatusType,
      productName: "Organic Coffee Beans",
    },
    {
      id: "tx_002",
      txId: "0x2b3c4d5e6f7890123456789012345678901234567890",
      blockNumber: 15419,
      from: "0x851d45Bb7754D0543825a3b8D9Af82D23GC74B89",
      to: "0x9cb2f209662cE543803012645Hac246d",
      value: "1.2 ETH",
      timestamp: "2025-08-28T14:28:00Z",
      type: "payment" as TransactionType,
      status: "confirmed" as StatusType,
      productName: "Premium Cotton T-Shirt",
    },
    {
      id: "tx_003",
      txId: "0x3c4d5e6f78901234567890123456789012345678901",
      blockNumber: 15418,
      from: "0x962e56Cc7865E0654936b9c9E8Bf93E34HD85C90",
      to: "0xadc3g310773dF654914023756Iac357e",
      value: "0.8 ETH",
      timestamp: "2025-08-28T14:25:00Z",
      type: "product-transfer" as TransactionType,
      status: "pending" as StatusType,
      productName: "Wireless Headphones",
    },
  ]);

  // Network nodes mock data
  const [networkNodes] = useState([
    {
      id: "peer0.org1",
      type: "peer" as NodeType,
      status: "online" as StatusType,
      location: "US-East",
      uptime: "99.9%",
      lastSeen: "2025-08-28T14:35:00Z",
      version: "2.4.3",
      transactions: 12450,
    },
    {
      id: "orderer.example.com",
      type: "orderer" as NodeType,
      status: "online" as StatusType,
      location: "EU-West",
      uptime: "100%",
      lastSeen: "2025-08-28T14:35:00Z",
      version: "2.4.3",
      transactions: 45687,
    },
    {
      id: "ca.org1",
      type: "ca" as NodeType,
      status: "syncing" as StatusType,
      location: "Asia-Pacific",
      uptime: "98.7%",
      lastSeen: "2025-08-28T14:33:00Z",
      version: "2.4.2",
      transactions: 8234,
    },
  ]);

  useEffect(() => {
    setIsVisible(true);
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Helper functions
  const getStatusBadge = (status: StatusType) => {
    const statusConfig = {
      online: { variant: "default", className: "bg-green-500 hover:bg-green-600", label: "Online" },
      active: { variant: "default", className: "bg-green-500 hover:bg-green-600", label: "Active" },
      confirmed: { variant: "default", className: "bg-green-500 hover:bg-green-600", label: "Confirmed" },
      offline: { variant: "destructive", className: "bg-red-500 hover:bg-red-600", label: "Offline" },
      failed: { variant: "destructive", className: "bg-red-500 hover:bg-red-600", label: "Failed" },
      syncing: { variant: "secondary", className: "bg-yellow-500 hover:bg-yellow-600", label: "Syncing" },
      pending: { variant: "secondary", className: "bg-yellow-500 hover:bg-yellow-600", label: "Pending" },
      paused: { variant: "outline", className: "bg-gray-500 hover:bg-gray-600", label: "Paused" },
    };

    const config = statusConfig[status] || statusConfig.offline;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    const colors = {
      "product-creation": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "product-transfer": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      payment: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      consensus: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      audit: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return colors[type];
  };

  const getHealthColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getNodeTypeIcon = (type: NodeType) => {
    switch (type) {
      case "peer": return <Server className="w-4 h-4" />;
      case "orderer": return <Layers className="w-4 h-4" />;
      case "ca": return <Key className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Enhanced Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Blockchain Expert Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Monitor, manage, and secure your Hyperledger Fabric network
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Admin Access
              </Badge>
              <Badge variant="outline" className="border-orange-300">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Hyperledger Fabric
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                Real-time Monitoring
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button
              size="sm"
              className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics Overview */}
      <div
        className={`transform transition-all duration-700 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Network Health
                  </p>
                  <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                    {dashboardData.systemHealth.overallHealth}%
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    +2% from last hour
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              <Progress
                value={dashboardData.systemHealth.overallHealth}
                className="mt-4 h-2"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Active Nodes
                  </p>
                  <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                    {dashboardData.networkHealth.onlineNodes}/
                    {dashboardData.networkHealth.totalNodes}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {Math.round(
                      (dashboardData.networkHealth.onlineNodes /
                        dashboardData.networkHealth.totalNodes) *
                        100
                    )}% online
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Server className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {Array.from({ length: dashboardData.networkHealth.totalNodes }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded ${
                      i < dashboardData.networkHealth.onlineNodes
                        ? "bg-blue-500"
                        : i < dashboardData.networkHealth.onlineNodes + dashboardData.networkHealth.syncingNodes
                        ? "bg-yellow-500"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Transactions/sec
                  </p>
                  <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                    {dashboardData.transactions.tps}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Real-time throughput
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-purple-600">+15% vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Security Status
                  </p>
                  <p className="text-3xl font-bold text-amber-800 dark:text-amber-200">
                    Secure
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {dashboardData.security.threatsDetected} threats detected
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600">All systems protected</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Consensus
                  </p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                    {dashboardData.consensus.algorithm}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Leader: {dashboardData.consensus.leaderNode}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                {getStatusBadge(dashboardData.consensus.status)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Tabs Section */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="nodes" className="rounded-lg">Network Nodes</TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-lg">Transactions</TabsTrigger>
            <TabsTrigger value="consensus" className="rounded-lg">Consensus</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg">Security</TabsTrigger>
            <TabsTrigger value="system" className="rounded-lg">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Network Performance */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-orange-500" />
                    Network Performance
                  </CardTitle>
                  <CardDescription>Real-time network metrics and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Throughput</span>
                        <Zap className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">
                        {dashboardData.networkHealth.transactionThroughput}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">tx/hour</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Latency</span>
                        <Clock className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">
                        {dashboardData.networkHealth.networkLatency}ms
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">avg response</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Block Time Average</span>
                        <span className="font-medium">{dashboardData.networkHealth.averageBlockTime}s</span>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Consensus Health</span>
                        <span className="font-medium">{dashboardData.networkHealth.consensusHealth}%</span>
                      </div>
                      <Progress value={dashboardData.networkHealth.consensusHealth} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Recent Transactions */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-orange-500" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>Latest blockchain transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {dashboardData.transactions.confirmed}
                      </div>
                      <div className="text-xs text-green-600">Confirmed</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600">
                        {dashboardData.transactions.pending}
                      </div>
                      <div className="text-xs text-yellow-600">Pending</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-3 rounded-lg">
                      <div className="text-xl font-bold text-red-600">
                        {dashboardData.transactions.failed}
                      </div>
                      <div className="text-xs text-red-600">Failed</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {dashboardData.transactions.last24h}
                      </div>
                      <div className="text-xs text-blue-600">Last 24h</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Latest Activity</h4>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View All
                      </Button>
                    </div>
                    {recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                            {tx.type === "product-creation" && <Package className="w-5 h-5 text-white" />}
                            {tx.type === "payment" && <CreditCard className="w-5 h-5 text-white" />}
                            {tx.type === "product-transfer" && <ArrowUpRight className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded font-mono border">
                                {tx.txId.slice(0, 10)}...{tx.txId.slice(-6)}
                              </code>
                              <Badge className={getTransactionTypeColor(tx.type)}>
                                {tx.type.replace('-', ' ')}
                              </Badge>
                              {getStatusBadge(tx.status)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {tx.productName} • Block #{tx.blockNumber}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {tx.value}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="nodes" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-orange-500" />
                  Network Nodes Status
                </CardTitle>
                <CardDescription>Monitor all nodes in your Hyperledger Fabric network</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {networkNodes.map((node) => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                          {getNodeTypeIcon(node.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {node.id}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {node.type.toUpperCase()}
                            </Badge>
                            {getStatusBadge(node.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>📍 {node.location}</span>
                            <span>⏱️ Uptime: {node.uptime}</span>
                            <span>📦 v{node.version}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {node.transactions.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          transactions processed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-orange-500" />
                  Transaction Analytics
                </CardTitle>
                <CardDescription>Detailed transaction metrics and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200">Total Volume</h3>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {dashboardData.transactions.totalTransactions.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      +{dashboardData.transactions.last24h} in last 24h
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-800 dark:text-purple-200">Current TPS</h3>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {dashboardData.transactions.tps}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      Average: {dashboardData.transactions.averageTime}s per tx
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-200">Success Rate</h3>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {Math.round((dashboardData.transactions.confirmed / dashboardData.transactions.totalTransactions) * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {dashboardData.transactions.failed} failed transactions
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Recent Transaction Activity</h4>
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                          <Hash className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded font-mono">
                              {tx.txId.slice(0, 12)}...{tx.txId.slice(-8)}
                            </code>
                            <Badge className={getTransactionTypeColor(tx.type)}>
                              {tx.type.replace('-', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Block #{tx.blockNumber} • {tx.productName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(tx.status)}
                        <span className="font-semibold">{tx.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consensus" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Consensus Mechanism
                </CardTitle>
                <CardDescription>Monitor consensus algorithm and validator nodes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-4">Algorithm Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Algorithm:</span>
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                            {dashboardData.consensus.algorithm}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          {getStatusBadge(dashboardData.consensus.status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Leader Node:</span>
                          <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded">
                            {dashboardData.consensus.leaderNode}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Consensus Time:</span>
                          <span className="font-medium">{dashboardData.consensus.consensusTime}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">Validator Nodes</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Validators:</span>
                          <span className="font-bold text-blue-800 dark:text-blue-200">
                            {dashboardData.consensus.validatorNodes}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Active Proposals:</span>
                          <span className="font-bold text-blue-800 dark:text-blue-200">
                            {dashboardData.consensus.activeProposals}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4">Performance Metrics</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Consensus Efficiency</span>
                            <span className="font-medium">{dashboardData.networkHealth.consensusHealth}%</span>
                          </div>
                          <Progress value={dashboardData.networkHealth.consensusHealth} className="h-3" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Fault Tolerance</span>
                            <span className="font-medium">{dashboardData.networkHealth.faultTolerance}%</span>
                          </div>
                          <Progress value={dashboardData.networkHealth.faultTolerance} className="h-3" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" size="sm" className="w-full">
                          <Play className="w-4 h-4 mr-2" />
                          Start Consensus
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  Security Overview
                </CardTitle>
                <CardDescription>Monitor security status and threat detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4">Security Status</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Overall Status:</span>
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Secure
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Threats Detected:</span>
                          <span className="font-bold text-green-600">
                            {dashboardData.security.threatsDetected}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Last Scan:</span>
                          <span className="text-sm text-gray-500">
                            {new Date(dashboardData.security.lastSecurityScan).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">Certificates</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Valid Certificates:</span>
                          <span className="font-bold text-green-600">
                            {dashboardData.security.certificatesValid}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Expiring Soon:</span>
                          <span className="font-bold text-yellow-600">
                            {dashboardData.security.certificatesExpiring}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-4">Encryption & Keys</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Encryption:</span>
                          <Badge variant="outline">
                            {dashboardData.security.encryptionLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Key Rotation:</span>
                          <Badge
                            className={
                              dashboardData.security.keyRotation
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }
                          >
                            {dashboardData.security.keyRotation ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Access Control:</span>
                          <Badge
                            className={
                              dashboardData.security.accessControlActive
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }
                          >
                            {dashboardData.security.accessControlActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-4">Security Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Run Scan
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Key className="w-4 h-4 mr-2" />
                          Rotate Keys
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Lock className="w-4 w-4 mr-2" />
                          Update Certs
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Export Logs
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-orange-500" />
                  System Health Monitoring
                </CardTitle>
                <CardDescription>Monitor system resources and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-blue-800 dark:text-blue-200">CPU Usage</span>
                      </div>
                      <span className={`font-bold text-xl ${getHealthColor(100 - dashboardData.systemHealth.cpuUsage)}`}>
                        {dashboardData.systemHealth.cpuUsage}%
                      </span>
                    </div>
                    <Progress value={dashboardData.systemHealth.cpuUsage} className="h-3 mb-2" />
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Normal operating range
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-green-800 dark:text-green-200">Memory Usage</span>
                      </div>
                      <span className={`font-bold text-xl ${getHealthColor(100 - dashboardData.systemHealth.memoryUsage)}`}>
                        {dashboardData.systemHealth.memoryUsage}%
                      </span>
                    </div>
                    <Progress value={dashboardData.systemHealth.memoryUsage} className="h-3 mb-2" />
                    <div className="text-sm text-green-600 dark:text-green-400">
                      8.2GB of 12GB used
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-purple-500" />
                        <span className="font-semibold text-purple-800 dark:text-purple-200">Disk Usage</span>
                      </div>
                      <span className={`font-bold text-xl ${getHealthColor(100 - dashboardData.systemHealth.diskUsage)}`}>
                        {dashboardData.systemHealth.diskUsage}%
                      </span>
                    </div>
                    <Progress value={dashboardData.systemHealth.diskUsage} className="h-3 mb-2" />
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      64GB of 200GB used
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-amber-500" />
                        <span className="font-semibold text-amber-800 dark:text-amber-200">Network I/O</span>
                      </div>
                      <span className="font-bold text-xl text-amber-800 dark:text-amber-200">
                        {dashboardData.systemHealth.networkIO} MB/s
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                      <span>↑ Upload: 45 MB/s</span>
                      <span>↓ Download: 83 MB/s</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-rose-500" />
                        <span className="font-semibold text-rose-800 dark:text-rose-200">Active Channels</span>
                      </div>
                      <span className="font-bold text-xl text-rose-800 dark:text-rose-200">
                        {dashboardData.systemHealth.activeChannels}
                      </span>
                    </div>
                    <div className="text-sm text-rose-600 dark:text-rose-400">
                      All channels operational
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-teal-500" />
                        <span className="font-semibold text-teal-800 dark:text-teal-200">Connected Peers</span>
                      </div>
                      <span className="font-bold text-xl text-teal-800 dark:text-teal-200">
                        {dashboardData.systemHealth.connectedPeers}
                      </span>
                    </div>
                    <div className="text-sm text-teal-600 dark:text-teal-400">
                      Maximum capacity reached
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Quick Actions */}
      <div
        className={`transform transition-all duration-700 delay-600 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used blockchain management tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 border-orange-200 hover:border-orange-300"
              >
                <Hash className="h-6 w-6 text-orange-600" />
                <span className="text-xs font-medium">All Transactions</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 border-orange-200 hover:border-orange-300"
              >
                <Shield className="h-6 w-6 text-orange-600" />
                <span className="text-xs font-medium">Security Scan</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 border-orange-200 hover:border-orange-300"
              >
                <Settings className="h-6 w-6 text-orange-600" />
                <span className="text-xs font-medium">Consensus Config</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 border-orange-200 hover:border-orange-300"
              >
                <Download className="h-6 w-6 text-orange-600" />
                <span className="text-xs font-medium">Export Logs</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 border-orange-200 hover:border-orange-300"
              >
                <Activity className="h-6 w-6 text-orange-600" />
                <span className="text-xs font-medium">Health Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Real-time Status Bar */}
      <div
        className={`fixed bottom-6 right-6 transform transition-all duration-700 delay-800 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="font-medium">Network: Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="font-medium">TPS: {dashboardData.transactions.tps}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-purple-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="font-medium">Latency: {dashboardData.networkHealth.networkLatency}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-orange-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="font-medium">Health: {dashboardData.systemHealth.overallHealth}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}