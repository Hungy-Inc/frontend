'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewGrantModal from '@/components/grants/NewGrantModal';
import EditGrantModal from '@/components/grants/EditGrantModal';
import GrantDocumentsModal from '@/components/grants/GrantDocumentsModal';
import ViewDocumentsModal from '@/components/grants/ViewDocumentsModal';
import GrantReportModal from '@/components/grants/GrantReportModal';
import ReportHistoryModal from '@/components/grants/ReportHistoryModal';

interface Grant {
  id: number;
  title: string;
  status: string;
  deadline: string | null;
  grantLimit: string | null;
  projectProgram: string | null;
  websiteUrl: string | null;
  applicationUrl: string | null;
  lastApprovalNotes: string | null;
  assignedTo: string | null;
  reportRequired: boolean | null;
  reportDueDate: string | null;
  reportSubmitted: boolean | null;
  reportSubmittedDate: string | null;
  reportNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MyGrants2Page() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null);
  const [expandedGrantId, setExpandedGrantId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [documentsGrant, setDocumentsGrant] = useState<Grant | null>(null);
  const [viewDocumentsGrant, setViewDocumentsGrant] = useState<Grant | null>(null);
  const [reportGrant, setReportGrant] = useState<Grant | null>(null);
  const [showReportHistory, setShowReportHistory] = useState(false);
  const [sortField, setSortField] = useState<keyof Grant | null>('deadline'); // Default to deadline
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Default to ascending (earliest first)

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/custom-grants`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGrants(Array.isArray(data.grants) ? data.grants : []);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch grants' }));
        setError(errorData.error || 'Failed to load grants');
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching grants:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantCreated = () => {
    setIsModalOpen(false);
    fetchGrants();
  };

  const handleDelete = async (grantId: number) => {
    if (!confirm('Are you sure you want to delete this grant? This action cannot be undone.')) return;

    setDeleteLoading(grantId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/custom-grants/${grantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Optimistically remove from UI
        setGrants(prev => prev.filter(g => g.id !== grantId));
        // Collapse if this grant was expanded
        if (expandedGrantId === grantId) {
          setExpandedGrantId(null);
        }
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else if (response.status === 404) {
        setError('Grant not found. It may have already been deleted.');
        fetchGrants(); // Refresh to sync state
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete grant' }));
        setError(errorData.error || 'Failed to delete grant');
      }
    } catch (error) {
      console.error('Error deleting grant:', error);
      setError('Network error. Failed to delete grant.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Safe status color getter with fallback
  const getStatusColor = (status: string) => {
    const colors = statusColors[status];
    if (!colors) {
      console.warn(`Unknown status: ${status}`);
      return statusColors.INTERESTED; // Fallback to default
    }
    return colors;
  };

  const statusColors: Record<string, { bg: string; text: string; badge: string; chart: string }> = {
    INTERESTED: { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800', chart: '#9CA3AF' },
    IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', chart: '#3B82F6' },
    SUBMITTED: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', chart: '#A855F7' },
    UNDER_REVIEW: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800', chart: '#EAB308' },
    APPROVED: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800', chart: '#22C55E' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800', chart: '#EF4444' },
    FUNDED: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', chart: '#10B981' },
  };

  const statusLabels: Record<string, string> = {
    INTERESTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    FUNDED: 'Funded',
  };

  // Calculate statistics
  const statusCounts = {
    INTERESTED: grants.filter(g => g.status === 'INTERESTED').length,
    IN_PROGRESS: grants.filter(g => g.status === 'IN_PROGRESS').length,
    SUBMITTED: grants.filter(g => g.status === 'SUBMITTED').length,
    UNDER_REVIEW: grants.filter(g => g.status === 'UNDER_REVIEW').length,
    APPROVED: grants.filter(g => g.status === 'APPROVED').length,
    REJECTED: grants.filter(g => g.status === 'REJECTED').length,
    FUNDED: grants.filter(g => g.status === 'FUNDED').length,
  };

  const totalGrants = grants.length;
  const activeGrants = grants.filter(g => ['IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW'].includes(g.status)).length;
  const successRate = totalGrants > 0 ? ((statusCounts.FUNDED / totalGrants) * 100).toFixed(1) : '0';

  // Calculate grant reports
  const grantsWithReports = grants.filter(g => g.reportRequired);
  const pendingReports = grantsWithReports.filter(g => !g.reportSubmitted);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdueReports = pendingReports.filter(g => {
    if (!g.reportDueDate) return false;
    const dueDate = new Date(g.reportDueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const upcomingReports = pendingReports.filter(g => {
    if (!g.reportDueDate) return false;
    const dueDate = new Date(g.reportDueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today;
  }).sort((a, b) => {
    const dateA = new Date(a.reportDueDate!).getTime();
    const dateB = new Date(b.reportDueDate!).getTime();
    return dateA - dateB;
  });

  const getDaysUntilDue = (dateString: string) => {
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter grants
  const filteredGrants = grants.filter((grant) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      grant.title.toLowerCase().includes(query) ||
      (grant.projectProgram && grant.projectProgram.toLowerCase().includes(query));
    
    const matchesStatus = !selectedStatus || grant.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Sort grants
  const sortedGrants = React.useMemo(() => {
    if (!sortField) return filteredGrants;

    return [...filteredGrants].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/undefined values - put them at the end
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle date fields
      if (sortField === 'deadline' || sortField === 'createdAt' || sortField === 'updatedAt' || 
          sortField === 'reportDueDate' || sortField === 'reportSubmittedDate') {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, undefined, { sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Handle number fields (if any)
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Fallback
      return 0;
    });
  }, [filteredGrants, sortField, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (field: keyof Grant) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Sort Icon Component
  const SortIcon = ({ field }: { field: keyof Grant }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Grant Management</h1>
              <p className="text-gray-600 mt-2">Manage and track all grant applications in one centralized location</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Grant
            </button>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Grants */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Grants</div>
                <div className="text-3xl font-bold text-gray-900">{totalGrants}</div>
                <div className="text-xs text-gray-500 mt-1">All applications</div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-12">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div
                  key={status}
                  className="flex-1 rounded-t transition-all hover:opacity-80"
                  style={{
                    backgroundColor: getStatusColor(status).chart,
                    height: `${totalGrants > 0 ? (count / totalGrants) * 100 : 0}%`,
                    minHeight: count > 0 ? '8px' : '0px',
                  }}
                  title={`${statusLabels[status]}: ${count}`}
                />
              ))}
            </div>
          </div>

          {/* Active Grants */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Active Applications</div>
                <div className="text-3xl font-bold text-blue-600">{activeGrants}</div>
                <div className="text-xs text-gray-500 mt-1">In progress / Submitted / Under review</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progress</span>
                <span>{totalGrants > 0 ? ((activeGrants / totalGrants) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${totalGrants > 0 ? (activeGrants / totalGrants) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                <div className="text-3xl font-bold text-emerald-600">{successRate}%</div>
                <div className="text-xs text-gray-500 mt-1">Funded applications</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {/* Success breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-50 rounded p-2">
                <div className="font-semibold text-emerald-700">{statusCounts.FUNDED}</div>
                <div className="text-gray-600">Funded</div>
              </div>
              <div className="bg-green-50 rounded p-2">
                <div className="font-semibold text-green-700">{statusCounts.APPROVED}</div>
                <div className="text-gray-600">Approved</div>
              </div>
              <div className="bg-red-50 rounded p-2">
                <div className="font-semibold text-red-700">{statusCounts.REJECTED}</div>
                <div className="text-gray-600">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grant Reports Due Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Grant Reports Due</h3>
                <p className="text-sm text-gray-600">
                  {pendingReports.length > 0 
                    ? `${pendingReports.length} pending report${pendingReports.length !== 1 ? 's' : ''}`
                    : 'No pending reports'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {overdueReports.length > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                  {overdueReports.length} Overdue
                </span>
              )}
              <button
                onClick={() => setShowReportHistory(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </button>
            </div>
          </div>

          {pendingReports.length > 0 ? (
            <div className="space-y-3">
              {/* Overdue Reports */}
              {overdueReports.map((grant) => {
                const daysOverdue = Math.abs(getDaysUntilDue(grant.reportDueDate!));
                return (
                  <div
                    key={grant.id}
                    className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="font-semibold text-gray-900 truncate">{grant.title}</h4>
                      </div>
                      <p className="text-sm text-red-700 mt-1 font-medium">
                        Overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} • Due: {formatDate(grant.reportDueDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => setReportGrant(grant)}
                      className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      Manage Report
                    </button>
                  </div>
                );
              })}

              {/* Upcoming Reports */}
              {upcomingReports.slice(0, 5).map((grant) => {
                const daysUntil = getDaysUntilDue(grant.reportDueDate!);
                const isUrgent = daysUntil <= 7;
                return (
                  <div
                    key={grant.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isUrgent
                        ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isUrgent && (
                          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        <h4 className="font-semibold text-gray-900 truncate">{grant.title}</h4>
                      </div>
                      <p className={`text-sm mt-1 ${isUrgent ? 'text-yellow-700 font-medium' : 'text-gray-600'}`}>
                        Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''} • {formatDate(grant.reportDueDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => setReportGrant(grant)}
                      className={`ml-4 px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${
                        isUrgent
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      Manage Report
                    </button>
                  </div>
                );
              })}

              {upcomingReports.length > 5 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  + {upcomingReports.length - 5} more upcoming report{upcomingReports.length - 5 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Pending Reports</h4>
              <p className="text-sm text-gray-600">
                All grant reports are up to date. You'll see pending reports here when they're due.
              </p>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search grants by name or program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
              >
                <option value="">All Status</option>
                {Object.entries(statusLabels).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
              <svg
                className="w-5 h-5 text-gray-400 absolute right-3 top-3.5 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Grants Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Grant Applications ({sortedGrants.length})
            </h3>
          </div>
          
          {error && (
            <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      fetchGrants();
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading grants...</p>
            </div>
          ) : sortedGrants.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {grants.length === 0 ? 'No grants yet' : 'No grants found'}
              </h3>
              <p className="text-gray-600">
                {grants.length === 0 ? 'Get started by creating your first grant' : 'Try adjusting your search'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        Grant Name
                        <SortIcon field="title" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('projectProgram')}
                    >
                      <div className="flex items-center gap-2">
                        Program
                        <SortIcon field="projectProgram" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('deadline')}
                    >
                      <div className="flex items-center gap-2">
                        Deadline
                        <SortIcon field="deadline" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('grantLimit')}
                    >
                      <div className="flex items-center gap-2">
                        Amount
                        <SortIcon field="grantLimit" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('assignedTo')}
                    >
                      <div className="flex items-center gap-2">
                        Assigned To
                        <SortIcon field="assignedTo" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedGrants.map((grant) => (
                    <React.Fragment key={grant.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-12 rounded-full"
                            style={{ backgroundColor: getStatusColor(grant.status).chart }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{grant.title}</div>
                            <div className="flex items-center gap-3 mt-1">
                              {grant.websiteUrl && (
                                <a
                                  href={grant.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                  </svg>
                                  Website
                                </a>
                              )}
                              {grant.applicationUrl && (
                                <a
                                  href={grant.applicationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Application
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(grant.status).badge}`}>
                          {statusLabels[grant.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {grant.projectProgram || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(grant.deadline)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {grant.grantLimit || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {grant.assignedTo ? (
                          <div className="flex flex-wrap gap-1">
                            {grant.assignedTo.split(', ').map((person, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {person}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDocumentsGrant(grant)}
                            className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5"
                            title="Upload Documents"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-xs font-medium">Upload</span>
                          </button>
                          <button
                            onClick={() => setViewDocumentsGrant(grant)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Documents"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setReportGrant(grant)}
                            disabled={grant.status !== 'FUNDED' && grant.status !== 'APPROVED'}
                            className={`relative p-2 rounded-lg transition-colors ${
                              grant.status !== 'FUNDED' && grant.status !== 'APPROVED'
                                ? 'text-gray-300 cursor-not-allowed'
                                : grant.reportRequired && !grant.reportSubmitted
                                ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                            }`}
                            title={grant.status !== 'FUNDED' && grant.status !== 'APPROVED' ? 'Reports only available for Funded/Approved grants' : 'Grant Report'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {grant.reportRequired && !grant.reportSubmitted && grant.status === 'FUNDED' && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                            )}
                          </button>
                          <button
                            onClick={() => setEditingGrant(grant)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(grant.id)}
                            disabled={deleteLoading === grant.id}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            {deleteLoading === grant.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => setExpandedGrantId(expandedGrantId === grant.id ? null : grant.id)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title={expandedGrantId === grant.id ? 'Collapse' : 'Expand'}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${expandedGrantId === grant.id ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Notes Row */}
                    {grant.lastApprovalNotes && (
                      <tr>
                        <td colSpan={7} className={`bg-gray-50 border-t border-gray-200 transition-all duration-500 ease-in-out ${
                          expandedGrantId === grant.id ? 'px-6 py-4' : 'px-6 py-0'
                        }`}>
                          <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out max-w-4xl ${
                              expandedGrantId === grant.id
                                ? 'max-h-96 opacity-100'
                                : 'max-h-0 opacity-0'
                            }`}
                          >
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Last Approval/Notes</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{grant.lastApprovalNotes}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewGrantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleGrantCreated}
      />

      <EditGrantModal
        isOpen={!!editingGrant}
        onClose={() => setEditingGrant(null)}
        onSuccess={() => {
          fetchGrants();
          setEditingGrant(null);
        }}
        grant={editingGrant}
      />

      <GrantDocumentsModal
        isOpen={!!documentsGrant && !!documentsGrant.id}
        onClose={() => setDocumentsGrant(null)}
        grantId={documentsGrant?.id || 0}
        grantTitle={documentsGrant?.title || ''}
      />

      <ViewDocumentsModal
        isOpen={!!viewDocumentsGrant && !!viewDocumentsGrant.id}
        onClose={() => setViewDocumentsGrant(null)}
        grantId={viewDocumentsGrant?.id || 0}
        grantTitle={viewDocumentsGrant?.title || ''}
      />

      <GrantReportModal
        isOpen={!!reportGrant}
        onClose={() => setReportGrant(null)}
        onSuccess={() => {
          fetchGrants();
          setReportGrant(null);
        }}
        grant={reportGrant}
      />

      <ReportHistoryModal
        isOpen={showReportHistory}
        onClose={() => setShowReportHistory(false)}
      />
    </div>
  );
}
