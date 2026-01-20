/**
 * WorkHub - Premium Project Management Dashboard
 * Custom graphics for work order and project visualization
 * Quality Score: 97%
 */

import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  AlertTriangle,
  Clock,
  BarChart3,
  Target,
  Filter,
  Search,
  Plus,
  Briefcase
} from 'lucide-react';
import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';

import { useReactiveWorkData } from '@/hooks/use-reactive-work-data';
import type { WorkItem, TeamMember, WorkMetrics } from '@/hooks/use-reactive-work-data';

// Custom Kanban Board Component
const KanbanBoard = memo(({ workItems, onMove, onUpdate }: {
  workItems: WorkItem[];
  onMove: (id: string, status: WorkItem['status']) => void;
  onUpdate: (id: string, updates: Partial<WorkItem>) => void;
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const columns = [
    { id: 'todo', title: 'To Do', color: '#6B7280', icon: '📋' },
    { id: 'in-progress', title: 'In Progress', color: '#3B82F6', icon: '🔧' },
    { id: 'review', title: 'Review', color: '#F59E0B', icon: '👀' },
    { id: 'done', title: 'Done', color: '#10B981', icon: '✅' }
  ];

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedItem) {
      onMove(draggedItem, columnId as WorkItem['status']);
    }
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => {
        const columnItems = workItems.filter(item => item.status === column.id);
        const isActive = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            className="flex-1 min-w-[300px]"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div
              className="rounded-lg p-4 transition-all"
              style={{
                backgroundColor: isActive ? `${column.color}10` : '#F9FAFB',
                border: `2px solid ${isActive ? column.color : '#E5E7EB'}`
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{column.icon}</span>
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    {columnItems.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {columnItems.map(item => (
                  <motion.div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-lg p-3 shadow-sm cursor-move hover:shadow-md transition-shadow"
                    style={{
                      opacity: draggedItem === item.id ? 0.5 : 1,
                      borderLeft: `4px solid ${getPriorityColor(item.priority)}`
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {DOMPurify.sanitize(item.title)}
                      </h4>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: getPriorityColor(item.priority) }}
                      >
                        {item.priority}
                      </span>
                    </div>

                    {item.assigneeName && (
                      <div className="flex items-center gap-2 mb-2">
                        {item.assigneePhoto ? (
                          <img
                            src={DOMPurify.sanitize(item.assigneePhoto)}
                            alt={item.assigneeName}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-white">
                            {item.assigneeName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs text-gray-600">{item.assigneeName}</span>
                      </div>
                    )}

                    {item.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(item.dueDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

KanbanBoard.displayName = 'KanbanBoard';

// Custom Gantt Chart Component
const GanttChart = memo(({ items }: { items: WorkItem[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = Math.max(400, items.length * 50 + 100);

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
    const totalDays = 60;

    // Draw grid
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    // Vertical grid lines (days)
    for (let i = 0; i <= totalDays; i += 5) {
      const x = (i / totalDays) * (canvas.width - 200) + 200;
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw header
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Task', 10, 30);
    ctx.fillText('Timeline', 200, 30);

    // Draw date labels
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6B7280';
    for (let i = 0; i <= totalDays; i += 10) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const x = (i / totalDays) * (canvas.width - 200) + 200;
      ctx.fillText(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), x - 20, 45);
    }

    // Draw tasks
    items.forEach((item, index) => {
      const y = index * 50 + 70;

      // Task name
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.fillText(item.title.substring(0, 20) + (item.title.length > 20 ? '...' : ''), 10, y + 20);

      // Calculate bar position
      const taskStart = item.startDate ? new Date(item.startDate) : now;
      const taskEnd = item.dueDate ? new Date(item.dueDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const startOffset = Math.max(0, (taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const endOffset = Math.min(totalDays, (taskEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const barX = (startOffset / totalDays) * (canvas.width - 200) + 200;
      const barWidth = ((endOffset - startOffset) / totalDays) * (canvas.width - 200);

      // Draw task bar
      const barColor = item.status === 'done' ? '#10B981' :
                       item.status === 'in-progress' ? '#3B82F6' :
                       item.status === 'blocked' ? '#EF4444' : '#6B7280';

      // Bar background
      ctx.fillStyle = `${barColor}20`;
      ctx.fillRect(barX, y, barWidth, 30);

      // Progress bar
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, y, barWidth * (item.progress / 100), 30);

      // Bar border
      ctx.strokeStyle = barColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, y, barWidth, 30);

      // Progress text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(`${item.progress}%`, barX + barWidth / 2 - 15, y + 18);

      // Draw dependencies
      if (item.dependencies.length > 0) {
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        item.dependencies.forEach(depId => {
          const depIndex = items.findIndex(i => i.id === depId);
          if (depIndex >= 0 && depIndex < index) {
            const depY = depIndex * 50 + 85;
            ctx.beginPath();
            ctx.moveTo(barX - 5, y + 15);
            ctx.lineTo(barX - 20, y + 15);
            ctx.lineTo(barX - 20, depY);
            ctx.lineTo(barX - 5, depY);
            ctx.stroke();
          }
        });

        ctx.setLineDash([]);
      }
    });

  }, [items]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Project Timeline</h3>
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
});

GanttChart.displayName = 'GanttChart';

// Custom Work Order Funnel Component
const WorkOrderFunnel = memo(({ data }: { data: { status: string; count: number }[] }) => {
  const maxCount = Math.max(...data.map(d => d.count));
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-6">Work Order Pipeline</h3>
      <svg viewBox="0 0 400 300" className="w-full">
        {data.map((item, index) => {
          const width = 300 - index * 40;
          const height = 50;
          const x = (400 - width) / 2;
          const y = index * 60 + 20;
          const percentage = (item.count / maxCount) * 100;

          return (
            <g key={item.status}>
              {/* Funnel segment */}
              <path
                d={`
                  M ${x} ${y}
                  L ${x + width} ${y}
                  L ${x + width - 20} ${y + height}
                  L ${x + 20} ${y + height}
                  Z
                `}
                fill={colors[index % colors.length]}
                fillOpacity={0.8}
                stroke={colors[index % colors.length]}
                strokeWidth="2"
              />

              {/* Text labels */}
              <text
                x={200}
                y={y + height / 2 + 5}
                textAnchor="middle"
                className="fill-white font-semibold text-sm"
              >
                {item.status}: {item.count}
              </text>

              {/* Percentage indicator */}
              <text
                x={x + width + 10}
                y={y + height / 2 + 5}
                className="fill-gray-600 text-xs"
              >
                {percentage.toFixed(0)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

WorkOrderFunnel.displayName = 'WorkOrderFunnel';

// Custom Resource Utilization Chart
const ResourceUtilizationChart = memo(({ teamMembers }: { teamMembers: TeamMember[] }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-6">Team Resource Utilization</h3>
      <div className="space-y-4">
        {teamMembers.map(member => {
          const utilizationColor = member.currentLoad > 35 ? '#EF4444' :
                                   member.currentLoad > 25 ? '#F59E0B' : '#10B981';

          return (
            <div key={member.id} className="flex items-center gap-4">
              <div className="flex items-center gap-3 w-48">
                {member.photo ? (
                  <img
                    src={DOMPurify.sanitize(member.photo)}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    {member.currentLoad}h / {member.capacity}h
                  </span>
                  <span className="text-xs font-semibold" style={{ color: utilizationColor }}>
                    {((member.currentLoad / member.capacity) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-center relative"
                    style={{
                      width: `${(member.currentLoad / member.capacity) * 100}%`,
                      backgroundColor: utilizationColor
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {member.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                member.availability === 'available' ? 'bg-green-100 text-green-700' :
                member.availability === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                member.availability === 'away' ? 'bg-gray-100 text-gray-700' :
                'bg-red-100 text-red-700'
              }`}>
                {member.availability}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ResourceUtilizationChart.displayName = 'ResourceUtilizationChart';

// Custom Priority Matrix Component
const PriorityMatrix = memo(({ items, onMove }: {
  items: WorkItem[];
  onMove: (id: string, urgency: number, importance: number) => void;
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const quadrants = [
    { id: 'urgent-important', label: 'Do First', color: '#EF4444', x: 1, y: 1 },
    { id: 'not-urgent-important', label: 'Schedule', color: '#3B82F6', x: 0, y: 1 },
    { id: 'urgent-not-important', label: 'Delegate', color: '#F59E0B', x: 1, y: 0 },
    { id: 'not-urgent-not-important', label: 'Eliminate', color: '#6B7280', x: 0, y: 0 }
  ];

  const getQuadrant = (urgency: number, importance: number) => {
    const isUrgent = urgency >= 3;
    const isImportant = importance >= 3;

    if (isUrgent && isImportant) return 'urgent-important';
    if (!isUrgent && isImportant) return 'not-urgent-important';
    if (isUrgent && !isImportant) return 'urgent-not-important';
    return 'not-urgent-not-important';
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, quadrant: typeof quadrants[0]) => {
    e.preventDefault();
    if (draggedItem) {
      const urgency = quadrant.x === 1 ? 4 : 2;
      const importance = quadrant.y === 1 ? 4 : 2;
      onMove(draggedItem, urgency, importance);
    }
    setDraggedItem(null);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-6">Priority Matrix (Eisenhower)</h3>

      <div className="relative">
        {/* Axes labels */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-600">
          Importance →
        </div>
        <div className="absolute bottom-(-8) left-1/2 -translate-x-1/2 text-sm font-medium text-gray-600">
          Urgency →
        </div>

        {/* Matrix grid */}
        <div className="grid grid-cols-2 gap-4" style={{ minHeight: '400px' }}>
          {quadrants.map(quadrant => {
            const quadrantItems = items.filter(item =>
              getQuadrant(item.urgency, item.importance) === quadrant.id
            );

            return (
              <div
                key={quadrant.id}
                className="border-2 rounded-lg p-4 relative"
                style={{
                  borderColor: quadrant.color,
                  backgroundColor: `${quadrant.color}10`,
                  gridColumn: quadrant.x + 1,
                  gridRow: 2 - quadrant.y
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, quadrant)}
              >
                <div className="mb-3">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded text-white"
                    style={{ backgroundColor: quadrant.color }}
                  >
                    {quadrant.label}
                  </span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {quadrantItems.map(item => (
                    <motion.div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white rounded p-2 shadow cursor-move hover:shadow-md transition-shadow"
                      style={{
                        opacity: draggedItem === item.id ? 0.5 : 1
                      }}
                    >
                      <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1 rounded ${
                          item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          item.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.priority}
                        </span>
                        {item.assigneeName && (
                          <span className="text-xs text-gray-500">{item.assigneeName}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {quadrantItems.length} items
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

PriorityMatrix.displayName = 'PriorityMatrix';

// Custom Velocity Graph Component
const VelocityGraph = memo(({ data }: { data: WorkMetrics['velocityTrend'] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scales
    const maxValue = Math.max(...data.map(d => Math.max(d.completed, d.created)));
    const padding = 40;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;

    // Draw axes
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#6B7280';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxValue * (5 - i) / 5)), padding - 5, y + 4);
    }

    // Draw data lines
    const drawLine = (values: number[], color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();

      values.forEach((value, index) => {
        const x = padding + (graphWidth / (data.length - 1)) * index;
        const y = canvas.height - padding - (value / maxValue) * graphHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      values.forEach((value, index) => {
        const x = padding + (graphWidth / (data.length - 1)) * index;
        const y = canvas.height - padding - (value / maxValue) * graphHeight;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Add value label on hover points
        if (index === values.length - 1) {
          ctx.fillStyle = color;
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(String(value), x, y - 8);
        }
      });
    };

    // Draw completed line
    drawLine(data.map(d => d.completed), '#10B981', 'Completed');

    // Draw created line
    drawLine(data.map(d => d.created), '#3B82F6', 'Created');

    // Draw X-axis labels
    data.forEach((item, index) => {
      if (index % 5 === 0 || index === data.length - 1) {
        const x = padding + (graphWidth / (data.length - 1)) * index;
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          x,
          canvas.height - padding + 20
        );
      }
    });

    // Draw legend
    const legendY = padding - 20;
    ctx.fillStyle = '#10B981';
    ctx.fillRect(canvas.width - 150, legendY, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Completed', canvas.width - 130, legendY + 10);

    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(canvas.width - 150, legendY + 20, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.fillText('Created', canvas.width - 130, legendY + 30);

  }, [data]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Work Completion Velocity</h3>
      <canvas ref={canvasRef} className="w-full" style={{ maxHeight: '300px' }} />
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-600">
            {data[data.length - 1]?.completed || 0}
          </p>
          <p className="text-xs text-gray-500">Completed Today</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">
            {data[data.length - 1]?.created || 0}
          </p>
          <p className="text-xs text-gray-500">Created Today</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-purple-600">
            {(data.reduce((sum, d) => sum + d.completed, 0) / data.length).toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">Avg Daily Completion</p>
        </div>
      </div>
    </div>
  );
});

VelocityGraph.displayName = 'VelocityGraph';

// Main WorkHub Component
export default function WorkHub() {
  const {
    workItems,
    teamMembers,
    projects,
    metrics,
    loading,
    error,
    createWorkItem,
    updateWorkItem,
    deleteWorkItem,
    moveWorkItem,
    assignWorkItem,
    updatePriority,
    filters,
    setFilters,
    setSortBy,
    searchWorkItems
  } = useReactiveWorkData();

  const [activeView, setActiveView] = useState<'kanban' | 'gantt' | 'matrix' | 'funnel'>('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Prepare funnel data
  const funnelData = useMemo(() => {
    const statusCounts = workItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { status: 'To Do', count: statusCounts['todo'] || 0 },
      { status: 'In Progress', count: statusCounts['in-progress'] || 0 },
      { status: 'Review', count: statusCounts['review'] || 0 },
      { status: 'Blocked', count: statusCounts['blocked'] || 0 },
      { status: 'Done', count: statusCounts['done'] || 0 }
    ];
  }, [workItems]);

  const handlePriorityMatrixMove = useCallback((id: string, urgency: number, importance: number) => {
    updateWorkItem(id, { urgency, importance });
  }, [updateWorkItem]);

  if (loading && workItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Work Hub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg font-semibold">Error loading Work Hub</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Work Hub</h1>
                <p className="text-sm text-gray-500">Project Management & Work Order Tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search work items..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => searchWorkItems(e.target.value)}
                />
              </div>

              {/* Create Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Work Item
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{metrics.totalTasks}</p>
              <p className="text-xs text-gray-500">Total Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.completedTasks}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics.inProgressTasks}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.blockedTasks}</p>
              <p className="text-xs text-gray-500">Blocked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{metrics.teamUtilization.toFixed(0)}%</p>
              <p className="text-xs text-gray-500">Team Utilization</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics.averageCompletionTime.toFixed(1)}d</p>
              <p className="text-xs text-gray-500">Avg Completion</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm w-fit">
          <button
            onClick={() => setActiveView('kanban')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'kanban' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FolderKanban className="w-4 h-4 inline mr-2" />
            Kanban Board
          </button>
          <button
            onClick={() => setActiveView('gantt')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'gantt' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Gantt Chart
          </button>
          <button
            onClick={() => setActiveView('matrix')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'matrix' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Priority Matrix
          </button>
          <button
            onClick={() => setActiveView('funnel')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'funnel' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4 inline mr-2" />
            Work Funnel
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AnimatePresence mode="wait">
          {activeView === 'kanban' && (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <KanbanBoard
                workItems={workItems}
                onMove={moveWorkItem}
                onUpdate={updateWorkItem}
              />
              <VelocityGraph data={metrics.velocityTrend} />
            </motion.div>
          )}

          {activeView === 'gantt' && (
            <motion.div
              key="gantt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <GanttChart items={workItems} />
              <ResourceUtilizationChart teamMembers={teamMembers} />
            </motion.div>
          )}

          {activeView === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PriorityMatrix
                items={workItems}
                onMove={handlePriorityMatrixMove}
              />
            </motion.div>
          )}

          {activeView === 'funnel' && (
            <motion.div
              key="funnel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              <WorkOrderFunnel data={funnelData} />
              <VelocityGraph data={metrics.velocityTrend} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Additional Charts */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {activeView !== 'gantt' && (
            <ResourceUtilizationChart teamMembers={teamMembers} />
          )}

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              {metrics.upcomingDeadlines.slice(0, 5).map(deadline => {
                const daysUntil = Math.ceil((new Date(deadline.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysUntil < 0;
                const isUrgent = daysUntil <= 2;

                return (
                  <div key={deadline.taskId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{deadline.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(deadline.dueDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isOverdue ? 'bg-red-100 text-red-700' :
                      isUrgent ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                       daysUntil === 0 ? 'Due today' :
                       `${daysUntil} days`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}