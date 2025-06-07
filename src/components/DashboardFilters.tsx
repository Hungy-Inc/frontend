'use client';

import { useState, useEffect } from 'react';

interface DashboardFiltersProps {
  onFilterChange: (filters: { month: string; year: string; unit: string }) => void;
}

export default function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [month, setMonth] = useState('0'); // 0 for All months
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [unit, setUnit] = useState('Kilograms (kg)');

  const months = [
    { value: '0', label: 'All months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const units = ['Kilograms (kg)', 'Pounds (lb)'];

  useEffect(() => {
    onFilterChange({ month, year, unit });
  }, [month, year, unit, onFilterChange]);

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {units.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
} 