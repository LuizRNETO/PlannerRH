/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { Stats } from './components/Stats';
import { ActivityModal } from './components/ActivityModal';
import { ListView } from './components/ListView';
import { KanbanView } from './components/KanbanView';
import { AnalyticsView } from './components/AnalyticsView';
import { TimelineView } from './components/TimelineView';
import { GanttView } from './components/GanttView';
import { Notifications } from './components/Notifications';
import { FilterBar, FilterType, FilterPriority, FilterStatus, FilterDateRange, FilterSubStatus } from './components/FilterBar';
import { ReportingDashboard } from './components/ReportingDashboard';
import { useActivities } from './hooks/useActivities';
import { Activity } from './types';
import { ASSIGNEES } from './constants';
import { Plus, LayoutGrid, List, Kanban, PieChart, GitGraph, BarChartHorizontal, FileBarChart, Moon, Sun } from 'lucide-react';
import { cn } from './lib/utils';
import { isToday, isThisWeek, isThisMonth, isBefore, isAfter, parseISO, startOfDay, addDays, addWeeks, addMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

type ViewMode = 'calendar' | 'list' | 'kanban' | 'analytics' | 'timeline' | 'gantt' | 'reporting';

export default function App() {
  const { activities, addActivity, addActivities, updateActivity, deleteActivity, markAsRealized } = useActivities();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [selectedPriority, setSelectedPriority] = useState<FilterPriority>('all');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<FilterDateRange>('all');
  const [selectedSubStatus, setSelectedSubStatus] = useState<FilterSubStatus>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

  // Get unique assignees
  const uniqueAssignees = Array.from(new Set([
    ...ASSIGNEES,
    ...activities
      .flatMap(a => a.assignees && a.assignees.length > 0 ? a.assignees : (a.assignee ? [a.assignee] : []))
      .filter((a): a is string => !!a && a.trim() !== '')
  ])).sort();

  // Filter Logic
  const filteredActivities = activities.filter(activity => {
    // Search Term
    if (searchTerm && !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !activity.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Type
    if (selectedType !== 'all' && activity.type !== selectedType) {
      return false;
    }

    // Priority
    if (selectedPriority !== 'all' && (activity.priority || 'medium') !== selectedPriority) {
      return false;
    }

    // Status
    if (selectedStatus !== 'all' && activity.status !== selectedStatus) {
      return false;
    }

    // Assignee
    if (selectedAssignee !== 'all') {
      const activityAssignees = activity.assignees && activity.assignees.length > 0 ? activity.assignees : (activity.assignee ? [activity.assignee] : []);
      if (selectedAssignee === 'unassigned') {
        if (activityAssignees.length > 0) return false;
      } else {
        if (!activityAssignees.includes(selectedAssignee)) return false;
      }
    }

    // Date Range
    if (selectedDateRange !== 'all') {
      const date = parseISO(activity.plannedDate);
      const today = startOfDay(new Date());

      if (selectedDateRange === 'today' && !isToday(date)) return false;
      if (selectedDateRange === 'week' && !isThisWeek(date)) return false;
      if (selectedDateRange === 'month' && !isThisMonth(date)) return false;
      if (selectedDateRange === 'overdue') {
        if (activity.status === 'completed' || activity.status === 'cancelled') return false;
        if (!isBefore(date, today)) return false;
      }
    }

    // Sub-activity Status
    if (selectedSubStatus !== 'all') {
      const subs = activity.subActivities || [];
      const hasSubs = subs.length > 0;

      if (selectedSubStatus === 'no-subs' && hasSubs) return false;
      if (selectedSubStatus === 'has-pending' && (!hasSubs || subs.every(s => s.completed))) return false;
      if (selectedSubStatus === 'fully-completed' && (!hasSubs || subs.some(s => !s.completed))) return false;
    }

    return true;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedPriority('all');
    setSelectedStatus('all');
    setSelectedDateRange('all');
    setSelectedSubStatus('all');
    setSelectedAssignee('all');
  };

  const handleAddActivity = (date?: Date) => {
    setSelectedDate(date || new Date());
    setSelectedActivity(undefined);
    setIsModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setSelectedDate(undefined);
    setIsModalOpen(true);
  };

  const handleSaveActivity = (activityData: any) => {
    const { generateMultiple, recurrenceEndType, occurrences, recurrenceEndDate, ...dataToSave } = activityData;
    
    if (dataToSave.status === 'in_progress' && !dataToSave.startDate) {
      dataToSave.startDate = new Date().toISOString().split('T')[0];
    }

    if (selectedActivity) {
      updateActivity(selectedActivity.id, dataToSave);
    } else {
      if (generateMultiple) {
        const activitiesToCreate = [dataToSave];
        let currentDate = parseISO(dataToSave.plannedDate);
        let count = 1;
        const maxOccurrences = 365; // hard limit to prevent infinite loops
        
        while (true) {
          if (recurrenceEndType === 'occurrences' && count >= occurrences) break;
          if (count >= maxOccurrences) break;

          let nextDate = new Date(currentDate);
          
          if (dataToSave.frequency === 'daily') {
            nextDate = addDays(nextDate, 1);
          } else if (dataToSave.frequency === 'weekly') {
            nextDate = addWeeks(nextDate, 1);
          } else if (dataToSave.frequency === 'bi-weekly') {
            nextDate = addWeeks(nextDate, 2);
          } else if (dataToSave.frequency === 'monthly') {
            nextDate = addMonths(nextDate, 1);
          } else if (dataToSave.frequency === 'custom') {
            if (dataToSave.intervalUnit === 'days') {
              nextDate = addDays(nextDate, dataToSave.interval || 1);
            } else if (dataToSave.intervalUnit === 'weeks') {
              nextDate = addWeeks(nextDate, dataToSave.interval || 1);
            } else if (dataToSave.intervalUnit === 'months') {
              nextDate = addMonths(nextDate, dataToSave.interval || 1);
            }
          }

          if (recurrenceEndType === 'date') {
            const endDate = parseISO(recurrenceEndDate);
            if (isAfter(startOfDay(nextDate), startOfDay(endDate))) {
              break;
            }
          }
          
          activitiesToCreate.push({
            ...dataToSave,
            plannedDate: nextDate.toISOString().split('T')[0],
            status: 'pending',
            startDate: undefined,
            endDate: undefined,
            actualHours: 0,
            subActivities: dataToSave.subActivities ? dataToSave.subActivities.map((s: any) => ({ ...s, id: uuidv4(), completed: false })) : []
          });
          
          currentDate = nextDate;
          count++;
        }
        
        addActivities(activitiesToCreate);
      } else {
        addActivity(dataToSave);
      }
    }
    setIsModalOpen(false);
  };

  const handleDeleteActivity = (id: string) => {
    deleteActivity(id);
    setIsModalOpen(false);
  };

  const handleMarkRealized = (activity: Activity) => {
    const today = new Date().toISOString().split('T')[0];
    markAsRealized(activity.id, today);
  };

  const handleMoveActivity = (activityId: string, newDate: Date) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      const dateStr = newDate.toISOString().split('T')[0];
      updateActivity(activityId, { plannedDate: dateStr });
    }
  };

  const handleStatusChange = (activityId: string, newStatus: Activity['status']) => {
    const activity = activities.find(a => a.id === activityId);
    const updates: Partial<Activity> = { status: newStatus };
    
    if (newStatus === 'in_progress' && activity && !activity.startDate) {
      updates.startDate = new Date().toISOString().split('T')[0];
    }
    
    updateActivity(activityId, updates);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Planejamento RH</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Acompanhe atividades planejadas vs. realizadas e projetos.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Notifications activities={activities} />
            
            <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center shadow-sm overflow-x-auto">
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap",
                  viewMode === 'calendar' 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                title="Calendário"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Calendário</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap",
                  viewMode === 'list' 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                title="Lista"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap",
                  viewMode === 'kanban' 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                title="Kanban"
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap",
                  viewMode === 'analytics' 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                title="Análise"
              >
                <PieChart className="w-4 h-4" />
                <span className="hidden sm:inline">Análise</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap",
                  viewMode === 'timeline' 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                title="Timeline"
              >
                <GitGraph className="w-4 h-4" />
                <span className="hidden sm:inline">Timeline</span>
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap",
                  viewMode === 'gantt' 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                title="Gantt"
              >
                <BarChartHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Gantt</span>
              </button>
              <button
                onClick={() => setViewMode('reporting')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap",
                  viewMode === 'reporting' 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                title="Relatórios"
              >
                <FileBarChart className="w-4 h-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </button>
            </div>

            <button
              onClick={() => handleAddActivity()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nova Atividade</span>
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <Stats activities={filteredActivities} />

        {/* Filters */}
        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedDateRange={selectedDateRange}
          onDateRangeChange={setSelectedDateRange}
          selectedSubStatus={selectedSubStatus}
          onSubStatusChange={setSelectedSubStatus}
          assignees={uniqueAssignees}
          selectedAssignee={selectedAssignee}
          onAssigneeChange={setSelectedAssignee}
          onClearFilters={handleClearFilters}
        />

        {/* Main Content Area */}
        <div className="h-[800px]">
          {viewMode === 'calendar' && (
            <Calendar
              activities={filteredActivities}
              onAddActivity={handleAddActivity}
              onEditActivity={handleEditActivity}
              onMarkRealized={handleMarkRealized}
              onMoveActivity={handleMoveActivity}
            />
          )}
          {viewMode === 'list' && (
            <ListView
              activities={filteredActivities}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onMarkRealized={handleMarkRealized}
              onStartActivity={(activity) => handleStatusChange(activity.id, 'in_progress')}
            />
          )}
          {viewMode === 'kanban' && (
            <KanbanView
              activities={filteredActivities}
              onEditActivity={handleEditActivity}
              onMarkRealized={handleMarkRealized}
              onStatusChange={handleStatusChange}
            />
          )}
          {viewMode === 'analytics' && (
            <AnalyticsView activities={filteredActivities} />
          )}
          {viewMode === 'timeline' && (
            <TimelineView 
              activities={filteredActivities}
              onEditActivity={handleEditActivity}
              onMarkRealized={handleMarkRealized}
              onStatusChange={handleStatusChange}
            />
          )}
          {viewMode === 'gantt' && (
            <GanttView 
              activities={filteredActivities}
              onEditActivity={handleEditActivity}
            />
          )}
          {viewMode === 'reporting' && (
            <ReportingDashboard activities={filteredActivities} />
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ActivityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveActivity}
          onDelete={handleDeleteActivity}
          initialDate={selectedDate}
          activity={selectedActivity}
        />
      )}
    </div>
  );
}
