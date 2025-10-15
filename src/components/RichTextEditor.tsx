'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  FaBold, 
  FaItalic, 
  FaUnderline, 
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaLink,
  FaImage,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaChevronDown,
  FaUser,
  FaCalendarAlt,
  FaBuilding,
  FaCog,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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

export default function RichTextEditor({ value, onChange, placeholder = "Start typing your email content...", disabled = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);

  // Apply formatting to selected text
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  // Update content when editor changes
  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  // Insert variable at cursor position
  const insertVariable = (variable: string) => {
    console.log('📝 RichTextEditor insertVariable called with:', variable);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(variable));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // If no selection, append to end
      if (editorRef.current) {
        editorRef.current.innerHTML += variable;
      }
    }
    updateContent();
    setShowVariableDropdown(false);
  };

  // Handle paste events to clean up formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateContent();
  };

  // Handle input events
  const handleInput = () => {
    updateContent();
  };

  // Set initial content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Bold"
            >
              <FaBold className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('italic')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Italic"
            >
              <FaItalic className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('underline')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Underline"
            >
              <FaUnderline className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('strikeThrough')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Strikethrough"
            >
              <FaStrikethrough className="text-sm" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={() => applyFormat('insertUnorderedList')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Bullet List"
            >
              <FaListUl className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('insertOrderedList')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Numbered List"
            >
              <FaListOl className="text-sm" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={() => applyFormat('justifyLeft')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Align Left"
            >
              <FaAlignLeft className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('justifyCenter')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Align Center"
            >
              <FaAlignCenter className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('justifyRight')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Align Right"
            >
              <FaAlignRight className="text-sm" />
            </button>
          </div>

          {/* Links and Images */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) applyFormat('createLink', url);
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Insert Link"
            >
              <FaLink className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => {
                const url = prompt('Enter image URL:');
                if (url) {
                  const img = document.createElement('img');
                  img.src = url;
                  img.alt = 'Image';
                  img.style.maxWidth = '100%';
                  img.style.height = 'auto';
                  document.execCommand('insertHTML', false, img.outerHTML);
                  updateContent();
                }
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Insert Image"
            >
              <FaImage className="text-sm" />
            </button>
          </div>

          {/* Variable Insertion */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowVariableDropdown(!showVariableDropdown);
              }}
              className="flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
            >
              <span>Insert Variable</span>
              <FaChevronDown className="text-xs" />
            </button>

            {showVariableDropdown && (
              <div 
                className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Choose Variable Category</h3>
                  
                  <div className="space-y-2">
                    {VARIABLE_CATEGORIES.map((category) => (
                      <div key={category.id}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const submenu = document.getElementById(`submenu-${category.id}`);
                            if (submenu) {
                              submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
                            }
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                        >
                          {category.icon}
                          <span className="text-sm font-medium text-gray-900">{category.label}</span>
                          <FaChevronDown className="text-xs text-gray-400" />
                        </button>
                        
                        <div
                          id={`submenu-${category.id}`}
                          className="ml-6 mt-2 space-y-1"
                          style={{ display: 'none' }}
                        >
                          {category.variables.map((variable) => (
                            <button
                              key={variable.key}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                insertVariable(variable.key);
                              }}
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Toggle */}
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              {showPreview ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="border border-gray-300 border-t-0 rounded-b-md">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onPaste={handlePaste}
          className="min-h-[300px] p-4 focus:outline-none"
          style={{ minHeight: '300px' }}
          data-placeholder={placeholder}
        />
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-4">
                {/* Rendered Preview Only */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Email Content Preview:</h4>
                  <div className="border border-gray-300 rounded-md p-4 bg-white">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: value || '<p>Start typing in the editor above...</p>' 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for placeholder */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}