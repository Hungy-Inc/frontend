'use client';

import { useState, useEffect } from 'react';
import { FaPaperPlane, FaArrowLeft, FaUsers, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import RichTextEditor from '@/components/RichTextEditor';
import { stripHtmlTags } from '@/utils/htmlUtils';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function SendCustomEmail() {
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    recipientEmail: '',
    recipientName: '',
    subject: '',
    htmlContent: '',
    textContent: ''
  });
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      toast.error('Please log in to access this page');
      router.push('/login');
      return;
    }

    try {
      const data = await api.getUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error instanceof Error) {
        if (error.message.includes('Invalid token')) {
          toast.error('Please log in again');
          router.push('/login');
        } else if (error.message.includes('Failed to fetch')) {
          toast.error('Cannot connect to server. Please check if backend is running.');
        } else {
          toast.error('Error fetching users: ' + error.message);
        }
      } else {
        toast.error('Error fetching users');
      }
    } finally {
      setUsersLoading(false);
    }
  };

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

  const handleUserSelect = (user: User) => {
    setFormData(prev => ({
      ...prev,
      recipientEmail: user.email,
      recipientName: `${user.firstName} ${user.lastName}`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientEmail || !formData.subject || !formData.htmlContent) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.sendCustomEmail(formData);
      toast.success('Email sent successfully');
      router.push('/email-management');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error sending email');
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
          <h1 className="text-3xl font-bold text-gray-900">Send Custom Email</h1>
        </div>
        <p className="text-gray-600">Send a one-time email to any recipient</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaUsers className="mr-2 text-blue-500" />
            Select Recipient
          </h3>
          
          {usersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading users...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    formData.recipientEmail === user.email
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Email Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email *
              </label>
              <input
                type="email"
                id="recipientEmail"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="recipient@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Name
              </label>
              <input
                type="text"
                id="recipientName"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Your email subject"
                required
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
                <FaPaperPlane />
                <span>{loading ? 'Sending...' : 'Send Email'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview */}
      {formData.htmlContent && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaEnvelope className="mr-2 text-green-500" />
            Email Preview
          </h3>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Subject:</div>
              <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                {formData.subject || 'No subject'}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Content:</div>
              <div className="bg-white p-4 rounded border min-h-32">
                <div dangerouslySetInnerHTML={{ __html: formData.htmlContent }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
