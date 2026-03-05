import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Trash2, CheckCircle, Clock, AlertCircle, Repeat } from 'lucide-react';
import { Activity } from '../types';
import { cn } from '../lib/utils';

interface ListViewProps {
  activities: Activity[];
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (id: string) => void;
  onMarkRealized: (activity: Activity) => void;
}

export function ListView({ activities, onEditActivity, onDeleteActivity, onMarkRealized }: ListViewProps) {
  const [sortField, setSortField] = useState<'plannedDate' | 'title' | 'status' | 'priority'>('plannedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<Activity['status'] | 'all'>('all');

  const filteredActivities = activities.filter(activity => 
    filterStatus === 'all' || activity.status === filterStatus
  );

  const priorityWeight = { high: 3, medium: 2, low: 1 };

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (sortField === 'plannedDate') {
      return sortDirection === 'asc'
        ? new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()
        : new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime();
    }
    if (sortField === 'title') {
      return sortDirection === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    if (sortField === 'status') {
      return sortDirection === 'asc'
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    if (sortField === 'priority') {
      const weightA = priorityWeight[a.priority || 'medium'];
      const weightB = priorityWeight[b.priority || 'medium'];
      return sortDirection === 'asc'
        ? weightA - weightB
        : weightB - weightA;
    }
    return 0;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc'); // Default to ascending, but for priority we might want descending (High first) usually, but let's stick to standard toggle
      if (field === 'priority') {
        setSortDirection('desc'); // Exception: priority usually sorts High to Low first
      }
    }
  };

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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

  const getFrequencyLabel = (freq: Activity['frequency']) => {
    switch (freq) {
      case 'once': return 'Única';
      case 'daily': return 'Diária';
      case 'weekly': return 'Semanal';
      case 'bi-weekly': return 'Quinzenal';
      case 'monthly': return 'Mensal';
      default: return freq;
    }
  };

  const getPriorityLabel = (priority: Activity['priority']) => {
    switch (priority) {
      case 'high': return <span className="text-red-600 font-medium">Alta</span>;
      case 'medium': return <span className="text-yellow-600 font-medium">Média</span>;
      case 'low': return <span className="text-blue-600 font-medium">Baixa</span>;
      default: return <span className="text-gray-600">Média</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-end">
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th 
                className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('title')}
              >
                Título {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Frequência</th>
              <th 
                className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('priority')}
              >
                Prioridade {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3">Descrição</th>
              <th 
                className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('plannedDate')}
              >
                Data Planejada {sortField === 'plannedDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3">Data Realizada</th>
              <th 
                className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedActivities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {activity.frequency !== 'once' && (
                        <Repeat className="w-3 h-3 text-gray-400 shrink-0" title={`Recorrente: ${getFrequencyLabel(activity.frequency)}`} />
                      )}
                      <span>{activity.title}</span>
                    </div>
                    {activity.type === 'project' && activity.subActivities && activity.subActivities.length > 0 && (
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden" title={`${Math.round((activity.subActivities.filter(s => s.completed).length / activity.subActivities.length) * 100)}% concluído`}>
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(activity.subActivities.filter(s => s.completed).length / activity.subActivities.length) * 100}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{getTypeLabel(activity.type)}</td>
                <td className="px-6 py-4 text-gray-600">{getFrequencyLabel(activity.frequency)}</td>
                <td className="px-6 py-4">{getPriorityLabel(activity.priority || 'medium')}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={activity.description}>
                  {activity.description || '-'}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {format(parseISO(activity.plannedDate), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {activity.realizedDate ? (
                    <span className={cn(
                      "flex items-center gap-1",
                      activity.realizedDate > activity.plannedDate ? "text-red-600 font-medium" : ""
                    )}>
                      {format(parseISO(activity.realizedDate), 'dd/MM/yyyy')}
                      {activity.realizedDate > activity.plannedDate && (
                        <AlertCircle className="w-4 h-4" title="Realizado com atraso" />
                      )}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', getStatusColor(activity.status))}>
                    {activity.status === 'pending' ? 'Pendente' : activity.status === 'completed' ? 'Concluído' : 'Cancelado'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {activity.status !== 'completed' && (
                      <button
                        onClick={() => onMarkRealized(activity)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Marcar como Realizado"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEditActivity(activity)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                          onDeleteActivity(activity.id);
                        }
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedActivities.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma atividade encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
