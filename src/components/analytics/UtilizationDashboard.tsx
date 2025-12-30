import { Table, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import Helmet from 'react-helmet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import { useAuth } from '../../hooks/useAuth';
import { fetchIdleAssets, fetchUtilizationData, fetchROIMetrics } from '../../services/analyticsService';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import * as logger from '../../utils/logger';
import { validateTenantId } from '../../utils/validation';

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
        const idleAssetsData = await fetchIdleAssets(tenantId);
        setIdleAssets(idleAssetsData);

        const utilizationData = await fetchUtilizationData(tenantId);
        setUtilizationData(utilizationData);

        const roiMetricsData = await fetchROIMetrics(tenantId);
        setRoiMetrics(roiMetricsData);

        logger.logAudit('Utilization dashboard data fetched', { tenantId });
      } catch (error) {
        logger.logError('Error fetching utilization dashboard data', error);
      }
    };

    fetchData();
  }, [tenantId]);

  const columns = [
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Idle Days',
      dataIndex: 'idleDays',
      key: 'idleDays',
      sorter: (a: Asset, b: Asset) => a.idleDays - b.idleDays,
    },
  ];

  return (
    <>
      <Helmet>
        <meta http-equiv="Content-Security-Policy" content="default-src 'self';" />
        <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
      </Helmet>
      <div>
        <h2>Idle Assets</h2>
        <Table columns={columns} dataSource={idleAssets} rowKey="id" />
        <Button onClick={() => exportToCSV(idleAssets, 'idle_assets.csv')}>Export to CSV</Button>
        <Button onClick={() => exportToExcel(idleAssets, 'idle_assets.xlsx')}>Export to Excel</Button>
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
        <Table
          columns={[
            { title: 'Asset ID', dataIndex: 'assetId', key: 'assetId' },
            { title: 'Revenue', dataIndex: 'revenue', key: 'revenue' },
            { title: 'Cost', dataIndex: 'cost', key: 'cost' },
            { title: 'ROI', dataIndex: 'roi', key: 'roi' },
          ]}
          dataSource={roiMetrics}
          rowKey="assetId"
        />
      </div>
    </>
  );
};

export default UtilizationDashboard;