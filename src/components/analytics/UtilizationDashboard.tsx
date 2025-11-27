import React, { useEffect, useState } from 'react';
import { Bar, HeatMap } from '@ant-design/plots';
import { Table, message } from 'antd';
import axios from 'axios';

interface UtilizationData {
  hour: string;
  utilizationPercentage: number;
}

interface ROIData {
  category: string;
  value: number;
}

interface IdleAssetsData {
  assetId: string;
  daysIdle: number;
}

const UtilizationDashboard: React.FC = () => {
  const [utilizationData, setUtilizationData] = useState<UtilizationData[]>([]);
  const [roiData, setRoiData] = useState<ROIData[]>([]);
  const [idleAssetsData, setIdleAssetsData] = useState<IdleAssetsData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [utilizationResponse, roiResponse, idleAssetsResponse] = await Promise.all([
          axios.get('/api/utilization/heatmap'),
          axios.get('/api/roi/summary'),
          axios.get('/api/assets/idle'),
        ]);
        setUtilizationData(utilizationResponse.data);
        setRoiData(roiResponse.data);
        setIdleAssetsData(idleAssetsResponse.data);
      } catch (error) {
        message.error('Failed to fetch data. Please try again later.');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const utilizationConfig = {
    data: utilizationData,
    xField: 'hour',
    yField: 'utilizationPercentage',
    colorField: 'utilizationPercentage',
    color: ['#BAE7FF', '#1890FF', '#0050B3'],
  };

  const roiConfig = {
    data: roiData,
    xField: 'category',
    yField: 'value',
    seriesField: 'category',
    legend: { position: 'top-left' },
  };

  const columns = [
    {
      title: 'Asset ID',
      dataIndex: 'assetId',
      key: 'assetId',
    },
    {
      title: 'Days Idle',
      dataIndex: 'daysIdle',
      key: 'daysIdle',
    },
  ];

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2>Utilization Heatmap</h2>
          <HeatMap {...utilizationConfig} />
          <h2>ROI Analysis</h2>
          <Bar {...roiConfig} />
          <h2>Idle Assets</h2>
          <Table dataSource={idleAssetsData} columns={columns} rowKey="assetId" />
        </>
      )}
    </div>
  );
};

export default UtilizationDashboard;