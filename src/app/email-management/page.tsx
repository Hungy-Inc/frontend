'use client';

import { useState, useEffect } from 'react';
import { FaEnvelope, FaEdit, FaTrash, FaEye, FaPlus, FaPaperPlane, FaHistory } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { api } from '@/services/api';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  templateType: string;
  isSystem: boolean;
  isActive: boolean;
  description?: string;
  createdAt: string;
  lastUsedAt?: string;
}

interface EmailLog {
  id: number;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status: string;
  sentAt?: string;
  template?: {
    name: string;
    templateType: string;
  };
}

export default function EmailManagement() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, []);

  const fetchTemplates = async () => {
    try {
      console.log('Fetching email templates...');
      const data = await api.getEmailTemplates();
      console.log('Email templates data:', data);
      setTemplates(data.templates.filter((template: EmailTemplate) => !template.isSystem));
    } catch (error) {
      console.error('Error fetching email templates:', error);
      toast.error('Error fetching email templates');
    }
  };

  const fetchLogs = async () => {
    try {
      console.log('Fetching email logs...');
      const data = await api.getEmailLogs(20);
      console.log('Email logs data:', data);
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast.error('Error fetching email logs');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.deleteEmailTemplate(templateId);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error deleting template');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'text-green-600';
      case 'DELIVERED': return 'text-green-700';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Management</h1>
        <p className="text-gray-600">Manage email templates and view sending history</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link href="/email-management/create-template" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <FaPlus className="text-orange-500 text-xl" />
            <div>
              <h3 className="font-semibold text-gray-900">Create Template</h3>
              <p className="text-sm text-gray-600">New email template</p>
            </div>
          </div>
        </Link>

        <button 
          onClick={() => toast.info('Send Custom Email feature is currently in development stage. Coming soon!')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <FaPaperPlane className="text-blue-500 text-xl" />
            <div>
              <h3 className="font-semibold text-gray-900">Send Custom Email</h3>
              <p className="text-sm text-gray-600">One-time email (Coming Soon)</p>
            </div>
          </div>
        </button>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <FaEnvelope className="text-green-500 text-xl" />
            <div>
              <h3 className="font-semibold text-gray-900">{templates.length}</h3>
              <p className="text-sm text-gray-600">Total Templates</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <FaHistory className="text-purple-500 text-xl" />
            <div>
              <h3 className="font-semibold text-gray-900">{logs.length}</h3>
              <p className="text-sm text-gray-600">Recent Emails</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Email Templates
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Email History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <FaEnvelope className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new email template.</p>
                  <div className="mt-6">
                    <Link
                      href="/email-management/create-template"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                    >
                      <FaPlus className="mr-2" />
                      Create Template
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                            {template.isSystem && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                System
                              </span>
                            )}
                            {!template.isActive && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Type: {getTemplateTypeLabel(template.templateType)}
                          </p>
                          {template.description && (
                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                            {template.lastUsedAt && (
                              <span>Last used: {new Date(template.lastUsedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/email-management/templates/${template.id}/edit`}
                            className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                            title="Edit template"
                          >
                            <FaEdit />
                          </Link>
                          <Link
                            href={`/email-management/templates/${template.id}/preview`}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Preview template"
                          >
                            <FaEye />
                          </Link>
                          {!template.isSystem && (
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete template"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No email history</h3>
                  <p className="mt-1 text-sm text-gray-500">Email sending history will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Template
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sent At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{log.recipientEmail}</div>
                              {log.recipientName && (
                                <div className="text-sm text-gray-500">{log.recipientName}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.template ? (
                              <div>
                                <div className="font-medium">{log.template.name}</div>
                                <div className="text-xs">{getTemplateTypeLabel(log.template.templateType)}</div>
                              </div>
                            ) : (
                              'Custom Email'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
