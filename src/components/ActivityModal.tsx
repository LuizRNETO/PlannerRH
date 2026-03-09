import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Activity, ActivityType, Frequency, Priority, SubActivity, IntervalUnit, Comment } from '../types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { ASSIGNEES } from '../constants';

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
    startDate: '',
    endDate: '',
    description: '',
    estimatedHours: 0,
    actualHours: 0,
    assignees: [] as string[],
    status: 'pending' as Activity['status'],
  });
  const [subActivities, setSubActivities] = useState<SubActivity[]>([]);
  const [newSubActivity, setNewSubActivity] = useState('');

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const [generateMultiple, setGenerateMultiple] = useState(false);
  const [occurrences, setOccurrences] = useState(2);

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
        startDate: activity.startDate || '',
        endDate: activity.endDate || '',
        description: activity.description || '',
        estimatedHours: activity.estimatedHours || 0,
        actualHours: activity.actualHours || 0,
        assignees: activity.assignees && activity.assignees.length > 0 ? activity.assignees : (activity.assignee ? [activity.assignee] : []),
        status: activity.status,
      });
      setSubActivities(activity.subActivities || []);
      setComments(activity.comments || []);
      setGenerateMultiple(false);
      setOccurrences(2);
    } else if (initialDate) {
      setFormData({
        title: '',
        type: 'simple',
        frequency: 'once',
        interval: 1,
        intervalUnit: 'days',
        priority: 'medium',
        plannedDate: format(initialDate, 'yyyy-MM-dd'),
        startDate: '',
        endDate: '',
        description: '',
        estimatedHours: 0,
        actualHours: 0,
        assignees: [],
        status: 'pending',
      });
      setSubActivities([]);
      setComments([]);
      setGenerateMultiple(false);
      setOccurrences(2);
    }
  }, [activity, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: activity?.id,
      subActivities,
      comments,
      generateMultiple,
      occurrences,
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

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      { id: uuidv4(), text: newComment, createdAt: new Date().toISOString() }
    ]);
    setNewComment('');
  };

  const removeComment = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {activity ? 'Editar Atividade' : 'Nova Atividade'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              Título
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="ex: Relatório Mensal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Frequência
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Frequency })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
            <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Repetir a cada
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  Unidade
                </label>
                <select
                  value={formData.intervalUnit}
                  onChange={(e) => setFormData({ ...formData, intervalUnit: e.target.value as IntervalUnit })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="days">Dias</option>
                  <option value="weeks">Semanas</option>
                  <option value="months">Meses</option>
                </select>
              </div>
            </div>
          )}

          {!activity && formData.frequency !== 'once' && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={generateMultiple}
                  onChange={(e) => setGenerateMultiple(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                  Gerar lançamentos futuros automaticamente
                </span>
              </label>
              
              {generateMultiple && (
                <div className="pl-6 flex items-center gap-2">
                  <span className="text-xs text-indigo-700 dark:text-indigo-400">Criar para as próximas</span>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={occurrences}
                    onChange={(e) => setOccurrences(parseInt(e.target.value) || 2)}
                    className="w-16 px-2 py-1 text-sm border border-indigo-200 dark:border-indigo-700 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-xs text-indigo-700 dark:text-indigo-400">ocorrências</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Activity['status'] })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Data Planejada
              </label>
              <input
                type="date"
                required
                value={formData.plannedDate}
                onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Data de Início
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Data de Fim
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
               <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Horas Est.
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimatedHours || ''}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="0"
              />
            </div>
             <div className="col-span-1">
               <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Horas Reais
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.actualHours || ''}
                onChange={(e) => setFormData({ ...formData, actualHours: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Responsáveis
              </label>
              <div className="flex flex-wrap gap-2">
                {ASSIGNEES.map(assignee => (
                  <label key={assignee} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.assignees.includes(assignee)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, assignees: [...formData.assignees, assignee] });
                        } else {
                          setFormData({ ...formData, assignees: formData.assignees.filter(a => a !== assignee) });
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-200">{assignee}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-16 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Adicione detalhes..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Sub-atividades
              </label>
              {subActivities.length > 0 && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {subActivities.filter(s => s.completed).length}/{subActivities.length} concluídas
                </span>
              )}
            </div>

            {subActivities.length > 0 && (
              <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
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
                className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Nova sub-atividade..."
              />
              <button
                type="button"
                onClick={addSubActivity}
                className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {subActivities.map((sub) => (
                <div 
                  key={sub.id} 
                  className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleSubActivity(sub.id)}
                >
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => {}} // Handled by parent div
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 pointer-events-none w-3.5 h-3.5"
                  />
                  <span className={`flex-1 text-xs ${sub.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                    {sub.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSubActivity(sub.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {subActivities.length === 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 italic text-center py-1">
                  Nenhuma sub-atividade adicionada
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Comentários
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addComment())}
                className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Adicionar comentário..."
              />
              <button
                type="button"
                onClick={addComment}
                className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="flex flex-col bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg group transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap flex-1">
                      {comment.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                  </span>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 italic text-center py-1">
                  Nenhum comentário
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            {activity && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                    onDelete(activity.id);
                    onClose();
                  }
                }}
                className="mr-auto text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
            >
              {activity ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
