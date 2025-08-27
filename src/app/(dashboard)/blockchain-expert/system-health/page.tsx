"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  Server,
  Network,
  Cpu,
  HardDrive,
  Wifi,
  Zap
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface HealthAlert {
  id: string;
  type: 'performance' | 'capacity' | 'network' | 'security';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface NetworkStats {
  throughput: number;
  latency: number;
  blockHeight: number;
  transactionsPerSecond: number;
  peersConnected: number;
  channelsActive: number;
}

const SystemHealthPage = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    throughput: 0,
    latency: 0,
    blockHeight: 0,
    transactionsPerSecond: 0,
    peersConnected: 0,
    channelsActive: 0
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [isLoading, setIsLoading] = useState(false);
  const [overallHealth, setOverallHealth] = useState(0);

  useEffect(() => {
    generateMockData();
    const interval = setInterval(generateMockData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const generateMockData = () => {
    // Generate system metrics
    const metrics: SystemMetric[] = [
      {
        name: 'CPU Usage',
        value: Math.floor(Math.random() * 30) + 45,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'Memory Usage',
        value: Math.floor(Math.random() * 25) + 60,
        unit: '%',
        status: 'healthy',
        trend: 'up',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'Disk Usage',
        value: Math.floor(Math.random() * 15) + 35,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'Network I/O',
        value: Math.floor(Math.random() * 40) + 20,
        unit: 'MB/s',
        status: 'healthy',
        trend: 'down',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'Block Processing',
        value: Math.floor(Math.random() * 10) + 90,
        unit: '%',
        status: 'healthy',
        trend: 'up',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'Consensus Efficiency',
        value: Math.floor(Math.random() * 5) + 95,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        lastUpdated: new Date().toISOString()
      }
    ];

    // Update status based on values
    metrics.forEach(metric => {
      if (metric.name === 'CPU Usage' || metric.name === 'Memory Usage' || metric.name === 'Disk Usage') {
        if (metric.value > 80) metric.status = 'critical';
        else if (metric.value > 65) metric.status = 'warning';
        else metric.status = 'healthy';
      } else {
        if (metric.value < 70) metric.status = 'critical';
        else if (metric.value < 85) metric.status = 'warning';
        else metric.status = 'healthy';
      }
    });

    setSystemMetrics(metrics);

    // Generate network stats
    setNetworkStats({
      throughput: Math.floor(Math.random() * 500) + 1000,
      latency: Math.floor(Math.random() * 50) + 10,
      blockHeight: Math.floor(Math.random() * 100) + 15420,
      transactionsPerSecond: Math.floor(Math.random() * 200) + 150,
      peersConnected: Math.floor(Math.random() * 3) + 9,
      channelsActive: Math.floor(Math.random() * 2) + 3
    });

    // Generate health alerts
    const alertTypes: HealthAlert['type'][] = ['performance', 'capacity', 'network', 'security'];
    const severities: HealthAlert['severity'][] = ['low', 'medium', 'high'];
    
    const alerts: HealthAlert[] = Array.from({ length: 5 }, (_, index) => ({
      id: `alert_${index + 1}`,
      type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: getAlertMessage(alertTypes[Math.floor(Math.random() * alertTypes.length)]),
      timestamp: new Date(Date.now() - index * 600000).toISOString(),
      resolved: Math.random() > 0.3
    }));

    setHealthAlerts(alerts);

    // Calculate overall health
    const healthyCount = metrics.filter(m => m.status === 'healthy').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    
    const healthScore = ((healthyCount * 100 + warningCount * 60 + criticalCount * 20) / (metrics.length * 100)) * 100;
    setOverallHealth(Math.floor(healthScore));
  };

  const getAlertMessage = (type: HealthAlert['type']) => {
    const messages = {
      performance: 'System performance degradation detected',
      capacity: 'Storage capacity approaching threshold',
      network: 'Network connectivity issues reported',
      security: 'Security scan completed with warnings'
    };
    return messages[type];
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      generateMockData();
      setIsLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: SystemMetric['status']) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
      critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300'
    };

    const icons = {
      healthy: CheckCircle,
      warning: AlertTriangle,
      critical: XCircle
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTrendIcon = (trend: SystemMetric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-600" />;
      case 'stable': return <div className="w-3 h-3 border-t-2 border-gray-400" />;
    }
  };

  const getSeverityBadge = (severity: HealthAlert['severity']) => {
    const variants = {
      low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[severity]}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  const getMetricIcon = (name: string) => {
    const icons = {
      'CPU Usage': Cpu,
      'Memory Usage': Database,
      'Disk Usage': HardDrive,
      'Network I/O': Wifi,
      'Block Processing': Server,
      'Consensus Efficiency': Network
    };
    const Icon = icons[name as keyof typeof icons] || Activity;
    return <Icon className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">
            Monitor overall system performance and health metrics
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
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Health Score</span>
                <span className={`text-2xl font-bold ${getStatusColor(overallHealth > 80 ? 'healthy' : overallHealth > 60 ? 'warning' : 'critical')}`}>
                  {overallHealth}%
                </span>
              </div>
              <Progress value={overallHealth} className="h-3" />
            </div>
            <div className="text-right">
              {getStatusBadge(overallHealth > 80 ? 'healthy' : overallHealth > 60 ? 'warning' : 'critical')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Throughput</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.throughput.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">transactions/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Block Height</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.blockHeight.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">latest block</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Peers</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{networkStats.peersConnected}</div>
            <p className="text-xs text-muted-foreground">connected peers</p>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
          <CardDescription>Real-time system performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemMetrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getMetricIcon(metric.name)}
                  <div>
                    <p className="font-medium">{metric.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {metric.value}{metric.unit}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {getStatusBadge(metric.status)}
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend)}
                    <span className="text-xs text-muted-foreground">trend</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Network Performance</CardTitle>
            <CardDescription>Blockchain network performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Average Latency</p>
                <p className="text-xs text-muted-foreground">Network response time</p>
              </div>
              <span className="text-lg font-bold text-blue-600">{networkStats.latency}ms</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">TPS</p>
                <p className="text-xs text-muted-foreground">Transactions per second</p>
              </div>
              <span className="text-lg font-bold text-green-600">{networkStats.transactionsPerSecond}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Active Channels</p>
                <p className="text-xs text-muted-foreground">Blockchain channels</p>
              </div>
              <span className="text-lg font-bold text-purple-600">{networkStats.channelsActive}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>System health alerts and warnings</CardDescription>
              </div>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7d</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {healthAlerts.slice(0, 6).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between p-3 border rounded-lg transition-colors ${
                    alert.resolved ? 'opacity-60' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {alert.resolved ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-sm capitalize">{alert.type}</p>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{alert.message}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={alert.resolved ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {alert.resolved ? 'Resolved' : 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealthPage;