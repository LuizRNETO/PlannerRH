import { useState } from 'react';
import { Activity } from '../types';
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface GanttViewProps {
  activities: Activity[];
  onEditActivity: (activity: Activity) => void;
}

export function GanttView({ activities, onEditActivity }: GanttViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filter only projects or activities that act like projects (have subactivities)
  const projects = activities.filter(a => a.type === 'project' || (a.subActivities && a.subActivities.length > 0));

  // Timeline settings
  const daysToShow = 14; // 2 weeks view
  const startDate = startOfWeek(currentDate);
  const endDate = addDays(startDate, daysToShow - 1);
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  const getProgress = (activity: Activity) => {
    if (!activity.subActivities || activity.subActivities.length === 0) return 0;
    const completed = activity.subActivities.filter(s => s.completed).length;
    return Math.round((completed / activity.subActivities.length) * 100);
  };

  const getDuration = (activity: Activity) => {
    // Estimate duration: 
    // If completed, diff between realized and planned.
    // If pending, default to 5 days or interval if set.
    if (activity.status === 'completed' && activity.realizedDate) {
      const start = parseISO(activity.plannedDate);
      const end = parseISO(activity.realizedDate);
      const diff = differenceInDays(end, start);
      return Math.max(diff + 1, 1);
    }
    
    if (activity.interval && activity.intervalUnit === 'days') {
      return activity.interval;
    }
    
    return 5; // Default duration
  };

  const getBarPosition = (activity: Activity) => {
    const activityDate = parseISO(activity.plannedDate);
    if (!isValid(activityDate)) return null;

    const diffDays = differenceInDays(activityDate, startDate);
    const duration = getDuration(activity);

    // If activity ends before view start or starts after view end, don't show (or handle clipping)
    // For simplicity, we'll render if it overlaps at all, but let's just calculate left/width
    
    return {
      left: `${(diffDays / daysToShow) * 100}%`,
      width: `${(duration / daysToShow) * 100}%`
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            Cronograma de Projetos
          </h2>
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-600">
              {format(startDate, "d MMM", { locale: ptBR })} - {format(endDate, "d MMM", { locale: ptBR })}
            </span>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Projects List */}
        <div className="w-64 border-r border-gray-200 flex flex-col bg-white shrink-0 overflow-y-auto">
          <div className="h-12 border-b border-gray-200 bg-gray-50 flex items-center px-4 font-medium text-sm text-gray-500">
            Projetos
          </div>
          {projects.map(project => (
            <div 
              key={project.id} 
              className="h-16 border-b border-gray-100 px-4 flex flex-col justify-center hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onEditActivity(project)}
            >
              <div className="font-medium text-sm text-gray-900 truncate">{project.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${getProgress(project)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{getProgress(project)}%</span>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="p-4 text-sm text-gray-400 text-center italic">
              Nenhum projeto encontrado
            </div>
          )}
        </div>

        {/* Right Column: Timeline */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden">
          {/* Timeline Header */}
          <div className="h-12 border-b border-gray-200 bg-gray-50 flex min-w-full">
            {dates.map(date => (
              <div 
                key={date.toISOString()} 
                className={cn(
                  "flex-1 min-w-[40px] border-r border-gray-200 flex flex-col items-center justify-center text-xs",
                  isSameDay(date, new Date()) && "bg-indigo-50"
                )}
              >
                <span className="font-medium text-gray-700">{format(date, 'd')}</span>
                <span className="text-gray-400 text-[10px] uppercase">{format(date, 'EEE', { locale: ptBR })}</span>
              </div>
            ))}
          </div>

          {/* Timeline Grid & Bars */}
          <div className="flex-1 overflow-y-auto relative min-w-full">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {dates.map(date => (
                <div 
                  key={date.toISOString()} 
                  className={cn(
                    "flex-1 border-r border-gray-100 h-full",
                    isSameDay(date, new Date()) && "bg-indigo-50/30"
                  )}
                />
              ))}
            </div>

            {/* Project Bars */}
            {projects.map(project => {
              const position = getBarPosition(project);
              if (!position) return <div key={project.id} className="h-16 border-b border-transparent" />;

              return (
                <div key={project.id} className="h-16 border-b border-gray-100 relative flex items-center group">
                  <div 
                    className="absolute h-10 rounded-lg shadow-sm border border-indigo-200 bg-white cursor-pointer hover:border-indigo-300 transition-all flex flex-col justify-center px-2 z-10"
                    style={{ 
                      left: position.left, 
                      width: position.width,
                      minWidth: '4px' // Ensure visibility
                    }}
                    onClick={() => onEditActivity(project)}
                    title={`${project.title} - ${getProgress(project)}%`}
                  >
                    <div className="flex justify-between items-center w-full mb-1">
                      <span className="text-xs font-semibold text-gray-700 truncate mr-2">
                        {project.title}
                      </span>
                      <span className="text-[10px] font-medium text-gray-500">
                        {getProgress(project)}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${getProgress(project)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
