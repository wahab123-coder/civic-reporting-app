// ── Enums ─────────────────────────────────────────────────
export type UserRole = 'citizen' | 'admin' | 'government_officer' | 'ngo';
export type AuthProvider = 'local' | 'google';

export type ReportStatus =
  | 'submitted' | 'verified' | 'assigned'
  | 'in_progress' | 'resolved' | 'rejected';

export type ReportCategory =
  | 'pothole' | 'drainage' | 'illegal_dumping' | 'traffic_light'
  | 'water_leakage' | 'power_outage' | 'environmental_hazard'
  | 'security' | 'corruption' | 'other';

export type ReportPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MediaType = 'image' | 'video' | 'document';
export type NotificationType =
  | 'report_submitted' | 'report_verified' | 'report_assigned'
  | 'report_in_progress' | 'report_resolved' | 'report_rejected'
  | 'comment_added' | 'system';

// ── Entities ──────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  priority: ReportPriority;
  latitude?: number;
  longitude?: number;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  isAnonymous: boolean;
  upvotes: number;
  rejectionReason?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  user?: Partial<User>;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  media?: Media[];
}

export interface Media {
  id: string;
  fileUrl: string;
  thumbnailUrl?: string;
  type: MediaType;
  mimeType?: string;
  originalName?: string;
  fileSize?: number;
  reportId?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  reportId: string;
  user: Partial<User>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  headName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  reportId: string;
  department: Department;
  departmentId: string;
  assignedTo?: Partial<User>;
  assignedToId?: string;
  assignedBy?: Partial<User>;
  notes?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  referenceId?: string;
  referenceType?: string;
  userId: string;
  createdAt: string;
}

// ── API Responses ─────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount?: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ── Analytics ─────────────────────────────────────────────
export interface OverviewStats {
  totalReports: number;
  totalUsers: number;
  resolved: number;
  pending: number;
  avgResolutionHours: string;
  byStatus: { status: ReportStatus; count: number }[];
}

export interface MonthlyData {
  month: string;
  total: number;
  resolved: number;
  rejected: number;
}

export interface CategoryData {
  category: ReportCategory;
  count: number;
  resolved: number;
}

export interface DepartmentPerformance {
  department: string;
  totalAssigned: number;
  resolved: number;
  resolutionRate: number;
  avgResolutionHours: number;
}

// ── Query Params ──────────────────────────────────────────
export interface ReportQueryParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  category?: ReportCategory;
  priority?: ReportPriority;
  search?: string;
  city?: string;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
