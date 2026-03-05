import { Search, Filter, X } from 'lucide-react';
import { ActivityType, Priority } from '../types';
import { cn } from '../lib/utils';

export type FilterDateRange = 'all' | 'today' | 'week' | 'month' | 'overdue';
export type FilterSubStatus = 'all' | 'has-pending' | 'fully-completed' | 'no-subs';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedType: FilterType;
  onTypeChange: (type: FilterType) => void;
  selectedPriority: FilterPriority;
  onPriorityChange: (priority: FilterPriority) => void;
  selectedStatus: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  selectedDateRange: FilterDateRange;
  onDateRangeChange: (range: FilterDateRange) => void;
  selectedSubStatus: FilterSubStatus;
  onSubStatusChange: (status: FilterSubStatus) => void;
  onClearFilters: () => void;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  selectedDateRange,
  onDateRangeChange,
  selectedSubStatus,
  onSubStatusChange,
  onClearFilters
}: FilterBarProps) {
  const hasActiveFilters = selectedType !== 'all' || 
    selectedPriority !== 'all' || 
    selectedStatus !== 'all' || 
    selectedDateRange !== 'all' ||
    selectedSubStatus !== 'all' ||
    searchTerm !== '';

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar atividades..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as FilterType)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos os Tipos</option>
          <option value="project">Projetos</option>
          <option value="routine">Rotinas</option>
          <option value="simple">Simples</option>
          <option value="meeting">Reuniões</option>
          <option value="training">Treinamentos</option>
          <option value="event">Eventos</option>
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value as FilterPriority)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todas Prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as FilterStatus)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos Status</option>
          <option value="pending">Pendente</option>
          <option value="completed">Concluído</option>
          <option value="cancelled">Cancelado</option>
        </select>

        {/* Date Range Filter */}
        <select
          value={selectedDateRange}
          onChange={(e) => onDateRangeChange(e.target.value as FilterDateRange)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todas as Datas</option>
          <option value="today">Hoje</option>
          <option value="week">Esta Semana</option>
          <option value="month">Este Mês</option>
          <option value="overdue">Atrasadas</option>
        </select>

        {/* Sub-activity Filter */}
        <select
          value={selectedSubStatus}
          onChange={(e) => onSubStatusChange(e.target.value as FilterSubStatus)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Sub-atividades (Todas)</option>
          <option value="has-pending">Com Pendências</option>
          <option value="fully-completed">Totalmente Concluídas</option>
          <option value="no-subs">Sem Sub-atividades</option>
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
