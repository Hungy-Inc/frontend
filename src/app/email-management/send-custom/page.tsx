'use client';

import { useState, useEffect, useCallback } from 'react';
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

const CUSTOM_EMAIL_RECIPIENT_LIMIT = 100; // per send; server also enforces 100 per org per 24h
const GMAIL_LIMIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const GMAIL_LIMIT_HIT_AT_KEY = 'gmailDailyLimitHitAt';

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
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');

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
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [serverUsage, setServerUsage] = useState<{ used: number; limit: number; resetsAt: string } | null>(null);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState<number | null>(null);
  const [gmailLimitHitAt, setGmailLimitHitAt] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(GMAIL_LIMIT_HIT_AT_KEY);
    const t = raw ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(t)) return null;
    if (Date.now() - t >= GMAIL_LIMIT_COOLDOWN_MS) {
      localStorage.removeItem(GMAIL_LIMIT_HIT_AT_KEY);
      return null;
    }
    return t;
  });
  const [gmailLimitCountdownSeconds, setGmailLimitCountdownSeconds] = useState<number | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const usage = await api.getCustomEmailUsage();
      setServerUsage(usage);
      if (usage.used >= usage.limit) {
        const remainingMs = new Date(usage.resetsAt).getTime() - Date.now();
        setCooldownRemainingSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));
      } else {
        setCooldownRemainingSeconds(null);
      }
    } catch {
      setServerUsage(null);
      setCooldownRemainingSeconds(null);
    }
  }, []);

  // Update countdown every second when at limit
  useEffect(() => {
    if (serverUsage == null || serverUsage.used < serverUsage.limit) return;
    const tick = () => {
      const remainingMs = new Date(serverUsage.resetsAt).getTime() - Date.now();
      setCooldownRemainingSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [serverUsage]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchUsage();

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
  }, [fetchUsage]);

  // Refresh usage periodically
  useEffect(() => {
    const interval = setInterval(fetchUsage, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  // Gmail limit 24h countdown: tick every second, clear when done
  useEffect(() => {
    if (gmailLimitHitAt == null) {
      setGmailLimitCountdownSeconds(null);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - gmailLimitHitAt;
      if (elapsed >= GMAIL_LIMIT_COOLDOWN_MS) {
        setGmailLimitHitAt(null);
        setGmailLimitCountdownSeconds(null);
        if (typeof window !== 'undefined') localStorage.removeItem(GMAIL_LIMIT_HIT_AT_KEY);
        return;
      }
      setGmailLimitCountdownSeconds(Math.ceil((GMAIL_LIMIT_COOLDOWN_MS - elapsed) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gmailLimitHitAt]);

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

    if (selectedUserIds.length > CUSTOM_EMAIL_RECIPIENT_LIMIT) {
      setShowLimitModal(true);
      return;
    }

    if (cannotSend) {
      return; // App 24h limit or Gmail limit reached; Send button is disabled, but guard anyway
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
        } catch (error: any) {
          if (error?.resetsAt != null) {
            toast.error(error.message || 'Custom email limit reached. Try again later.');
            await fetchUsage();
            setIsSending(false);
            return;
          }
          if (error?.code === 'GMAIL_DAILY_LIMIT') {
            const hitAt = Date.now();
            setGmailLimitHitAt(hitAt);
            setGmailLimitCountdownSeconds(Math.ceil(GMAIL_LIMIT_COOLDOWN_MS / 1000));
            if (typeof window !== 'undefined') localStorage.setItem(GMAIL_LIMIT_HIT_AT_KEY, String(hitAt));
            toast.error('Daily email limit reached. No emails can be sent for 24 hours.');
            await fetchUsage();
            setIsSending(false);
            return;
          }
          console.error(`Error sending email to ${selectedUser.email}:`, error);
          failCount++;
        }
      }

      // Show results
      if (successCount > 0 && failCount === 0) {
        toast.success(`Email sent successfully to ${successCount} user${successCount > 1 ? 's' : ''}!`);
        await fetchUsage();
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
        await fetchUsage();
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
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      if (prev.length >= CUSTOM_EMAIL_RECIPIENT_LIMIT) {
        setShowLimitModal(true);
        return prev;
      }
      return [...prev, userId];
    });
  };

  const filteredRecipientUsers = recipientSearchQuery.trim()
    ? users.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(recipientSearchQuery.trim().toLowerCase()) ||
          u.email.toLowerCase().includes(recipientSearchQuery.trim().toLowerCase())
      )
    : users;

  const selectAllUsers = () => {
    const pool = filteredRecipientUsers;
    if (pool.length > CUSTOM_EMAIL_RECIPIENT_LIMIT) {
      setSelectedUserIds(pool.slice(0, CUSTOM_EMAIL_RECIPIENT_LIMIT).map((u) => u.id));
      setShowLimitModal(true);
    } else {
      setSelectedUserIds(pool.map((u) => u.id));
    }
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

  const formatCountdown = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isAtServerLimit = serverUsage != null && serverUsage.used >= serverUsage.limit;
  const isInCooldown = isAtServerLimit && cooldownRemainingSeconds !== null && cooldownRemainingSeconds > 0;
  const gmailCountdownDisplay =
    gmailLimitHitAt != null
      ? gmailLimitCountdownSeconds != null
        ? gmailLimitCountdownSeconds
        : Math.max(0, Math.ceil((GMAIL_LIMIT_COOLDOWN_MS - (Date.now() - gmailLimitHitAt)) / 1000))
      : 0;
  const isGmailLimitActive = gmailLimitHitAt != null && gmailCountdownDisplay > 0;
  const cannotSend = isInCooldown || isGmailLimitActive;

  // --- SVG Icons ---
  const EnvelopeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.003 5.884L10 11.884l7.997-6M2 18h16V6l-8 5-8-5v12z" />
    </svg>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Recipient limit modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recipient limit</h3>
            <p className="text-gray-600 mb-6">
              You cannot send to more than {CUSTOM_EMAIL_RECIPIENT_LIMIT} recipients at a time. Please deselect some users.
            </p>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              OK
            </button>
          </div>
        </div>
      )}

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

      {/* When daily (Gmail) limit hit: show only this — no emails until 24h countdown */}
      {isGmailLimitActive ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900">No emails can be sent</p>
              <p className="text-xs text-red-700 mt-0.5">Daily sending limit reached. You can send again in:</p>
            </div>
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-red-900 min-w-[7rem] text-right">
            {formatCountdown(gmailCountdownDisplay)}
          </div>
        </div>
      ) : serverUsage != null ? (
        <div className={`mb-6 rounded-lg border p-4 flex flex-wrap items-center justify-between gap-4 ${isAtServerLimit ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isAtServerLimit ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <svg className={`h-6 w-6 ${isAtServerLimit ? 'text-amber-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Custom emails (last 24 hours)</p>
              <p className="text-xs text-gray-600">
                {serverUsage.used} / {serverUsage.limit} used — limit resets in 24h from first send in window
              </p>
            </div>
          </div>
          {isInCooldown ? (
            <div className="text-2xl font-mono font-bold tabular-nums text-amber-900 min-w-[7rem] text-right">
              Next available in: {formatCountdown(cooldownRemainingSeconds ?? 0)}
            </div>
          ) : (
            <div className="text-lg font-mono font-semibold tabular-nums text-gray-700">
              {serverUsage.limit - serverUsage.used} remaining
            </div>
          )}
        </div>
      ) : null}

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
                  Step 3: Select Recipients ({selectedUserIds.length}/{CUSTOM_EMAIL_RECIPIENT_LIMIT} selected)
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
              <input
                type="text"
                value={recipientSearchQuery}
                onChange={(e) => setRecipientSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full mt-2 mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
              <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No users available
                  </div>
                ) : filteredRecipientUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No users match your search
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredRecipientUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          disabled={!selectedUserIds.includes(user.id) && selectedUserIds.length >= CUSTOM_EMAIL_RECIPIENT_LIMIT}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={selectedUserIds.length === 0 || (mode === 'existing' && !selectedTemplateId) || (mode === 'create' && (!newTemplate.subject || !newTemplate.htmlContent)) || isSending || loading || cannotSend}
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