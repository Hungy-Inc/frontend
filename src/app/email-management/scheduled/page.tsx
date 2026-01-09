'use client';

import { useState, useEffect } from 'react';
import { FaEnvelope, FaEdit, FaTrash, FaEye, FaPlus, FaPlay, FaToggleOn, FaToggleOff, FaHistory, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

interface ScheduledEmail {
  id: number;
  name: string;
  description?: string;
  emailType: string;
  templateId: number;
  isActive: boolean;
  scheduleType: string;
  scheduleConfig: any;
  recipientFilter: string;
  recipientConfig: any;
  lastRunAt?: string;
  nextRunAt?: string;
  totalSent: number;
  lastSentCount: number;
  lastRunStatus?: string;
  template?: {
    id: number;
    name: string;
    subject: string;
    templateType: string;
  };
  createdByUser?: {
    firstName: string;
    lastName: string;
  };
}

export default function ScheduledEmailsPage() {
  const router = useRouter();
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchScheduledEmails();
  }, [filterActive, filterType]);

  const fetchScheduledEmails = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterActive !== undefined) {
        filters.isActive = filterActive;
      }
      if (filterType) {
        filters.emailType = filterType;
      }
      const data = await api.getScheduledEmails(filters);
      setScheduledEmails(data.scheduledEmails || []);
    } catch (error) {
      console.error('Error fetching scheduled emails:', error);
      toast.error('Error fetching scheduled emails');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await api.toggleScheduledEmailActive(id, !currentStatus);
      toast.success(`Scheduled email ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchScheduledEmails();
    } catch (error) {
      console.error('Error toggling scheduled email:', error);
      toast.error('Error updating scheduled email');
    }
  };

  const deleteScheduledEmail = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scheduled email?')) return;

    try {
      await api.deleteScheduledEmail(id);
      toast.success('Scheduled email deleted successfully');
      fetchScheduledEmails();
    } catch (error) {
      console.error('Error deleting scheduled email:', error);
      toast.error('Error deleting scheduled email');
    }
  };

  const testScheduledEmail = async (id: number) => {
    try {
      await api.testScheduledEmail(id);
      toast.success('Test email sent successfully');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Error sending test email');
    }
  };

  const executeNow = async (id: number) => {
    if (!confirm('Execute this scheduled email now? This will send emails to all matching recipients.')) return;

    try {
      await api.executeScheduledEmail(id);
      toast.success('Scheduled email executed successfully');
      fetchScheduledEmails();
    } catch (error) {
      console.error('Error executing scheduled email:', error);
      toast.error('Error executing scheduled email');
    }
  };

  const getEmailTypeLabel = (type: string) => {
    switch (type) {
      case 'BIRTHDAY': return 'Birthday';
      case 'VOLUNTEER_ANNIVERSARY': return 'Volunteer Anniversary';
      case 'SHIFT_REMINDER': return 'Shift Reminder';
      case 'CUSTOM_RECURRING': return 'Custom Recurring';
      default: return type;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600';
      case 'PARTIAL_SUCCESS': return 'text-yellow-600';
      case 'FAILED': return 'text-red-600';
      case 'RUNNING': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatSchedule = (email: ScheduledEmail) => {
    if (email.emailType === 'BIRTHDAY') {
      const config = email.scheduleConfig || {};
      return `Daily (${config.sendOnDay || 'BIRTHDAY'})`;
    } else if (email.emailType === 'VOLUNTEER_ANNIVERSARY') {
      const config = email.scheduleConfig || {};
      const years = config.anniversaryYears || [];
      return `Daily (Years: ${years.join(', ')})`;
    } else if (email.emailType === 'SHIFT_REMINDER') {
      const config = email.scheduleConfig || {};
      const hours = Array.isArray(config.hoursBefore) 
        ? config.hoursBefore.join(', ') 
        : config.hoursBefore || 24;
      return `${hours} hours before shift`;
    }
    return email.scheduleType;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduled Emails</h1>
            <p className="text-gray-600">Manage automated email schedules for birthdays, anniversaries, and shift reminders</p>
          </div>
          <Link
            href="/email-management/scheduled/create"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Create Scheduled Email
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterActive === undefined ? 'all' : filterActive.toString()}
              onChange={(e) => setFilterActive(e.target.value === 'all' ? undefined : e.target.value === 'true')}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="BIRTHDAY">Birthday</option>
              <option value="VOLUNTEER_ANNIVERSARY">Anniversary</option>
              <option value="SHIFT_REMINDER">Shift Reminder</option>
              <option value="CUSTOM_RECURRING">Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scheduled Emails List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {scheduledEmails.length === 0 ? (
          <div className="text-center py-12">
            <FaEnvelope className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled emails</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new scheduled email.</p>
            <div className="mt-6">
              <Link
                href="/email-management/scheduled/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <FaPlus className="mr-2" />
                Create Scheduled Email
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Run</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledEmails.map((email) => (
                  <tr key={email.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{email.name}</div>
                        {email.description && (
                          <div className="text-sm text-gray-500">{email.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getEmailTypeLabel(email.emailType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatSchedule(email)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleActive(email.id, email.isActive)}
                          className="text-2xl"
                          title={email.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {email.isActive ? (
                            <FaToggleOn className="text-green-500" />
                          ) : (
                            <FaToggleOff className="text-gray-400" />
                          )}
                        </button>
                        {email.lastRunStatus && (
                          <span className={`text-xs ${getStatusColor(email.lastRunStatus)}`}>
                            {email.lastRunStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.lastRunAt ? new Date(email.lastRunAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.nextRunAt ? new Date(email.nextRunAt).toLocaleString() : 'Not scheduled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.totalSent} ({email.lastSentCount} last run)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/email-management/scheduled/${email.id}/edit`}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => testScheduledEmail(email.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Test"
                        >
                          <FaPlay />
                        </button>
                        <Link
                          href={`/email-management/scheduled/${email.id}/executions`}
                          className="text-purple-600 hover:text-purple-900"
                          title="View History"
                        >
                          <FaHistory />
                        </Link>
                        <button
                          onClick={() => executeNow(email.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Execute Now"
                        >
                          <FaCheckCircle />
                        </button>
                        <button
                          onClick={() => deleteScheduledEmail(email.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

