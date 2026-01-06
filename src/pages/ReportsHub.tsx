import React, { useState, useMemo, useCallback } from 'react';
import { Search, Filter, ChevronDown, Download, Star, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReportCard } from '@/components/reports/ReportCard';
import { ReportViewer } from '@/components/reports/ReportViewer';
import { AIReportBuilder } from '@/components/reports/AIReportBuilder';
import { AIChatbot } from '@/components/reports/AIChatbot';
import reportLibrary from '@/reporting_library/index.json';

// Domain metadata for organization and styling
const DOMAIN_METADATA: Record<string, { label: string; icon: string; color: string; description: string }> = {
  exec: {
    label: 'Executive',
    icon: '👔',
    color: 'from-purple-500 to-purple-700',
    description: 'High-level strategic insights and KPIs for leadership'
  },
  billing: {
    label: 'Billing & Finance',
    icon: '💰',
    color: 'from-green-500 to-green-700',
    description: 'Financial reporting, billing analytics, and cost tracking'
  },
  workorders: {
    label: 'Work Orders',
    icon: '🔧',
    color: 'from-blue-500 to-blue-700',
    description: 'Work order tracking, completion rates, and labor analytics'
  },
  shop: {
    label: 'Shop & Labor',
    icon: '⚙️',
    color: 'from-orange-500 to-orange-700',
    description: 'Shop efficiency, technician performance, and labor utilization'
  },
  pm: {
    label: 'Preventive Maintenance',
    icon: '🛡️',
    color: 'from-cyan-500 to-cyan-700',
    description: 'PM schedules, compliance, and predictive maintenance insights'
  },
  assets: {
    label: 'Assets & Inventory',
    icon: '📦',
    color: 'from-indigo-500 to-indigo-700',
    description: 'Asset tracking, inventory levels, and parts management'
  },
  fuel: {
    label: 'Fuel & Emissions',
    icon: '⛽',
    color: 'from-yellow-500 to-yellow-700',
    description: 'Fuel consumption, efficiency metrics, and emissions tracking'
  },
  safety: {
    label: 'Safety',
    icon: '🚨',
    color: 'from-red-500 to-red-700',
    description: 'Incident reports, safety compliance, and risk analytics'
  },
  ev: {
    label: 'Electric Vehicles',
    icon: '⚡',
    color: 'from-teal-500 to-teal-700',
    description: 'EV performance, charging analytics, and battery health'
  },
  bio: {
    label: 'Biodiesel',
    icon: '🌱',
    color: 'from-lime-500 to-lime-700',
    description: 'Biodiesel usage, sustainability metrics, and environmental impact'
  }
};

interface Report {
  id: string;
  title: string;
  domain: string;
  file: string;
}

export default function ReportsHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'gallery' | 'viewer' | 'builder'>('gallery');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'domain' | 'recent'>('domain');

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let reports = reportLibrary.reports as Report[];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      reports = reports.filter(
        (report) =>
          report.title.toLowerCase().includes(term) ||
          DOMAIN_METADATA[report.domain]?.label.toLowerCase().includes(term)
      );
    }

    // Filter by domain
    if (selectedDomain !== 'all') {
      reports = reports.filter((report) => report.domain === selectedDomain);
    }

    // Sort reports
    reports = [...reports].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'domain':
          return a.domain.localeCompare(b.domain);
        case 'recent':
          // Would need timestamp metadata - fallback to domain for now
          return a.domain.localeCompare(b.domain);
        default:
          return 0;
      }
    });

    return reports;
  }, [searchTerm, selectedDomain, sortBy]);

  // Group reports by domain
  const reportsByDomain = useMemo(() => {
    const grouped: Record<string, Report[]> = {};
    filteredReports.forEach((report) => {
      if (!grouped[report.domain]) {
        grouped[report.domain] = [];
      }
      grouped[report.domain].push(report);
    });
    return grouped;
  }, [filteredReports]);

  // Handle report selection
  const handleReportClick = useCallback((report: Report) => {
    setSelectedReport(report);
    setViewMode('viewer');
  }, []);

  // Handle back to gallery
  const handleBackToGallery = useCallback(() => {
    setViewMode('gallery');
    setSelectedReport(null);
  }, []);

  // Render gallery view
  const renderGallery = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Reports Hub</h1>
          <p className="text-lg opacity-90 mb-6">
            {reportLibrary.count} pre-built reports across {Object.keys(DOMAIN_METADATA).length} domains
          </p>

          {/* Search and filter bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search reports by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/90 backdrop-blur-sm border-white/20 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/90 backdrop-blur-sm border-white/20 text-gray-900 hover:bg-white"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              onClick={() => setViewMode('builder')}
              className="bg-white text-indigo-600 hover:bg-white/90"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              AI Report Builder
            </Button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-gray-900">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Domain</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Domains</option>
                    {Object.entries(DOMAIN_METADATA).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.icon} {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'domain' | 'recent')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="domain">Domain</option>
                    <option value="name">Name</option>
                    <option value="recent">Recently Used</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedDomain('all');
                      setSortBy('domain');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report statistics */}
      <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Star className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{filteredReports.length}</div>
                <div className="text-sm text-gray-600">Available Reports</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Recently Viewed</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Custom Reports</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Download className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Exports Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports grid by domain */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-8">
          {Object.entries(reportsByDomain).map(([domain, reports]) => {
            const meta = DOMAIN_METADATA[domain];
            if (!meta) return null;

            return (
              <div key={domain} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 bg-gradient-to-r ${meta.color} text-white rounded-lg shadow-md`}>
                    <span className="text-2xl mr-2">{meta.icon}</span>
                    <span className="font-bold text-lg">{meta.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{meta.description}</p>
                  <span className="ml-auto text-sm font-medium text-gray-500">
                    {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      domainMeta={meta}
                      onClick={() => handleReportClick(report)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render report viewer
  const renderViewer = () => {
    if (!selectedReport) return null;
    return (
      <ReportViewer
        reportId={selectedReport.id}
        onBack={handleBackToGallery}
      />
    );
  };

  // Render AI builder
  const renderBuilder = () => (
    <AIReportBuilder
      onBack={handleBackToGallery}
      onReportCreated={(reportId) => {
        // Would load the custom report and display in viewer
        console.log('Custom report created:', reportId);
        handleBackToGallery();
      }}
    />
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {viewMode === 'gallery' && renderGallery()}
      {viewMode === 'viewer' && renderViewer()}
      {viewMode === 'builder' && renderBuilder()}

      {/* AI Chatbot - always visible */}
      <AIChatbot />
    </div>
  );
}
