'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';
import { stripHtmlTags } from '@/utils/htmlUtils';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const TEMPLATE_TYPES = [
  { value: 'CUSTOM_MARKETING', label: 'Marketing Email' },
  { value: 'CUSTOM_NOTIFICATION', label: 'Notification' },
  { value: 'CUSTOM_ANNOUNCEMENT', label: 'Announcement' },
  { value: 'CUSTOM_REMINDER', label: 'Reminder' },
];

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
  organizationId?: number;
  organization?: {
    id: number;
    name: string;
  };
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  isSystem: boolean;
  variables?: any;
}

export default function SendCustomEmailPage() {
  const router = useRouter();
  
  // State for data
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // State for selections
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // State for loading
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Toggle state: 'create' or 'existing'
  const [mode, setMode] = useState<'create' | 'existing'>('create');

  // New template form data
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    templateType: 'CUSTOM_MARKETING',
    description: ''
  });

  // Save template modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalStep, setModalStep] = useState<'askToSave' | 'getName'>('askToSave');
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false); // For the final save button
  const [sentEmailData, setSentEmailData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get current user from localStorage (admin info)
        const userStr = localStorage.getItem('user');
        const currentUserId = userStr ? JSON.parse(userStr).id : null;
        const currentUserData = userStr ? JSON.parse(userStr) : null;
        setCurrentUser(currentUserData);
        
        // 1. Fetch all users
        const allUsers = await api.getUsers();
        
        // Filter out current user
        const filteredUsers = allUsers.filter((user: User) => user.id !== currentUserId);
        setUsers(filteredUsers);

        // 2. Fetch all email templates
        const response = await api.getEmailTemplates();
        const allTemplates = response.templates || [];
        
        // Filter for non-system templates only
        const customTemplates = allTemplates.filter((template: EmailTemplate) => !template.isSystem);
        setTemplates(customTemplates);

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load necessary data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTemplate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRichTextChange = (htmlContent: string) => {
    const plainText = stripHtmlTags(htmlContent);
    setNewTemplate(prev => ({
      ...prev,
      htmlContent,
      textContent: plainText
    }));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUserIds.length === 0) {
      toast.warn('Please select at least one user.');
      return;
    }

    // Validate based on mode
    if (mode === 'existing') {
      if (!selectedTemplateId) {
        toast.warn('Please select a template.');
        return;
      }
    } else {
      if (!newTemplate.subject || !newTemplate.htmlContent) {
        toast.warn('Please fill in subject and email content.');
        return;
      }
    }

    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
    const templateToUse = mode === 'existing' 
      ? templates.find(t => t.id === selectedTemplateId)
      : newTemplate;

    if (selectedUsers.length === 0 || !templateToUse) {
      toast.error('Invalid selection.');
      return;
    }

    setIsSending(true);

    try {
      let successCount = 0;
      let failCount = 0;

      // Send email to each selected user
      for (const selectedUser of selectedUsers) {
        try {
          // Prepare user data for template variable replacement
          const now = new Date();
          const userData = {
            user: {
              firstName: selectedUser.firstName,
              lastName: selectedUser.lastName,
              fullName: `${selectedUser.firstName} ${selectedUser.lastName}`,
              email: selectedUser.email,
              phone: selectedUser.phone || '',
              role: selectedUser.role || '',
              status: selectedUser.status || '',
              organization: {
                name: selectedUser.organization?.name || 'Hungy'
              }
            },
            system: {
              currentDate: now.toLocaleDateString(),
              currentTime: now.toLocaleTimeString(),
              appName: 'Hungy',
              supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@hungy.com'
            }
          };

      // Replace template variables with user data
      const replaceVariables = (content: string, variables: Record<string, any>): string => {
        let result = content;
        const variableRegex = /\{\{([^}]+)\}\}/g;
        result = result.replace(variableRegex, (match, path) => {
          const keys = path.trim().split('.');
          let value = variables;
          
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

          const subject = replaceVariables(templateToUse.subject, userData);
          const htmlContent = replaceVariables(templateToUse.htmlContent, userData);
          const textContent = templateToUse.textContent ? replaceVariables(templateToUse.textContent, userData) : undefined;

          // Send email via API
          await api.sendCustomEmail({
            recipientEmail: selectedUser.email,
            recipientName: `${selectedUser.firstName} ${selectedUser.lastName}`,
            subject,
            htmlContent,
            textContent
          });

          successCount++;
        } catch (error) {
          console.error(`Error sending email to ${selectedUser.email}:`, error);
          failCount++;
        }
      }

      // Show results
      if (successCount > 0 && failCount === 0) {
        toast.success(`Email sent successfully to ${successCount} user${successCount > 1 ? 's' : ''}!`);
        
        // If mode is 'create', ask to save template
        if (mode === 'create') {
          setSentEmailData({
            subject: newTemplate.subject,
            htmlContent: newTemplate.htmlContent,
            textContent: newTemplate.textContent,
            templateType: newTemplate.templateType,
            description: newTemplate.description
          });
          setShowSaveModal(true);
        } else {
          // Reset and redirect
          setSelectedUserIds([]);
          setSelectedTemplateId(null);
          setTimeout(() => {
            router.push('/email-management');
          }, 1500);
        }
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Email sent to ${successCount} user${successCount > 1 ? 's' : ''}, but failed for ${failCount} user${failCount > 1 ? 's' : ''}.`);
      } else {
        toast.error('Failed to send email to all selected users.');
      }

    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error('Failed to send emails. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUserIds(users.map(u => u.id));
  };

  const deselectAllUsers = () => {
    setSelectedUserIds([]);
  };

  const handleSaveTemplate = () => {
    // This function now just transitions the modal to the next step
    setModalStep('getName');
  };

  const handleFinalSave = async () => {
    if (!sentEmailData || !templateName) {
      toast.warn('Template name is required.');
      return;
    }

    setIsSaving(true);
    try {
      await api.createEmailTemplate({
        ...sentEmailData,
        name: templateName,
      });
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
      setShowSaveModal(false);
      setModalStep('askToSave'); // Reset modal step
      setTemplateName(''); // Reset template name
      setSelectedUserIds([]);
      setNewTemplate({
        name: '',
        subject: '',
        htmlContent: '',
        textContent: '',
        templateType: 'CUSTOM_MARKETING',
        description: '',
      });
      router.push('/email-management');
    }
  };

  const handleSkipSave = () => {
    setShowSaveModal(false);
    setModalStep('askToSave'); // Reset modal step
    setTemplateName(''); // Reset template name
    setSelectedUserIds([]);
    setNewTemplate({
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      templateType: 'CUSTOM_MARKETING',
      description: '',
    });
    router.push('/email-management');
  };

  // --- SVG Icons ---
  const EnvelopeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.003 5.884L10 11.884l7.997-6M2 18h16V6l-8 5-8-5v12z" />
    </svg>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transition-all duration-300">
            {modalStep === 'askToSave' ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Save Email Template?</h3>
                <p className="text-gray-600 mb-6">
                  Would you like to save this email as a template for future use?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveTemplate}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    Yes, Save Template
                  </button>
                  <button
                    onClick={handleSkipSave}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    No, Skip
                  </button>
                </div>
              </>
            ) : (
              // modalStep === 'getName'
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Name Your Template</h3>
                <p className="text-gray-600 mb-4">
                  Enter a unique name for your new template.
                </p>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 'Monthly Newsletter'"
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleFinalSave}
                    disabled={!templateName || isSaving}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-400"
                  >
                    {isSaving ? 'Saving...' : 'Save Template'}
                  </button>
                  <button
                    onClick={handleSkipSave}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/email-management" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <FaArrowLeft />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Send Custom Email</h1>
        </div>
        <p className="text-gray-600">Create a new email or use an existing template to send to users</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="space-y-6">
            {/* Toggle Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Step 1: Choose Email Source
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    mode === 'create'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">Create New Email</div>
                  <div className="text-xs mt-1">Compose from scratch</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    mode === 'existing'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">Use Existing Template</div>
                  <div className="text-xs mt-1">Select from saved templates</div>
                </button>
              </div>
            </div>

            {/* Template Section */}
            {mode === 'existing' ? (
              <div>
                <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                  Step 2: Select Email Template
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <EnvelopeIcon />
                  </div>
                  <select
                    id="template"
                    name="template"
                    value={selectedTemplateId || ''}
                    onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
                    disabled={templates.length === 0}
                  >
                    <option value="">
                      {templates.length === 0
                        ? 'No custom templates found'
                        : '-- Select a custom template --'}
                    </option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTemplate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Subject: "<span className="font-medium">{selectedTemplate.subject}</span>"
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Step 2: Email Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={newTemplate.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Welcome to our organization!"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 mb-2">
                    Template Type
                  </label>
                  <select
                    id="templateType"
                    name="templateType"
                    value={newTemplate.templateType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {TEMPLATE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Content *
                  </label>
                  <RichTextEditor
                    value={newTemplate.htmlContent}
                    onChange={handleRichTextChange}
                    placeholder="Start typing your email content here..."
                    allowedCategories={['user', 'organization', 'system']}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newTemplate.description}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Brief description of this email"
                  />
                </div>
              </div>
            )}

            {/* User Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Step 3: Select Recipients ({selectedUserIds.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllUsers}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllUsers}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No users available
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedUsers.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Email will be sent to <span className="font-medium">{selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/email-management')}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedUserIds.length === 0 || (mode === 'existing' && !selectedTemplateId) || (mode === 'create' && (!newTemplate.subject || !newTemplate.htmlContent)) || isSending || loading}
                className="flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}