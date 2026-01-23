'use client';

import { useState, useEffect } from 'react';
import { FaArrowLeft, FaUser, FaEnvelope, FaBirthdayCake, FaCalendarAlt, FaClock, FaSync, FaCheckCircle, FaTimesCircle, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';

interface Recipient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  birthdate?: string;
  registrationDate?: string;
  yearsVolunteering?: number;
  shiftName?: string;
  shiftDate?: string;
  hoursUntilShift?: number;
  isDefaultUser?: boolean;
}

interface EmailPreview {
  subject: string;
  htmlContent: string;
  textContent?: string | null;
  sampleRecipient: {
    name: string;
    email: string;
  };
}

interface PreviewData {
  emailType: string;
  scheduledEmailName: string;
  nextRunAt: string | null;
  isActive: boolean;
  criteria: string;
  totalRecipients: number;
  recipients: Recipient[];
  previewGeneratedAt: string;
  emailPreview?: EmailPreview | null;
}

export default function PreviewRecipientsPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [id]);

  const fetchPreview = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await api.previewScheduledEmailRecipients(id);
      setPreviewData(data);
      if (showRefreshToast) {
        toast.success('Preview refreshed');
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast.error('Error fetching recipient preview');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case 'BIRTHDAY': return <FaBirthdayCake className="text-pink-500" />;
      case 'VOLUNTEER_ANNIVERSARY': return <FaCalendarAlt className="text-purple-500" />;
      case 'SHIFT_REMINDER': return <FaClock className="text-blue-500" />;
      default: return <FaEnvelope className="text-gray-500" />;
    }
  };

  // Format date in Halifax timezone for consistent display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/Halifax',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' (Halifax)';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <FaTimesCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading preview</h3>
          <p className="mt-1 text-gray-500">Could not load recipient preview data.</p>
          <Link href="/email-management/scheduled" className="mt-4 inline-block text-orange-600 hover:text-orange-800">
            ← Back to Scheduled Emails
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href="/email-management/scheduled"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Scheduled Emails
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {getEmailTypeIcon(previewData.emailType)}
              Preview Recipients
            </h1>
            <p className="text-gray-600 mt-2">
              Preview who will receive emails from: <strong>{previewData.scheduledEmailName}</strong>
            </p>
          </div>
          <button
            onClick={() => fetchPreview(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Preview
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Email Type</div>
          <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {getEmailTypeIcon(previewData.emailType)}
            {getEmailTypeLabel(previewData.emailType)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Status</div>
          <div className={`text-lg font-bold flex items-center gap-2 ${previewData.isActive ? 'text-green-600' : 'text-gray-500'}`}>
            {previewData.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
            {previewData.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Next Run</div>
          <div className="text-lg font-bold text-blue-600">
            {previewData.nextRunAt ? formatDate(previewData.nextRunAt) : 'Not scheduled'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Recipients Found</div>
          <div className={`text-2xl font-bold ${previewData.totalRecipients > 0 ? 'text-green-600' : 'text-orange-600'}`}>
            {previewData.totalRecipients}
          </div>
        </div>
      </div>

      {/* Criteria Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FaEnvelope className="text-blue-500 mt-1" />
          <div>
            <div className="font-medium text-blue-900">Selection Criteria</div>
            <div className="text-blue-700">{previewData.criteria}</div>
            <div className="text-sm text-blue-600 mt-1">
              Preview generated at: {formatDate(previewData.previewGeneratedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Warning if no recipients */}
      {previewData.totalRecipients === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FaTimesCircle className="text-yellow-500 mt-1" />
            <div>
              <div className="font-medium text-yellow-900">No Recipients Found</div>
              <div className="text-yellow-700">
                No users currently match the criteria for this scheduled email. This could mean:
              </div>
              <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
                {previewData.emailType === 'BIRTHDAY' && (
                  <>
                    <li>No users have a birthday today</li>
                    <li>Users don&apos;t have their birthdate field filled in</li>
                  </>
                )}
                {previewData.emailType === 'VOLUNTEER_ANNIVERSARY' && (
                  <>
                    <li>No users have their registration anniversary today</li>
                    <li>Users haven&apos;t reached the configured anniversary years</li>
                  </>
                )}
                {previewData.emailType === 'SHIFT_REMINDER' && (
                  <>
                    <li>No shifts are scheduled within the reminder window</li>
                    <li>No users are registered for upcoming shifts</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Section */}
      {previewData.emailPreview && (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FaEye className="text-blue-500" />
                Email Preview
              </h2>
              <div className="text-sm text-gray-500">
                Preview using: <span className="font-medium text-gray-700">{previewData.emailPreview.sampleRecipient.name}</span> ({previewData.emailPreview.sampleRecipient.email})
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Email Subject */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">Subject Line:</div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-900 font-medium">
                {previewData.emailPreview.subject}
              </div>
            </div>

            {/* Email HTML Content */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Email Content:</div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs text-gray-500">
                  HTML Preview (as recipients will see it)
                </div>
                <div 
                  className="p-6 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewData.emailPreview.htmlContent }}
                  style={{ 
                    maxHeight: '600px', 
                    overflowY: 'auto',
                    fontFamily: 'Arial, sans-serif'
                  }}
                />
              </div>
            </div>

            {/* Text Content (if available) */}
            {previewData.emailPreview.textContent && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Plain Text Version:</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {previewData.emailPreview.textContent}
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Note:</strong> This preview uses data from the first recipient. Each recipient will receive personalized content with their own data.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipients Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Recipients ({previewData.totalRecipients})
          </h2>
        </div>
        
        {previewData.totalRecipients === 0 ? (
          <div className="text-center py-12">
            <FaUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recipients</h3>
            <p className="mt-1 text-sm text-gray-500">
              No users match the criteria for this scheduled email right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  {previewData.emailType === 'BIRTHDAY' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Birthdate
                    </th>
                  )}
                  {previewData.emailType === 'VOLUNTEER_ANNIVERSARY' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Years
                      </th>
                    </>
                  )}
                  {previewData.emailType === 'SHIFT_REMINDER' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shift
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shift Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours Until
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.recipients.map((recipient, index) => (
                  <tr key={`${recipient.id}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {recipient.firstName} {recipient.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${recipient.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                          recipient.role === 'STAFF' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {recipient.role || 'VOLUNTEER'}
                      </span>
                    </td>
                    {previewData.emailType === 'BIRTHDAY' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="flex items-center gap-2">
                          <FaBirthdayCake className="text-pink-500" />
                          {recipient.birthdate || 'N/A'}
                        </span>
                      </td>
                    )}
                    {previewData.emailType === 'VOLUNTEER_ANNIVERSARY' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {recipient.registrationDate ? new Date(recipient.registrationDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            {recipient.yearsVolunteering} year{recipient.yearsVolunteering !== 1 ? 's' : ''}
                          </span>
                        </td>
                      </>
                    )}
                    {previewData.emailType === 'SHIFT_REMINDER' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recipient.shiftName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {recipient.shiftDate ? formatDate(recipient.shiftDate) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {recipient.hoursUntilShift !== undefined ? `${recipient.hoursUntilShift}h` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                            ${recipient.isDefaultUser ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {recipient.isDefaultUser ? 'Default User' : 'Registered'}
                          </span>
                        </td>
                      </>
                    )}
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
