'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

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
  upcomingShifts: ShiftDetail[];
  completedShifts: ShiftDetail[];
};

type ShiftDetail = {
  id: number;
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
          setColumns(data.columns);
          setTableData(data.tableData);
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
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteers/details`, {
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
  }, [activeTab]);

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
          Volunteers
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
                  {/* Total hours row */}
                  <tr className={styles.monthlyTotalRow} style={{ fontWeight: 700 }}>
                    {displayColumns.map((col, idx) => {
                      if (col === firstCol) return <td key={col} className={styles.totalCol}>Total Hours</td>;
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {volunteers.map(volunteer => {
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
                          <div style={{ fontSize: 13, color: '#888' }}>Total Hours</div>
                          <div style={{ fontWeight: 700, fontSize: 18, color: '#ff9800' }}>
                            {volunteer.totalHours.toFixed(2)}
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
                                  </tr>
                                </thead>
                                <tbody>
                                  {getFilteredShifts(volunteer.upcomingShifts, getShiftLimit(volunteer.id, 'upcoming')).map(shift => (
                                    <tr key={shift.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                      <td style={{ padding: '10px' }}>{formatDateOnly(shift.startTime)}</td>
                                      <td style={{ padding: '10px' }}>{shift.category}</td>
                                      <td style={{ padding: '10px' }}>
                                        {formatTimeOnly(shift.startTime)} - {formatTimeOnly(shift.endTime)}
                                      </td>
                                      <td style={{ padding: '10px' }}>
                                        <span style={{
                                          padding: '4px 8px',
                                          borderRadius: 4,
                                          background: shift.status === 'Registered' ? '#e3f2fd' : '#fff3e0',
                                          color: shift.status === 'Registered' ? '#1976d2' : '#f57c00',
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
                                        {formatTimeOnly(shift.startTime)} - {formatTimeOnly(shift.endTime)}
                                      </td>
                                      <td style={{ padding: '10px', fontSize: 12 }}>
                                        {shift.checkIn ? (
                                          <div>
                                            <div>In: {formatTimeOnly(shift.checkIn)}</div>
                                            {shift.checkOut ? (
                                              <div>Out: {formatTimeOnly(shift.checkOut)}</div>
                                            ) : shift.autoCheckout ? (
                                              <div style={{ color: '#f57c00' }}>Out: {formatTimeOnly(shift.endTime)} (Auto)</div>
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
        </div>
      )}
    </main>
  );
} 