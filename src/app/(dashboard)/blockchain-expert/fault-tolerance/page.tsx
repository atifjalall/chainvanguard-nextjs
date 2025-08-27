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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Shield,
  Server,
  RefreshCw,
  Settings,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  Network,
  Zap
} from 'lucide-react';

interface Node {
  id: string;
  name: string;
  type: 'peer' | 'orderer' | 'ca';
  status: 'online' | 'offline' | 'syncing' | 'error';
  health: number;
  lastSeen: string;
  location: string;
  version: string;
}

interface FaultEvent {
  id: string;
  timestamp: string;
  type: 'node-failure' | 'network-partition' | 'consensus-failure' | 'recovery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  nodeId: string;
  description: string;
  status: 'active' | 'resolved' | 'investigating';
}

const FaultTolerancePage = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [faultEvents, setFaultEvents] = useState<FaultEvent[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalNodes: 0,
    onlineNodes: 0,
    offlineNodes: 0,
    errorNodes: 0,
    averageHealth: 0,
    faultTolerance: 0,
    redundancyLevel: 'High',
    consensusHealth: 98.5
  });

  // Generate mock data
  useEffect(() => {
    generateMockData();
  }, []);

  const generateMockData = () => {
    // Generate nodes
    const nodeTypes: Node['type'][] = ['peer', 'orderer', 'ca'];
    const statuses: Node['status'][] = ['online', 'offline', 'syncing', 'error'];
    const locations = ['US-East', 'EU-West', 'Asia-Pacific', 'US-West', 'EU-Central'];
    
    const mockNodes: Node[] = Array.from({ length: 12 }, (_, index) => {
      const status = index < 9 ? 'online' : statuses[Math.floor(Math.random() * statuses.length)];
      return {
        id: `node_${index + 1}`,
        name: `Node-${(index + 1).toString().padStart(2, '0')}`,
        type: nodeTypes[index % nodeTypes.length],
        status,
        health: status === 'online' ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 50),
        lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        location: locations[Math.floor(Math.random() * locations.length)],
        version: `v${Math.floor(Math.random() * 3) + 2}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`
      };
    });

    // Generate fault events
    const eventTypes: FaultEvent['type'][] = ['node-failure', 'network-partition', 'consensus-failure', 'recovery'];
    const severities: FaultEvent['severity'][] = ['low', 'medium', 'high', 'critical'];
    const eventStatuses: FaultEvent['status'][] = ['active', 'resolved', 'investigating'];

    const mockEvents: FaultEvent[] = Array.from({ length: 20 }, (_, index) => {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      return {
        id: `event_${index + 1}`,
        timestamp: new Date(Date.now() - index * 300000).toISOString(), // 5 minutes apart
        type,
        severity,
        nodeId: mockNodes[Math.floor(Math.random() * mockNodes.length)].id,
        description: getEventDescription(type, severity),
        status: index < 3 ? 'active' : eventStatuses[Math.floor(Math.random() * eventStatuses.length)]
      };
    });

    setNodes(mockNodes);
    setFaultEvents(mockEvents);

    // Calculate stats
    const onlineCount = mockNodes.filter(n => n.status === 'online').length;
    const offlineCount = mockNodes.filter(n => n.status === 'offline').length;
    const errorCount = mockNodes.filter(n => n.status === 'error').length;
    const avgHealth = mockNodes.reduce((sum, node) => sum + node.health, 0) / mockNodes.length;
    const faultTolerance = (onlineCount / mockNodes.length) * 100;

    setStats({
      totalNodes: mockNodes.length,
      onlineNodes: onlineCount,
      offlineNodes: offlineCount,
      errorNodes: errorCount,
      averageHealth: Math.floor(avgHealth),
      faultTolerance: Math.floor(faultTolerance),
      redundancyLevel: faultTolerance > 85 ? 'High' : faultTolerance > 70 ? 'Medium' : 'Low',
      consensusHealth: 95 + Math.random() * 5
    });
  };

  const getEventDescription = (type: FaultEvent['type'], severity: FaultEvent['severity']) => {
    const descriptions = {
      'node-failure': `${severity} node failure detected`,
      'network-partition': `Network partition ${severity} impact`,
      'consensus-failure': `Consensus mechanism ${severity} disruption`,
      'recovery': `System recovery process ${severity} priority`
    };
    return descriptions[type];
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      generateMockData();
      setIsLoading(false);
    }, 1000);
  };

  const getStatusBadge = (status: Node['status']) => {
    const variants = {
      online: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300',
      offline: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300',
      syncing: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
      error: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300'
    };

    const icons = {
      online: CheckCircle,
      offline: XCircle,
      syncing: RefreshCw,
      error: AlertTriangle
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[status]}`}>
        <Icon className={`w-3 h-3 mr-1 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSeverityBadge = (severity: FaultEvent['severity']) => {
    const variants = {
      low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
      high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300',
      critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[severity]}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  const getNodeTypeIcon = (type: Node['type']) => {
    const icons = {
      peer: Database,
      orderer: Server,
      ca: Shield
    };
    const Icon = icons[type];
    return <Icon className="w-4 h-4 text-muted-foreground" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredEvents = faultEvents.filter(event => {
    const now = new Date();
    const eventTime = new Date(event.timestamp);
    const timeDiff = now.getTime() - eventTime.getTime();
    
    switch (selectedTimeRange) {
      case '1h':
        return timeDiff <= 60 * 60 * 1000;
      case '24h':
        return timeDiff <= 24 * 60 * 60 * 1000;
      case '7d':
        return timeDiff <= 7 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Fault Tolerance</h1>
          <p className="text-muted-foreground">
            Monitor system resilience and node health
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
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fault Tolerance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.faultTolerance}%</div>
            <div className="flex items-center mt-2">
              <Progress value={stats.faultTolerance} className="flex-1 mr-2" />
              <Badge variant="outline">{stats.redundancyLevel}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Nodes</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.onlineNodes}/{stats.totalNodes}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.floor((stats.onlineNodes / stats.totalNodes) * 100)}% operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(stats.averageHealth)}`}>
              {stats.averageHealth}%
            </div>
            <p className="text-xs text-muted-foreground">System-wide health</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consensus Health</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.consensusHealth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Consensus performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Node Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Node Status Overview</CardTitle>
          <CardDescription>Real-time status of all network nodes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getNodeTypeIcon(node.type)}
                  <div>
                    <p className="font-medium">{node.name}</p>
                    <p className="text-sm text-muted-foreground">{node.type} • {node.location}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {getStatusBadge(node.status)}
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getHealthColor(node.health)}`}>
                      {node.health}%
                    </span>
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          node.health >= 80 ? 'bg-green-500' : 
                          node.health >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${node.health}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fault Events */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fault Events</CardTitle>
              <CardDescription>Recent system events and failures</CardDescription>
            </div>
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {event.type === 'recovery' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium capitalize">{event.type.replace('-', ' ')}</p>
                      {getSeverityBadge(event.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(event.timestamp)}</span>
                      <span>•</span>
                      <span>Node: {event.nodeId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge 
                    variant={event.status === 'resolved' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Resilience Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Redundancy Levels</CardTitle>
            <CardDescription>System backup and failover capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Replication</span>
                <span className="text-sm font-medium">3x Redundancy</span>
              </div>
              <Progress value={90} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Node Backup</span>
                <span className="text-sm font-medium">Active Standby</span>
              </div>
              <Progress value={85} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Network Failover</span>
                <span className="text-sm font-medium">Auto-Recovery</span>
              </div>
              <Progress value={95} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery Metrics</CardTitle>
            <CardDescription>System recovery and restoration times</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Recovery Time Objective (RTO)</p>
                <p className="text-xs text-muted-foreground">Maximum downtime</p>
              </div>
              <span className="text-lg font-bold text-green-600"> 2 min</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Recovery Point Objective (RPO)</p>
                <p className="text-xs text-muted-foreground">Maximum data loss</p>
              </div>
              <span className="text-lg font-bold text-blue-600"> 10 sec</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Mean Time to Recovery</p>
                <p className="text-xs text-muted-foreground">Average recovery time</p>
              </div>
              <span className="text-lg font-bold text-purple-600">45 sec</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FaultTolerancePage;