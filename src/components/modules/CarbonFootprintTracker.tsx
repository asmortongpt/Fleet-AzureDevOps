/**
 * Carbon Footprint Tracker
 *
 * Comprehensive ESG tracking and carbon footprint analysis for EV fleet:
 * - Real-time carbon emissions tracking
 * - Comparison with ICE vehicle baseline
 * - Environmental impact visualization
 * - ESG reporting and compliance
 * - Renewable energy integration metrics
 * - Cost savings analysis
 */

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CloudIcon,
  BoltIcon,
  TruckIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select } from '../ui/select';

interface CarbonData {
  vehicle_id: number;
  vehicle_name: string;
  log_date: string;
  kwh_consumed: number;
  miles_driven: number;
  efficiency_kwh_per_mile: number;
  carbon_emitted_kg: number;
  carbon_saved_kg: number;
  carbon_saved_percent: number;
  renewable_percent: number;
}

interface CarbonSummary {
  vehicle_count: number;
  total_kwh: number;
  total_miles: number;
  total_carbon_kg: number;
  total_saved_kg: number;
  avg_reduction_percent: number;
  gasoline_avoided_gallons: number;
}

interface ESGReport {
  report_period: string;
  report_year: number;
  report_month?: number;
  total_ev_count: number;
  total_fleet_count: number;
  ev_adoption_percent: number;
  total_kwh_consumed: number;
  total_miles_driven: number;
  total_carbon_emitted_kg: number;
  total_carbon_saved_kg: number;
  carbon_reduction_percent: number;
  renewable_percent: number;
  environmental_score: number;
  sustainability_rating: string;
  meets_esg_targets: boolean;
}

const CarbonFootprintTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [carbonData, setCarbonData] = useState<CarbonData[]>([]);
  const [summary, setSummary] = useState<CarbonSummary | null>(null);
  const [esgReport, setEsgReport] = useState<ESGReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);

  useEffect(() => {
    loadCarbonData();
  }, [dateRange, selectedVehicle]);

  const loadCarbonData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const endDate = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      let url = `/api/ev/carbon-footprint?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
      if (selectedVehicle) {
        url += `&vehicleId=${selectedVehicle}`;
      }

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (data.success) {
        setCarbonData(data.data?.logs);
        setSummary(data.data?.summary);
      }

      // Load ESG report
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const esgResponse = await fetch(
        `/api/ev/esg-report?period=monthly&year=${currentYear}&month=${currentMonth}`,
        { headers }
      );
      const esgData = await esgResponse.json();
      if (esgData.success) {
        setEsgReport(esgData.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading carbon data:', error);
      setLoading(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return formatNumber(num, 0);
  };

  const getESGColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getESGBadgeVariant = (rating: string): 'default' | 'secondary' | 'destructive' => {
    if (rating.startsWith('A')) return 'default';
    if (rating.startsWith('B')) return 'secondary';
    return 'destructive';
  };

  const calculateTreeEquivalent = (carbonKg: number): number => {
    // Average tree absorbs 21.8 kg CO2 per year
    return Math.round(carbonKg / 21.8);
  };

  const downloadReport = async () => {
    // TODO: Implement PDF report generation
    alert('Downloading ESG report...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <CloudIcon className="w-16 h-16 mx-auto text-green-500 animate-pulse" />
          <p className="mt-4 text-lg text-gray-600">Loading carbon data...</p>
        </div>
      </div>
    );
  }

  const treesEquivalent = summary ? calculateTreeEquivalent(summary.total_saved_kg) : 0;
  const avgEfficiency = summary && summary.total_miles > 0
    ? summary.total_kwh / summary.total_miles
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carbon Footprint Tracker</h1>
          <p className="text-gray-600 mt-1">Monitor environmental impact and ESG performance</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>
          <Button onClick={downloadReport} variant="outline">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">CO₂ Emissions</CardTitle>
            <CloudIcon className="w-5 h-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatLargeNumber(summary?.total_carbon_kg || 0)} kg
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From EV charging
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">CO₂ Saved</CardTitle>
            <ArrowTrendingDownIcon className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatLargeNumber(summary?.total_saved_kg || 0)} kg
            </div>
            <p className="text-xs text-gray-500 mt-1">
              vs. ICE vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reduction</CardTitle>
            <SparklesIcon className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(summary?.avg_reduction_percent || 0, 1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Carbon reduction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Trees Equivalent</CardTitle>
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {treesEquivalent}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Annual absorption
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ESG Score Card */}
      {esgReport && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">ESG Performance Score</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {esgReport.report_period} - {new Date(esgReport.report_year, (esgReport.report_month || 1) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Badge variant={getESGBadgeVariant(esgReport.sustainability_rating)} className="text-2xl px-4 py-2">
                {esgReport.sustainability_rating}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Environmental Score</p>
                <p className={`text-4xl font-bold ${getESGColor(esgReport.environmental_score)}`}>
                  {formatNumber(esgReport.environmental_score, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">EV Adoption</p>
                <p className="text-4xl font-bold text-blue-600">
                  {formatNumber(esgReport.ev_adoption_percent, 1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Renewable Energy</p>
                <p className="text-4xl font-bold text-yellow-600">
                  {formatNumber(esgReport.renewable_percent, 1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Carbon Reduction</p>
                <p className="text-4xl font-bold text-green-600">
                  {formatNumber(esgReport.carbon_reduction_percent, 1)}%
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {esgReport.meets_esg_targets ? (
                    <>
                      <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-green-700 font-medium">Meeting ESG Targets</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-yellow-700 font-medium">Below ESG Targets</p>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Target: 70% environmental score minimum
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Energy Consumption */}
            <Card>
              <CardHeader>
                <CardTitle>Energy Consumption</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <BoltIcon className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Energy</p>
                      <p className="text-2xl font-bold">{formatNumber(summary?.total_kwh || 0)} kWh</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <TruckIcon className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Miles Driven</p>
                      <p className="text-2xl font-bold">{formatLargeNumber(summary?.total_miles || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <ChartBarIcon className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Efficiency</p>
                      <p className="text-2xl font-bold">{formatNumber(avgEfficiency, 2)} kWh/mi</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gasoline Savings */}
            <Card>
              <CardHeader>
                <CardTitle>Fuel Savings Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Gasoline Avoided</p>
                  <p className="text-5xl font-bold text-green-600">
                    {formatLargeNumber(summary?.gasoline_avoided_gallons || 0)}
                  </p>
                  <p className="text-xl text-gray-700 mt-1">gallons</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Estimated Cost Savings</span>
                    <span className="font-bold text-green-600">
                      ${formatNumber((summary?.gasoline_avoided_gallons || 0) * 3.50, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">ICE Emissions Avoided</span>
                    <span className="font-bold text-blue-600">
                      {formatLargeNumber(((summary?.gasoline_avoided_gallons || 0) * 8887) / 1000)} kg CO₂
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Carbon Data */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Carbon Footprint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Vehicle</th>
                      <th className="text-right py-3 px-4">Energy (kWh)</th>
                      <th className="text-right py-3 px-4">Miles</th>
                      <th className="text-right py-3 px-4">CO₂ Emitted</th>
                      <th className="text-right py-3 px-4">CO₂ Saved</th>
                      <th className="text-right py-3 px-4">Reduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carbonData.slice(0, 10).map((data, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(data.log_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium">{data.vehicle_name}</td>
                        <td className="text-right py-3 px-4">
                          {formatNumber(data.kwh_consumed, 2)}
                        </td>
                        <td className="text-right py-3 px-4">
                          {formatNumber(data.miles_driven, 1)}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-600">
                          {formatNumber(data.carbon_emitted_kg, 2)} kg
                        </td>
                        <td className="text-right py-3 px-4 text-green-600 font-medium">
                          {formatNumber(data.carbon_saved_kg, 2)} kg
                        </td>
                        <td className="text-right py-3 px-4">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {formatNumber(data.carbon_saved_percent, 1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Carbon Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Trend visualization coming soon</p>
                <p className="text-sm mt-2">Chart library integration pending</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Vehicle Tab */}
        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Carbon Footprint by Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(new Set(carbonData.map(d => d.vehicle_name))).map((vehicleName) => {
                  const vehicleData = carbonData.filter(d => d.vehicle_name === vehicleName);
                  const totalSaved = vehicleData.reduce((sum, d) => sum + d.carbon_saved_kg, 0);
                  const totalEmitted = vehicleData.reduce((sum, d) => sum + d.carbon_emitted_kg, 0);
                  const avgReduction = vehicleData.reduce((sum, d) => sum + d.carbon_saved_percent, 0) / vehicleData.length;

                  return (
                    <div key={vehicleName} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{vehicleName}</h3>
                        <Badge variant="default">
                          {formatNumber(avgReduction, 1)}% reduction
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">CO₂ Emitted</p>
                          <p className="text-xl font-bold text-gray-700">
                            {formatNumber(totalEmitted, 0)} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">CO₂ Saved</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatNumber(totalSaved, 0)} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Trees Equivalent</p>
                          <p className="text-xl font-bold text-green-600">
                            {calculateTreeEquivalent(totalSaved)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="impact">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle>Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Fleet's Impact</h3>
                  <p className="text-gray-600">
                    Equivalent to planting <span className="font-bold text-green-600">{treesEquivalent} trees</span> annually
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Carbon Reduction</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatNumber(summary?.avg_reduction_percent || 0, 1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">vs. comparable ICE vehicles</p>
                  </div>

                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total CO₂ Offset</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatLargeNumber(summary?.total_saved_kg || 0)} kg
                    </p>
                    <p className="text-xs text-gray-500 mt-1">in selected period</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle>Business Value</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual Savings</h3>
                  <p className="text-gray-600">
                    Estimated fuel cost savings
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Fuel Savings</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${formatNumber((summary?.gasoline_avoided_gallons || 0) * 3.50, 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatLargeNumber(summary?.gasoline_avoided_gallons || 0)} gallons @ $3.50/gal
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Annual Projection</p>
                    <p className="text-3xl font-bold text-blue-600">
                      $300,000
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expected annual savings at current rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarbonFootprintTracker;
