/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
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
import { useActivities } from './hooks/useActivities';
import { Activity } from './types';
import { Plus, LayoutGrid, List, Kanban, PieChart, GitGraph, BarChartHorizontal } from 'lucide-react';
import { cn } from './lib/utils';
import { isToday, isThisWeek, isThisMonth, isBefore, parseISO, startOfDay } from 'date-fns';

type ViewMode = 'calendar' | 'list' | 'kanban' | 'analytics' | 'timeline' | 'gantt';

export default function App() {
  const { activities, addActivity, updateActivity, deleteActivity, markAsRealized } = useActivities();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [selectedPriority, setSelectedPriority] = useState<FilterPriority>('all');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<FilterDateRange>('all');
  const [selectedSubStatus, setSelectedSubStatus] = useState<FilterSubStatus>('all');

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
    if (selectedActivity) {
      updateActivity(selectedActivity.id, activityData);
    } else {
      addActivity(activityData);
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
    updateActivity(activityId, { status: newStatus });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Planejamento RH</h1>
            <p className="text-gray-500 mt-1">Acompanhe atividades planejadas vs. realizadas e projetos.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Notifications activities={activities} />
            
            <div className="bg-white p-1 rounded-lg border border-gray-200 flex items-center shadow-sm">
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium",
                  viewMode === 'calendar' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                )}
                title="Calendário"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Calendário</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium",
                  viewMode === 'list' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                )}
                title="Lista"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium",
                  viewMode === 'kanban' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                )}
                title="Kanban"
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium",
                  viewMode === 'analytics' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                )}
                title="Análise"
              >
                <PieChart className="w-4 h-4" />
                <span className="hidden sm:inline">Análise</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium",
                  viewMode === 'timeline' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                )}
                title="Timeline"
              >
                <GitGraph className="w-4 h-4" />
                <span className="hidden sm:inline">Timeline</span>
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={cn(
                  "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium",
                  viewMode === 'gantt' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                )}
                title="Gantt"
              >
                <BarChartHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Gantt</span>
              </button>
            </div>

            <button
              onClick={() => handleAddActivity()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-5 h-5" />
              Nova Atividade
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
            />
          )}
          {viewMode === 'gantt' && (
            <GanttView 
              activities={filteredActivities}
              onEditActivity={handleEditActivity}
            />
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
