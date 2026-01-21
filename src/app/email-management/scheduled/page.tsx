'use client';

import { useState, useEffect } from 'react';
import { FaEnvelope, FaEdit, FaTrash, FaPlus, FaPlay, FaToggleOn, FaToggleOff, FaHistory, FaCheckCircle, FaUsers, FaBirthdayCake, FaCalendarAlt, FaClock, FaCog } from 'react-icons/fa';
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
      case 'VOLUNTEER_ANNIVERSARY': return 'Anniversary';
      case 'SHIFT_REMINDER': return 'Shift Reminder';
      case 'CUSTOM_RECURRING': return 'Custom';
      default: return type;
    }
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case 'BIRTHDAY': return <FaBirthdayCake className="text-pink-500" />;
      case 'VOLUNTEER_ANNIVERSARY': return <FaCalendarAlt className="text-purple-500" />;
      case 'SHIFT_REMINDER': return <FaClock className="text-blue-500" />;
      case 'CUSTOM_RECURRING': return <FaCog className="text-gray-500" />;
      default: return <FaEnvelope className="text-gray-500" />;
    }
  };

  const getEmailTypeBgColor = (type: string) => {
    switch (type) {
      case 'BIRTHDAY': return 'bg-pink-50 border-pink-200';
      case 'VOLUNTEER_ANNIVERSARY': return 'bg-purple-50 border-purple-200';
      case 'SHIFT_REMINDER': return 'bg-blue-50 border-blue-200';
      case 'CUSTOM_RECURRING': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'PARTIAL_SUCCESS': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'RUNNING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSchedule = (email: ScheduledEmail) => {
    if (email.emailType === 'BIRTHDAY') {
      const config = email.scheduleConfig || {};
      return config.sendOnDay === 'BIRTHDAY' ? 'On birthday' : `${config.daysBefore || 0} days before`;
    } else if (email.emailType === 'VOLUNTEER_ANNIVERSARY') {
      const config = email.scheduleConfig || {};
      const years = config.anniversaryYears || [];
      return `Years: ${years.join(', ')}`;
    } else if (email.emailType === 'SHIFT_REMINDER') {
      const config = email.scheduleConfig || {};
      const hours = Array.isArray(config.hoursBefore) 
        ? config.hoursBefore.join(', ') 
        : config.hoursBefore || 24;
      return `${hours}h before shift`;
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

      {/* Scheduled Emails Cards */}
      {scheduledEmails.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border text-center py-12">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scheduledEmails.map((email) => (
            <div 
              key={email.id} 
              className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden ${email.isActive ? 'border-green-300' : 'border-gray-200 opacity-75'}`}
            >
              {/* Card Header */}
              <div className={`px-5 py-4 ${getEmailTypeBgColor(email.emailType)} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getEmailTypeIcon(email.emailType)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{email.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 text-gray-700">
                          {getEmailTypeLabel(email.emailType)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatSchedule(email)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(email.id, email.isActive)}
                    className="text-3xl"
                    title={email.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                  >
                    {email.isActive ? (
                      <FaToggleOn className="text-green-500 hover:text-green-600" />
                    ) : (
                      <FaToggleOff className="text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card Body - Stats */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase">Total Sent</div>
                    <div className="text-xl font-bold text-gray-900">{email.totalSent}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase">Last Run</div>
                    <div className="text-sm font-medium text-gray-700">
                      {email.lastRunAt ? new Date(email.lastRunAt).toLocaleDateString() : 'Never'}
                    </div>
                    {email.lastRunStatus && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(email.lastRunStatus)}`}>
                        {email.lastRunStatus}
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase">Next Run</div>
                    <div className="text-sm font-medium text-gray-700">
                      {email.nextRunAt ? new Date(email.nextRunAt).toLocaleDateString() : 'N/A'}
                    </div>
                    {email.nextRunAt && (
                      <div className="text-xs text-gray-500">
                        {new Date(email.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons - PROMINENT */}
                <div className="border-t pt-4">
                  <div className="text-xs text-gray-500 uppercase mb-2 font-medium">Quick Actions</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <Link
                      href={`/email-management/scheduled/${email.id}/preview`}
                      className="flex flex-col items-center justify-center p-3 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors group"
                      title="Preview who will receive this email"
                    >
                      <FaUsers className="text-cyan-600 text-lg mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-cyan-700 font-medium">Preview</span>
                    </Link>
                    
                    <button
                      onClick={() => testScheduledEmail(email.id)}
                      className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                      title="Send a test email to yourself"
                    >
                      <FaPlay className="text-blue-600 text-lg mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-blue-700 font-medium">Test</span>
                    </button>
                    
                    <button
                      onClick={() => executeNow(email.id)}
                      className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                      title="Execute now and send to all recipients"
                    >
                      <FaCheckCircle className="text-green-600 text-lg mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-green-700 font-medium">Run Now</span>
                    </button>
                    
                    <Link
                      href={`/email-management/scheduled/${email.id}/executions`}
                      className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                      title="View execution history"
                    >
                      <FaHistory className="text-purple-600 text-lg mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-purple-700 font-medium">History</span>
                    </Link>
                    
                    <Link
                      href={`/email-management/scheduled/${email.id}/edit`}
                      className="flex flex-col items-center justify-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
                      title="Edit this scheduled email"
                    >
                      <FaEdit className="text-orange-600 text-lg mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-orange-700 font-medium">Edit</span>
                    </Link>
                    
                    <button
                      onClick={() => deleteScheduledEmail(email.id)}
                      className="flex flex-col items-center justify-center p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
                      title="Delete this scheduled email"
                    >
                      <FaTrash className="text-red-600 text-lg mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-red-700 font-medium">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
