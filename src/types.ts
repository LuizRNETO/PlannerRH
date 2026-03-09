export type ActivityType = 'project' | 'routine' | 'simple' | 'meeting' | 'training' | 'event';
export type Frequency = 'once' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'custom';
export type IntervalUnit = 'days' | 'weeks' | 'months';
export type Priority = 'low' | 'medium' | 'high';

export interface SubActivity {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  frequency: Frequency;
  interval?: number;
  intervalUnit?: IntervalUnit;
  priority: Priority;
  plannedDate: string; // ISO date string
  startDate?: string | null; // ISO date string
  endDate?: string | null; // ISO date string
  realizedDate?: string | null; // ISO date string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  subActivities?: SubActivity[];
  comments?: Comment[];
  estimatedHours?: number;
  actualHours?: number;
  assignee?: string;
  assignees?: string[];
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  activities: Activity[];
}
