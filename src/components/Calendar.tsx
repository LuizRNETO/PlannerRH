import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  isValid,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, CheckCircle, Clock, AlertCircle, Check, Sidebar, X, Repeat } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Activity } from '../types';
import { cn } from '../lib/utils';
import { isActivityScheduledForDate } from '../utils/recurrence';

interface CalendarProps {
  activities: Activity[];
  onAddActivity: (date: Date) => void;
  onEditActivity: (activity: Activity) => void;
  onMarkRealized: (activity: Activity) => void;
  onMoveActivity: (activityId: string, newDate: Date) => void;
}

interface DraggableActivityProps {
  activity: Activity;
  onClick: (e: React.MouseEvent) => void;
  onMarkRealized: (activity: Activity) => void;
  getActivityColor: (type: Activity['type']) => string;
}

const DraggableActivity: React.FC<DraggableActivityProps> = ({ activity, onClick, onMarkRealized, getActivityColor }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
    data: { activity }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'text-xs p-1.5 rounded border cursor-grab active:cursor-grabbing hover:shadow-sm transition-all flex flex-col gap-0.5 touch-none',
        getActivityColor(activity.type),
        activity.status === 'completed' && 'opacity-75',
        isDragging && 'opacity-50 shadow-lg rotate-2'
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          {activity.frequency !== 'once' && (
            <Repeat className="w-3 h-3 text-gray-500 shrink-0" />
          )}
          <span className="font-medium truncate">{activity.title}</span>
        </div>
        {activity.status === 'completed' ? (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRealized(activity);
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on button click
            className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full p-0.5 transition-all shrink-0"
            title="Marcar como Realizado"
          >
            <CheckCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      
      {activity.type === 'project' && activity.subActivities && activity.subActivities.length > 0 && (
        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mt-0.5">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ 
              width: `${(activity.subActivities.filter(s => s.completed).length / activity.subActivities.length) * 100}%` 
            }}
          />
        </div>
      )}

      {activity.realizedDate && (
        <div className="text-[10px] opacity-75 flex items-center gap-1">
          Feito: {format(parseISO(activity.realizedDate), 'd MMM', { locale: ptBR })}
          {parseISO(activity.realizedDate) > parseISO(activity.plannedDate) && (
             <AlertCircle className="w-3 h-3 text-red-500" />
          )}
        </div>
      )}
    </div>
  );
}

interface DroppableDayProps {
  day: Date;
  isCurrent: boolean;
  isTodayDate: boolean;
  onAddActivity: (date: Date) => void;
  children: React.ReactNode;
}

const DroppableDay: React.FC<DroppableDayProps> = ({ day, isCurrent, isTodayDate, onAddActivity, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-white min-h-[120px] p-2 flex flex-col gap-1 group relative transition-colors',
        !isCurrent && 'bg-gray-50/30 text-gray-400',
        isOver && 'bg-indigo-50 ring-2 ring-inset ring-indigo-300'
      )}
      onClick={() => onAddActivity(day)}
    >
      <div className="flex justify-between items-start">
        <span
          className={cn(
            'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
            isTodayDate
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-700'
          )}
        >
          {format(day, 'd')}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddActivity(day);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-full transition-opacity"
        >
          <Plus className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[150px] scrollbar-thin">
        {children}
      </div>
    </div>
  );
}

