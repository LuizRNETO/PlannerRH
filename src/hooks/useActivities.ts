import { useState, useEffect } from 'react';
import { Activity } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'hr-planner-activities';

const initialActivities: Activity[] = [
  {
    id: uuidv4(),
    title: 'Revisão Mensal da Folha',
    type: 'routine',
    frequency: 'monthly',
    priority: 'high',
    plannedDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Avaliação de Desempenho Q1',
    type: 'project',
    frequency: 'once',
    priority: 'medium',
    plannedDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    status: 'pending',
    createdAt: new Date().toISOString(),
    subActivities: [
      { id: uuidv4(), title: 'Auto-avaliação', completed: true },
      { id: uuidv4(), title: 'Avaliação do Gestor', completed: false },
      { id: uuidv4(), title: 'Reunião de Feedback', completed: false },
    ],
  },
  {
    id: uuidv4(),
    title: 'Evento de Team Building',
    type: 'simple',
    frequency: 'once',
    priority: 'low',
    plannedDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Treinamento de Compliance',
    type: 'training',
    frequency: 'once',
    priority: 'high',
    plannedDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0],
    realizedDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0],
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Relatório de Vendas (Atrasado)',
    type: 'routine',
    frequency: 'monthly',
    priority: 'medium',
    plannedDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    realizedDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Reunião de Planejamento (Adiantado)',
    type: 'meeting',
    frequency: 'weekly',
    priority: 'low',
    plannedDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
    realizedDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
];

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialActivities;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  const addActivity = (activity: Omit<Activity, 'id' | 'createdAt'>) => {
    const newActivity: Activity = {
      status: 'pending',
      realizedDate: null,
      priority: 'medium',
      ...activity,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setActivities((prev) => [...prev, newActivity]);
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((activity) => (activity.id === id ? { ...activity, ...updates } : activity))
    );
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((activity) => activity.id !== id));
  };

  const markAsRealized = (id: string, date: string) => {
    updateActivity(id, { realizedDate: date, status: 'completed' });
  };

  return {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    markAsRealized,
  };
}
