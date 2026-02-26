/**
 * ArchonY Recharts Theme Configuration
 *
 * Consistent chart styling across all Recharts visualizations.
 */

export const archonyChartTheme = {
  colors: ['#00CCFE', '#1F3076', '#FF4300', '#FDC016', '#10B981', '#8B5CF6'],
  backgroundColor: '#221060',
  gridColor: 'rgba(0, 204, 254, 0.08)',
  textColor: 'rgba(255, 255, 255, 0.65)',
  tooltipBackground: '#2A1878',
  tooltipBorder: 'rgba(0, 204, 254, 0.15)',
  areaGradient: {
    start: 'rgba(0, 204, 254, 0.3)',
    end: 'rgba(0, 204, 254, 0.0)',
  },
} as const

/** Common axis props for ArchonY-themed charts */
export const archonyAxisStyle = {
  tick: { fill: 'rgba(255, 255, 255, 0.40)', fontSize: 11 },
  axisLine: { stroke: 'rgba(0, 204, 254, 0.08)' },
  tickLine: { stroke: 'rgba(0, 204, 254, 0.08)' },
}

/** Common grid props */
export const archonyGridStyle = {
  strokeDasharray: '3 3',
  stroke: 'rgba(0, 204, 254, 0.08)',
}

/** Common tooltip style */
export const archonyTooltipStyle = {
  contentStyle: {
    backgroundColor: '#2A1878',
    border: '1px solid rgba(0, 204, 254, 0.15)',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(26, 6, 72, 0.5)',
  },
  labelStyle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: 500,
    marginBottom: '4px',
  },
  itemStyle: {
    color: '#FFFFFF',
    fontSize: '12px',
    padding: '2px 0',
  },
}

/** Common legend style */
export const archonyLegendStyle = {
  wrapperStyle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: '12px',
    fontFamily: "'Montserrat', sans-serif",
  },
}
