import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity } from '../types';
import { Clock, CheckCircle, Users, AlertCircle } from 'lucide-react';

interface ReportingDashboardProps {
  activities: Activity[];
}

export function ReportingDashboard({ activities }: ReportingDashboardProps) {
  // 1. Calculate Key Metrics
  const metrics = useMemo(() => {
    let totalPlannedHours = 0;
    let totalRealizedHours = 0;
    let completedCount = 0;
    let totalCount = activities.length;
    let overdueCount = 0;

    const today = new Date().toISOString().split('T')[0];

    activities.forEach(activity => {
      totalPlannedHours += activity.estimatedHours || 0;
      totalRealizedHours += activity.actualHours || 0;
      
      if (activity.status === 'completed') {
        completedCount++;
      } else if ((activity.status === 'pending' || activity.status === 'in_progress') && activity.plannedDate < today) {
        overdueCount++;
      }
    });

    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      totalPlannedHours,
      totalRealizedHours,
      completionRate,
      overdueCount,
      totalCount
    };
  }, [activities]);

  // 2. Prepare Data for Charts

  // Planned vs Realized Hours by Type
  const hoursByTypeData = useMemo(() => {
    const data: Record<string, { name: string; planned: number; realized: number }> = {};

    activities.forEach(activity => {
      const type = activity.type;
      if (!data[type]) {
        data[type] = { name: type, planned: 0, realized: 0 };
      }
      data[type].planned += activity.estimatedHours || 0;
      data[type].realized += activity.actualHours || 0;
    });

    return Object.values(data);
  }, [activities]);

  // Workload by Assignee
  const workloadData = useMemo(() => {
    const data: Record<string, { name: string; hours: number; count: number }> = {};

    activities.forEach(activity => {
      const activityAssignees = activity.assignees && activity.assignees.length > 0 ? activity.assignees : (activity.assignee ? [activity.assignee] : ['Unassigned']);
      
      activityAssignees.forEach(assignee => {
        if (!data[assignee]) {
          data[assignee] = { name: assignee, hours: 0, count: 0 };
        }
        data[assignee].hours += (activity.estimatedHours || 0) / activityAssignees.length;
        data[assignee].count += 1;
      });
    });

    return Object.values(data).sort((a, b) => b.hours - a.hours);
  }, [activities]);

  // Completion Status
  const statusData = useMemo(() => {
    return [
      { name: 'Concluído', value: metrics.completionRate },
      { name: 'Pendente', value: 100 - metrics.completionRate },
    ];
  }, [metrics]);

  const COLORS = ['#10B981', '#E5E7EB']; // Emerald for completed, Gray for pending

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Horas Planejadas</p>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.totalPlannedHours}h</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Horas Realizadas</p>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.totalRealizedHours}h</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Taxa de Conclusão</p>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.completionRate}%</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Atividades Atrasadas</p>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.overdueCount}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planned vs Realized Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Planejado vs. Realizado (por Tipo)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hoursByTypeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="planned" name="Planejado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realized" name="Realizado" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workload Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Carga de Trabalho (por Responsável)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={workloadData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="hours" name="Horas Planejadas" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
