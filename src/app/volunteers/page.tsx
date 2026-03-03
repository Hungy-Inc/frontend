'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaChevronDown, FaChevronRight, FaSearch, FaEdit, FaTimes, FaSave } from 'react-icons/fa';
import { getRecurringShiftWallClockTimeDisplay } from '@/utils/timezoneUtils';

const months = [
  { value: 0, label: 'All Months' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

type VolunteerRow = {
  [key: string]: string | number;
};

type VolunteerDetail = {
  id: number;
  name: string;
  email: string;
  role: string;
  totalHours: number;
  extraHours?: number;
  upcomingShifts: ShiftDetail[];
  completedShifts: ShiftDetail[];
};

type ShiftDetail = {
  id: number;
  signupId?: number;
  recurringShiftId?: number;
  date: string;
  category: string;
  startTime: string;
  endTime: string;
  checkIn: string | null;
  checkOut: string | null;
  autoCheckout?: boolean;
  hours: number;
  status: string;
};

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= 2020; y--) {
    years.push(y);
  }
  return years;
};

export default function VolunteersPage() {
  const [activeTab, setActiveTab] = useState<'hours' | 'volunteers'>('hours');
  const [columns, setColumns] = useState<string[]>([]);
  const [tableData, setTableData] = useState<VolunteerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Volunteers tab state
  const [volunteers, setVolunteers] = useState<VolunteerDetail[]>([]);
  const [volunteersLoading, setVolunteersLoading] = useState(true);
  const [volunteersError, setVolunteersError] = useState('');
  const [expandedVolunteers, setExpandedVolunteers] = useState<Set<number>>(new Set());
  const [shiftFilters, setShiftFilters] = useState<{ [volunteerId: number]: { upcoming: number; completed: number } }>({});
  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState('');
  // Record extra hours modal
  const [showRecordExtraModal, setShowRecordExtraModal] = useState(false);
  const [recordExtraUsers, setRecordExtraUsers] = useState<{ id: number; firstName: string; lastName: string; email: string }[]>([]);
  const [recordExtraUsersLoading, setRecordExtraUsersLoading] = useState(false);
  const [recordExtraUserSearch, setRecordExtraUserSearch] = useState('');
  const [recordExtraSelectedUser, setRecordExtraSelectedUser] = useState<{ id: number; name: string } | null>(null);
  const [recordExtraDate, setRecordExtraDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recordExtraHours, setRecordExtraHours] = useState('');
  const [recordExtraReason, setRecordExtraReason] = useState('');
  const [recordExtraSubmitting, setRecordExtraSubmitting] = useState(false);
  // Extra hours list per volunteer (when card expanded). Key: `${userId}-${month}-${year}`
  const [extraHoursRecordsMap, setExtraHoursRecordsMap] = useState<Record<string, { loading: boolean; records: { id: number; hours: number; reason: string | null; recordDate: string; shiftId: number | null; recurringShiftId: number | null; Shift: { id: number; name: string; startTime: string; endTime: string } | null }[] }>>({});
  const [editingExtraRecord, setEditingExtraRecord] = useState<{ volunteerId: number; recordId: number; hours: string; reason: string; recordDate: string } | null>(null);
  const [savingExtraRecord, setSavingExtraRecord] = useState(false);
  const [cancellingShiftKey, setCancellingShiftKey] = useState<string | null>(null);

  const extraHoursCacheKey = (userId: number) => `${userId}-${selectedMonth}-${selectedYear}`;

  const refetchVolunteers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteers/details?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const filteredData = data.filter((volunteer: VolunteerDetail) => {
        const role = (volunteer.role || '').toLowerCase().trim();
        return role !== 'staff' && role !== 'admin';
      });
      setVolunteers(filteredData);
    } catch (e) {
      toast.error('Failed to refresh volunteers');
    }
  };

  const handleCancelShift = async (volunteerId: number, shift: ShiftDetail) => {
    const key = `${volunteerId}-${shift.startTime}`;
    setCancellingShiftKey(key);
    try {
      const token = localStorage.getItem('token');
      const body: Record<string, unknown> = {
        userId: volunteerId,
        status: shift.status
      };
      if (shift.status === 'Registered') {
        if (shift.signupId == null) {
          toast.error('Cannot cancel: signup id missing');
          return;
        }
        body.signupId = shift.signupId;
      } else {
        body.shiftId = shift.id;
        if (shift.id === 0 && shift.recurringShiftId != null) {
          body.recurringShiftId = shift.recurringShiftId;
          body.startTime = shift.startTime;
        }
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteer-shifts/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Failed to cancel shift');
        return;
      }
      toast.success('Shift cancelled');
      await refetchVolunteers();
    } catch (e) {
      toast.error('Failed to cancel shift');
    } finally {
      setCancellingShiftKey(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'hours') {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError('');
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteer-hours?month=${selectedMonth}&year=${selectedYear}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) throw new Error('Failed to fetch volunteer hours');
          const data = await response.json();
          setColumns(data.columns || []);
          setTableData(data.tableData || []);
        } catch (err) {
          setColumns([]);
          setTableData([]);
          setError('Failed to load volunteer hours.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedMonth, selectedYear, activeTab]);

  useEffect(() => {
    if (activeTab === 'volunteers') {
      const fetchVolunteers = async () => {
        try {
          setVolunteersLoading(true);
          setVolunteersError('');
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteers/details?month=${selectedMonth}&year=${selectedYear}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) throw new Error('Failed to fetch volunteers');
          const data = await response.json();
          // Filter out staff and admin - only show volunteers
          const filteredData = data.filter((volunteer: VolunteerDetail) => {
            const role = (volunteer.role || '').toLowerCase().trim();
            return role !== 'staff' && role !== 'admin';
          });
          setVolunteers(filteredData);
        } catch (err) {
          setVolunteers([]);
          setVolunteersError('Failed to load volunteers.');
        } finally {
          setVolunteersLoading(false);
        }
      };
      fetchVolunteers();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  // Fetch extra hours records when a volunteer card is expanded (refetches when month/year changes)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    expandedVolunteers.forEach(volunteerId => {
      const key = extraHoursCacheKey(volunteerId);
      const current = extraHoursRecordsMap[key];
      if (current?.loading) return;
      setExtraHoursRecordsMap(prev => ({ ...prev, [key]: { loading: true, records: [] } }));
      fetch(`${apiUrl}/api/extra-hours?userId=${volunteerId}&month=${selectedMonth}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then((data: any[]) => {
          setExtraHoursRecordsMap(prev => ({
            ...prev,
            [key]: {
              loading: false,
              records: Array.isArray(data) ? data.map((r: any) => ({
                id: r.id,
                hours: r.hours,
                reason: r.reason ?? null,
                recordDate: r.recordDate,
                shiftId: r.shiftId ?? null,
                recurringShiftId: r.recurringShiftId ?? null,
                Shift: r.Shift ?? null
              })) : []
            }
          }));
        })
        .catch(() => {
          setExtraHoursRecordsMap(prev => ({ ...prev, [key]: { loading: false, records: [] } }));
        });
    });
  }, [expandedVolunteers, selectedMonth, selectedYear]);

  // Fetch users when Record extra hours modal opens
  useEffect(() => {
    if (!showRecordExtraModal) return;
    let cancelled = false;
    setRecordExtraUsersLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then((data: any[]) => {
        if (cancelled) return;
        const list = (Array.isArray(data) ? data : []).map((u: any) => ({
          id: u.id,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || ''
        }));
        setRecordExtraUsers(list);
      })
      .catch(() => { if (!cancelled) setRecordExtraUsers([]); })
      .finally(() => { if (!cancelled) setRecordExtraUsersLoading(false); });
    return () => { cancelled = true; };
  }, [showRecordExtraModal]);

  const handleSaveExtraHoursEdit = async () => {
    if (!editingExtraRecord) return;
    const h = parseFloat(editingExtraRecord.hours);
    if (isNaN(h) || h < 0) {
      toast.error('Enter a valid number of hours.');
      return;
    }
    setSavingExtraRecord(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extra-hours/${editingExtraRecord.recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          hours: h,
          reason: editingExtraRecord.reason || undefined,
          recordDate: editingExtraRecord.recordDate,
          shiftId: null,
          recurringShiftId: null
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update');
      }
      const updated = await res.json();
      const key = extraHoursCacheKey(editingExtraRecord.volunteerId);
      setExtraHoursRecordsMap(prev => {
        const entry = prev[key];
        if (!entry) return prev;
        const records = entry.records.map(r =>
          r.id === editingExtraRecord.recordId
            ? {
                ...r,
                hours: updated.hours,
                reason: updated.reason ?? null,
                shiftId: updated.shiftId ?? null,
                recurringShiftId: updated.recurringShiftId ?? null,
                Shift: updated.Shift ?? null
              }
            : r
        );
        return { ...prev, [key]: { ...entry, records } };
      });
      setEditingExtraRecord(null);
      toast.success('Extra hours updated.');
      // Refresh volunteers list so header extra hours sum updates
      const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteers/details?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (detailsRes.ok) {
        const data = await detailsRes.json();
        const filtered = (Array.isArray(data) ? data : []).filter((v: VolunteerDetail) => {
          const r = (v.role || '').toLowerCase();
          return r !== 'staff' && r !== 'admin';
        });
        setVolunteers(filtered);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSavingExtraRecord(false);
    }
  };

  const recordExtraFilteredUsers = recordExtraUserSearch.trim()
    ? recordExtraUsers.filter(u => {
        const s = recordExtraUserSearch.toLowerCase();
        const name = `${u.firstName} ${u.lastName}`.toLowerCase();
        return name.includes(s) || (u.email || '').toLowerCase().includes(s);
      })
    : recordExtraUsers;

  const handleRecordExtraHoursSubmit = async () => {
    if (!recordExtraSelectedUser) {
      toast.error('Please select a user.');
      return;
    }
    const h = parseFloat(recordExtraHours);
    if (isNaN(h) || h < 0) {
      toast.error('Please enter a valid number of hours.');
      return;
    }
    setRecordExtraSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extra-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: recordExtraSelectedUser.id,
          hours: h,
          recordDate: recordExtraDate,
          reason: recordExtraReason || undefined
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to record extra hours');
      }
      toast.success('Extra hours recorded.');
      setShowRecordExtraModal(false);
      setRecordExtraSelectedUser(null);
      setRecordExtraHours('');
      setRecordExtraReason('');
      // Refetch volunteers so extra hours count updates
      const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteers/details?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (detailsRes.ok) {
        const data = await detailsRes.json();
        const filtered = (Array.isArray(data) ? data : []).filter((v: VolunteerDetail) => {
          const r = (v.role || '').toLowerCase();
          return r !== 'staff' && r !== 'admin';
        });
        setVolunteers(filtered);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to record extra hours');
    } finally {
      setRecordExtraSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Halifax'
    });
  };

  // Export to Excel handler
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteer-hours/export?month=${selectedMonth}&year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to export Excel');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `volunteer-hours-${selectedYear}-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed successfully!');
    } catch (err) {
      toast.error('Failed to export Excel.');
    }
  };

  // Helper to aggregate data by month if 'All Months' is selected
  const getDisplayData = () => {
    if (selectedMonth !== 0) return { columns, data: tableData, firstCol: 'Date' };
    // Aggregate by month
    const monthMap: { [month: number]: any } = {};
    // Initialize all months
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { Month: months[m].label };
      columns.forEach(col => {
        if (col !== 'Date') monthMap[m][col] = 0;
      });
    }
    tableData.forEach(row => {
      const d = new Date(row['Date'] as string || row['date'] as string);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      columns.forEach(col => {
        if (col !== 'Date' && typeof row[col] === 'number') {
          monthMap[m][col] += Number(row[col]);
        }
      });
    });
    // Build display data for all months
    const displayData = Object.values(monthMap);
    const newColumns = ['Month', ...columns.filter(col => col !== 'Date')];
    return { columns: newColumns, data: displayData, firstCol: 'Month' };
  };
  const { columns: displayColumns, data: displayData, firstCol } = getDisplayData();

  const toggleVolunteer = (volunteerId: number) => {
    const newExpanded = new Set(expandedVolunteers);
    if (newExpanded.has(volunteerId)) {
      newExpanded.delete(volunteerId);
    } else {
      newExpanded.add(volunteerId);
    }
    setExpandedVolunteers(newExpanded);
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Halifax'
    });
  };

  const formatTimeOnly = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Halifax'
    });
  };

  const formatShiftTimeOnly = (shift: { startTime?: string; endTime?: string; recurringShiftId?: number | null }, which: 'start' | 'end') => {
    const t = which === 'start' ? shift.startTime : shift.endTime;
    if (!t) return '';
    if (shift.recurringShiftId) return getRecurringShiftWallClockTimeDisplay(t);
    return formatTimeOnly(t);
  };

  const formatDateOnly = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Halifax'
    });
  };

  const getShiftLimit = (volunteerId: number, type: 'upcoming' | 'completed') => {
    return shiftFilters[volunteerId]?.[type] || 5; // Default to 5
  };

  const setShiftLimit = (volunteerId: number, type: 'upcoming' | 'completed', limit: number) => {
    setShiftFilters(prev => ({
      ...prev,
      [volunteerId]: {
        ...prev[volunteerId],
        [type]: limit
      }
    }));
  };

  const getFilteredShifts = (shifts: ShiftDetail[], limit: number) => {
    if (limit === -1) return shifts; // -1 means "all"
    return shifts.slice(0, limit);
  };

  // Filter volunteers based on search term
  const filteredVolunteers = volunteers.filter(volunteer => {
    const searchLower = volunteerSearchTerm.toLowerCase();
    return (
      volunteer.name.toLowerCase().includes(searchLower) ||
      volunteer.email.toLowerCase().includes(searchLower) ||
      volunteer.role.toLowerCase().includes(searchLower)
    );
  });

  return (
    <main className={styles.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div className={styles.pageTitle}>Volunteer Management</div>
          <div className={styles.pageSubtitle}>
            {activeTab === 'hours' ? 'Track volunteer hours by date and category' : 'View volunteers and their shift details'}
          </div>
        </div>
        {activeTab === 'hours' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              className={styles.select}
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{ minWidth: 130 }}
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ minWidth: 100 }}
            >
              {getYearOptions().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button className={styles.exportBtn} onClick={handleExport} type="button">
              Export to Excel
            </button>
          </div>
        )}
        {activeTab === 'volunteers' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setShowRecordExtraModal(true);
                setRecordExtraUserSearch('');
                setRecordExtraSelectedUser(null);
                setRecordExtraDate(new Date().toISOString().split('T')[0]);
                setRecordExtraHours('');
                setRecordExtraReason('');
              }}
              style={{
                padding: '8px 16px',
                background: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Record extra hours
            </button>
            <select
              className={styles.select}
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{ minWidth: 130 }}
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ minWidth: 100 }}
            >
              {getYearOptions().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'hours' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('hours')}
        >
          Volunteer Hours
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'volunteers' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('volunteers')}
        >
          Volunteer Profiles
        </button>
      </div>

      {/* Volunteer Hours Tab Content */}
      {activeTab === 'hours' && (
        <div className={styles.tableWrapper}>
          <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
            ) : error ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>{error}</div>
            ) : tableData.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>No volunteer data found.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    {displayColumns.map(col => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((row, i) => (
                    <tr key={i}>
                      {displayColumns.map((col, idx) => (
                        <td
                          key={col}
                          className={idx === displayColumns.length - 1 ? styles.totalCol : ''}
                        >
                          {col === firstCol
                            ? (firstCol === 'Month' ? row[col] : formatDate(row[col] as string))
                            : row[col] !== undefined ? row[col] : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className={styles.monthlyTotalRow} style={{ fontWeight: 700 }}>
                    {displayColumns.map((col, idx) => {
                      if (col === firstCol) return <td key={col} className={styles.totalCol}>Total</td>;
                      const total = displayData.reduce((sum, row) => sum + (typeof row[col] === 'number' ? Number(row[col]) : 0), 0);
                      return <td key={col} className={idx === displayColumns.length - 1 ? styles.totalCol : ''}>{total.toFixed(2)}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Volunteers Tab Content */}
      {activeTab === 'volunteers' && (
        <div className={styles.tableWrapper}>
          {volunteersLoading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
          ) : volunteersError ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>{volunteersError}</div>
          ) : volunteers.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>No volunteers found.</div>
          ) : (
            <>
              {/* Search Bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ position: 'relative' }}>
                  <FaSearch style={{ 
                    position: 'absolute', 
                    left: 12, 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#999',
                    fontSize: 14
                  }} />
                  <input
                    type="text"
                    placeholder="Search volunteers by name, email, or role..."
                    value={volunteerSearchTerm}
                    onChange={(e) => setVolunteerSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ff9800'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>
              </div>

              {/* Volunteers List */}
              {filteredVolunteers.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#999' }}>
                  No volunteers match your search criteria.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredVolunteers.map(volunteer => {
                const isExpanded = expandedVolunteers.has(volunteer.id);
                return (
                  <div
                    key={volunteer.id}
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#fff'
                    }}
                  >
                    {/* Volunteer Header */}
                    <div
                      onClick={() => toggleVolunteer(volunteer.id)}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isExpanded ? '#fff5ed' : '#fff',
                        transition: 'background 0.2s',
                        borderBottom: isExpanded ? '1px solid #eee' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div style={{ color: '#666', fontSize: 14 }}>
                          {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>
                            {volunteer.name}
                          </div>
                          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                            {volunteer.email} • {volunteer.role}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, color: '#888' }}>Shift Hours</div>
                          <div style={{ fontWeight: 700, fontSize: 18, color: '#ff9800' }}>
                            {volunteer.totalHours.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, color: '#888' }}>Extra Hours</div>
                          <div style={{ fontWeight: 600, fontSize: 16, color: '#2196f3' }}>
                            {(volunteer.extraHours ?? 0).toFixed(2)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, color: '#888' }}>Upcoming</div>
                          <div style={{ fontWeight: 600, fontSize: 16, color: '#4caf50' }}>
                            {volunteer.upcomingShifts.length}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, color: '#888' }}>Completed</div>
                          <div style={{ fontWeight: 600, fontSize: 16, color: '#666' }}>
                            {volunteer.completedShifts.length}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={{ padding: '20px', background: '#fff' }}>
                        {/* Upcoming Shifts */}
                        {volunteer.upcomingShifts.length > 0 && (
                          <div style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <div style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>
                                Upcoming Shifts ({volunteer.upcomingShifts.length})
                              </div>
                              <select
                                className={styles.select}
                                value={getShiftLimit(volunteer.id, 'upcoming')}
                                onChange={e => setShiftLimit(volunteer.id, 'upcoming', Number(e.target.value))}
                                onClick={e => e.stopPropagation()}
                                style={{ minWidth: 100, fontSize: 13, padding: '4px 8px' }}
                              >
                                <option value={5}>Top 5</option>
                                <option value={10}>Top 10</option>
                                <option value={-1}>All</option>
                              </select>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                  <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Date</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Category</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Time</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Status</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {getFilteredShifts(volunteer.upcomingShifts, getShiftLimit(volunteer.id, 'upcoming')).map(shift => (
                                    <tr key={`${shift.id}-${shift.startTime}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                      <td style={{ padding: '10px' }}>{formatDateOnly(shift.startTime)}</td>
                                      <td style={{ padding: '10px' }}>{shift.category}</td>
                                      <td style={{ padding: '10px' }}>
                                        {formatShiftTimeOnly(shift, 'start')} - {formatShiftTimeOnly(shift, 'end')}
                                      </td>
                                      <td style={{ padding: '10px' }}>
                                        <span style={{
                                          padding: '4px 8px',
                                          borderRadius: 4,
                                          background: shift.status === 'Registered' ? '#e3f2fd' : shift.status === 'Default' ? '#e8f5e9' : '#fff3e0',
                                          color: shift.status === 'Registered' ? '#1976d2' : shift.status === 'Default' ? '#2e7d32' : '#f57c00',
                                          fontSize: 12,
                                          fontWeight: 500
                                        }}>
                                          {shift.status}
                                        </span>
                                      </td>
                                      <td style={{ padding: '10px' }}>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleCancelShift(volunteer.id, shift); }}
                                          disabled={cancellingShiftKey === `${volunteer.id}-${shift.startTime}`}
                                          style={{
                                            padding: '4px 10px',
                                            fontSize: 12,
                                            border: '1px solid #d32f2f',
                                            background: '#fff',
                                            color: '#d32f2f',
                                            borderRadius: 4,
                                            cursor: cancellingShiftKey === `${volunteer.id}-${shift.startTime}` ? 'not-allowed' : 'pointer',
                                            opacity: cancellingShiftKey === `${volunteer.id}-${shift.startTime}` ? 0.7 : 1
                                          }}
                                        >
                                          {cancellingShiftKey === `${volunteer.id}-${shift.startTime}` ? 'Cancelling…' : 'Remove / Cancel shift'}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Completed Shifts */}
                        {volunteer.completedShifts.length > 0 && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <div style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>
                                Completed Shifts ({volunteer.completedShifts.length})
                              </div>
                              <select
                                className={styles.select}
                                value={getShiftLimit(volunteer.id, 'completed')}
                                onChange={e => setShiftLimit(volunteer.id, 'completed', Number(e.target.value))}
                                onClick={e => e.stopPropagation()}
                                style={{ minWidth: 100, fontSize: 13, padding: '4px 8px' }}
                              >
                                <option value={5}>Top 5</option>
                                <option value={10}>Top 10</option>
                                <option value={-1}>All</option>
                              </select>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                  <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Date</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Category</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Time</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Check In/Out</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Hours</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {getFilteredShifts(volunteer.completedShifts, getShiftLimit(volunteer.id, 'completed')).map(shift => (
                                    <tr key={shift.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                      <td style={{ padding: '10px' }}>{formatDateOnly(shift.startTime)}</td>
                                      <td style={{ padding: '10px' }}>{shift.category}</td>
                                      <td style={{ padding: '10px' }}>
                                        {formatShiftTimeOnly(shift, 'start')} - {formatShiftTimeOnly(shift, 'end')}
                                      </td>
                                      <td style={{ padding: '10px', fontSize: 12 }}>
                                        {shift.checkIn ? (
                                          <div>
                                            <div>In: {formatTimeOnly(shift.checkIn)}</div>
                                            {shift.checkOut ? (
                                              <div>Out: {formatTimeOnly(shift.checkOut)}</div>
                                            ) : shift.autoCheckout ? (
                                              <div style={{ color: '#f57c00' }}>Out: {formatShiftTimeOnly(shift, 'end')} (Auto)</div>
                                            ) : null}
                                          </div>
                                        ) : (
                                          <span style={{ color: '#999' }}>No check-in</span>
                                        )}
                                      </td>
                                      <td style={{ padding: '10px', fontWeight: 600 }}>
                                        {shift.hours > 0 ? `${shift.hours.toFixed(2)}h` : '-'}
                                      </td>
                                      <td style={{ padding: '10px' }}>
                                        <span style={{
                                          padding: '4px 8px',
                                          borderRadius: 4,
                                          background: shift.status === 'Completed' ? '#e8f5e9' : shift.status === 'Auto Checkout' ? '#fff3e0' : shift.status === 'Missed' ? '#ffebee' : '#fff3e0',
                                          color: shift.status === 'Completed' ? '#2e7d32' : shift.status === 'Auto Checkout' ? '#f57c00' : shift.status === 'Missed' ? '#c62828' : '#f57c00',
                                          fontSize: 12,
                                          fontWeight: 500
                                        }}>
                                          {shift.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Extra Hours (recorded) - same expanded area */}
                        <div style={{ marginTop: 24 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: '#222', marginBottom: 12 }}>
                            Extra Hours (recorded)
                          </div>
                          {(() => {
                            const key = extraHoursCacheKey(volunteer.id);
                            const { loading, records } = extraHoursRecordsMap[key] || { loading: true, records: [] };
                            if (loading) {
                              return <div style={{ padding: '12px 0', fontSize: 14, color: '#888' }}>Loading...</div>;
                            }
                            if (records.length === 0) {
                              return <div style={{ padding: '12px 0', fontSize: 14, color: '#999' }}>No extra hours recorded for this period.</div>;
                            }
                            return (
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                  <thead>
                                    <tr style={{ background: '#f5f5f5' }}>
                                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Date</th>
                                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Hours</th>
                                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #eee' }}>Reason</th>
                                      <th style={{ padding: '10px', width: 80 }}></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {records.map(r => {
                                      const isEditing = editingExtraRecord?.recordId === r.id;
                                      const recordDateStr = typeof r.recordDate === 'string' ? r.recordDate.split('T')[0] : new Date(r.recordDate).toISOString().split('T')[0];
                                      return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                          <td style={{ padding: '10px' }}>
                                            {isEditing ? (
                                              <input
                                                type="date"
                                                value={editingExtraRecord!.recordDate}
                                                onChange={e => setEditingExtraRecord(prev => prev ? { ...prev, recordDate: e.target.value } : null)}
                                                style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}
                                              />
                                            ) : (
                                              new Date(r.recordDate).toLocaleDateString('en-CA', { timeZone: 'America/Halifax', year: 'numeric', month: 'short', day: 'numeric' })
                                            )}
                                          </td>
                                          <td style={{ padding: isEditing ? '8px' : '10px' }}>
                                            {isEditing ? (
                                              <input
                                                type="number"
                                                min={0}
                                                step={0.25}
                                                value={editingExtraRecord!.hours}
                                                onChange={e => setEditingExtraRecord(prev => prev ? { ...prev, hours: e.target.value } : null)}
                                                style={{ width: 80, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6 }}
                                              />
                                            ) : (
                                              <span style={{ fontWeight: 500 }}>{Number(r.hours).toFixed(2)}</span>
                                            )}
                                          </td>
                                          <td style={{ padding: isEditing ? '8px' : '10px' }}>
                                            {isEditing ? (
                                              <input
                                                type="text"
                                                value={editingExtraRecord!.reason}
                                                onChange={e => setEditingExtraRecord(prev => prev ? { ...prev, reason: e.target.value } : null)}
                                                placeholder="Reason"
                                                style={{ width: '100%', minWidth: 120, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6 }}
                                              />
                                            ) : (
                                              <span style={{ color: '#666' }}>{r.reason || '—'}</span>
                                            )}
                                          </td>
                                          <td style={{ padding: '10px' }}>
                                            {isEditing ? (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={handleSaveExtraHoursEdit}
                                                  disabled={savingExtraRecord}
                                                  style={{ marginRight: 6, padding: '4px 8px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 6, cursor: savingExtraRecord ? 'not-allowed' : 'pointer', fontSize: 12 }}
                                                >
                                                  <FaSave style={{ verticalAlign: 'middle' }} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingExtraRecord(null)}
                                                  disabled={savingExtraRecord}
                                                  style={{ padding: '4px 8px', background: '#999', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                                                >
                                                  <FaTimes style={{ verticalAlign: 'middle' }} />
                                                </button>
                                              </>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => setEditingExtraRecord({
                                                  volunteerId: volunteer.id,
                                                  recordId: r.id,
                                                  hours: String(r.hours),
                                                  reason: r.reason || '',
                                                  recordDate: recordDateStr
                                                })}
                                                style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                                                title="Edit"
                                              >
                                                <FaEdit style={{ verticalAlign: 'middle', color: '#2196f3' }} />
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </div>

                        {volunteer.upcomingShifts.length === 0 && volunteer.completedShifts.length === 0 && (
                          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                            No shifts found for this volunteer.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Record extra hours modal */}
      {showRecordExtraModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => !recordExtraSubmitting && setShowRecordExtraModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Record extra hours</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#333' }}>Search user</label>
              <input
                type="text"
                placeholder="Type name or email..."
                value={recordExtraUserSearch}
                onChange={e => setRecordExtraUserSearch(e.target.value)}
                onFocus={() => setRecordExtraSelectedUser(null)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
              {recordExtraUsersLoading ? (
                <div style={{ padding: '8px 0', fontSize: 13, color: '#888' }}>Loading users...</div>
              ) : (
                <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 4, border: '1px solid #eee', borderRadius: 8 }}>
                  {recordExtraFilteredUsers.slice(0, 50).map(u => {
                    const name = `${u.firstName} ${u.lastName}`.trim() || u.email;
                    const isSelected = recordExtraSelectedUser?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setRecordExtraSelectedUser({ id: u.id, name });
                          setRecordExtraUserSearch(name);
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          background: isSelected ? '#fff5ed' : '#fff',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: 14
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{name}</span>
                        {u.email && <span style={{ color: '#888', marginLeft: 8, fontSize: 13 }}>{u.email}</span>}
                      </div>
                    );
                  })}
                  {recordExtraFilteredUsers.length === 0 && (
                    <div style={{ padding: 12, color: '#888', fontSize: 13 }}>No users match.</div>
                  )}
                </div>
              )}
              {recordExtraSelectedUser && (
                <div style={{ marginTop: 6, fontSize: 13, color: '#2196f3' }}>Selected: {recordExtraSelectedUser.name}</div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#333' }}>Date</label>
              <input
                type="date"
                value={recordExtraDate}
                onChange={e => setRecordExtraDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#333' }}>Hours</label>
              <input
                type="number"
                min={0}
                step={0.25}
                placeholder="e.g. 1"
                value={recordExtraHours}
                onChange={e => setRecordExtraHours(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#333' }}>Reason (optional)</label>
              <input
                type="text"
                placeholder="e.g. Snow day"
                value={recordExtraReason}
                onChange={e => setRecordExtraReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => !recordExtraSubmitting && setShowRecordExtraModal(false)}
                disabled={recordExtraSubmitting}
                style={{
                  padding: '10px 18px',
                  border: '1px solid #ddd',
                  background: '#fff',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: recordExtraSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordExtraHoursSubmit}
                disabled={recordExtraSubmitting || !recordExtraSelectedUser || !recordExtraDate || !recordExtraHours?.trim()}
                style={{
                  padding: '10px 18px',
                  background: '#2196f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: recordExtraSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: 14
                }}
              >
                {recordExtraSubmitting ? 'Recording...' : 'Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 