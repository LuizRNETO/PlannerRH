import { useMemo, useState } from 'react';
import { Activity } from '../types';
import { isActivityScheduledForDate } from '../utils/recurrence';
import { 
  addDays, 
  eachDayOfInterval, 
  format, 
  isToday, 
  isTomorrow, 
  startOfDay, 
  isBefore,
  parseISO,
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertCircle,
  Briefcase,
  Repeat,
  Zap,
  Users,
  GraduationCap,
  PartyPopper
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TimelineViewProps {
  activities: Activity[];
  onEditActivity: (activity: Activity) => void;
  onMarkRealized: (activity: Activity) => void;
}

export function TimelineView({ activities, onEditActivity, onMarkRealized }: TimelineViewProps) {
  const [daysToShow, setDaysToShow] = useState(30);

  const timelineData = useMemo(() => {
    const today = startOfDay(new Date());
    const endDate = addDays(today, daysToShow);
    
    // 1. Find overdue activities (only 'once' or past instances of recurring? 
    // For simplicity, let's just show 'pending' activities with plannedDate < today and frequency 'once'
    // Recurring ones are tricky if we don't track individual instances. 
    // Let's stick to the "Calendar" logic: we project activities onto dates.
    // So "Overdue" is just activities strictly scheduled for dates before today that are pending.
    // But since we generate instances, we can just look back a bit or just show non-recurring overdue.
    
    const overdueActivities = activities.filter(a => 
      a.status === 'pending' && 
      isBefore(parseISO(a.plannedDate), today) &&
      a.frequency === 'once' // Only show non-recurring as overdue to avoid clutter
    );

    // 2. Generate future days
    const days = eachDayOfInterval({ start: today, end: endDate });
    
    const futureGroups = days.map(day => {
      const dayActivities = activities.filter(activity => isActivityScheduledForDate(activity, day));
      return {
        date: day,
        activities: dayActivities
      };
    }); // Removed filter to show all days

    return { overdueActivities, futureGroups };
  }, [activities, daysToShow]);

  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'project': return <Briefcase className="w-4 h-4" />;
      case 'routine': return <Repeat className="w-4 h-4" />;
      case 'simple': return <Zap className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'training': return <GraduationCap className="w-4 h-4" />;
      case 'event': return <PartyPopper className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'routine': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'simple': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'meeting': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'training': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'event': return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-end mb-4">
        <select 
          value={daysToShow} 
          onChange={(e) => setDaysToShow(Number(e.target.value))}
          className="text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none p-1.5 bg-white"
        >
          <option value={7}>Próximos 7 dias</option>
          <option value={14}>Próximos 14 dias</option>
          <option value={30}>Próximos 30 dias</option>
          <option value={60}>Próximos 60 dias</option>
        </select>
      </div>

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        
        {/* Overdue Section */}
        {timelineData.overdueActivities.length > 0 && (
          <div className="relative">
            <div className="sticky top-0 z-10 bg-gray-50 py-2 mb-4">
               <div className="flex items-center justify-center">
                 <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 rounded-full shadow-sm">
                   Atrasadas
                 </span>
               </div>
            </div>
            
            <div className="space-y-4">
              {timelineData.overdueActivities.map(activity => (
                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon Dot */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-red-100 text-red-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 md:absolute md:left-1/2 md:transform">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 bg-white rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-[10px] font-bold uppercase tracking-wider text-red-600 border border-red-100">
                        <AlertCircle className="w-3 h-3" />
                        Atrasado
                      </span>
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-20">
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 w-fit", getTypeColor(activity.type))}>
                        {getTypeIcon(activity.type)}
                        {activity.type}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(parseISO(activity.plannedDate), "d 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                    {activity.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{activity.description}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={() => onEditActivity(activity)}
                        className="text-xs text-gray-500 hover:text-indigo-600 underline"
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Future Groups */}
        {timelineData.futureGroups.map((group, groupIndex) => {
          const hasActivities = group.activities.length > 0;
          const isTodayDate = isToday(group.date);
          
          if (!hasActivities) {
            return (
              <div key={group.date.toISOString()} className="relative py-2 flex items-center justify-center group/day">
                {/* Subtle Dot for Empty Days */}
                <div 
                  className={cn(
                    "relative z-10 w-2 h-2 rounded-full border transition-all duration-200",
                    isTodayDate 
                      ? "bg-indigo-600 border-indigo-600 w-3 h-3" 
                      : "bg-white border-gray-300 group-hover/day:border-gray-400 group-hover/day:scale-125"
                  )}
                  title={format(group.date, "dd 'de' MMMM", { locale: ptBR })}
                >
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 opacity-0 group-hover/day:opacity-100 transition-opacity whitespace-nowrap bg-white px-1 rounded shadow-sm border border-gray-100">
                     {format(group.date, "dd MMM", { locale: ptBR })}
                   </span>
                </div>
              </div>
            );
          }

          return (
          <div key={group.date.toISOString()} className="relative py-6">
             <div className="sticky top-20 z-10 mb-8 pointer-events-none">
               <div className="flex items-center justify-center">
                 <div className="relative">
                   {/* Axis Indicator for Days with Activities */}
                   <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-100 rounded-full -z-10 animate-pulse"></div>
                   
                   <span className={cn(
                     "px-4 py-1.5 text-sm font-bold uppercase tracking-wider rounded-full shadow-sm border flex items-center gap-2 transition-colors bg-white pointer-events-auto",
                     isTodayDate 
                      ? "text-indigo-600 border-indigo-200 ring-4 ring-indigo-50" 
                      : "text-gray-700 border-gray-200"
                   )}>
                     {isTodayDate ? 'Hoje' : isTomorrow(group.date) ? 'Amanhã' : format(group.date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                     <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                   </span>
                 </div>
               </div>
            </div>

            <div className="space-y-8">
              {group.activities.map((activity, index) => (
                <div key={`${activity.id}-${group.date.toISOString()}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  {/* Icon Dot */}
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-2xl border-4 border-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 md:absolute md:left-1/2 md:transform z-10 transition-transform group-hover:scale-110 duration-200",
                    getTypeColor(activity.type).split(' ')[0], // Use background color from helper
                    getTypeColor(activity.type).split(' ')[1]  // Use text color from helper
                  )}>
                    {getTypeIcon(activity.type)}
                  </div>
                  
                  {/* Card */}
                  <div 
                    className={cn(
                      "w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group/card",
                      activity.status === 'completed' ? "border-gray-200 opacity-75" : "border-gray-200 hover:border-indigo-300"
                    )}
                    onClick={() => onEditActivity(activity)}
                  >
                    {/* Color Strip */}
                    <div className={cn("h-1 w-full", getTypeColor(activity.type).split(' ')[0].replace('bg-', 'bg-').replace('100', '500'))} />
                    
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {activity.type}
                        </span>
                        {activity.status !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkRealized(activity);
                            }}
                            className="text-gray-300 hover:text-emerald-500 transition-colors p-1 -mr-2 -mt-2"
                            title="Concluir"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      
                      <h3 className={cn("font-bold text-lg mb-2 leading-tight", activity.status === 'completed' ? "text-gray-500 line-through" : "text-gray-900")}>
                        {activity.title}
                      </h3>
                      
                      {activity.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{activity.description}</p>
                      )}

                      {activity.type === 'project' && activity.subActivities && activity.subActivities.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                            <span>Progresso</span>
                            <span>{Math.round((activity.subActivities.filter(s => s.completed).length / activity.subActivities.length) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                              style={{ 
                                width: `${(activity.subActivities.filter(s => s.completed).length / activity.subActivities.length) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )})}
        
        {timelineData.futureGroups.length === 0 && timelineData.overdueActivities.length === 0 && (
           <div className="text-center py-20">
             <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <CalendarIcon className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900">Nenhuma atividade no período</h3>
             <p className="text-gray-500">Tente aumentar o período de visualização ou adicione novas atividades.</p>
           </div>
        )}
      </div>
    </div>
  );
}
