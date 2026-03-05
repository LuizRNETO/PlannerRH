import { Activity } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, MoreHorizontal, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface KanbanViewProps {
  activities: Activity[];
  onEditActivity: (activity: Activity) => void;
  onMarkRealized: (activity: Activity) => void;
}

export function KanbanView({ activities, onEditActivity, onMarkRealized }: KanbanViewProps) {
  const columns = [
    { id: 'pending', title: 'A Fazer', color: 'bg-gray-100 border-gray-200' },
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

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex-1 min-w-[300px] flex flex-col h-full">
          <div className={cn("p-3 rounded-t-xl border-b-2 font-semibold text-gray-700 flex justify-between items-center", column.color)}>
            <span>{column.title}</span>
            <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
              {getActivitiesByStatus(column.id).length}
            </span>
          </div>
          <div className="bg-gray-50/50 flex-1 p-3 rounded-b-xl border border-t-0 border-gray-200 space-y-3 overflow-y-auto">
            {getActivitiesByStatus(column.id).map((activity) => (
              <div
                key={activity.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => onEditActivity(activity)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full", getTypeColor(activity.type))}>
                      {getTypeLabel(activity.type)}
                    </span>
                    {getPriorityBadge(activity.priority || 'medium')}
                  </div>
                  {column.id === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRealized(activity);
                      }}
                      className="text-gray-400 hover:text-emerald-600 transition-colors"
                      title="Concluir"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{activity.title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                  <Clock className="w-3 h-3" />
                  <span>
                    {format(parseISO(activity.plannedDate), "d 'de' MMMM", { locale: ptBR })}
                  </span>
                  {activity.realizedDate && parseISO(activity.realizedDate) > parseISO(activity.plannedDate) && (
                    <AlertCircle className="w-3 h-3 text-red-500 ml-auto" title="Atrasado" />
                  )}
                </div>
              </div>
            ))}
            {getActivitiesByStatus(column.id).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                Vazio
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
