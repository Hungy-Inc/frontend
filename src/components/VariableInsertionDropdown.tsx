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
      { 
        key: '{{user.firstName}}', 
        label: 'First Name', 
        description: 'User\'s first name (e.g., John)' 
      },
      { 
        key: '{{user.lastName}}', 
        label: 'Last Name', 
        description: 'User\'s last name (e.g., Doe)' 
      },
      { 
        key: '{{user.email}}', 
        label: 'Email Address', 
        description: 'User\'s email address' 
      },
      { 
        key: '{{user.role}}', 
        label: 'User Role', 
        description: 'User\'s role (e.g., Volunteer, Staff)' 
      }
    ]
  },
  {
    id: 'shift',
    label: 'Shift Information',
    icon: <FaCalendarAlt className="text-green-500" />,
    variables: [
      { 
        key: '{{shift.name}}', 
        label: 'Shift Name', 
        description: 'Name of the shift (e.g., Morning Kitchen Prep)' 
      },
      { 
        key: '{{shift.category}}', 
        label: 'Shift Category', 
        description: 'Category of the shift (e.g., Kitchen, Delivery)' 
      },
      { 
        key: '{{shift.startTime}}', 
        label: 'Start Time', 
        description: 'When the shift starts (e.g., 8:00 AM)' 
      },
      { 
        key: '{{shift.endTime}}', 
        label: 'End Time', 
        description: 'When the shift ends (e.g., 12:00 PM)' 
      },
      { 
        key: '{{shift.location}}', 
        label: 'Location', 
        description: 'Where the shift takes place' 
      }
    ]
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: <FaBuilding className="text-purple-500" />,
    variables: [
      { 
        key: '{{user.organization.name}}', 
        label: 'Organization Name', 
        description: 'Name of your organization' 
      },
      { 
        key: '{{shift.organization.name}}', 
        label: 'Shift Organization', 
        description: 'Organization running the shift' 
      }
    ]
  },
  {
    id: 'system',
    label: 'System Information',
    icon: <FaCog className="text-gray-500" />,
    variables: [
      { 
        key: '{{system.currentDate}}', 
        label: 'Current Date', 
        description: 'Today\'s date' 
      },
      { 
        key: '{{system.currentTime}}', 
        label: 'Current Time', 
        description: 'Current time' 
      },
      { 
        key: '{{system.appName}}', 
        label: 'App Name', 
        description: 'Name of the application (Hungy)' 
      },
      { 
        key: '{{system.supportEmail}}', 
        label: 'Support Email', 
        description: 'Support contact email' 
      }
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
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 rounded-md transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900 group-hover:text-orange-700">
                                {variable.label}
                              </div>
                              <div className="text-xs text-gray-500 group-hover:text-orange-600">
                                {variable.description}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                              {variable.key}
                            </div>
                          </div>
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
