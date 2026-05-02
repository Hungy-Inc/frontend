'use client';

import { useState, useEffect } from 'react';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
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
  templateType: string;
}

const EMAIL_TYPES = [
  { value: 'BIRTHDAY', label: 'Birthday Email' },
  { value: 'VOLUNTEER_ANNIVERSARY', label: 'Volunteer Anniversary' },
  // SHIFT_DISABLED_START
  // { value: 'SHIFT_REMINDER', label: 'Shift Reminder' },
  // SHIFT_DISABLED_END
  { value: 'CUSTOM_RECURRING', label: 'Custom Recurring' },
];

const SCHEDULE_TYPES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'CUSTOM_CRON', label: 'Custom Cron' },
];

const RECIPIENT_FILTERS = [
  { value: 'ALL_USERS', label: 'All Users' },
  { value: 'VOLUNTEERS_ONLY', label: 'Volunteers Only' },
  { value: 'STAFF_ONLY', label: 'Staff Only' },
  { value: 'ADMIN_ONLY', label: 'Admins Only' },
  { value: 'APPROVED_USERS_ONLY', label: 'Approved Users Only' },
  { value: 'CUSTOM_FILTER', label: 'Custom Filter' },
];

export default function CreateScheduledEmail() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emailType: 'BIRTHDAY',
    useTemplate: true, // Toggle between template and custom content
    templateId: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true,
    scheduleType: 'DAILY',
    scheduleConfig: {} as any,
    recipientFilter: 'APPROVED_USERS_ONLY',
    recipientConfig: {} as any,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Initialize schedule config based on email type
    const config: any = {};
    if (formData.emailType === 'BIRTHDAY') {
      config.type = 'BIRTHDAY';
      config.sendOnDay = 'BIRTHDAY';
      config.daysBefore = 0;
      config.timeOfDay = '09:00';
      config.timezone = 'America/Halifax';
    } else if (formData.emailType === 'VOLUNTEER_ANNIVERSARY') {
      config.type = 'ANNIVERSARY';
      config.anniversaryType = 'REGISTRATION_DATE';
      config.anniversaryYears = [1];
      config.sendOnDay = 'ANNIVERSARY';
      config.timeOfDay = '09:00';
      config.timezone = 'America/Halifax';
    // SHIFT_DISABLED_START
    // } else if (formData.emailType === 'SHIFT_REMINDER') {
    //   config.type = 'SHIFT_REMINDER';
    //   config.reminderType = 'BEFORE_SHIFT_START';
    //   config.hoursBefore = 24;
    //   config.timeOfDay = '09:00';
    //   config.timezone = 'America/Halifax';
    // }
    // SHIFT_DISABLED_END
    }
    setFormData(prev => ({ ...prev, scheduleConfig: config }));
  }, [formData.emailType]);

  const fetchTemplates = async () => {
    try {
      const data = await api.getEmailTemplates();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error fetching email templates');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleScheduleConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...prev.scheduleConfig,
        [field]: value
      }
    }));
  };

  const handleRecipientConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recipientConfig: {
        ...prev.recipientConfig,
        [field]: value
      }
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
    
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    // Validate based on useTemplate
    if (formData.useTemplate && !formData.templateId) {
      toast.error('Please select a template or create custom content');
      return;
    }

    if (!formData.useTemplate) {
      if (!formData.subject || !formData.htmlContent) {
        toast.error('Subject and email content are required when using custom content');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        emailType: formData.emailType,
        isActive: formData.isActive,
        scheduleType: formData.scheduleType,
        scheduleConfig: formData.scheduleConfig,
        recipientFilter: formData.recipientFilter,
        recipientConfig: formData.recipientConfig,
      };

      if (formData.useTemplate) {
        payload.templateId = parseInt(formData.templateId);
      } else {
        payload.subject = formData.subject;
        payload.htmlContent = formData.htmlContent;
        payload.textContent = formData.textContent;
      }

      await api.createScheduledEmail(payload);
      toast.success('Scheduled email created successfully');
      router.push('/email-management/scheduled');
    } catch (error: any) {
      console.error('Error creating scheduled email:', error);
      toast.error(error.message || 'Error creating scheduled email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/email-management/scheduled"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Scheduled Emails
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Scheduled Email</h1>
        <p className="text-gray-600 mt-2">Set up automated emails for birthdays, anniversaries, or shift reminders</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Monthly Birthday Wishes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Type <span className="text-red-500">*</span>
              </label>
              <select
                name="emailType"
                value={formData.emailType}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {EMAIL_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Content Source
              </label>
              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="useTemplate"
                    checked={formData.useTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, useTemplate: true }))}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Use Existing Template</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="useTemplate"
                    checked={!formData.useTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, useTemplate: false }))}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Create Custom Content</span>
                </label>
              </div>

              {formData.useTemplate ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Template <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="templateId"
                    value={formData.templateId}
                    onChange={handleInputChange}
                    required={formData.useTemplate}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select a template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.subject}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required={!formData.useTemplate}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Happy Birthday!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Content <span className="text-red-500">*</span>
                    </label>
                    <RichTextEditor
                      value={formData.htmlContent}
                      onChange={handleRichTextChange}
                      placeholder="Start typing your email content here..."
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Use variables like {'{{user.firstName}}'}, {'{{user.birthday}}'}, {'{{shift.name}}'}, etc.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active (emails will be sent automatically)
              </label>
            </div>
          </div>
        </div>

        {/* Schedule Configuration */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
              <select
                name="scheduleType"
                value={formData.scheduleType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {SCHEDULE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Birthday Configuration */}
            {formData.emailType === 'BIRTHDAY' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send On</label>
                  <select
                    value={formData.scheduleConfig.sendOnDay || 'BIRTHDAY'}
                    onChange={(e) => handleScheduleConfigChange('sendOnDay', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="BIRTHDAY">On Birthday</option>
                    <option value="BEFORE_BIRTHDAY">Before Birthday</option>
                    <option value="AFTER_BIRTHDAY">After Birthday</option>
                  </select>
                </div>
                {(formData.scheduleConfig.sendOnDay === 'BEFORE_BIRTHDAY' || formData.scheduleConfig.sendOnDay === 'AFTER_BIRTHDAY') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Days {formData.scheduleConfig.sendOnDay === 'BEFORE_BIRTHDAY' ? 'Before' : 'After'}
                    </label>
                    <input
                      type="number"
                      value={formData.scheduleConfig.daysBefore || 0}
                      onChange={(e) => handleScheduleConfigChange('daysBefore', parseInt(e.target.value))}
                      min="0"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time of Day</label>
                  <input
                    type="time"
                    value={formData.scheduleConfig.timeOfDay || '09:00'}
                    onChange={(e) => handleScheduleConfigChange('timeOfDay', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            )}

            {/* Anniversary Configuration */}
            {formData.emailType === 'VOLUNTEER_ANNIVERSARY' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anniversary Years</label>
                  <div className="space-y-2">
                    {[1, 2, 3, 5, 10].map(year => (
                      <label key={year} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(formData.scheduleConfig.anniversaryYears || []).includes(year)}
                          onChange={(e) => {
                            const years = formData.scheduleConfig.anniversaryYears || [];
                            const newYears = e.target.checked
                              ? [...years, year]
                              : years.filter((y: number) => y !== year);
                            handleScheduleConfigChange('anniversaryYears', newYears);
                          }}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{year} {year === 1 ? 'Year' : 'Years'}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time of Day</label>
                  <input
                    type="time"
                    value={formData.scheduleConfig.timeOfDay || '09:00'}
                    onChange={(e) => handleScheduleConfigChange('timeOfDay', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            )}

            {/* SHIFT_DISABLED_START */}
            {/* Shift Reminder Configuration */}
            {/* {formData.emailType === 'SHIFT_REMINDER' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Before Shift</label>
                  <input
                    type="number"
                    value={formData.scheduleConfig.hoursBefore || 24}
                    onChange={(e) => handleScheduleConfigChange('hoursBefore', parseInt(e.target.value))}
                    min="1"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="24"
                  />
                  <p className="mt-1 text-sm text-gray-500">Send reminder this many hours before shift starts</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time of Day</label>
                  <input
                    type="time"
                    value={formData.scheduleConfig.timeOfDay || '09:00'}
                    onChange={(e) => handleScheduleConfigChange('timeOfDay', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            )} */}
            {/* SHIFT_DISABLED_END */}
          </div>
        </div>

        {/* Recipient Configuration */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipient Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Filter</label>
              <select
                name="recipientFilter"
                value={formData.recipientFilter}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {RECIPIENT_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value}>{filter.label}</option>
                ))}
              </select>
            </div>

            {/* SHIFT_DISABLED_START */}
            {/* Additional recipient config based on email type */}
            {/* {formData.emailType === 'SHIFT_REMINDER' && (
              <div className="p-4 bg-gray-50 rounded-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signup Status</label>
                  <select
                    value={formData.recipientConfig.shiftSignupStatus?.[0] || 'REGISTERED'}
                    onChange={(e) => handleRecipientConfigChange('shiftSignupStatus', [e.target.value])}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="REGISTERED">Registered</option>
                    <option value="CHECKED_IN">Checked In</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Status</label>
                  <select
                    value={formData.recipientConfig.userStatus || 'APPROVED'}
                    onChange={(e) => handleRecipientConfigChange('userStatus', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>
            )} */}
            {/* SHIFT_DISABLED_END */}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          <Link
            href="/email-management/scheduled"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <FaSave className="mr-2" />
            {loading ? 'Creating...' : 'Create Scheduled Email'}
          </button>
        </div>
      </form>
    </div>
  );
}

