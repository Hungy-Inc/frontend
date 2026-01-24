'use client';

import { useState, useEffect } from 'react';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';

interface RecipientFailure {
  recipientEmail: string;
  recipientName: string;
  reason: string;
  details?: any;
}

interface ExecutionDetails {
  recipientsFound?: number;
  emailsSent?: number;
  emailsFailed?: number;
  skippedCount?: number;
  failedCount?: number;
  failures?: RecipientFailure[];
}

interface Execution {
  id: number;
  executionDate: string;
  status: string;
  recipientsFound: number;
  emailsSent: number;
  emailsFailed: number;
  errorMessage?: string;
  executionDetails?: ExecutionDetails;
}

export default function ExecutionHistoryPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchExecutions();
  }, [id, offset]);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const data = await api.getScheduledEmailExecutions(id, limit, offset);
      setExecutions(data.executions || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching execution history:', error);
      toast.error('Error fetching execution history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <FaCheckCircle className="text-green-500" />;
      case 'FAILED':
        return <FaTimesCircle className="text-red-500" />;
      case 'PARTIAL_SUCCESS':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'RUNNING':
        return <FaSpinner className="text-blue-500 animate-spin" />;
      default:
        return <FaExclamationTriangle className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600 bg-green-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      case 'PARTIAL_SUCCESS':
        return 'text-yellow-600 bg-yellow-50';
      case 'RUNNING':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

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
        <h1 className="text-3xl font-bold text-gray-900">Execution History</h1>
        <p className="text-gray-600 mt-2">View execution logs and statistics for this scheduled email</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Total Executions</div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Successful</div>
          <div className="text-2xl font-bold text-green-600">
            {executions.filter(e => e.status === 'SUCCESS').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Failed</div>
          <div className="text-2xl font-bold text-red-600">
            {executions.filter(e => e.status === 'FAILED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Total Emails Sent</div>
          <div className="text-2xl font-bold text-blue-600">
            {executions.reduce((sum, e) => sum + e.emailsSent, 0)}
          </div>
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-12">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No execution history</h3>
            <p className="mt-1 text-sm text-gray-500">Execution history will appear here once the scheduled email runs.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Execution Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients Found
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emails Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emails Failed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {executions.map((execution) => {
                    const isExpanded = expandedExecutionId === execution.id;
                    const hasFailures = execution.executionDetails?.failures && execution.executionDetails.failures.length > 0;
                    
                    return (
                      <>
                        <tr key={execution.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(execution.executionDate).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(execution.status)}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                                {execution.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {execution.recipientsFound}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {execution.emailsSent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            {execution.emailsFailed}
                            {execution.executionDetails?.skippedCount && execution.executionDetails.skippedCount > 0 && (
                              <span className="ml-1 text-xs text-orange-600">
                                ({execution.executionDetails.skippedCount} skipped)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex items-center justify-between">
                              <span>
                                {execution.errorMessage ? (
                                  <span className="text-red-600" title={execution.errorMessage}>
                                    {execution.errorMessage.length > 40 
                                      ? execution.errorMessage.substring(0, 40) + '...' 
                                      : execution.errorMessage}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </span>
                              {hasFailures && (
                                <button
                                  onClick={() => setExpandedExecutionId(isExpanded ? null : execution.id)}
                                  className="ml-2 text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>
                                      <FaChevronUp className="text-xs" />
                                      Hide Details
                                    </>
                                  ) : (
                                    <>
                                      <FaChevronDown className="text-xs" />
                                      Show Details
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && hasFailures && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <div className="font-medium text-gray-900 text-sm mb-2">
                                  Failure Details ({execution.executionDetails.failures.length} recipient(s))
                                </div>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                  {execution.executionDetails.failures.map((failure: RecipientFailure, idx: number) => (
                                    <div key={idx} className="bg-white border border-red-200 rounded-lg p-3 text-sm">
                                      <div className="font-medium text-gray-900">
                                        {failure.recipientName} ({failure.recipientEmail})
                                      </div>
                                      <div className="text-red-700 mt-1">
                                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium mr-2">
                                          ERROR
                                        </span>
                                        {failure.reason}
                                      </div>
                                      {failure.details && (
                                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                          <strong>Details:</strong>
                                          <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">
                                            {JSON.stringify(failure.details, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} executions
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

