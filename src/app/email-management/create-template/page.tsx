'use client';

import { useState } from 'react';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
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

            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <FaSave />
              <span>{loading ? 'Creating...' : 'Create Template'}</span>
            </button>
          </form>
      </div>

      {/* Available Variables */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Variables</h4>
        <p className="text-sm text-gray-600 mb-6">Use these variables in your email template. They will be automatically replaced with actual values when the email is sent.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-3">User Variables:</h5>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">First Name</span>
                <span className="text-xs text-gray-600">User's first name (e.g., John)</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Last Name</span>
                <span className="text-xs text-gray-600">User's last name (e.g., Doe)</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Email</span>
                <span className="text-xs text-gray-600">User's email address</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">User Role</span>
                <span className="text-xs text-gray-600">User's role (e.g., Volunteer, Staff)</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Shift Variables:</h5>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Shift Name</span>
                <span className="text-xs text-gray-600">Name of the shift (e.g., Morning Kitchen Prep)</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Category</span>
                <span className="text-xs text-gray-600">Category of the shift (e.g., Kitchen, Delivery)</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Start Time</span>
                <span className="text-xs text-gray-600">When the shift starts (e.g., 8:00 AM)</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">End Time</span>
                <span className="text-xs text-gray-600">When the shift ends (e.g., 12:00 PM)</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Location</span>
                <span className="text-xs text-gray-600">Where the shift takes place</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Organization Variables:</h5>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Organization Name</span>
                <span className="text-xs text-gray-600">Name of your organization</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Shift Organization</span>
                <span className="text-xs text-gray-600">Organization running the shift</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-3">System Variables:</h5>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Current Date</span>
                <span className="text-xs text-gray-600">Today's date</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Current Time</span>
                <span className="text-xs text-gray-600">Current time</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">App Name</span>
                <span className="text-xs text-gray-600">Name of the application (Hungy)</span>
              </div>
              <div className="flex items-start">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono mr-3 shrink-0">Support Email</span>
                <span className="text-xs text-gray-600">Support contact email</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
