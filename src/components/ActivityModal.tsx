import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, Plus, Trash2, AlignLeft, Calendar, Clock, Users, CheckSquare, MessageSquare, Repeat, Tag, AlertCircle, Activity as ActivityIcon } from 'lucide-react';
import { Activity, ActivityType, Frequency, Priority, SubActivity, IntervalUnit, Comment } from '../types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { ASSIGNEES } from '../constants';
import { cn } from '../lib/utils';

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
  const [recurrenceEndType, setRecurrenceEndType] = useState<'occurrences' | 'date'>('occurrences');
  const [occurrences, setOccurrences] = useState(2);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

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
      setRecurrenceEndType('occurrences');
      setOccurrences(2);
      setRecurrenceEndDate('');
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
      setRecurrenceEndType('occurrences');
      setOccurrences(2);
      setRecurrenceEndDate('');
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
      recurrenceEndType,
      occurrences,
      recurrenceEndDate,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-indigo-500" />
            {activity ? 'Editar Atividade' : 'Nova Atividade'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="activity-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Title Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-gray-400" />
                Título da Atividade
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                placeholder="Ex: Reunião de Planejamento Estratégico"
              />
            </div>

            {/* Classification Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-gray-400" />
                  Frequência
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Frequency })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                >
                  <option value="once">Única</option>
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="bi-weekly">Quinzenal</option>
                  <option value="monthly">Mensal</option>
                  <option value="custom">A cada...</option>
                </select>
              </div>
            </div>

            {formData.frequency === 'custom' && (
              <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <div>
                  <label className="block text-xs font-medium text-indigo-900 dark:text-indigo-300 mb-1.5">
                    Repetir a cada
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-900 dark:text-indigo-300 mb-1.5">
                    Unidade
                  </label>
                  <select
                    value={formData.intervalUnit}
                    onChange={(e) => setFormData({ ...formData, intervalUnit: e.target.value as IntervalUnit })}
                    className="w-full px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                  >
                    <option value="days">Dias</option>
                    <option value="weeks">Semanas</option>
                    <option value="months">Meses</option>
                  </select>
                </div>
              </div>
            )}

            {!activity && formData.frequency !== 'once' && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={generateMultiple}
                    onChange={(e) => setGenerateMultiple(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                    Gerar lançamentos futuros automaticamente
                  </span>
                </label>
                
                {generateMultiple && (
                  <div className="pl-7 flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={recurrenceEndType === 'occurrences'}
                          onChange={() => setRecurrenceEndType('occurrences')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-indigo-700 dark:text-indigo-400">Por ocorrências</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={recurrenceEndType === 'date'}
                          onChange={() => setRecurrenceEndType('date')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-indigo-700 dark:text-indigo-400">Até a data</span>
                      </label>
                    </div>

                    {recurrenceEndType === 'occurrences' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-indigo-700 dark:text-indigo-400">Criar para as próximas</span>
                        <input
                          type="number"
                          min="2"
                          max="60"
                          value={occurrences}
                          onChange={(e) => setOccurrences(parseInt(e.target.value) || 2)}
                          className="w-20 px-3 py-1.5 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                        />
                        <span className="text-sm text-indigo-700 dark:text-indigo-400">ocorrências</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-indigo-700 dark:text-indigo-400">Repetir até</span>
                        <input
                          type="date"
                          required={recurrenceEndType === 'date'}
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Status & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4 text-gray-400" />
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Activity['status'] })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                >
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Data Planejada
                </label>
                <input
                  type="date"
                  required
                  value={formData.plannedDate}
                  onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Data de Início
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Data de Fim
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                />
              </div>
            </div>

            {/* Hours & Assignees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-1">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Horas Est.
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                  placeholder="0"
                />
              </div>
               <div className="sm:col-span-1">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Horas Reais
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.actualHours || ''}
                  onChange={(e) => setFormData({ ...formData, actualHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                  placeholder="0"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  Responsáveis
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {ASSIGNEES.map(assignee => (
                    <label key={assignee} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
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
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{assignee}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-gray-400" />
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                placeholder="Adicione detalhes, links ou notas importantes..."
              />
            </div>

            {/* Sub-activities */}
            <div className="space-y-3 bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-gray-400" />
                  Sub-atividades
                </label>
                {subActivities.length > 0 && (
                  <span className="text-xs font-medium px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                    {subActivities.filter(s => s.completed).length}/{subActivities.length} concluídas
                  </span>
                )}
              </div>

              {subActivities.length > 0 && (
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
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
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                  placeholder="Adicionar nova sub-atividade..."
                />
                <button
                  type="button"
                  onClick={addSubActivity}
                  className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {subActivities.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-sm"
                    onClick={() => toggleSubActivity(sub.id)}
                  >
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => {}} // Handled by parent div
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 pointer-events-none w-4 h-4"
                    />
                    <span className={`flex-1 text-sm transition-colors ${sub.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                      {sub.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSubActivity(sub.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {subActivities.length === 0 && (
                  <div className="text-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Nenhuma sub-atividade adicionada
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-3 bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                Comentários
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addComment())}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                  placeholder="Escreva um comentário..."
                />
                <button
                  type="button"
                  onClick={addComment}
                  className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {comments.map((comment) => (
                  <div 
                    key={comment.id} 
                    className="flex flex-col bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 group transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap flex-1 leading-relaxed">
                        {comment.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">
                      {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Nenhum comentário
                    </p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          {activity && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                  onDelete(activity.id);
                  onClose();
                }
              }}
              className="mr-auto text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Excluir Atividade
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="activity-form"
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors flex items-center gap-2"
          >
            {activity ? 'Salvar Alterações' : 'Criar Atividade'}
          </button>
        </div>
      </div>
    </div>
  );
}
