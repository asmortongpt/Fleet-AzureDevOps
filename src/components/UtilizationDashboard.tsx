import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { fetchIdleAssets, fetchUtilizationData, fetchROIMetrics } from '@/services/analyticsService';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';
import { logger } from '@/utils/logger';
import { validateTenantId } from '@/utils/validation';

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Name</TableHead>
              <TableHead>Idle Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {idleAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.idleDays}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 space-x-2">
          <Button onClick={() => exportToCSV(idleAssets)}>Export to CSV</Button>
          <Button onClick={() => exportToExcel(idleAssets)}>Export to Excel</Button>
        </div>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset ID</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roiMetrics.map((metric) => (
              <TableRow key={metric.assetId}>
                <TableCell>{metric.assetId}</TableCell>
                <TableCell>{metric.revenue}</TableCell>
                <TableCell>{metric.cost}</TableCell>
                <TableCell>{metric.roi}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default UtilizationDashboard;