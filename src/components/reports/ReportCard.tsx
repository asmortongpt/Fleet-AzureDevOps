import { FileText, Star, Clock } from 'lucide-react';
import React from 'react';

import { Card } from '@/components/ui/card';

interface Report {
  id: string;
  title: string;
  domain: string;
  file?: string;
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
 * Tesla/Rivian minimal style
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
      className="group relative overflow-hidden cursor-pointer transition-colors duration-150 hover:bg-[#161616] focus:outline-none focus:ring-1 focus:ring-white/20"
      aria-label={`Open ${report.title} report from ${domainMeta.label} domain`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] text-white/30">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium text-white/35 uppercase tracking-wider">
              {domainMeta.label}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-1 rounded-lg hover:bg-white/[0.04] transition-colors"
            aria-label="Add to favorites"
          >
            <Star className="h-4 w-4 text-white/20 hover:text-amber-400" />
          </button>
        </div>

        <h3 className="text-[14px] font-semibold text-white mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-white/90 transition-colors">
          {report.title}
        </h3>

        <div className="flex items-center gap-2 text-[11px] text-white/30">
          <span className="font-mono bg-white/[0.04] px-2 py-0.5 rounded">{report.id}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Never viewed</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
