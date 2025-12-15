'use client';

import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DashboardFiltersProps {
    onFilterChange: (filters: { month: string; year: string; unit: string }) => void;
}

export default function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
    const [month, setMonth] = useState('0'); // 0 for All months
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [unit, setUnit] = useState('Pounds (lb)');

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
            <div className="w-[180px]">
                <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-[120px]">
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={y}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-[180px]">
                <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                        {units.map((u) => (
                            <SelectItem key={u} value={u}>
                                {u}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
