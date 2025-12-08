'use client';

import React, { useState, useEffect } from 'react';

interface Grant {
  id: number;
  title: string;
  reportRequired: boolean | null;
  reportDueDate: string | null;
  reportSubmitted: boolean | null;
  reportSubmittedDate: string | null;
  reportNotes: string | null;
  updatedAt: string;
}

interface ReportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportHistoryEntry {
  id: number;
  grantTitle: string;
  reportDueDate: string;
  reportSubmittedDate: string;
  reportNotes: string | null;
  submittedAt: string;
}

export default function ReportHistoryModal({ isOpen, onClose }: ReportHistoryModalProps) {
  const [history, setHistory] = useState<ReportHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReportHistory();
      // Disable body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchReportHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/custom-grants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grants');
      }

      const data = await response.json();
      const grants: Grant[] = data.grants || [];
      
      // Filter grants that have submitted reports
      const submittedReports = grants
        .filter(grant => grant.reportRequired && grant.reportSubmitted && grant.reportSubmittedDate)
        .map(grant => ({
          id: grant.id,
          grantTitle: grant.title,
          reportDueDate: grant.reportDueDate || '',
          reportSubmittedDate: grant.reportSubmittedDate || '',
          reportNotes: grant.reportNotes,
          submittedAt: grant.updatedAt,
        }))
        .sort((a, b) => new Date(b.reportSubmittedDate).getTime() - new Date(a.reportSubmittedDate).getTime());

      setHistory(submittedReports);
    } catch (err) {
      console.error('Error fetching report history:', err);
      setError('Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Report Submission History</h2>
              <p className="text-sm text-gray-600 mt-1">All submitted grant reports</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report History</h3>
                <p className="text-sm text-gray-600">
                  No reports have been submitted yet. Submitted reports will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{entry.grantTitle}</h3>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Submitted
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Due Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(entry.reportDueDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Submitted On</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(entry.reportSubmittedDate)}</p>
                      </div>
                    </div>

                    {entry.reportNotes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.reportNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
