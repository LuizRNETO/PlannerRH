import { useState, useRef, useEffect } from 'react';
import { Activity } from '../types';
import { Bell, AlertCircle, Calendar } from 'lucide-react';
import { format, parseISO, isBefore, isAfter, addDays, isToday, isTomorrow, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationsProps {
  activities: Activity[];
}

export function Notifications({ activities }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('hr-planner-read-notifications');
    return stored ? JSON.parse(stored) : [];
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('hr-planner-read-notifications', JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const today = startOfDay(new Date());
  const threeDaysFromNow = addDays(today, 3);

  const overdueActivities = activities.filter(activity => {
    if (activity.status !== 'pending') return false;
    const planned = parseISO(activity.plannedDate);
    // Check if planned date is strictly before today (ignoring time)
    return isBefore(planned, today);
  });

  const upcomingActivities = activities.filter(activity => {
    if (activity.status !== 'pending') return false;
    const planned = parseISO(activity.plannedDate);
    // Check if planned date is today or in the future, AND before 3 days from now
    return (isToday(planned) || isAfter(planned, today)) && isBefore(planned, threeDaysFromNow);
  });

  const unreadOverdue = overdueActivities.filter(a => !readNotificationIds.includes(a.id));
  const unreadUpcoming = upcomingActivities.filter(a => !readNotificationIds.includes(a.id));

  const hasUnread = unreadOverdue.length > 0 || unreadUpcoming.length > 0;
  const totalUnread = unreadOverdue.length + unreadUpcoming.length;

  const markAllAsRead = () => {
    const allIds = [...overdueActivities, ...upcomingActivities].map(a => a.id);
    setReadNotificationIds(prev => Array.from(new Set([...prev, ...allIds])));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        title="Notificações"
      >
        <Bell className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              {totalUnread > 0 && (
                <span className="text-xs font-medium text-white bg-red-500 px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
            {hasUnread && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {overdueActivities.length === 0 && upcomingActivities.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>Nenhuma notificação no momento.</p>
              </div>
            )}

            {overdueActivities.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                  Atrasadas
                </p>
                <div className="space-y-1">
                  {overdueActivities.map(activity => {
                    const isRead = readNotificationIds.includes(activity.id);
                    return (
                      <div key={activity.id} className={`p-3 rounded-lg border flex gap-3 ${isRead ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-red-50 border-red-100'}`}>
                        <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isRead ? 'text-gray-400' : 'text-red-600'}`} />
                        <div>
                          <p className={`text-sm font-medium line-clamp-1 ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>{activity.title}</p>
                          <p className={`text-xs mt-0.5 ${isRead ? 'text-gray-500' : 'text-red-600'}`}>
                            Era para: {format(parseISO(activity.plannedDate), "d 'de' MMM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {upcomingActivities.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1 mt-2">
                  Próximas (3 dias)
                </p>
                <div className="space-y-1">
                  {upcomingActivities.map(activity => {
                    const isRead = readNotificationIds.includes(activity.id);
                    return (
                      <div key={activity.id} className={`p-3 rounded-lg border flex gap-3 ${isRead ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-indigo-50 border-indigo-100'}`}>
                        <Calendar className={`w-5 h-5 shrink-0 mt-0.5 ${isRead ? 'text-gray-400' : 'text-indigo-600'}`} />
                        <div>
                          <p className={`text-sm font-medium line-clamp-1 ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>{activity.title}</p>
                          <p className={`text-xs mt-0.5 ${isRead ? 'text-gray-500' : 'text-indigo-600'}`}>
                            {isToday(parseISO(activity.plannedDate)) 
                              ? 'Hoje' 
                              : isTomorrow(parseISO(activity.plannedDate)) 
                                ? 'Amanhã' 
                                : format(parseISO(activity.plannedDate), "d 'de' MMM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
