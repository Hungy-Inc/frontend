'use client';

import React, { useState, useEffect } from 'react';

interface GrantReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  grant: {
    id: number;
    title: string;
    reportRequired: boolean | null;
    reportDueDate: string | null;
    reportSubmitted: boolean | null;
    reportSubmittedDate: string | null;
    reportNotes: string | null;
  } | null;
}

export default function GrantReportModal({ isOpen, onClose, onSuccess, grant }: GrantReportModalProps) {
  const [reportRequired, setReportRequired] = useState(false);
  const [reportDueDate, setReportDueDate] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportSubmittedDate, setReportSubmittedDate] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosingRequired, setIsClosingRequired] = useState(false);
  const [isClosingSubmitted, setIsClosingSubmitted] = useState(false);

  useEffect(() => {
    if (grant && isOpen) {
      setReportRequired(grant.reportRequired || false);
      setReportDueDate(grant.reportDueDate ? grant.reportDueDate.split('T')[0] : '');
      setReportSubmitted(grant.reportSubmitted || false);
      setReportSubmittedDate(grant.reportSubmittedDate ? grant.reportSubmittedDate.split('T')[0] : '');
      setReportNotes(grant.reportNotes || '');
      setError(null);
      setIsClosingRequired(false);
      setIsClosingSubmitted(false);
    }
  }, [grant, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleReportRequiredChange = (checked: boolean) => {
    if (!checked) {
      setIsClosingRequired(true);
      setTimeout(() => {
        setReportRequired(false);
        setIsClosingRequired(false);
      }, 300);
    } else {
      setReportRequired(true);
    }
  };

  const handleReportSubmittedChange = (checked: boolean) => {
    if (!checked) {
      setIsClosingSubmitted(true);
      setTimeout(() => {
        setReportSubmitted(false);
        setIsClosingSubmitted(false);
      }, 300);
    } else {
      setReportSubmitted(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grant) return;

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/custom-grants/${grant.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportRequired,
          reportDueDate: reportDueDate || null,
          reportSubmitted,
          reportSubmittedDate: reportSubmittedDate || null,
          reportNotes: reportNotes || null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update grant report');
      }
    } catch (err) {
      console.error('Error updating grant report:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !grant) return null;

  return (
    <>
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-in forwards;
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Grant Report Management</h2>
            <p className="text-sm text-gray-600 mt-1">{grant.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Report Required */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="reportRequired"
              checked={reportRequired}
              onChange={(e) => handleReportRequiredChange(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="reportRequired" className="flex-1 cursor-pointer">
              <div className="font-semibold text-gray-900">Grant Report Required</div>
              <div className="text-sm text-gray-600">Check this if a report is required for this grant</div>
            </label>
          </div>

          {/* Report Due Date */}
          {(reportRequired || isClosingRequired) && (
          <div className={`transition-all duration-1300 ease-in-out ${
            reportRequired || isClosingRequired ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            {(reportRequired || isClosingRequired) && (
              <div className={!isClosingRequired ? 'animate-slideDown' : 'animate-slideUp'}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Report Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={reportDueDate}
                  onChange={(e) => setReportDueDate(e.target.value)}
                  required={reportRequired}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
          )}

          {/* Report Submitted */}
          {(reportRequired || isClosingRequired) && (
          <div className={`transition-all duration-1300 ease-in-out ${
            reportRequired || isClosingRequired ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            {(reportRequired || isClosingRequired) && (
              <div className={`flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200 ${!isClosingRequired ? 'animate-slideDown' : 'animate-slideUp'}`}>
                <input
                  type="checkbox"
                  id="reportSubmitted"
                  checked={reportSubmitted}
                  onChange={(e) => handleReportSubmittedChange(e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <label htmlFor="reportSubmitted" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-gray-900">Report Submitted</div>
                  <div className="text-sm text-gray-600">Mark this when the report has been submitted</div>
                </label>
              </div>
            )}
          </div>
          )}

          {/* Report Submitted Date */}
          {((reportRequired && reportSubmitted) || isClosingSubmitted) && (
          <div className={`transition-all duration-1300 ease-in-out ${
            (reportRequired && reportSubmitted) || isClosingSubmitted ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            {((reportRequired && reportSubmitted) || isClosingSubmitted) && (
              <div className={!isClosingSubmitted ? 'animate-slideDown' : 'animate-slideUp'}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Report Submitted Date
                </label>
                <input
                  type="date"
                  value={reportSubmittedDate}
                  onChange={(e) => setReportSubmittedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
          )}

          {/* Report Notes */}
          {(reportRequired || isClosingRequired) && (
          <div className={`transition-all duration-1300 ease-in-out ${
            reportRequired || isClosingRequired ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            {(reportRequired || isClosingRequired) && (
              <div className={!isClosingRequired ? 'animate-slideDown' : 'animate-slideUp'}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Report Notes
                </label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows={4}
                  placeholder="Add any notes about the grant report..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            )}
          </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Report Info'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
