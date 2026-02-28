/**
 * ArchonY Recharts Theme Configuration
 *
 * Consistent chart styling across all Recharts visualizations.
 */

export const archonyChartTheme = {
  colors: ['#00CCFE', '#10B981', '#FF4300', '#FDC016', '#14B8A6', '#F97316'],
  backgroundColor: '#1a1a1a',
  gridColor: 'rgba(255, 255, 255, 0.06)',
  textColor: 'rgba(255, 255, 255, 0.65)',
  tooltipBackground: '#242424',
  tooltipBorder: 'rgba(255, 255, 255, 0.08)',
  areaGradient: {
    start: 'rgba(0, 204, 254, 0.3)',
    end: 'rgba(0, 204, 254, 0.0)',
  },
} as const

/** Common axis props for ArchonY-themed charts */
export const archonyAxisStyle = {
  tick: { fill: 'rgba(255, 255, 255, 0.40)', fontSize: 11 },
  axisLine: { stroke: 'rgba(255, 255, 255, 0.06)' },
  tickLine: { stroke: 'rgba(255, 255, 255, 0.06)' },
}

/** Common grid props */
export const archonyGridStyle = {
  strokeDasharray: '3 3',
  stroke: 'rgba(255, 255, 255, 0.06)',
}

/** Common tooltip style */
export const archonyTooltipStyle = {
  contentStyle: {
    backgroundColor: '#242424',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
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
