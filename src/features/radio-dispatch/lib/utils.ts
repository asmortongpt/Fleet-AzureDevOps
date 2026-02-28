import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { formatDate, formatDateTime } from '@/utils/format-helpers';

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    open: 'bg-emerald-500/50',
    in_progress: 'bg-yellow-500',
    assigned: 'bg-amber-500',
    completed: 'bg-green-500',
    closed: 'bg-white/[0.03]0',
    cancelled: 'bg-red-500',
    pending: 'bg-orange-500',
    active: 'bg-green-500',
    inactive: 'bg-white/[0.10]',
    critical: 'bg-red-600',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-emerald-500/50',
  };

  return statusColors[status.toLowerCase()] || 'bg-white/[0.03]0';
}

export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-emerald-800 bg-emerald-500/5',
  };

  return priorityColors[priority.toLowerCase()] || 'text-white/70 bg-white/[0.03]';
}