export function Calendar({ activities, onAddActivity, onEditActivity, onMarkRealized, onMoveActivity }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDaySidebar, setShowDaySidebar] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // over.id is the date ISO string
      const newDate = parseISO(over.id as string);
      if (isValid(newDate)) {
        onMoveActivity(active.id as string, newDate);
      }
    }
    setActiveId(null);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const [filterType, setFilterType] = useState<Activity['type'] | 'all' | 'recurring'>('all');
  const [filterFrequency, setFilterFrequency] = useState<Activity['frequency'] | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Activity['status'] | 'all'>('all');

  const getActivitiesForDay = (date: Date) => {
    return activities.filter((activity) => {
      // Filters
      let isTypeMatch = true;
      if (filterType === 'recurring') {
        isTypeMatch = activity.frequency !== 'once';
      } else if (filterType !== 'all') {
        isTypeMatch = activity.type === filterType;
      }
      
      const isFrequencyMatch = filterFrequency === 'all' || activity.frequency === filterFrequency;
      const isStatusMatch = filterStatus === 'all' || activity.status === filterStatus;
      
      if (!isTypeMatch || !isFrequencyMatch || !isStatusMatch) return false;

      return isActivityScheduledForDate(activity, date);
    });
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'project':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'routine':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'simple':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'meeting':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'training':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'event':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none p-1.5 bg-white"
          >
            <option value="all">Todos os Tipos</option>
            <option value="recurring">Recorrentes</option>
            <option value="project">Projetos</option>
            <option value="routine">Rotina</option>
            <option value="simple">Simples</option>
            <option value="meeting">Reunião</option>
            <option value="training">Treinamento</option>
            <option value="event">Evento</option>
          </select>

          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none p-1.5 bg-white"
          >
            <option value="all">Todas as Frequências</option>
            <option value="once">Única</option>
            <option value="daily">Diária</option>
            <option value="weekly">Semanal</option>
            <option value="bi-weekly">Quinzenal</option>
            <option value="monthly">Mensal</option>
            <option value="custom">Personalizada</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none p-1.5 bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <div className="flex gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div> Projeto
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Rotina
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div> Simples
          </div>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <button
            onClick={() => setShowDaySidebar(!showDaySidebar)}
            className={cn(
              "p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium",
              showDaySidebar ? "bg-indigo-100 text-indigo-700" : "hover:bg-gray-100 text-gray-600"
            )}
            title="Visualização do Dia"
          >
            <Sidebar className="w-5 h-5" />
            <span className="hidden sm:inline">Hoje</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 shrink-0">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 gap-px overflow-y-auto">
              {days.map((day) => {
                const dayActivities = getActivitiesForDay(day);
                const isCurrent = isSameMonth(day, monthStart);
                const isTodayDate = isToday(day);

                return (
                  <DroppableDay
                    key={day.toString()}
                    day={day}
                    isCurrent={isCurrent}
                    isTodayDate={isTodayDate}
                    onAddActivity={onAddActivity}
                  >
                    {dayActivities.map((activity) => (
                      <DraggableActivity
                        key={activity.id}
                        activity={activity}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditActivity(activity);
                        }}
                        onMarkRealized={onMarkRealized}
                        getActivityColor={getActivityColor}
                      />
                    ))}
                  </DroppableDay>
                );
              })}
            </div>
            <DragOverlay>
              {activeId ? (
                <div className={cn(
                  'text-xs p-1.5 rounded border shadow-lg bg-white opacity-80 rotate-2 w-[150px]',
                  getActivityColor(activities.find(a => a.id === activeId)?.type || 'simple')
                )}>
                   <span className="font-medium truncate">{activities.find(a => a.id === activeId)?.title}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Today Sidebar */}
        {showDaySidebar && (
          <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full shadow-xl z-10 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900">Agenda de Hoje</h3>
                <p className="text-xs text-gray-500 capitalize">
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <button
                onClick={() => setShowDaySidebar(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {getActivitiesForDay(new Date()).length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">Nada planejado para hoje!</p>
                  <p className="text-xs mt-1">Aproveite o dia livre.</p>
                  <button
                    onClick={() => onAddActivity(new Date())}
                    className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                  >
                    Adicionar atividade
                  </button>
                </div>
              ) : (
                getActivitiesForDay(new Date()).map(activity => (
                  <div 
                    key={activity.id}
                    className={cn(
                      "p-3 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-all group",
                      getActivityColor(activity.type)
                    )}
                    onClick={() => onEditActivity(activity)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                        {activity.type === 'project' ? 'Projeto' : 
                         activity.type === 'routine' ? 'Rotina' : 
                         activity.type === 'meeting' ? 'Reunião' : 
                         activity.type === 'training' ? 'Treinamento' : 
                         activity.type === 'event' ? 'Evento' : 'Simples'}
                      </span>
                      {activity.status !== 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRealized(activity);
                          }}
                          className="text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Concluir"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">{activity.title}</h4>
                    
                    {activity.description && (
                      <p className="text-xs opacity-70 line-clamp-2 mb-2">{activity.description}</p>
                    )}

                    {activity.type === 'project' && activity.subActivities && activity.subActivities.length > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] mb-1 opacity-80">
                          <span>Progresso</span>
                          <span>{Math.round((activity.subActivities.filter(s => s.completed).length / activity.subActivities.length) * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(activity.subActivities.filter(s => s.completed).length / activity.subActivities.length) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/5 text-xs opacity-70">
                       {activity.status === 'completed' ? (
                         <span className="flex items-center gap-1 text-emerald-700 font-medium">
                           <CheckCircle className="w-3 h-3" /> Concluído
                         </span>
                       ) : (
                         <span className="flex items-center gap-1">
                           <Clock className="w-3 h-3" /> Pendente
                         </span>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
