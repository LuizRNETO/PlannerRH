import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Activity, ActivityType, Frequency, Priority, SubActivity, IntervalUnit } from '../types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: any) => void;
  onDelete?: (id: string) => void;
  initialDate?: Date;
  activity?: Activity;
}

export function ActivityModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  activity,
}: ActivityModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'simple' as ActivityType,
    frequency: 'once' as Frequency,
    interval: 1,
    intervalUnit: 'days' as IntervalUnit,
    priority: 'medium' as Priority,
    plannedDate: '',
    description: '',
  });
  const [subActivities, setSubActivities] = useState<SubActivity[]>([]);
  const [newSubActivity, setNewSubActivity] = useState('');

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title,
        type: activity.type,
        frequency: activity.frequency,
        interval: activity.interval || 1,
        intervalUnit: activity.intervalUnit || 'days',
        priority: activity.priority || 'medium',
        plannedDate: activity.plannedDate,
        description: activity.description || '',
      });
      setSubActivities(activity.subActivities || []);
    } else if (initialDate) {
      setFormData({
        title: '',
        type: 'simple',
        frequency: 'once',
        interval: 1,
        intervalUnit: 'days',
        priority: 'medium',
        plannedDate: format(initialDate, 'yyyy-MM-dd'),
        description: '',
      });
      setSubActivities([]);
    }
  }, [activity, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: activity?.id,
      subActivities,
    });
    onClose();
  };

  const addSubActivity = () => {
    if (!newSubActivity.trim()) return;
    setSubActivities([
      ...subActivities,
      { id: uuidv4(), title: newSubActivity, completed: false }
    ]);
    setNewSubActivity('');
  };

  const removeSubActivity = (id: string) => {
    setSubActivities(subActivities.filter(sub => sub.id !== id));
  };

  const toggleSubActivity = (id: string) => {
    setSubActivities(subActivities.map(sub => 
      sub.id === id ? { ...sub, completed: !sub.completed } : sub
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {activity ? 'Editar Atividade' : 'Nova Atividade'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="ex: Relatório Mensal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="simple">Simples</option>
                <option value="routine">Rotina</option>
                <option value="project">Projeto</option>
                <option value="meeting">Reunião</option>
                <option value="training">Treinamento</option>
                <option value="event">Evento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequência
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Frequency })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="once">Única</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="bi-weekly">Quinzenal</option>
                <option value="monthly">Mensal</option>
                <option value="custom">Personalizada</option>
              </select>
            </div>
          </div>

          {formData.frequency === 'custom' && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Repetir a cada
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unidade
                </label>
                <select
                  value={formData.intervalUnit}
                  onChange={(e) => setFormData({ ...formData, intervalUnit: e.target.value as IntervalUnit })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="days">Dias</option>
                  <option value="weeks">Semanas</option>
                  <option value="months">Meses</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridade
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Planejada
            </label>
            <input
              type="date"
              required
              value={formData.plannedDate}
              onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24"
              placeholder="Adicione detalhes..."
            />
          </div>

          {formData.type === 'project' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Sub-atividades
                </label>
                {subActivities.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {subActivities.filter(s => s.completed).length}/{subActivities.length} concluídas
                  </span>
                )}
              </div>

              {subActivities.length > 0 && (
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(subActivities.filter(s => s.completed).length / subActivities.length) * 100}%` 
                    }}
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubActivity}
                  onChange={(e) => setNewSubActivity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubActivity())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  placeholder="Nova sub-atividade..."
                />
                <button
                  type="button"
                  onClick={addSubActivity}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {subActivities.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg group cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSubActivity(sub.id)}
                  >
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => {}} // Handled by parent div
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                    />
                    <span className={`flex-1 text-sm ${sub.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {sub.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSubActivity(sub.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {subActivities.length === 0 && (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    Nenhuma sub-atividade adicionada
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            {activity && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                    onDelete(activity.id);
                    onClose();
                  }
                }}
                className="mr-auto text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
            >
              {activity ? 'Salvar Alterações' : 'Criar Atividade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
