
'use client';

import { DebtFilter } from '@/lib/types';

interface FilterTabsProps {
  currentFilter: DebtFilter;
  onFilterChange: (filter: DebtFilter) => void;
}

export default function FilterTabs({ currentFilter, onFilterChange }: FilterTabsProps) {
  const filters: { key: DebtFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'Todas', icon: 'ri-list-check-3' },
    { key: 'active', label: 'Activas', icon: 'ri-alarm-warning-line' },
    { key: 'paid', label: 'Pagadas', icon: 'ri-check-double-line' }
  ];

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50">
      <div className="grid grid-cols-3 gap-1">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              currentFilter === filter.key
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            <i className={`${filter.icon} text-sm`}></i>
            <span className="hidden sm:inline">{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}