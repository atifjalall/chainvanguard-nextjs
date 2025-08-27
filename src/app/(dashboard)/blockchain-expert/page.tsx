"use client";

import {
  useState,
  useEffect,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  ReactPortal,
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
      cpuUsage: 67,
      memoryUsage: 72,
      diskUsage: 45,
      networkIO: 38,
      blockProcessing: 94,
      consensusEfficiency: 97,
      overallHealth: 86,
    },
    security: {
      securityScore: 95,
      activeThreat: 2,
      encryption: "AES-256",
      lastScan: "15m ago",
      activeAlerts: 3,
      keyRotation: true,
    },
    consensus: {
      status: "active" as StatusType,
      algorithm: "PBFT",
      blockTime: 5,
      batchSize: 100,
      participatingNodes: 10,
    },
    transactions: {
      total: 15847,
      confirmed: 15234,
      pending: 45,
      failed: 12,
      last24h: 1247,
      tps: 157,
    },
  });

  // Recent transactions state
  const [recentTransactions, setRecentTransactions] = useState([
    {
      id: "tx_001",
      txId: "0x1234567890abcdef",
      type: "product-creation" as TransactionType,
      status: "confirmed" as StatusType,
      from: "supplier_abc123",
      to: "vendor_def456",
      value: "25.99 HLFC",
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      blockNumber: 15847,
      productName: "Organic Coffee Beans",
    },
    {
      id: "tx_002",
      txId: "0x2345678901bcdef0",
      type: "payment" as TransactionType,
      status: "confirmed" as StatusType,
      from: "vendor_def456",
      to: "customer_ghi789",
      value: "199.99 HLFC",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      blockNumber: 15846,
      productName: null,
    },
    {
      id: "tx_003",
      txId: "0x3456789012cdef12",
      type: "consensus" as TransactionType,
      status: "pending" as StatusType,
      from: "peer_node_01",
      to: "orderer_node",
      value: "0 HLFC",
      timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      blockNumber: 15848,
      productName: null,
    },
  ]);

  // Network nodes state
  const [networkNodes, setNetworkNodes] = useState([
    {
      id: "peer0.org1.supply.com",
      name: "Peer 0 - Supplier Org",
      type: "peer" as NodeType,
      status: "online" as StatusType,
      health: 95,
      lastSeen: "30s ago",
      blockHeight: 15847,
    },
    {
      id: "peer1.org2.vendor.com",
      name: "Peer 1 - Vendor Org",
      type: "peer" as NodeType,
      status: "online" as StatusType,
      health: 89,
      lastSeen: "45s ago",
      blockHeight: 15847,
    },
    {
      id: "orderer.supply.com",
      name: "Orderer Node",
      type: "orderer" as NodeType,
      status: "online" as StatusType,
      health: 98,
      lastSeen: "15s ago",
      blockHeight: 15847,
    },
    {
      id: "peer0.org3.ministry.com",
      name: "Peer 0 - Ministry Org",
      type: "peer" as NodeType,
      status: "syncing" as StatusType,
      health: 76,
      lastSeen: "2m ago",
      blockHeight: 15845,
    },
    {
      id: "ca.supply.com",
      name: "Certificate Authority",
      type: "ca" as NodeType,
      status: "offline" as StatusType,
      health: 0,
      lastSeen: "5m ago",
      blockHeight: 15840,
    },
  ]);

  // System alerts
  const [systemAlerts, setSystemAlerts] = useState([
    {
      id: "alert_001",
      type: "warning" as AlertType,
      message: "Node peer0.org3.ministry.com is behind by 2 blocks",
      timestamp: "2m ago",
      severity: "medium",
    },
    {
      id: "alert_002",
      type: "info" as AlertType,
      message: "Block 15847 confirmed by all peers",
      timestamp: "5m ago",
      severity: "low",
    },
    {
      id: "alert_003",
      type: "error" as AlertType,
      message: "CA node offline - certificate services affected",
      timestamp: "5m ago",
      severity: "high",
    },
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setDashboardData((prev) => ({
        ...prev,
        networkHealth: {
          ...prev.networkHealth,
          transactionThroughput: 1200 + Math.floor(Math.random() * 100),
          networkLatency: 40 + Math.floor(Math.random() * 20),
        },
        transactions: {
          ...prev.transactions,
          tps: 150 + Math.floor(Math.random() * 20),
        },
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Simulate data refresh
      setDashboardData((prev) => ({
        ...prev,
        networkHealth: {
          ...prev.networkHealth,
          transactionThroughput: 1200 + Math.floor(Math.random() * 100),
          networkLatency: 40 + Math.floor(Math.random() * 20),
        },
      }));
      setIsLoading(false);
    }, 1000);
  };

  const handleConsensusAction = (action: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setDashboardData((prev) => ({
        ...prev,
        consensus: {
          ...prev.consensus,
          status: (action === "pause"
            ? "paused"
            : action === "restart"
              ? "syncing"
              : "active") as StatusType,
        },
      }));
      setIsLoading(false);
    }, 1000);
  };

  const getStatusBadge = (status: StatusType) => {
    const variants: Record<StatusType, string> = {
      online: "bg-green-100 text-green-800",
      offline: "bg-red-100 text-red-800",
      syncing: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
    };

    const icons: Record<
      StatusType,
      React.ComponentType<{ className?: string }>
    > = {
      online: CheckCircle,
      offline: XCircle,
      syncing: Clock,
      confirmed: CheckCircle,
      pending: Clock,
      failed: XCircle,
      active: Play,
      paused: Pause,
    };

    const Icon = icons[status];

    return (
      <Badge className={variants[status]}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getNodeTypeIcon = (type: NodeType) => {
    const icons: Record<
      NodeType,
      React.ComponentType<{ className?: string }>
    > = {
      peer: Server,
      orderer: Network,
      ca: Shield,
    };
    const Icon = icons[type] || Database;
    return <Icon className="h-4 w-4" />;
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    const colors: Record<TransactionType, string> = {
      "product-creation": "bg-blue-100 text-blue-800",
      "product-transfer": "bg-purple-100 text-purple-800",
      payment: "bg-green-100 text-green-800",
      consensus: "bg-orange-100 text-orange-800",
      audit: "bg-red-100 text-red-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return "text-green-600";
    if (health >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getAlertIcon = (type: AlertType) => {
    const icons: Record<
      AlertType,
      React.ComponentType<{ className?: string }>
    > = {
      warning: AlertTriangle,
      error: XCircle,
      info: CheckCircle,
    };
    const Icon = icons[type];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blockchain Expert Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive network monitoring and administration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Network Health
                </p>
                <p className="text-2xl font-bold">
                  {dashboardData.systemHealth.overallHealth}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <Progress
              value={dashboardData.systemHealth.overallHealth}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Online Nodes
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.networkHealth.onlineNodes}/
                  {dashboardData.networkHealth.totalNodes}
                </p>
              </div>
              <Server className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(
                (dashboardData.networkHealth.onlineNodes /
                  dashboardData.networkHealth.totalNodes) *
                  100
              )}
              % operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">TPS</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.transactions.tps}
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Transactions per second
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Security Score
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.security.securityScore}/100
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last scan: {dashboardData.security.lastScan}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Consensus
                </p>
                <p className="text-2xl font-bold">
                  {dashboardData.consensus.algorithm}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-1">
              {getStatusBadge(dashboardData.consensus.status)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nodes">Network Nodes</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="consensus">Consensus</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Network Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Network Performance</CardTitle>
                <CardDescription>Real-time network metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Throughput</span>
                  <span className="font-medium">
                    {dashboardData.networkHealth.transactionThroughput} tx/h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Latency</span>
                  <span className="font-medium">
                    {dashboardData.networkHealth.networkLatency}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Block Time</span>
                  <span className="font-medium">
                    {dashboardData.networkHealth.averageBlockTime}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Consensus Health</span>
                  <span className="font-medium">
                    {dashboardData.networkHealth.consensusHealth}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>
                  Recent alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        alert.severity === "high"
                          ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                          : alert.severity === "medium"
                            ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
                            : "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                      }`}
                    >
                      <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
              <CardDescription>
                Transaction statistics and recent activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.transactions.confirmed}
                  </div>
                  <div className="text-sm text-muted-foreground">Confirmed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {dashboardData.transactions.pending}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardData.transactions.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData.transactions.last24h}
                  </div>
                  <div className="text-sm text-muted-foreground">Last 24h</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Recent Transactions</h4>
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getTransactionTypeColor(tx.type)}>
                        {tx.type}
                      </Badge>
                      <div>
                        <div className="font-mono text-sm">
                          {tx.txId.slice(0, 10)}...{tx.txId.slice(-6)}
                        </div>
                        {tx.productName && (
                          <div className="text-xs text-muted-foreground">
                            {tx.productName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(tx.status)}
                      <span className="font-medium">{tx.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Nodes ({networkNodes.length})</CardTitle>
              <CardDescription>
                Monitor all network nodes and their health status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkNodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        {getNodeTypeIcon(node.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{node.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {node.id}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {node.type}
                          </Badge>
                          {getStatusBadge(node.status)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${getHealthColor(node.health)}`}
                        >
                          {node.health}%
                        </span>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              node.health >= 90
                                ? "bg-green-500"
                                : node.health >= 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${node.health}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Block: {node.blockHeight}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last seen: {node.lastSeen}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Management</CardTitle>
              <CardDescription>
                View and manage blockchain transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">
                    Live: {dashboardData.transactions.pending} pending
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {tx.txId.slice(0, 10)}...{tx.txId.slice(-6)}
                        </code>
                        <Badge className={getTransactionTypeColor(tx.type)}>
                          {tx.type}
                        </Badge>
                        {getStatusBadge(tx.status)}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Block: {tx.blockNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">From: </span>
                        <code className="text-xs">{tx.from}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To: </span>
                        <code className="text-xs">{tx.to}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value: </span>
                        <span className="font-medium">{tx.value}</span>
                      </div>
                      {tx.productName && (
                        <div>
                          <span className="text-muted-foreground">
                            Product:{" "}
                          </span>
                          <span className="font-medium">{tx.productName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consensus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consensus Management</CardTitle>
              <CardDescription>
                Monitor and control consensus protocol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Consensus Controls</h4>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConsensusAction("start")}
                      disabled={
                        dashboardData.consensus.status === "active" || isLoading
                      }
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleConsensusAction("pause")}
                      disabled={
                        dashboardData.consensus.status === "paused" || isLoading
                      }
                      size="sm"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleConsensusAction("restart")}
                      disabled={isLoading}
                      size="sm"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restart
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Consensus Settings</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Algorithm:</span>
                      <span className="font-medium">
                        {dashboardData.consensus.algorithm}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Block Time:</span>
                      <span className="font-medium">
                        {dashboardData.consensus.blockTime}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch Size:</span>
                      <span className="font-medium">
                        {dashboardData.consensus.batchSize}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Participating:
                      </span>
                      <span className="font-medium">
                        {dashboardData.consensus.participatingNodes} nodes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Byzantine Fault Tolerance
                  </h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Network can tolerate up to{" "}
                  {Math.floor(
                    (dashboardData.networkHealth.onlineNodes - 1) / 3
                  )}{" "}
                  faulty nodes while maintaining consensus integrity.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>
                Network security monitoring and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Security Score</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {dashboardData.security.securityScore}/100
                    </div>
                    <Progress
                      value={dashboardData.security.securityScore}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Last scan: {dashboardData.security.lastScan}
                    </p>
                  </div>
                  <Button className="w-full">
                    <Shield className="w-4 h-4 mr-2" />
                    Run Security Scan
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Active Threats</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {dashboardData.security.activeThreat}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Detected threats
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Intrusion attempts</span>
                      <Badge variant="destructive">1</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Suspicious activity</span>
                      <Badge variant="outline">1</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Encryption Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Algorithm</span>
                      <Badge variant="default">
                        {dashboardData.security.encryption}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Key Rotation</span>
                      <Badge
                        variant={
                          dashboardData.security.keyRotation
                            ? "default"
                            : "outline"
                        }
                      >
                        {dashboardData.security.keyRotation
                          ? "Enabled"
                          : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">TLS Version</span>
                      <Badge variant="default">1.3</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    Manage Keys
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Metrics</CardTitle>
              <CardDescription>
                Monitor system performance and resource usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">CPU Usage</span>
                    </div>
                    <span
                      className={`font-bold ${getHealthColor(100 - dashboardData.systemHealth.cpuUsage)}`}
                    >
                      {dashboardData.systemHealth.cpuUsage}%
                    </span>
                  </div>
                  <Progress value={dashboardData.systemHealth.cpuUsage} />
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Memory Usage</span>
                    </div>
                    <span
                      className={`font-bold ${getHealthColor(100 - dashboardData.systemHealth.memoryUsage)}`}
                    >
                      {dashboardData.systemHealth.memoryUsage}%
                    </span>
                  </div>
                  <Progress value={dashboardData.systemHealth.memoryUsage} />
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Disk Usage</span>
                    </div>
                    <span
                      className={`font-bold ${getHealthColor(100 - dashboardData.systemHealth.diskUsage)}`}
                    >
                      {dashboardData.systemHealth.diskUsage}%
                    </span>
                  </div>
                  <Progress value={dashboardData.systemHealth.diskUsage} />
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Network I/O</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {dashboardData.systemHealth.networkIO} MB/s
                    </span>
                  </div>
                  <Progress value={dashboardData.systemHealth.networkIO} />
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Block Processing</span>
                    </div>
                    <span
                      className={`font-bold ${getHealthColor(dashboardData.systemHealth.blockProcessing)}`}
                    >
                      {dashboardData.systemHealth.blockProcessing}%
                    </span>
                  </div>
                  <Progress
                    value={dashboardData.systemHealth.blockProcessing}
                  />
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Consensus Efficiency</span>
                    </div>
                    <span
                      className={`font-bold ${getHealthColor(dashboardData.systemHealth.consensusEfficiency)}`}
                    >
                      {dashboardData.systemHealth.consensusEfficiency}%
                    </span>
                  </div>
                  <Progress
                    value={dashboardData.systemHealth.consensusEfficiency}
                  />
                </div>
              </div>

              {/* Fault Tolerance Section */}
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
<h4 className="font-medium text-green-900 dark:text-green-100">Fault Tolerance</h4>

                  <span className="text-2xl font-bold text-green-600">
                    {dashboardData.networkHealth.faultTolerance}%
                  </span>
                </div>
                <Progress
                  value={dashboardData.networkHealth.faultTolerance}
                  className="mb-2"
                />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
<div className="font-medium text-green-700 dark:text-green-300">Recovery Time</div>

<div className="text-green-600 dark:text-green-400"> 2 min</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-700 dark:text-green-300">Data Loss</div>
<div className="text-green-600 dark:text-green-400"> 10 sec</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-700 dark:text-green-300">MTTR</div>
                    <div className="text-green-600 dark:text-green-400"> 45 sec</div>

                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Monitor className="h-6 w-6" />
              <span className="text-xs">View All Nodes</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Hash className="h-6 w-6" />
              <span className="text-xs">All Transactions</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Shield className="h-6 w-6" />
              <span className="text-xs">Security Scan</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span className="text-xs">Consensus Config</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Download className="h-6 w-6" />
              <span className="text-xs">Export Logs</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Activity className="h-6 w-6" />
              <span className="text-xs">Health Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Status Bar */}
      <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Network: Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>TPS: {dashboardData.transactions.tps}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Latency: {dashboardData.networkHealth.networkLatency}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
