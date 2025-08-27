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
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Scan,
  RefreshCw,
  Settings,
  Users,
  FileText,
  Activity
} from 'lucide-react';

interface SecuritySettings {
  encryption: {
    algorithm: 'AES-256' | 'AES-128' | 'RSA-4096';
    keyRotation: boolean;
    keyRotationInterval: number; // hours
  };
  access: {
    method: 'RBAC' | 'ABAC' | 'MFA';
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
  };
  audit: {
    enabled: boolean;
    level: 'basic' | 'detailed' | 'full';
    retention: number; // days
  };
  network: {
    tlsVersion: '1.2' | '1.3';
    certificateValidation: boolean;
    ipWhitelisting: boolean;
  };
}

interface SecurityThreat {
  id: string;
  type: 'intrusion' | 'malware' | 'suspicious' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  status: 'detected' | 'investigating' | 'resolved';
  source?: string;
}

const SecurityPage = () => {
  const [settings, setSettings] = useState<SecuritySettings>({
    encryption: {
      algorithm: 'AES-256',
      keyRotation: true,
      keyRotationInterval: 24
    },
    access: {
      method: 'RBAC',
      sessionTimeout: 30,
      maxLoginAttempts: 3
    },
    audit: {
      enabled: true,
      level: 'detailed',
      retention: 90
    },
    network: {
      tlsVersion: '1.3',
      certificateValidation: true,
      ipWhitelisting: false
    }
  });

  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [securityScore, setSecurityScore] = useState(95);
  const [lastScan, setLastScan] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Generate mock threats and initialize
  useEffect(() => {
    const mockThreats: SecurityThreat[] = [
      {
        id: 'threat_001',
        type: 'suspicious',
        severity: 'medium',
        description: 'Multiple failed login attempts from IP 192.168.1.100',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'investigating',
        source: '192.168.1.100'
      },
      {
        id: 'threat_002',
        type: 'policy_violation',
        severity: 'low',
        description: 'User accessed restricted channel outside business hours',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'resolved',
        source: 'vendor_user_001'
      },
      {
        id: 'threat_003',
        type: 'intrusion',
        severity: 'high',
        description: 'Unauthorized certificate access attempt detected',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: 'resolved',
        source: 'unknown'
      }
    ];
    
    setThreats(mockThreats);
    setLastScan(new Date(Date.now() - 15 * 60 * 1000).toISOString());
  }, []);

  const runSecurityScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setLastScan(new Date().toISOString());
      setSecurityScore(Math.max(90, Math.floor(Math.random() * 10) + 90));
      setIsScanning(false);
      
      // Simulate finding a new threat occasionally
      if (Math.random() > 0.7) {
        const newThreat: SecurityThreat = {
          id: `threat_${Date.now()}`,
          type: 'suspicious',
          severity: 'low',
          description: 'Unusual transaction pattern detected',
          timestamp: new Date().toISOString(),
          status: 'detected',
          source: 'network_monitor'
        };
        setThreats(prev => [newThreat, ...prev.slice(0, 4)]);
      }
    }, 3000);
  };

  const getSeverityBadge = (severity: SecurityThreat['severity']) => {
    const variants = {
      low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
      high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300',
      critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[severity]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: SecurityThreat['status']) => {
    const variants = {
      detected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300',
      investigating: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
      resolved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300'
    };

    const icons = {
      detected: AlertTriangle,
      investigating: Eye,
      resolved: CheckCircle
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const activeThreatCount = threats.filter(t => t.status === 'detected' || t.status === 'investigating').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Security Management</h1>
          <p className="text-muted-foreground">
            Monitor and configure blockchain security settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            securityScore >= 90 ? 'bg-green-500' : 
            securityScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm font-medium">Security Score: {securityScore}/100</span>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className={`text-2xl font-bold ${getSecurityScoreColor(securityScore)}`}>
                  {securityScore}/100
                </p>
              </div>
              <Shield className={`h-8 w-8 ${getSecurityScoreColor(securityScore)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold text-red-600">{activeThreatCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Encryption</p>
                <p className="text-2xl font-bold text-blue-600">{settings.encryption.algorithm}</p>
              </div>
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Scan</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatTimeAgo(lastScan)}
                </p>
              </div>
              <Scan className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Security Configuration
            </CardTitle>
            <CardDescription>
              Configure encryption and access control settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Encryption Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Encryption
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Algorithm</Label>
                  <Select 
                    value={settings.encryption.algorithm}
                    onValueChange={(value: SecuritySettings['encryption']['algorithm']) =>
                      setSettings(prev => ({
                        ...prev,
                        encryption: { ...prev.encryption, algorithm: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AES-256">AES-256</SelectItem>
                      <SelectItem value="AES-128">AES-128</SelectItem>
                      <SelectItem value="RSA-4096">RSA-4096</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Key Rotation (hours)</Label>
                  <Input
                    type="number"
                    value={settings.encryption.keyRotationInterval}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      encryption: { ...prev.encryption, keyRotationInterval: Number(e.target.value) }
                    }))}
                    min="1"
                    max="168"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={settings.encryption.keyRotation ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    encryption: { ...prev.encryption, keyRotation: !prev.encryption.keyRotation }
                  }))}
                  className="w-20"
                >
                  {settings.encryption.keyRotation ? 'ON' : 'OFF'}
                </Button>
                <Label>Enable automatic key rotation</Label>
              </div>
            </div>

            {/* Access Control */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Access Control
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select 
                    value={settings.access.method}
                    onValueChange={(value: SecuritySettings['access']['method']) =>
                      setSettings(prev => ({
                        ...prev,
                        access: { ...prev.access, method: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RBAC">Role-Based (RBAC)</SelectItem>
                      <SelectItem value="ABAC">Attribute-Based (ABAC)</SelectItem>
                      <SelectItem value="MFA">Multi-Factor Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout (min)</Label>
                  <Input
                    type="number"
                    value={settings.access.sessionTimeout}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      access: { ...prev.access, sessionTimeout: Number(e.target.value) }
                    }))}
                    min="5"
                    max="240"
                  />
                </div>
              </div>
            </div>

            <Button className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Apply Security Settings
            </Button>
          </CardContent>
        </Card>

        {/* Threat Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Threat Detection
            </CardTitle>
            <CardDescription>
              Recent security threats and anomalies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Monitoring</span>
                <Button 
                  size="sm" 
                  onClick={runSecurityScan}
                  disabled={isScanning}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Scanning...' : 'Run Scan'}
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {threats.map((threat) => (
                  <div
                    key={threat.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(threat.severity)}
                        {getStatusBadge(threat.status)}
                      </div>
                      <p className="text-sm font-medium mb-1">{threat.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(threat.timestamp)}</span>
                        {threat.source && (
                          <>
                            <span>•</span>
                            <span>Source: {threat.source}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Audit & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Security Audit & Compliance
          </CardTitle>
          <CardDescription>
            Audit trail and compliance monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Audit Configuration</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={settings.audit.enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      audit: { ...prev.audit, enabled: !prev.audit.enabled }
                    }))}
                    className="w-20"
                  >
                    {settings.audit.enabled ? 'ON' : 'OFF'}
                  </Button>
                  <Label>Enable audit logging</Label>
                </div>
                <div className="space-y-2">
                  <Label>Audit Level</Label>
                  <Select 
                    value={settings.audit.level}
                    onValueChange={(value: SecuritySettings['audit']['level']) =>
                      setSettings(prev => ({
                        ...prev,
                        audit: { ...prev.audit, level: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Network Security</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={settings.network.certificateValidation ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      network: { ...prev.network, certificateValidation: !prev.network.certificateValidation }
                    }))}
                    className="w-20"
                  >
                    {settings.network.certificateValidation ? 'ON' : 'OFF'}
                  </Button>
                  <Label>Certificate validation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={settings.network.ipWhitelisting ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      network: { ...prev.network, ipWhitelisting: !prev.network.ipWhitelisting }
                    }))}
                    className="w-20"
                  >
                    {settings.network.ipWhitelisting ? 'ON' : 'OFF'}
                  </Button>
                  <Label>IP whitelisting</Label>
                </div>
                <div className="space-y-2">
                  <Label>TLS Version</Label>
                  <Select 
                    value={settings.network.tlsVersion}
                    onValueChange={(value: SecuritySettings['network']['tlsVersion']) =>
                      setSettings(prev => ({
                        ...prev,
                        network: { ...prev.network, tlsVersion: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.2">TLS 1.2</SelectItem>
                      <SelectItem value="1.3">TLS 1.3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">API Security</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>API Keys</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKeys(!showApiKeys)}
                  >
                    {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                    {showApiKeys ? 'hlf_api_key_abc123...xyz789' : '••••••••••••••••••••••••'}
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    Regenerate API Key
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPage;