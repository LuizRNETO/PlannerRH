import {
  isSameDay,
  parseISO,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  getDate,
  getDay,
  addDays,
  isBefore,
  startOfDay
} from 'date-fns';
import { Activity } from '../types';

export function isActivityScheduledForDate(activity: Activity, date: Date): boolean {
  const planned = parseISO(activity.plannedDate);
  
  // Basic date match
  if (activity.frequency === 'once') {
    return isSameDay(planned, date);
  }

  // Recurrence logic
  // Only show future occurrences or today (or past if it was missed? let's show all valid occurrences)
  // But we must start from plannedDate
  // For recurrence, we generally want to see if 'date' is a valid occurrence of 'activity'
  
  // If the check date is before the start date, it can't be an occurrence
  if (isBefore(date, startOfDay(planned))) return false;

  if (activity.frequency === 'daily') {
    return differenceInDays(date, planned) % 1 === 0;
  }
  if (activity.frequency === 'weekly') {
    return differenceInWeeks(date, planned) % 1 === 0 && getDay(date) === getDay(planned);
  }
  if (activity.frequency === 'bi-weekly') {
    return differenceInWeeks(date, planned) % 2 === 0 && getDay(date) === getDay(planned);
  }
  if (activity.frequency === 'monthly') {
    // Simple monthly: same day of month
    return getDate(date) === getDate(planned) && differenceInMonths(date, planned) % 1 === 0;
  }
  if (activity.frequency === 'custom') {
    const interval = activity.interval || 1;
    const unit = activity.intervalUnit || 'days';

    if (unit === 'days') {
      return differenceInDays(date, planned) % interval === 0;
    }
    if (unit === 'weeks') {
      return differenceInWeeks(date, planned) % interval === 0 && getDay(date) === getDay(planned);
    }
    if (unit === 'months') {
      return getDate(date) === getDate(planned) && differenceInMonths(date, planned) % interval === 0;
    }
  }

  return isSameDay(planned, date);
}
