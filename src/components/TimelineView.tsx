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
      case 'project': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'routine': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'simple': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 'meeting': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'training': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case 'event': return 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex justify-end mb-8">
        <select 
          value={daysToShow} 
          onChange={(e) => setDaysToShow(Number(e.target.value))}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value={7}>Próximos 7 dias</option>
          <option value={14}>Próximos 14 dias</option>
          <option value={30}>Próximos 30 dias</option>
          <option value={60}>Próximos 60 dias</option>
        </select>
      </div>

      <div className="space-y-8 relative">
        {/* Central Line with Gradient */}
        <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-transparent opacity-30 dark:opacity-50" />
        
        {/* Overdue Section */}
        {timelineData.overdueActivities.length > 0 && (
          <div className="relative mb-12">
            <div className="sticky top-0 z-20 py-4 pointer-events-none">
               <div className="flex items-center justify-center">
                 <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-full shadow-sm backdrop-blur-sm">
                   Atrasadas
                 </span>
               </div>
            </div>
            
            <div className="space-y-6">
              {timelineData.overdueActivities.map(activity => (
                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon Dot */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 md:absolute md:left-1/2 md:transform z-10">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] p-4 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group/card ml-auto md:ml-0">
                    <div className="absolute top-0 right-0 p-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
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
                      <span className="text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(parseISO(activity.plannedDate), "d 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{activity.title}</h3>
                    {activity.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{activity.description}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={() => onEditActivity(activity)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
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
              <div key={group.date.toISOString()} className="relative py-3 flex items-center justify-center group/day md:justify-center justify-start pl-4 md:pl-0">
                {/* Subtle Dot for Empty Days */}
                <div 
                  className={cn(
                    "relative z-10 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300",
                    isTodayDate 
                      ? "bg-indigo-600 border-indigo-600 w-4 h-4 ring-4 ring-indigo-100 dark:ring-indigo-900/50" 
                      : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 group-hover/day:border-indigo-400 group-hover/day:scale-125"
                  )}
                  title={format(group.date, "dd 'de' MMMM", { locale: ptBR })}
                >
                   <span className="absolute left-8 md:left-6 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 dark:text-gray-400 opacity-0 group-hover/day:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-100 dark:border-gray-700 z-20 pointer-events-none">
                     {format(group.date, "dd MMM", { locale: ptBR })}
                   </span>
                </div>
              </div>
            );
          }

          return (
          <div key={group.date.toISOString()} className="relative py-8">
             {/* Date Header / Milestone */}
             <div className="flex items-center justify-center mb-8 relative z-10">
               <div className={cn(
                 "px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-full shadow-sm border flex items-center gap-2 transition-colors backdrop-blur-sm",
                 isTodayDate 
                  ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-900/30" 
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
               )}>
                 {isTodayDate ? 'Hoje' : isTomorrow(group.date) ? 'Amanhã' : format(group.date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                 {isTodayDate && (
                   <span className="flex h-2 w-2 relative ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                 )}
               </div>
            </div>

            <div className="space-y-12">
              {group.activities.map((activity, index) => (
                <div key={`${activity.id}-${group.date.toISOString()}`} className="relative flex items-center justify-between md:justify-center group">
                  
                  {/* Connector Line (Desktop) */}
                  <div className={cn(
                    "hidden md:block absolute top-1/2 -translate-y-1/2 h-px w-[calc(50%-3rem)] -z-10 transition-colors duration-300",
                    index % 2 === 0 ? "right-[50%] mr-6 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600" : "left-[50%] ml-6 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"
                  )} />

                  {/* Icon Dot (Center) */}
                  <div className={cn(
                    "absolute left-4 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-2xl border-4 border-white dark:border-gray-900 shadow-md shrink-0 z-10 transition-transform group-hover:scale-110 duration-200",
                    getTypeColor(activity.type).split(' ')[0], // Use background color from helper
                    getTypeColor(activity.type).split(' ')[1]  // Use text color from helper
                  )}>
                    {getTypeIcon(activity.type)}
                  </div>
                  
                  {/* Card Container */}
                  <div className={cn(
                    "w-full pl-20 md:pl-0 flex",
                    index % 2 === 0 ? "md:justify-start md:pr-[50%]" : "md:justify-end md:pl-[50%]"
                  )}>
                    {/* Card */}
                    <div 
                      className={cn(
                        "w-full md:w-[calc(100%-3rem)] bg-white dark:bg-gray-800 rounded-2xl border shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group/card relative",
                        index % 2 === 0 ? "md:mr-auto" : "md:ml-auto",
                        activity.status === 'completed' ? "border-gray-200 dark:border-gray-700 opacity-60" : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500"
                      )}
                      onClick={() => onEditActivity(activity)}
                    >
                      {/* Color Strip */}
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", getTypeColor(activity.type).split(' ')[0].replace('bg-', 'bg-').replace('100', '500'))} />
                      
                      <div className="p-5 pl-7">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {activity.type}
                          </span>
                          {activity.status !== 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkRealized(activity);
                              }}
                              className="text-gray-300 hover:text-emerald-500 dark:text-gray-600 dark:hover:text-emerald-400 transition-colors p-1 -mr-2 -mt-2"
                              title="Concluir"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        
                        <h3 className={cn("font-bold text-lg mb-2 leading-tight", activity.status === 'completed' ? "text-gray-500 dark:text-gray-500 line-through" : "text-gray-900 dark:text-white")}>
                          {activity.title}
                        </h3>
                        
                        {activity.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">{activity.description}</p>
                        )}

                        {activity.type === 'project' && activity.subActivities && activity.subActivities.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                              <span>Progresso</span>
                              <span>{Math.round((activity.subActivities.filter(s => s.completed).length / activity.subActivities.length) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
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
