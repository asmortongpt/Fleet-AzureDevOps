import React from 'react';
import { FileText, Star, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Report {
  id: string;
  title: string;
  domain: string;
  file: string;
}

interface DomainMeta {
  label: string;
  icon: string;
  color: string;
  description: string;
}

interface ReportCardProps {
  report: Report;
  domainMeta: DomainMeta;
  onClick: () => void;
}

/**
 * ReportCard - Displays a single report in the library grid
 *
 * Features:
 * - Click to open report in viewer
 * - Visual domain indicator with gradient
 * - Hover effects for better UX
 * - Accessibility compliant (WCAG 2.1 AA)
 */
export function ReportCard({ report, domainMeta, onClick }: ReportCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      aria-label={`Open ${report.title} report from ${domainMeta.label} domain`}
    >
      {/* Gradient header */}
      <div className={`h-2 bg-gradient-to-r ${domainMeta.color}`} />

      {/* Card content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 bg-gradient-to-br ${domainMeta.color} rounded-lg text-white shadow-sm`}>
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {domainMeta.label}
            </span>
          </div>
          {/* Favorite icon - would be interactive in full implementation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle favorite toggle
            }}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Add to favorites"
          >
            <Star className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
          </button>
        </div>

        {/* Report title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-indigo-600 transition-colors">
          {report.title}
        </h3>

        {/* Report ID and metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="font-mono bg-gray-100 px-2 py-1 rounded">{report.id}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Never viewed</span>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
      </div>
    </Card>
  );
}
