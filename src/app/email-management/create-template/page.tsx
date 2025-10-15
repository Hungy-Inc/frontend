'use client';

import { useState } from 'react';
import { FaSave, FaEye, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import RichTextEditor from '@/components/RichTextEditor';
import { stripHtmlTags } from '@/utils/htmlUtils';

const TEMPLATE_TYPES = [
  { value: 'CUSTOM_MARKETING', label: 'Marketing Email' },
  { value: 'CUSTOM_NOTIFICATION', label: 'Notification' },
  { value: 'CUSTOM_ANNOUNCEMENT', label: 'Announcement' },
  { value: 'CUSTOM_REMINDER', label: 'Reminder' },
];

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

export default function CreateTemplate() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    templateType: 'CUSTOM_MARKETING',
    description: ''
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRichTextChange = (htmlContent: string) => {
    const plainText = stripHtmlTags(htmlContent);
    setFormData(prev => ({
      ...prev,
      htmlContent,
      textContent: plainText
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subject || !formData.htmlContent) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      toast.error('Please log in to create template');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      await api.createEmailTemplate(formData);
      toast.success('Template created successfully');
      router.push('/email-management');
    } catch (error) {
      console.error('Error creating template:', error);
      if (error instanceof Error) {
        if (error.message.includes('Invalid token')) {
          toast.error('Please log in again');
          router.push('/login');
        } else if (error.message.includes('Failed to fetch')) {
          toast.error('Cannot connect to server. Please check if backend is running.');
        } else {
          toast.error('Error creating template: ' + error.message);
        }
      } else {
        toast.error('Error creating template');
      }
    } finally {
      setLoading(false);
    }
  };

  const previewContent = previewMode ? replaceVariables(formData.htmlContent) : formData.htmlContent;
  const previewSubject = previewMode ? replaceVariables(formData.subject) : formData.subject;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/email-management" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <FaArrowLeft />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Email Template</h1>
        </div>
        <p className="text-gray-600">Create a new custom email template</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Event Invitation"
                required
              />
            </div>

            <div>
              <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 mb-2">
                Template Type *
              </label>
              <select
                id="templateType"
                name="templateType"
                value={formData.templateType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                {TEMPLATE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Welcome to our organization!"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Brief description of this template's purpose"
              />
            </div>

            <RichTextEditor
              value={formData.htmlContent}
              onChange={handleRichTextChange}
              placeholder="Start typing your email content here..."
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plain Text Content (Auto-generated)
              </label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-3">
                <div className="text-sm text-gray-600 mb-2">
                  This plain text version is automatically generated from your rich text content above.
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {formData.textContent || 'Start typing in the rich text editor above to see the plain text version here...'}
                </pre>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <FaSave />
                <span>{loading ? 'Creating...' : 'Create Template'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                <FaEye />
                <span>{previewMode ? 'Edit Mode' : 'Preview Mode'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
            <div className="text-sm text-gray-500">
              {previewMode ? 'With Sample Data' : 'Raw Template'}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Subject:</div>
              <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                {previewSubject || 'No subject'}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Content:</div>
              <div className="bg-white p-4 rounded border min-h-64">
                {formData.htmlContent ? (
                  <div dangerouslySetInnerHTML={{ __html: previewContent }} />
                ) : (
                  <div className="text-gray-500 italic">No content yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Variable Reference */}
          <div className="mt-6">
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
      </div>
    </div>
  );
}
