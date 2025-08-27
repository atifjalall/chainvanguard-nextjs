"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  FileText,
  Clock,
  Database,
  Shield,
  Settings
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  component: string;
  message: string;
  details?: string;
}

const BlockchainLogsPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedComponent, setSelectedComponent] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Generate mock logs
  useEffect(() => {
    generateMockLogs();
  }, []);

  const generateMockLogs = () => {
    const levels: LogEntry['level'][] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const components = ['peer', 'orderer', 'chaincode', 'consensus', 'network', 'security'];
    
    const logMessages = {
      INFO: [
        'New block committed to ledger',
        'Transaction endorsed successfully',
        'Peer connected to network',
        'Channel joined successfully',
        'Smart contract deployed',
        'Node synchronized with network'
      ],
      WARN: [
        'High transaction volume detected',
        'Peer connection timeout',
        'Channel capacity approaching limit',
        'Endorsement policy mismatch',
        'Network latency increased'
      ],
      ERROR: [
        'Failed to commit transaction',
        'Peer disconnected from network',
        'Chaincode invocation failed',
        'Consensus timeout',
        'Invalid transaction signature'
      ],
      DEBUG: [
        'Processing endorsement request',
        'Validating transaction proposal',
        'Checking access control policies',
        'Updating world state',
        'Broadcasting block to peers'
      ]
    };

    const mockLogs: LogEntry[] = Array.from({ length: 100 }, (_, index) => {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const component = components[Math.floor(Math.random() * components.length)];
      const messages = logMessages[level];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      return {
        id: `log_${(100 - index).toString().padStart(6, '0')}`,
        timestamp: new Date(Date.now() - index * 30000).toISOString(), // 30 seconds apart
        level,
        component,
        message,
        details: Math.random() > 0.7 ? `Additional context for ${component} component` : undefined
      };
    });

    setLogs(mockLogs);
    setFilteredLogs(mockLogs);
  };

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    if (selectedComponent !== 'all') {
      filtered = filtered.filter(log => log.component === selectedComponent);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, selectedLevel, selectedComponent, logs]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      generateMockLogs();
      setIsLoading(false);
    }, 1000);
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Level', 'Component', 'Message', 'Details'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.component,
        log.message,
        log.details || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blockchain_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: LogEntry['level']) => {
    const variants = {
      INFO: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300',
      WARN: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
      ERROR: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300',
      DEBUG: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300'
    };

    const icons = {
      INFO: Info,
      WARN: AlertTriangle,
      ERROR: AlertCircle,
      DEBUG: Settings
    };

    const Icon = icons[level];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[level]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {level}
      </span>
    );
  };

  const getComponentIcon = (component: string) => {
    const icons: Record<string, React.ElementType> = {
      peer: Database,
      orderer: Shield,
      chaincode: FileText,
      consensus: CheckCircle,
      network: Settings,
      security: Shield
    };

    const Icon = icons[component] || FileText;
    return <Icon className="w-4 h-4 text-muted-foreground" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getLogCounts = () => {
    return {
      total: filteredLogs.length,
      info: filteredLogs.filter(log => log.level === 'INFO').length,
      warn: filteredLogs.filter(log => log.level === 'WARN').length,
      error: filteredLogs.filter(log => log.level === 'ERROR').length,
      debug: filteredLogs.filter(log => log.level === 'DEBUG').length
    };
  };

  const counts = getLogCounts();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Blockchain Logs</h1>
          <p className="text-muted-foreground">
            Monitor system logs and network events
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
          <Button onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counts.total}</div>
            <p className="text-xs text-muted-foreground">Total Logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{counts.info}</div>
            <p className="text-xs text-muted-foreground">Info</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{counts.warn}</div>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{counts.error}</div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{counts.debug}</div>
            <p className="text-xs text-muted-foreground">Debug</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARN">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="DEBUG">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedComponent} onValueChange={setSelectedComponent}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Component" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Components</SelectItem>
                <SelectItem value="peer">Peer</SelectItem>
                <SelectItem value="orderer">Orderer</SelectItem>
                <SelectItem value="chaincode">Chaincode</SelectItem>
                <SelectItem value="consensus">Consensus</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Real-time system logs and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center gap-2 min-w-0">
                  {getLevelBadge(log.level)}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getComponentIcon(log.component)}
                    <span>{log.component}</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">{log.message}</p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground">{log.details}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Network Status</p>
                <p className="text-xs text-muted-foreground">All nodes online</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Security</p>
                <p className="text-xs text-muted-foreground">No threats detected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Consensus</p>
                <p className="text-xs text-muted-foreground">Operating normally</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainLogsPage;