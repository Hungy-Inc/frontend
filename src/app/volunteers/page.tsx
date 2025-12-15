'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaChevronDown, FaChevronRight, FaSearch } from 'react-icons/fa';
import { useVolunteerHours, useVolunteerDetails, useExportVolunteerHours } from '@/hooks/queries/useVolunteers';
import { formatDate, formatDateOnly, formatTimeOnly } from '@/utils/formatUtils';

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
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Hooks
  const {
    data: hoursData,
    isLoading: loadingHours,
    error: errorHours
  } = useVolunteerHours(selectedMonth, selectedYear);

  const {
    data: volunteersData,
    isLoading: loadingVolunteers,
    error: errorVolunteers
  } = useVolunteerDetails(selectedMonth, selectedYear);

  const exportMutation = useExportVolunteerHours();

  // Local state for UI interactions
  const [expandedVolunteers, setExpandedVolunteers] = useState<Set<number>>(new Set());
  const [shiftFilters, setShiftFilters] = useState<{ [volunteerId: number]: { upcoming: number; completed: number } }>({});
  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState('');

  // Derived data
  const columns = hoursData?.columns || [];
  const tableData = hoursData?.tableData || [];

  const volunteers = React.useMemo(() => {
    if (!volunteersData) return [];
    return volunteersData.filter((volunteer: VolunteerDetail) => {
      const role = (volunteer.role || '').toLowerCase().trim();
      return role !== 'staff' && role !== 'admin';
    });
  }, [volunteersData]);

  // Export to Excel handler
  const handleExport = () => {
    exportMutation.mutate(
      { month: selectedMonth, year: selectedYear },
      {
        onSuccess: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `volunteer-hours-${selectedYear}-${selectedMonth}.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          toast.success('Export completed successfully!');
        },
        onError: () => {
          toast.error('Failed to export Excel.');
        }
      }
    );
  };

  // Helper to aggregate data by month if 'All Months' is selected
  const { columns: displayColumns, data: displayData, firstCol } = React.useMemo(() => {
    if (selectedMonth !== 0) return { columns, data: tableData, firstCol: 'Date' };

    // Aggregate by month
    const monthMap: { [month: number]: any } = {};
    // Initialize all months
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { Month: months[m].label };
      columns.forEach((col: string) => {
        if (col !== 'Date') monthMap[m][col] = 0;
      });
    }

    tableData.forEach((row: VolunteerRow) => {
      const d = new Date(row['Date'] as string || row['date'] as string);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      columns.forEach((col: string) => {
        if (col !== 'Date' && typeof row[col] === 'number') {
          monthMap[m][col] += Number(row[col]);
        }
      });
    });

    // Build display data for all months
    const displayData = Object.values(monthMap);
    const newColumns = ['Month', ...columns.filter((col: string) => col !== 'Date')];
    return { columns: newColumns, data: displayData, firstCol: 'Month' };
  }, [selectedMonth, columns, tableData]);

  const toggleVolunteer = (volunteerId: number) => {
    const newExpanded = new Set(expandedVolunteers);
    if (newExpanded.has(volunteerId)) {
      newExpanded.delete(volunteerId);
    } else {
      newExpanded.add(volunteerId);
    }
    setExpandedVolunteers(newExpanded);
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
  const filteredVolunteers = React.useMemo(() => volunteers.filter((volunteer: VolunteerDetail) => {
    const searchLower = volunteerSearchTerm.toLowerCase();
    return (
      volunteer.name.toLowerCase().includes(searchLower) ||
      volunteer.email.toLowerCase().includes(searchLower) ||
      volunteer.role.toLowerCase().includes(searchLower)
    );
  }), [volunteers, volunteerSearchTerm]);

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
            <button
              className={styles.exportBtn}
              onClick={handleExport}
              type="button"
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>
        )}
        {activeTab === 'volunteers' && (
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
            {loadingHours ? (
              <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
            ) : errorHours ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>Failed to load volunteer hours.</div>
            ) : tableData.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>No volunteer data found.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    {displayColumns.map((col: string) => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((row: any, i: number) => (
                    <tr key={i}>
                      {displayColumns.map((col: string, idx: number) => (
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
                    {displayColumns.map((col: string, idx: number) => {
                      if (col === firstCol) return <td key={col} className={styles.totalCol}>Total Hours</td>;
                      const total = displayData.reduce((sum: number, row: any) => sum + (typeof row[col] === 'number' ? Number(row[col]) : 0), 0);
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
          {loadingVolunteers ? (
            <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
          ) : errorVolunteers ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>Failed to load volunteers.</div>
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
                  {filteredVolunteers.map((volunteer: VolunteerDetail) => {
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
            </>
          )}
        </div>
      )}
    </main>
  );
}
