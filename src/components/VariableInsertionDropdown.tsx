'use client';

import { useState, useRef } from 'react';
import { FaChevronDown, FaUser, FaCalendarAlt, FaBuilding, FaCog } from 'react-icons/fa';

interface VariableInsertionDropdownProps {
  onInsertVariable: (variable: string) => void;
  disabled?: boolean;
}

const VARIABLE_CATEGORIES = [
  {
    id: 'user',
    label: 'User Information',
    icon: <FaUser className="text-blue-500" />,
    variables: [
      { key: '{{user.firstName}}', label: 'First Name' },
      { key: '{{user.lastName}}', label: 'Last Name' },
      { key: '{{user.email}}', label: 'Email Address' },
      { key: '{{user.role}}', label: 'User Role' }
    ]
  },
  {
    id: 'shift',
    label: 'Shift Information',
    icon: <FaCalendarAlt className="text-green-500" />,
    variables: [
      { key: '{{shift.name}}', label: 'Shift Name' },
      { key: '{{shift.category}}', label: 'Shift Category' },
      { key: '{{shift.startTime}}', label: 'Start Time' },
      { key: '{{shift.endTime}}', label: 'End Time' },
      { key: '{{shift.location}}', label: 'Location' }
    ]
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: <FaBuilding className="text-purple-500" />,
    variables: [
      { key: '{{user.organization.name}}', label: 'Organization Name' },
      { key: '{{shift.organization.name}}', label: 'Shift Organization' }
    ]
  },
  {
    id: 'system',
    label: 'System Information',
    icon: <FaCog className="text-gray-500" />,
    variables: [
      { key: '{{system.currentDate}}', label: 'Current Date' },
      { key: '{{system.currentTime}}', label: 'Current Time' },
      { key: '{{system.appName}}', label: 'App Name' },
      { key: '{{system.supportEmail}}', label: 'Support Email' }
    ]
  }
];

export default function VariableInsertionDropdown({ onInsertVariable, disabled = false }: VariableInsertionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleInsertVariable = (variable: string) => {
    onInsertVariable(variable);
    setIsOpen(false);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
      setSelectedCategory(null);
    }
  };

  // Add event listener for outside clicks
  useState(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>Insert Variable</span>
        <FaChevronDown className={`text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Choose Variable Category</h3>
            
            <div className="space-y-2">
              {VARIABLE_CATEGORIES.map((category) => (
                <div key={category.id}>
                  <button
                    onClick={() => handleCategorySelect(category.id)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {category.icon}
                    <span className="text-sm font-medium text-gray-900">{category.label}</span>
                    <FaChevronDown className={`text-xs text-gray-400 transition-transform ${
                      selectedCategory === category.id ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {selectedCategory === category.id && (
                    <div className="ml-6 mt-2 space-y-1">
                      {category.variables.map((variable) => (
                        <button
                          key={variable.key}
                          onClick={() => handleInsertVariable(variable.key)}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 rounded-md transition-colors group flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-gray-900 group-hover:text-orange-700">
                            {variable.label}
                          </span>
                          <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                            {variable.key}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
