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
  Cell,
} from 'recharts';
import { Activity } from '../types';

interface PriorityChartProps {
  activities: Activity[];
}

export function PriorityChart({ activities }: PriorityChartProps) {
  const priorityData = useMemo(() => {
    const counts = activities.reduce((acc, curr) => {
      const priority = curr.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const labels: Record<string, string> = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
    };

    // Ensure order: High, Medium, Low
    return ['high', 'medium', 'low'].map(key => ({
      name: labels[key],
      value: counts[key] || 0,
      originalKey: key, // Keep original key for color mapping if needed
    }));
  }, [activities]);

  const PRIORITY_COLORS = {
    'Alta': '#EF4444',
    'Média': '#F59E0B',
    'Baixa': '#3B82F6',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades por Prioridade</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={priorityData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            <Bar dataKey="value" name="Quantidade" radius={[4, 4, 0, 0]}>
              {priorityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || '#8884d8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
