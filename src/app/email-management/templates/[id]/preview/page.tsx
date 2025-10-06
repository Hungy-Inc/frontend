'use client';

import { useState, useEffect } from 'react';
import { FaArrowLeft, FaEye, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { api } from '@/services/api';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateType: string;
  isSystem: boolean;
  description?: string;
}

const SAMPLE_VARIABLES = {
  user: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    organization: {
      name: 'Community Food Bank'
    }
  },
  shift: {
    name: 'Morning Kitchen Prep',
    category: 'Kitchen',
    startTime: '2024-01-15 08:00 AM',
    endTime: '2024-01-15 12:00 PM',
    location: 'Main Kitchen',
    organization: {
      name: 'Community Food Bank'
    }
  },
  system: {
    currentDate: new Date().toLocaleDateString(),
    currentTime: new Date().toLocaleTimeString(),
    appName: 'Hungy',
    supportEmail: 'support@hungy.ca'
  }
};

export default function PreviewTemplate({ params }: { params: Promise<{ id: string }> }) {
  const [templateId, setTemplateId] = useState<string>('');
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get templateId from params
    params.then(({ id }) => {
      setTemplateId(id);
    });
  }, [params]);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const data = await api.getEmailTemplates();
      const foundTemplate = data.templates.find((t: EmailTemplate) => t.id === parseInt(templateId));
      
      if (foundTemplate) {
        setTemplate(foundTemplate);
      } else {
        toast.error('Template not found');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Error fetching template');
    } finally {
      setLoading(false);
    }
  };

  const replaceVariables = (content: string) => {
    let result = content;
    const variableRegex = /\{\{([^}]+)\}\}/g;
    result = result.replace(variableRegex, (match, path) => {
      const keys = path.trim().split('.');
      let value: any = SAMPLE_VARIABLES;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return match;
        }
      }
      
      return value !== undefined ? String(value) : match;
    });
    
    return result;
  };

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'SYSTEM_WELCOME_NEW_USER': return 'New User Welcome';
      case 'SYSTEM_SHIFT_CONFIRMATION': return 'Shift Confirmation';
      case 'SYSTEM_SHIFT_WELCOME': return 'New User Shift Welcome';
      case 'SYSTEM_PASSWORD_RESET': return 'Password Reset';
      case 'CUSTOM_MARKETING': return 'Marketing';
      case 'CUSTOM_NOTIFICATION': return 'Notification';
      case 'CUSTOM_ANNOUNCEMENT': return 'Announcement';
      case 'CUSTOM_REMINDER': return 'Reminder';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Not Found</h1>
          <Link href="/email-management" className="text-orange-600 hover:text-orange-700">
            ← Back to Email Management
          </Link>
        </div>
      </div>
    );
  }

  const previewContent = previewMode ? replaceVariables(template.htmlContent) : template.htmlContent;
  const previewSubject = previewMode ? replaceVariables(template.subject) : template.subject;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/email-management" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <FaArrowLeft />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Template Preview</h1>
          {template.isSystem && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              System Template
            </span>
          )}
        </div>
        <p className="text-gray-600">Preview email template: {template.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaEnvelope className="mr-2 text-blue-500" />
            Template Details
          </h3>
          
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700">Name</div>
              <div className="text-sm text-gray-900">{template.name}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700">Type</div>
              <div className="text-sm text-gray-900">{getTemplateTypeLabel(template.templateType)}</div>
            </div>
            
            {template.description && (
              <div>
                <div className="text-sm font-medium text-gray-700">Description</div>
                <div className="text-sm text-gray-900">{template.description}</div>
              </div>
            )}
            
            <div>
              <div className="text-sm font-medium text-gray-700">Status</div>
              <div className="text-sm">
                {template.isSystem ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    System Template
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Custom Template
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Variables:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><code>{'{{user.firstName}}'}</code> - User's first name</div>
              <div><code>{'{{user.lastName}}'}</code> - User's last name</div>
              <div><code>{'{{user.email}}'}</code> - User's email</div>
              <div><code>{'{{user.organization.name}}'}</code> - Organization name</div>
              <div><code>{'{{shift.name}}'}</code> - Shift name</div>
              <div><code>{'{{shift.startTime}}'}</code> - Shift start time</div>
              <div><code>{'{{shift.location}}'}</code> - Shift location</div>
              <div><code>{'{{system.currentDate}}'}</code> - Current date</div>
            </div>
          </div>
        </div>

        {/* Email Preview */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaEye className="mr-2 text-green-500" />
              Email Preview
            </h3>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Preview Mode:</span>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  previewMode
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {previewMode ? 'With Sample Data' : 'Raw Template'}
              </button>
            </div>
          </div>

          {/* Email Header */}
          <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 mb-4">
            <div className="bg-white rounded border p-3">
              <div className="text-sm font-medium text-gray-700 mb-1">From:</div>
              <div className="text-sm text-gray-900">Hungy System &lt;noreply@hungy.ca&gt;</div>
              
              <div className="text-sm font-medium text-gray-700 mb-1 mt-3">To:</div>
              <div className="text-sm text-gray-900">
                {previewMode ? 'John Doe &lt;john.doe@example.com&gt;' : '{{user.firstName}} {{user.lastName}} &lt;{{user.email}}&gt;'}
              </div>
              
              <div className="text-sm font-medium text-gray-700 mb-1 mt-3">Subject:</div>
              <div className="text-sm text-gray-900 font-medium">{previewSubject}</div>
            </div>
          </div>

          {/* Email Content */}
          <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
            <div className="bg-white rounded border min-h-96">
              {template.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
              ) : (
                <div className="p-8 text-center text-gray-500 italic">
                  No HTML content available
                </div>
              )}
            </div>
          </div>

          {/* Plain Text Version */}
          {template.textContent && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Plain Text Version:</h4>
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                <div className="bg-white rounded border p-4 font-mono text-sm whitespace-pre-wrap">
                  {previewMode ? replaceVariables(template.textContent) : template.textContent}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
