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
import { Notifications } from './components/Notifications';
import { useActivities } from './hooks/useActivities';
import { Activity } from './types';
import { Plus, LayoutGrid, List, Kanban, PieChart, GitGraph } from 'lucide-react';
import { cn } from './lib/utils';

type ViewMode = 'calendar' | 'list' | 'kanban' | 'analytics' | 'timeline';

export default function App() {
  const { activities, addActivity, updateActivity, deleteActivity, markAsRealized } = useActivities();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

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
        <Stats activities={activities} />

        {/* Main Content Area */}
        <div className="h-[800px]">
          {viewMode === 'calendar' && (
            <Calendar
              activities={activities}
              onAddActivity={handleAddActivity}
              onEditActivity={handleEditActivity}
              onMarkRealized={handleMarkRealized}
              onMoveActivity={handleMoveActivity}
            />
          )}
          {viewMode === 'list' && (
            <ListView
              activities={activities}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onMarkRealized={handleMarkRealized}
            />
          )}
          {viewMode === 'kanban' && (
            <KanbanView
              activities={activities}
              onEditActivity={handleEditActivity}
              onMarkRealized={handleMarkRealized}
            />
          )}
          {viewMode === 'analytics' && (
            <AnalyticsView activities={activities} />
          )}
          {viewMode === 'timeline' && (
            <TimelineView 
              activities={activities}
              onEditActivity={handleEditActivity}
              onMarkRealized={handleMarkRealized}
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
