import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ReportCategory, ReportPriority, ReportStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted:   'Submitted',
  verified:    'Verified',
  assigned:    'Assigned',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  rejected:    'Rejected',
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  submitted:   'badge-submitted',
  verified:    'badge-verified',
  assigned:    'badge-assigned',
  in_progress: 'badge-in_progress',
  resolved:    'badge-resolved',
  rejected:    'badge-rejected',
};
export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  pothole:              'Pothole',
  drainage:             'Drainage Blockage',
  illegal_dumping:      'Illegal Dumping',
  traffic_light:        'Broken Traffic Light',
  water_leakage:        'Water Leakage',
  power_outage:         'Power Outage',
  environmental_hazard: 'Environmental Hazard',
  security:             'Security Concern',
  corruption:           'Public Corruption',
  other:                'Other',
};

export const PRIORITY_COLORS: Record<ReportPriority, string> = {
  low:    'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export const CATEGORY_ICONS: Record<ReportCategory, string> = {
  pothole:              '🕳️',
  drainage:             '🌊',
  illegal_dumping:      '🗑️',
  traffic_light:        '🚦',
  water_leakage:        '💧',
  power_outage:         '⚡',
  environmental_hazard: '☣️',
  security:             '🔒',
  corruption:           '⚖️',
  other:                '📋',
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function truncate(str: string, max = 80): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
