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
  FaEyeSlash,
  FaFileAlt,
  FaKey,
  FaLightbulb,
  FaHeading
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

export default function RichTextEditor({ value, onChange, placeholder = "Start typing your email content...", disabled = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [focusedSection, setFocusedSection] = useState<HTMLElement | null>(null);

  // Apply formatting to selected text
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  // Convert styled tags back to plain {{variable}} format for storage
  const convertTagsToVariables = (html: string): string => {
    // Replace styled variable spans with plain {{variable}} format
    return html.replace(
      /<span[^>]*class="email-variable-tag"[^>]*data-variable="([^"]+)"[^>]*>.*?<\/span>/g,
      (match, variable) => variable
    );
  };

  // Update content when editor changes
  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      // Convert styled tags back to plain {{variable}} format before saving
      const plainContent = convertTagsToVariables(content);
      onChange(plainContent);
    }
  };

  // Insert variable at cursor position
  const insertVariable = (variable: string) => {
    console.log('📝 RichTextEditor insertVariable called with:', variable);
    
    if (!editorRef.current) return;
    
    // Create a styled span element for the variable
    const variableSpan = document.createElement('span');
    variableSpan.className = 'email-variable-tag';
    variableSpan.contentEditable = 'false';
    variableSpan.setAttribute('data-variable', variable);
    
    // Extract readable name from variable (e.g., {{user.firstName}} -> user.firstName)
    const variableName = variable.replace(/{{|}}/g, '');
    variableSpan.textContent = variableName;
    
    
    
    const selection = window.getSelection();
    let insertAtCursor = false;
    
    // Check if cursor is within the editor
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Check if the selection is within the editor
      if (editorRef.current.contains(container)) {
        insertAtCursor = true;
        range.deleteContents();
        range.insertNode(variableSpan);
        
        // Add a space after the variable
        const spaceNode = document.createTextNode(' ');
        range.collapse(false);
        range.insertNode(spaceNode);
        range.setStartAfter(spaceNode);
        range.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // If cursor is not in editor, append to end of editor
    if (!insertAtCursor) {
      editorRef.current.appendChild(variableSpan);
      // Add a space after the variable
      editorRef.current.appendChild(document.createTextNode(' '));
      
      // Focus the editor and move cursor to end
      editorRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    updateContent();
    setShowVariableDropdown(false);
    setSelectedCategory(null);
  };

  // Insert section at cursor position
  const insertSection = (sectionType: 'credentials' | 'recommendations' | 'heading') => {
    console.log('📝 RichTextEditor insertSection called with:', sectionType);
    
    if (!editorRef.current) return;
    
    let sectionHTML = '';
    
    if (sectionType === 'credentials') {
      // Credentials section with light grey background
      sectionHTML = `
        <div class="email-section-credentials" contenteditable="false" style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0; position: relative;">
          <div class="section-placeholder" contenteditable="true" data-placeholder="Heading (e.g., Your Login Details:)" style="font-weight: bold; font-size: 16px; margin-bottom: 12px; color: #1f2937;"></div>
          <div class="section-placeholder" contenteditable="true" data-placeholder="Email: [value]" style="margin-bottom: 8px;"></div>
        </div>
      `;
    } else if (sectionType === 'recommendations') {
      // Recommendations section with light blue background and blue border
      sectionHTML = `
        <div class="email-section-recommendations" contenteditable="false" style="background-color: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0; position: relative;">
          <div class="section-placeholder" contenteditable="true" data-placeholder="Heading (e.g., Security Recommendation)" style="color: #2563eb; font-size: 16px; margin-bottom: 12px; font-weight: normal;"></div>
          <div class="section-placeholder" contenteditable="true" data-placeholder="Add your recommendation text here..." style="color: #1f2937; line-height: 1.6; font-weight: normal; min-height: 40px;"></div>
        </div>
      `;
    } else if (sectionType === 'heading') {
      // Heading section with orange text
      sectionHTML = `
        <div class="email-section-heading" contenteditable="false" style="margin: 16px 0; position: relative;">
          <div class="section-placeholder" contenteditable="true" data-placeholder="Add your text here..." style="color: orange;"></div>
        </div>
      `;
    }
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sectionHTML;
    
    // Get the section element before creating fragment
    const sectionElement = tempDiv.firstElementChild as HTMLElement;
    
    // Create the fragment
    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    
    const selection = window.getSelection();
    let insertAtCursor = false;
    let insertedSection: HTMLElement | null = null;
    
    // Check if cursor is within the editor
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Check if the selection is within the editor
      if (editorRef.current.contains(container)) {
        insertAtCursor = true;
        range.deleteContents();
        range.insertNode(fragment);
        
        // Store reference to the inserted section
        insertedSection = sectionElement;
        
        // Add a line break after the section
        const br = document.createElement('br');
        range.collapse(false);
        range.insertNode(br);
      }
    }
    
    // If cursor is not in editor, append to end of editor
    if (!insertAtCursor) {
      editorRef.current.appendChild(fragment);
      insertedSection = sectionElement;
      editorRef.current.appendChild(document.createElement('br'));
    }
    
    // Focus inside the first editable placeholder of the inserted section
    if (insertedSection && selection) {
      const firstPlaceholder = insertedSection.querySelector('.section-placeholder[contenteditable="true"]') as HTMLElement;
      if (firstPlaceholder) {
        firstPlaceholder.focus();
        
        // Move cursor to the beginning of the placeholder
        const range = document.createRange();
        range.setStart(firstPlaceholder, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // Content updated after insertion
    
    updateContent();
    setShowSectionDropdown(false);
  };

  // Handle paste events to clean up formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateContent();
  };


  // Handle focus events - track which section is being edited
  const handleFocus = (e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    // Find the parent section if the focused element is a placeholder
    const section = target.closest('.email-section-credentials, .email-section-recommendations, .email-section-heading') as HTMLElement;
    if (section) {
      setFocusedSection(section);
    }
  };

  // Handle blur events - clean up empty sections when user moves away
  const handleBlur = (e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const section = target.closest('.email-section-credentials, .email-section-recommendations, .email-section-heading') as HTMLElement;
    
    if (section && editorRef.current) {
      // Check if the section has any content
      const placeholders = section.querySelectorAll('.section-placeholder');
      let hasContent = false;
      
      placeholders.forEach((placeholder) => {
        const text = placeholder.textContent?.trim() || '';
        if (text !== '') {
          hasContent = true;
        }
      });
      
      // Remove section if it's empty after blur
      if (!hasContent) {
        section.remove();
        updateContent();
      }
    }
    
    // Clear focused section
    setFocusedSection(null);
  };

  // Handle input events
  const handleInput = () => {
    // Clean up empty placeholders but DON'T remove sections while user is typing in them
    if (editorRef.current) {
      const sections = editorRef.current.querySelectorAll('.email-section-credentials, .email-section-recommendations, .email-section-heading');
      
      sections.forEach((section) => {
        const placeholders = section.querySelectorAll('.section-placeholder');
        let hasContent = false;
        
        placeholders.forEach((placeholder) => {
          const text = placeholder.textContent?.trim() || '';
          // If the placeholder only contains whitespace or <br> tags, clear it completely
          if (text === '' || placeholder.innerHTML === '<br>') {
            placeholder.innerHTML = '';
          } else if (text !== '') {
            hasContent = true;
          }
        });
        
        // Only remove section if no content AND it's not currently focused
        // This prevents the section from disappearing while the user is typing in it
        if (!hasContent && section !== focusedSection) {
          section.remove();
        }
      });
    }
    
    // Update content when user types
    updateContent();
  };

  // Convert plain text variables to styled tags
  const convertVariablesToTags = (html: string): string => {
    // First, check if the HTML already contains styled variable tags to avoid double conversion
    if (html.includes('email-variable-tag')) {
      return html;
    }
    
    // Match {{variable}} patterns and replace with styled spans
    return html.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      return `<span class="email-variable-tag" contenteditable="false" data-variable="{{${variableName}}}">${variableName}</span>`;
    });
  };

  // Set initial content only once
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      const convertedValue = convertVariablesToTags(value || '');
      editorRef.current.innerHTML = convertedValue;
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

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
                setShowSectionDropdown(false);
                setSelectedCategory(null);
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
                            // If clicking the same category, close it. Otherwise, open the new category
                            setSelectedCategory(selectedCategory === category.id ? null : category.id);
                          }}
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
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  insertVariable(variable.key);
                                }}
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

          {/* Section Insertion */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSectionDropdown(!showSectionDropdown);
                setShowVariableDropdown(false);
              }}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              <FaFileAlt className="text-xs" />
              <span>Insert Section</span>
              <FaChevronDown className="text-xs" />
            </button>

            {showSectionDropdown && (
              <div 
                className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Choose Section Type</h3>
                  
                  <div className="space-y-2">
                    {/* Heading Section */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        insertSection('heading');
                      }}
                      className="w-full flex items-start space-x-3 px-3 py-3 text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                    >
                      <FaHeading className="text-orange-500 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Heading</div>
                      </div>
                    </button>
                    {/* Credentials Section */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        insertSection('credentials');
                      }}
                      className="w-full flex items-start space-x-3 px-3 py-3 text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                    >
                      <FaKey className="text-gray-500 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Credentials</div>
                      </div>
                    </button>

                    {/* Recommendations Section */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        insertSection('recommendations');
                      }}
                      className="w-full flex items-start space-x-3 px-3 py-3 text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                    >
                      <FaLightbulb className="text-blue-500 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Recommendations</div>
                      </div>
                    </button>
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
          onFocus={handleFocus}
          onBlur={handleBlur}
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
                        __html: convertVariablesToTags(value || '<p>Start typing in the editor above...</p>') 
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
      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .email-variable-tag {
          display: inline-block;
          background-color: #e0f2fe;
          color: #dc2626;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0 2px;
          cursor: default;
          user-select: none;
          white-space: nowrap;
        }
        
        .email-variable-tag:hover {
          background-color: #bae6fd;
        }
        
        .email-section-credentials,
        .email-section-recommendations {
          margin: 16px 0;
        }
        
        .email-section-credentials div,
        .email-section-recommendations div {
          outline: none;
        }
        
        .section-placeholder:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          opacity: 0.7;
          pointer-events: none;
        }
        
        .section-placeholder:focus:before {
          opacity: 0.5;
        }
        
        .email-section-credentials,
        .email-section-recommendations,
        .email-section-heading {
          /* No extra padding needed */
        }
      `}</style>
    </div>
  );
}