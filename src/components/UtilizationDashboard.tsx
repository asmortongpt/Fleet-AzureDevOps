// Legacy import - antd not in package.json, commented out for type safety
// import { Table, Button } from 'antd';
// Using shadcn/ui Button and a basic table implementation instead
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import Helmet from 'react-helmet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Legacy imports - these paths don't exist, commented out
// import { useAuth } from '../../hooks/useAuth';
// import { fetchIdleAssets, fetchUtilizationData, fetchROIMetrics } from '../../services/analyticsService';
// import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
// import { logger } from '../../utils/logger';
// import { validateTenantId } from '../../utils/validation';

// Stub implementations for missing utilities
const useAuth = () => ({ tenantId: 'demo-tenant' });
const fetchIdleAssets = async () => [];
const fetchUtilizationData = async () => [];
const fetchROIMetrics = async () => [];
const exportToCSV = (data: unknown) => console.log('Export CSV:', data);
const exportToExcel = (data: unknown) => console.log('Export Excel:', data);
const logger = {
  logError: (msg: string, err?: unknown) => console.error(msg, err),
  logAudit: (msg: string, ctx?: unknown) => console.log(msg, ctx)
};
const validateTenantId = (id: string) => !!id;

interface Asset {
  id: string;
  name: string;
  idleDays: number;
  revenue: number;
  cost: number;
}

interface UtilizationData {
  date: string;
  utilizationRate: number;
}

interface ROIMetric {
  assetId: string;
  revenue: number;
  cost: number;
  roi: number;
}

interface AuthContextType {
  tenantId?: string;
}

const UtilizationDashboard: React.FC = () => {
  const [idleAssets, setIdleAssets] = useState<Asset[]>([]);
  const [utilizationData, setUtilizationData] = useState<UtilizationData[]>([]);
  const [roiMetrics, setRoiMetrics] = useState<ROIMetric[]>([]);
  const { tenantId } = useAuth() as AuthContextType;

  useEffect(() => {
    if (!tenantId || !validateTenantId(tenantId)) {
      logger.logError('Invalid tenant ID');
      return;
    }

    const fetchData = async () => {
      try {
        const idleAssetsData = await fetchIdleAssets();
        if (Array.isArray(idleAssetsData)) {
          setIdleAssets(idleAssetsData as Asset[]);
        }

        const utilizationData = await fetchUtilizationData();
        if (Array.isArray(utilizationData)) {
          setUtilizationData(utilizationData as UtilizationData[]);
        }

        const roiMetricsData = await fetchROIMetrics();
        if (Array.isArray(roiMetricsData)) {
          setRoiMetrics(roiMetricsData as ROIMetric[]);
        }

        logger.logAudit('Utilization dashboard data fetched', { tenantId });
      } catch (error) {
        logger.logError('Error fetching utilization dashboard data', error);
      }
    };

    fetchData();
  }, [tenantId]);

  return (
    <>
      <Helmet>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self';" />
        <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
      </Helmet>
      <div>
        <h2>Idle Assets</h2>
        {/* Replaced antd Table with basic HTML table */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Idle Days</th>
            </tr>
          </thead>
          <tbody>
            {idleAssets.map((asset) => (
              <tr key={asset.id}>
                <td>{asset.name}</td>
                <td>{asset.idleDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button onClick={() => exportToCSV(idleAssets)}>Export to CSV</Button>
        <Button onClick={() => exportToExcel(idleAssets)}>Export to Excel</Button>
      </div>
      <div>
        <h2>Utilization Rate</h2>
        <LineChart width={600} height={300} data={utilizationData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="utilizationRate" stroke="#8884d8" />
        </LineChart>
      </div>
      <div>
        <h2>ROI Metrics</h2>
        {/* Replaced antd Table with basic HTML table */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {roiMetrics.map((metric) => (
              <tr key={metric.assetId}>
                <td>{metric.assetId}</td>
                <td>{metric.revenue}</td>
                <td>{metric.cost}</td>
                <td>{metric.roi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UtilizationDashboard;