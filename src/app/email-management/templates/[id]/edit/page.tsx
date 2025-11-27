'use client';

import { useState, useEffect } from 'react';
import { FaSave, FaEye, FaArrowLeft, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import RichTextEditor from '@/components/RichTextEditor';
import { stripHtmlTags } from '@/utils/htmlUtils';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateType: string;
  isSystem: boolean;
  isActive: boolean;
  description?: string;
}

const TEMPLATE_TYPES = [
  { value: 'CUSTOM_MARKETING', label: 'Marketing Email' },
  { value: 'CUSTOM_NOTIFICATION', label: 'Notification' },
  { value: 'CUSTOM_ANNOUNCEMENT', label: 'Announcement' },
  { value: 'CUSTOM_REMINDER', label: 'Reminder' },
];

export default function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  const [templateId, setTemplateId] = useState<string>('');
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    templateType: 'CUSTOM_MARKETING',
    description: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [originalFormData, setOriginalFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    templateType: 'CUSTOM_MARKETING',
    description: '',
    isActive: true
  });

  useEffect(() => {
    // Get templateId from params
    params.then(({ id }) => {
      setTemplateId(id);
    });
  }, [params]);

  useEffect(() => {
    if (templateId && initialLoading) {
      console.log('🔄 useEffect triggered - calling fetchTemplate for templateId:', templateId);
      fetchTemplate();
    }
  }, [templateId, initialLoading]);

  // Deep comparison function for detecting changes
  const deepEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  };

  // Detect unsaved changes
  useEffect(() => {
    const hasChanges = !deepEqual(formData, originalFormData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, originalFormData]);

  // Prevent browser navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchTemplate = async () => {
    // Prevent multiple calls
    if (!templateId || !initialLoading || isFetching) {
      console.log('🚫 fetchTemplate skipped - templateId:', templateId, 'initialLoading:', initialLoading, 'isFetching:', isFetching);
      return;
    }

    setIsFetching(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        toast.error('Please log in to access this page');
        router.push('/login');
        return;
      }
      
      console.log('📡 Fetching template with ID:', templateId);
      const data = await api.getEmailTemplates();
      console.log('📡 API response:', data);
      
      if (!data || !data.templates) {
        console.error('Invalid API response structure:', data);
        toast.error('Invalid response from server');
        router.push('/email-management');
        return;
      }
      
      const foundTemplate = data.templates.find((t: EmailTemplate) => t.id === parseInt(templateId));
      
      if (foundTemplate) {
        console.log('Found template:', foundTemplate);
        setTemplate(foundTemplate);
        const initialData = {
          name: foundTemplate.name,
          subject: foundTemplate.subject,
          htmlContent: foundTemplate.htmlContent,
          textContent: foundTemplate.textContent || '',
          templateType: foundTemplate.templateType,
          description: foundTemplate.description || '',
          isActive: foundTemplate.isActive
        };
        setFormData(initialData);
        setOriginalFormData(initialData);
      } else {
        console.error('Template not found. Available templates:', data.templates);
        toast.error('Template not found');
        router.push('/email-management');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      if (error instanceof Error) {
        if (error.message.includes('Invalid token')) {
          toast.error('Please log in again');
          router.push('/login');
        } else if (error.message.includes('Failed to fetch')) {
          toast.error('Cannot connect to server. Please check if backend is running.');
        } else {
          toast.error('Error fetching template: ' + error.message);
        }
      } else {
        toast.error('Error fetching template');
      }
      router.push('/email-management');
    } finally {
      setInitialLoading(false);
      setIsFetching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      console.log('🚨 ENTER KEY PRESSED - Preventing form submission');
      e.preventDefault();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    console.log('📝 handleInputChange called for:', e.target.name, 'value:', e.target.value);
    console.log('📝 This should NOT trigger auto-save');
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleRichTextChange = (htmlContent: string) => {
    console.log('📝 handleRichTextChange called with HTML length:', htmlContent.length);
    console.log('📝 This should NOT trigger auto-save');
    const plainText = stripHtmlTags(htmlContent);
    setFormData(prev => ({
      ...prev,
      htmlContent,
      textContent: plainText
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚨 FORM SUBMITTED - handleSubmit called');
    
    if (!formData.name || !formData.subject || !formData.htmlContent) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      toast.error('Please log in to save changes');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      console.log('Updating template with ID:', templateId);
      console.log('Update data:', formData);
      
      await api.updateEmailTemplate(parseInt(templateId), formData);
      toast.success('Template updated successfully');
      // Update original form data to reflect saved state
      setOriginalFormData(formData);
      setHasUnsavedChanges(false);
      router.push('/email-management');
    } catch (error) {
      console.error('Error updating template:', error);
      if (error instanceof Error) {
        if (error.message.includes('Invalid token')) {
          toast.error('Please log in again');
          router.push('/login');
        } else if (error.message.includes('Failed to fetch')) {
          toast.error('Cannot connect to server. Please check if backend is running.');
        } else {
          toast.error('Error updating template: ' + error.message);
        }
      } else {
        toast.error('Error updating template');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      router.push('/email-management');
    }
  };

  const handleLeaveWithoutSaving = () => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    router.push('/email-management');
  };

  const handleStayOnPage = () => {
    setShowConfirmDialog(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) return;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      toast.error('Please log in to delete template');
      router.push('/login');
      return;
    }

    try {
      await api.deleteEmailTemplate(parseInt(templateId));
      toast.success('Template deleted successfully');
      router.push('/email-management');
    } catch (error) {
      console.error('Error deleting template:', error);
      if (error instanceof Error) {
        if (error.message.includes('Invalid token')) {
          toast.error('Please log in again');
          router.push('/login');
        } else if (error.message.includes('Failed to fetch')) {
          toast.error('Cannot connect to server. Please check if backend is running.');
        } else {
          toast.error('Error deleting template: ' + error.message);
        }
      } else {
        toast.error('Error deleting template');
      }
    }
  };


  if (initialLoading) {
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Template</h1>
          {template.isSystem && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              System Template
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Unsaved Changes
            </span>
          )}
        </div>
        <p className="text-gray-600">Edit email template: {template.name}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onKeyDown={handleKeyDown} className="space-y-6">
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
                disabled={template.isSystem}
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
                disabled={template.isSystem}
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

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Template is active</span>
              </label>
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
                type="button"
                onClick={handleSubmit}
                disabled={loading || !hasUnsavedChanges}
                className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>

              {!template.isSystem && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-6 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <FaTrash />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </form>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Unsaved Changes
            </h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to leave without saving?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleStayOnPage}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Stay on Page
              </button>
              <button
                onClick={handleLeaveWithoutSaving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Leave Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
