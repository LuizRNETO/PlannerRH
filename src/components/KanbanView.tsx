import { Activity } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, MoreHorizontal, Clock, CheckCircle, AlertCircle, Play, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import React, { useState } from 'react';

interface KanbanViewProps {
  activities: Activity[];
  onEditActivity: (activity: Activity) => void;
  onMarkRealized: (activity: Activity) => void;
  onStatusChange: (activityId: string, newStatus: Activity['status']) => void;
}

interface DraggableCardProps {
  activity: Activity;
  onClick: (activity: Activity) => void;
  onMarkRealized: (activity: Activity) => void;
  onStatusChange: (activityId: string, newStatus: Activity['status']) => void;
  getTypeColor: (type: Activity['type']) => string;
  getTypeLabel: (type: Activity['type']) => string;
  getPriorityBadge: (priority: Activity['priority']) => React.ReactNode;
  columnId: string;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ activity, onClick, onMarkRealized, onStatusChange, getTypeColor, getTypeLabel, getPriorityBadge, columnId }) => {
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
      className={cn(
        "bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-50 rotate-2 shadow-xl"
      )}
      onClick={() => onClick(activity)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2">
          <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full", getTypeColor(activity.type))}>
            {getTypeLabel(activity.type)}
          </span>
          {getPriorityBadge(activity.priority || 'medium')}
        </div>
        <div className="flex gap-1">
          {columnId === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(activity.id, 'in_progress');
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              title="Iniciar"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {(columnId === 'pending' || columnId === 'in_progress') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRealized(activity);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-emerald-600 transition-colors"
              title="Concluir"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <h4 className="font-medium text-gray-900 mb-1">{activity.title}</h4>
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {format(parseISO(activity.plannedDate), "d 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
        {activity.comments && activity.comments.length > 0 && (
          <div className="flex items-center gap-1 ml-2 text-gray-400" title={`${activity.comments.length} comentário(s)`}>
            <MessageSquare className="w-3 h-3" />
            <span>{activity.comments.length}</span>
          </div>
        )}
        {activity.realizedDate && parseISO(activity.realizedDate) > parseISO(activity.plannedDate) && (
          <AlertCircle className="w-3 h-3 text-red-500 ml-auto" title="Atrasado" />
        )}
      </div>
    </div>
  );
};

interface DroppableColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
  className?: string;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, title, count, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex-1 min-w-[300px] flex flex-col h-full">
      <div className={cn("p-3 rounded-t-xl border-b-2 font-semibold text-gray-700 flex justify-between items-center", className)}>
        <span>{title}</span>
        <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
          {count}
        </span>
      </div>
      <div 
        ref={setNodeRef}
        className={cn(
          "bg-gray-50/50 flex-1 p-3 rounded-b-xl border border-t-0 border-gray-200 space-y-3 overflow-y-auto transition-colors",
          isOver && "bg-indigo-50/50 ring-2 ring-inset ring-indigo-200"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export function KanbanView({ activities, onEditActivity, onMarkRealized, onStatusChange }: KanbanViewProps) {
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

  const columns = [
    { id: 'pending', title: 'A Fazer', color: 'bg-gray-100 border-gray-200' },
    { id: 'in_progress', title: 'Em Andamento', color: 'bg-indigo-50 border-indigo-100' },
    { id: 'completed', title: 'Concluído', color: 'bg-emerald-50 border-emerald-100' },
    { id: 'cancelled', title: 'Cancelado', color: 'bg-red-50 border-red-100' },
  ] as const;

  const getActivitiesByStatus = (status: Activity['status']) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return activities
      .filter((a) => a.status === status)
      .sort((a, b) => {
        const weightA = priorityWeight[a.priority || 'medium'];
        const weightB = priorityWeight[b.priority || 'medium'];
        return weightB - weightA; // High priority first
      });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // over.id is the column status
      const newStatus = over.id as Activity['status'];
      const activity = activities.find(a => a.id === active.id);
      
      if (activity && activity.status !== newStatus) {
        onStatusChange(active.id as string, newStatus);
      }
    }
    setActiveId(null);
  };

  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-800';
      case 'routine': return 'bg-emerald-100 text-emerald-800';
      case 'simple': return 'bg-gray-100 text-gray-800';
      case 'meeting': return 'bg-purple-100 text-purple-800';
      case 'training': return 'bg-orange-100 text-orange-800';
      case 'event': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'project': return 'Projeto';
      case 'routine': return 'Rotina';
      case 'simple': return 'Simples';
      case 'meeting': return 'Reunião';
      case 'training': return 'Treinamento';
      case 'event': return 'Evento';
      default: return type;
    }
  };

  const getPriorityBadge = (priority: Activity['priority']) => {
    switch (priority) {
      case 'high': return <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Alta</span>;
      case 'medium': return <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">Média</span>;
      case 'low': return <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Baixa</span>;
      default: return null;
    }
  };

  const activeActivity = activeId ? activities.find(a => a.id === activeId) : null;

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full overflow-x-auto pb-4">
        {columns.map((column) => (
          <DroppableColumn 
            key={column.id} 
            id={column.id} 
            title={column.title} 
            count={getActivitiesByStatus(column.id).length}
            className={column.color}
          >
            {getActivitiesByStatus(column.id).map((activity) => (
              <DraggableCard
                key={activity.id}
                activity={activity}
                onClick={onEditActivity}
                onMarkRealized={onMarkRealized}
                onStatusChange={onStatusChange}
                getTypeColor={getTypeColor}
                getTypeLabel={getTypeLabel}
                getPriorityBadge={getPriorityBadge}
                columnId={column.id}
              />
            ))}
            {getActivitiesByStatus(column.id).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                Vazio
              </div>
            )}
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay>
        {activeActivity ? (
          <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 opacity-90 rotate-2 w-[300px]">
             <h4 className="font-medium text-gray-900 mb-1">{activeActivity.title}</h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
