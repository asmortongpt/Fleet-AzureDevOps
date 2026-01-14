import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  MapPin,
  Cloud,
  Database,
  Key,
  Zap,
} from 'lucide-react';

type ServiceStatus = 'connected' | 'disconnected' | 'testing' | 'configured' | 'not_configured';

interface ServiceInfo {
  name: string;
  status: ServiceStatus;
  lastCheck?: Date;
  error?: string;
  description: string;
  category: 'maps' | 'auth' | 'cloud' | 'ai' | 'database' | 'internal';
  icon: React.ReactNode;
  configKey?: string;
  docsUrl?: string;
}

export function ExternalServicesStatus() {
  const [services, setServices] = useState<ServiceInfo[]>([
    {
      name: 'Google Maps API',
      status: 'testing',
      description: 'Real-time vehicle location mapping and geocoding',
      category: 'maps',
      icon: <MapPin className="h-5 w-5" />,
      configKey: 'VITE_GOOGLE_MAPS_API_KEY',
      docsUrl: 'https://developers.google.com/maps/documentation',
    },
    {
      name: 'Azure AD Authentication',
      status: 'testing',
      description: 'Single sign-on and user authentication',
      category: 'auth',
      icon: <Key className="h-5 w-5" />,
      configKey: 'VITE_AZURE_AD_CLIENT_ID',
      docsUrl: 'https://learn.microsoft.com/en-us/azure/active-directory/',
    },
    {
      name: 'Microsoft Graph API',
      status: 'testing',
      description: 'Office 365 integration and user profile data',
      category: 'cloud',
      icon: <Cloud className="h-5 w-5" />,
      configKey: 'VITE_MICROSOFT_GRAPH_CLIENT_ID',
      docsUrl: 'https://learn.microsoft.com/en-us/graph/',
    },
    {
      name: 'Azure OpenAI',
      status: 'testing',
      description: 'AI-powered insights and natural language processing',
      category: 'ai',
      icon: <Zap className="h-5 w-5" />,
      configKey: 'VITE_AZURE_OPENAI_ENDPOINT',
      docsUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/',
    },
    {
      name: 'PostgreSQL Database',
      status: 'testing',
      description: 'Primary data storage and persistence layer',
      category: 'database',
      icon: <Database className="h-5 w-5" />,
      docsUrl: 'https://www.postgresql.org/docs/',
    },
    {
      name: 'Internal REST API',
      status: 'testing',
      description: 'Fleet management backend services',
      category: 'internal',
      icon: <Zap className="h-5 w-5" />,
    },
  ]);

  const [testing, setTesting] = useState(false);
  const [lastTestRun, setLastTestRun] = useState<Date>(new Date());

  useEffect(() => {
    testAllServices();
  }, []);

  const testAllServices = async () => {
    setTesting(true);
    setLastTestRun(new Date());

    // Test Google Maps
    await testGoogleMaps();

    // Test Azure AD
    await testAzureAD();

    // Test Microsoft Graph
    await testMicrosoftGraph();

    // Test Azure OpenAI
    await testAzureOpenAI();

    // Test Database
    await testDatabase();

    // Test Internal API
    await testInternalAPI();

    setTesting(false);
  };

  const updateServiceStatus = (
    name: string,
    status: ServiceStatus,
    error?: string
  ) => {
    setServices((prev) =>
      prev.map((s) =>
        s.name === name
          ? { ...s, status, lastCheck: new Date(), error }
          : s
      )
    );
  };

  const testGoogleMaps = async () => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        updateServiceStatus('Google Maps API', 'not_configured', 'API key not configured in environment');
        return;
      }

      // Check if Google Maps script is loaded
      if (window.google && window.google.maps) {
        updateServiceStatus('Google Maps API', 'connected');
      } else {
        updateServiceStatus('Google Maps API', 'configured', 'API key present but Maps not yet loaded');
      }
    } catch (error) {
      updateServiceStatus('Google Maps API', 'disconnected', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testAzureAD = async () => {
    try {
      const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID;
      const tenantId = import.meta.env.VITE_AZURE_AD_TENANT_ID;

      if (!clientId || !tenantId) {
        updateServiceStatus('Azure AD Authentication', 'not_configured', 'Missing client ID or tenant ID');
        return;
      }

      updateServiceStatus('Azure AD Authentication', 'configured', 'Credentials configured');
    } catch (error) {
      updateServiceStatus('Azure AD Authentication', 'disconnected', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testMicrosoftGraph = async () => {
    try {
      const clientId = import.meta.env.VITE_MICROSOFT_GRAPH_CLIENT_ID;
      const tenantId = import.meta.env.VITE_MICROSOFT_GRAPH_TENANT_ID;

      if (!clientId || !tenantId) {
        updateServiceStatus('Microsoft Graph API', 'not_configured', 'Missing client ID or tenant ID');
        return;
      }

      updateServiceStatus('Microsoft Graph API', 'configured', 'Credentials configured');
    } catch (error) {
      updateServiceStatus('Microsoft Graph API', 'disconnected', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testAzureOpenAI = async () => {
    try {
      const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;

      if (!endpoint) {
        updateServiceStatus('Azure OpenAI', 'not_configured', 'Endpoint not configured');
        return;
      }

      updateServiceStatus('Azure OpenAI', 'configured', 'Endpoint configured');
    } catch (error) {
      updateServiceStatus('Azure OpenAI', 'disconnected', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testDatabase = async () => {
    try {
      // Test database connection via API health check
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.database === 'connected' || data.status === 'ok') {
          updateServiceStatus('PostgreSQL Database', 'connected');
        } else {
          updateServiceStatus('PostgreSQL Database', 'disconnected', 'Database health check failed');
        }
      } else {
        updateServiceStatus('PostgreSQL Database', 'disconnected', `HTTP ${response.status}`);
      }
    } catch (error) {
      updateServiceStatus('PostgreSQL Database', 'disconnected', 'Unable to reach database');
    }
  };

  const testInternalAPI = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        updateServiceStatus('Internal REST API', 'connected');
      } else {
        updateServiceStatus('Internal REST API', 'disconnected', `HTTP ${response.status}`);
      }
    } catch (error) {
      updateServiceStatus('Internal REST API', 'disconnected', 'API not reachable');
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'configured':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      case 'not_configured':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Not Configured
          </Badge>
        );
      case 'testing':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1 animate-pulse" />
            Testing...
          </Badge>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maps':
        return <MapPin className="h-4 w-4" />;
      case 'auth':
        return <Key className="h-4 w-4" />;
      case 'cloud':
        return <Cloud className="h-4 w-4" />;
      case 'ai':
        return <Zap className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const connectedCount = services.filter((s) => s.status === 'connected' || s.status === 'configured').length;
  const totalCount = services.length;
  const healthPercentage = Math.round((connectedCount / totalCount) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">External Services Status</h1>
          <p className="text-gray-600 mt-2">Monitor the health and connectivity of all external integrations</p>
        </div>
        <Button onClick={testAllServices} disabled={testing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Testing...' : 'Refresh Status'}
        </Button>
      </div>

      {/* Overall Health Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Overall System Health</CardTitle>
          <CardDescription>Last checked: {lastTestRun.toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {connectedCount} of {totalCount} services operational
                </span>
                <span className="text-2xl font-bold">{healthPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    healthPercentage >= 80
                      ? 'bg-green-500'
                      : healthPercentage >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {service.icon}
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </div>
                {getStatusBadge(service.status)}
              </div>
              <CardDescription className="text-sm">{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {service.lastCheck && (
                <p className="text-xs text-gray-500">Last checked: {service.lastCheck.toLocaleTimeString()}</p>
              )}

              {service.error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{service.error}</AlertDescription>
                </Alert>
              )}

              {service.configKey && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                    {service.configKey}
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      import.meta.env[service.configKey] ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              )}

              {service.docsUrl && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={service.docsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Documentation
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Guide</CardTitle>
          <CardDescription>How to configure external services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <h4 className="font-semibold">Environment Variables</h4>
            <p className="text-sm text-gray-600">
              Configure services by adding the following environment variables to your <code>.env.local</code> file:
            </p>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
              {`# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# Azure AD
VITE_AZURE_AD_CLIENT_ID=your_client_id
VITE_AZURE_AD_TENANT_ID=your_tenant_id

# Microsoft Graph
VITE_MICROSOFT_GRAPH_CLIENT_ID=your_client_id
VITE_MICROSOFT_GRAPH_TENANT_ID=your_tenant_id

# Azure OpenAI
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
