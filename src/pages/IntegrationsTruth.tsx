import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  successRate: number;
  lastSuccess: string | null;
  errorMessage: string | null;
  isRequired: boolean;
  lastChecked: string;
}

interface HealthResponse {
  services: ServiceHealth[];
  timestamp: string;
}

const IntegrationsTruth: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const fetchHealthData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/integrations/health', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: HealthResponse = await response.json();
      setHealthData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      setHealthData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [fetchHealthData, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchHealthData();
  }, [fetchHealthData]);

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="text-green-500 h-5 w-5" />;
      case 'degraded':
        return <AlertCircle className="text-yellow-500 h-5 w-5" />;
      case 'failed':
        return <XCircle className="text-red-500 h-5 w-5" />;
      default:
        return <HelpCircle className="text-gray-500 h-5 w-5" />;
    }
  };

  const getStatusColor = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 border-yellow-200';
      case 'failed':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  if (error && !healthData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl w-full text-center"
        >
          <h2 className="text-2xl font-bold text-red-700 mb-2">Connection Failed</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={handleRetry}
            className="flex items-center justify-center mx-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Now
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations Truth</h1>
        <p className="text-gray-600">
          Real-time connectivity status and diagnostics for all critical services.
          Last updated: {healthData?.timestamp || 'N/A'}
        </p>
      </motion.div>

      {isLoading && !healthData ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {healthData?.services.map((service) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`border rounded-lg p-6 shadow-sm ${getStatusColor(service.status)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getStatusIcon(service.status)}
                  <h2 className="text-xl font-semibold ml-2">{service.name}</h2>
                </div>
                {service.isRequired && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">{service.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="font-medium">{service.successRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Latency (p50/p95/p99)</p>
                  <p className="font-medium">
                    {service.latency.p50}ms / {service.latency.p95}ms / {service.latency.p99}ms
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Success</p>
                  <p className="font-medium">{service.lastSuccess || 'Never'}</p>
                </div>
              </div>

              {service.errorMessage && (
                <div className="mb-4">
                  <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                    {service.errorMessage}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Checked: {service.lastChecked}</p>
                {service.status !== 'healthy' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="hover:bg-gray-100"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Retry
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {healthData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-gray-50 rounded-lg"
        >
          <h3 className="text-lg font-semibold mb-2">Diagnostic Steps</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Check network connectivity and firewall settings for failed services.</li>
            <li>Verify API keys and credentials for external integrations.</li>
            <li>Review error logs in Admin > Logs for detailed stack traces.</li>
            <li>Contact support with service name and error message if issues persist.</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default IntegrationsTruth;