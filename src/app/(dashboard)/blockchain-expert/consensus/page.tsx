"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users,
  CheckCircle,
  Clock,
  Settings,
  Activity,
  Shield,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp
} from 'lucide-react';

interface Node {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'syncing';
  role: 'peer' | 'orderer';
  lastSeen: string;
  blockHeight: number;
}

interface ConsensusSettings {
  algorithm: 'PBFT' | 'Raft' | 'PoW' | 'PoS';
  blockTime: number;
  batchSize: number;
  timeout: number;
  minNodes: number;
}

const ConsensusPage = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [settings, setSettings] = useState<ConsensusSettings>({
    algorithm: 'PBFT',
    blockTime: 5,
    batchSize: 100,
    timeout: 30,
    minNodes: 4
  });
  const [consensusStatus, setConsensusStatus] = useState<'active' | 'paused' | 'syncing'>('active');
  const [isLoading, setIsLoading] = useState(false);

  // Generate mock nodes
  useEffect(() => {
    const mockNodes: Node[] = [
      {
        id: 'peer-0',
        name: 'Peer Node 0',
        status: 'online',
        role: 'peer',
        lastSeen: new Date().toISOString(),
        blockHeight: 15847
      },
      {
        id: 'peer-1', 
        name: 'Peer Node 1',
        status: 'online',
        role: 'peer',
        lastSeen: new Date(Date.now() - 30000).toISOString(),
        blockHeight: 15847
      },
      {
        id: 'orderer-0',
        name: 'Orderer Node 0',
        status: 'online',
        role: 'orderer',
        lastSeen: new Date(Date.now() - 10000).toISOString(),
        blockHeight: 15847
      },
      {
        id: 'peer-2',
        name: 'Peer Node 2',
        status: 'syncing',
        role: 'peer',
        lastSeen: new Date(Date.now() - 120000).toISOString(),
        blockHeight: 15845
      },
      {
        id: 'orderer-1',
        name: 'Orderer Node 1',
        status: 'offline',
        role: 'orderer',
        lastSeen: new Date(Date.now() - 300000).toISOString(),
        blockHeight: 15840
      }
    ];
    setNodes(mockNodes);
  }, []);

  const getNodeCounts = () => {
    const online = nodes.filter(n => n.status === 'online').length;
    const offline = nodes.filter(n => n.status === 'offline').length;
    const syncing = nodes.filter(n => n.status === 'syncing').length;
    return { online, offline, syncing, total: nodes.length };
  };

  const getStatusBadge = (status: Node['status']) => {
    const variants = {
      online: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300',
      offline: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300',
      syncing: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
    };

    const icons = {
      online: CheckCircle,
      offline: AlertCircle,
      syncing: Clock
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: Node['role']) => {
    const variant = role === 'orderer' ? 'default' : 'secondary';
    return <Badge variant={variant}>{role}</Badge>;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleSettingsUpdate = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // In real app, this would update the consensus configuration
    }, 1500);
  };

  const handleConsensusAction = (action: 'start' | 'pause' | 'restart') => {
    setIsLoading(true);
    setTimeout(() => {
      switch (action) {
        case 'start':
          setConsensusStatus('active');
          break;
        case 'pause':
          setConsensusStatus('paused');
          break;
        case 'restart':
          setConsensusStatus('syncing');
          setTimeout(() => setConsensusStatus('active'), 2000);
          break;
      }
      setIsLoading(false);
    }, 1000);
  };

  const counts = getNodeCounts();
  const consensusHealth = Math.round((counts.online / counts.total) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Consensus Management</h1>
          <p className="text-muted-foreground">
            Monitor and configure blockchain consensus protocol
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            consensusStatus === 'active' ? 'bg-green-500' : 
            consensusStatus === 'paused' ? 'bg-yellow-500' : 'bg-blue-500'
          } animate-pulse`}></div>
          <span className="text-sm font-medium capitalize">{consensusStatus}</span>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Consensus Health</p>
                <p className="text-2xl font-bold">{consensusHealth}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Nodes</p>
                <p className="text-2xl font-bold text-green-600">{counts.online}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Block Time</p>
                <p className="text-2xl font-bold">{settings.blockTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Algorithm</p>
                <p className="text-2xl font-bold">{settings.algorithm}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consensus Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Consensus Controls
            </CardTitle>
            <CardDescription>
              Manage consensus protocol operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => handleConsensusAction('start')}
                disabled={consensusStatus === 'active' || isLoading}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleConsensusAction('pause')}
                disabled={consensusStatus === 'paused' || isLoading}
                className="flex-1"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleConsensusAction('restart')}
                disabled={isLoading}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{consensusStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nodes:</span>
                  <span className="font-medium">{counts.online}/{counts.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Required:</span>
                  <span className="font-medium">{settings.minNodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeout:</span>
                  <span className="font-medium">{settings.timeout}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Adjust consensus protocol parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="algorithm">Consensus Algorithm</Label>
              <Select value={settings.algorithm} onValueChange={(value: ConsensusSettings['algorithm']) => 
                setSettings(prev => ({ ...prev, algorithm: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PBFT">PBFT (Practical Byzantine Fault Tolerance)</SelectItem>
                  <SelectItem value="Raft">Raft</SelectItem>
                  <SelectItem value="PoW">Proof of Work</SelectItem>
                  <SelectItem value="PoS">Proof of Stake</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blockTime">Block Time (seconds)</Label>
                <Input
                  id="blockTime"
                  type="number"
                  value={settings.blockTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, blockTime: Number(e.target.value) }))}
                  min="1"
                  max="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  value={settings.batchSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, batchSize: Number(e.target.value) }))}
                  min="10"
                  max="1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={settings.timeout}
                  onChange={(e) => setSettings(prev => ({ ...prev, timeout: Number(e.target.value) }))}
                  min="5"
                  max="120"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minNodes">Min Nodes</Label>
                <Input
                  id="minNodes"
                  type="number"
                  value={settings.minNodes}
                  onChange={(e) => setSettings(prev => ({ ...prev, minNodes: Number(e.target.value) }))}
                  min="3"
                  max="10"
                />
              </div>
            </div>

            <Button 
              onClick={handleSettingsUpdate} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Apply Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Network Nodes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Network Nodes ({nodes.length})
          </CardTitle>
          <CardDescription>
            Monitor participating consensus nodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{node.name}</span>
                      {getRoleBadge(node.role)}
                    </div>
                    <span className="text-sm text-muted-foreground">{node.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">Block #{node.blockHeight}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(node.lastSeen)}
                    </div>
                  </div>
                  {getStatusBadge(node.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Consensus Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Network Healthy</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {counts.online} of {counts.total} nodes online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Byzantine Fault Tolerance</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Can tolerate {Math.floor((counts.total - 1) / 3)} faulty nodes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900 dark:text-purple-100">Block Production</p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Avg {settings.blockTime}s per block
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsensusPage;