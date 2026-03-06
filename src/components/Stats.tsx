import { Activity } from '../types';
import { CheckCircle, Clock, AlertCircle, Calendar, Play } from 'lucide-react';

interface StatsProps {
  activities: Activity[];
}

export function Stats({ activities }: StatsProps) {
  const total = activities.length;
  const completed = activities.filter((a) => a.status === 'completed').length;
  const active = activities.filter((a) => a.status === 'pending' || a.status === 'in_progress').length;
  const inProgress = activities.filter((a) => a.status === 'in_progress').length;
  
  // Calculate on-time vs delayed
  const onTime = activities.filter((a) => {
    if (a.status !== 'completed' || !a.realizedDate) return false;
    return new Date(a.realizedDate) <= new Date(a.plannedDate);
  }).length;

  const delayed = activities.filter((a) => {
    // If completed, check if it was late
    if (a.status === 'completed' && a.realizedDate) {
      return new Date(a.realizedDate) > new Date(a.plannedDate);
    }
    // If not completed (pending or in_progress), check if it is currently overdue
    // User request: "atividades iniciadas não devem constar como atrasadas, a não ser que ultrapassem o prazo delimitado"
    // This implies that if they exceed the deadline, they ARE delayed.
    if ((a.status === 'pending' || a.status === 'in_progress') && !a.realizedDate) {
       const today = new Date().toISOString().split('T')[0];
       return a.plannedDate < today;
    }
    return false;
  }).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-colors">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Atividades</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{total}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-colors">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
          <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Conclusão</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{completionRate}%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-colors">
        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
          <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ativas</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{active}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-colors">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <Play className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-current" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Em Andamento</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{inProgress}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-colors">
        <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Atrasadas</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{delayed}</p>
        </div>
      </div>
    </div>
  );
}
