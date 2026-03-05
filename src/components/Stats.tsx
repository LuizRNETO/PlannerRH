import { Activity } from '../types';
import { CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';

interface StatsProps {
  activities: Activity[];
}

export function Stats({ activities }: StatsProps) {
  const total = activities.length;
  const completed = activities.filter((a) => a.status === 'completed').length;
  const pending = activities.filter((a) => a.status === 'pending').length;
  
  // Calculate on-time vs delayed
  const onTime = activities.filter((a) => {
    if (a.status !== 'completed' || !a.realizedDate) return false;
    return new Date(a.realizedDate) <= new Date(a.plannedDate);
  }).length;

  const delayed = activities.filter((a) => {
    if (a.status !== 'completed' || !a.realizedDate) return false;
    return new Date(a.realizedDate) > new Date(a.plannedDate);
  }).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-lg">
          <Calendar className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Total de Atividades</p>
          <p className="text-2xl font-semibold text-gray-900">{total}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="p-3 bg-emerald-50 rounded-lg">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Taxa de Conclusão</p>
          <p className="text-2xl font-semibold text-gray-900">{completionRate}%</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="p-3 bg-orange-50 rounded-lg">
          <Clock className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Pendentes</p>
          <p className="text-2xl font-semibold text-gray-900">{pending}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="p-3 bg-red-50 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Atrasadas</p>
          <p className="text-2xl font-semibold text-gray-900">{delayed}</p>
        </div>
      </div>
    </div>
  );
}
