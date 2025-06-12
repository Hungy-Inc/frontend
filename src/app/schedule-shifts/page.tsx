"use client";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { MultiSelect } from "react-multi-select-component";
import { toast } from 'react-toastify';
import type { ToastContainerProps } from 'react-toastify';

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export default function ScheduleShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<number>(0);
  const [bookedUserIds, setBookedUserIds] = useState<number[]>([]);

  // Add modal state
  const [addData, setAddData] = useState<any>({ userIds: [], shiftCategoryId: '', startTime: '', endTime: '', location: '', slots: 1 });
  const [users, setUsers] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

  // Edit modal state
  const [editId, setEditId] = useState<number|null>(null);
  const [editData, setEditData] = useState<any>({ userId: null, shiftId: null });
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);

  const [recurringShifts, setRecurringShifts] = useState<any[]>([]);
  const [addDayOfWeek, setAddDayOfWeek] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [addDate, setAddDate] = useState<string>("");

  // Add state for editing signup
  const [editSignupId, setEditSignupId] = useState<number|null>(null);
  const [editSignupUserId, setEditSignupUserId] = useState<number|null>(null);

  // Add state to track which shift row is being edited and the edited userIds
  const [editShiftId, setEditShiftId] = useState<number|null>(null);
  const [editSignupUserIds, setEditSignupUserIds] = useState<{[signupId: string]: number}>({});

  const [showCategoryWarning, setShowCategoryWarning] = useState(false);
  const [showRecurringWarning, setShowRecurringWarning] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  // Fetch users on page load
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Ensure we have the correct user data structure
      const formattedUsers = data.map((user: any) => ({
        ...user,
        name: `${user.firstName} ${user.lastName}`.trim()
      }));
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  // Fetch categories for dropdown (existing code, but also for add modal)
  useEffect(() => {
    if (showAdd) fetchCategories();
  }, [showAdd]);
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategoryOptions(data);
    } catch {
      setCategoryOptions([]);
    }
  };

  const fetchShifts = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch shifts");
      const data = await res.json();
      console.log('Raw shifts data:', data); // Debug log for raw data
      setShifts(data);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError("Failed to load shifts.");
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recurring shifts for add modal
  useEffect(() => {
    if (showAdd) fetchRecurringShifts();
  }, [showAdd]);
  const fetchRecurringShifts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecurringShifts(data);
    } catch {
      setRecurringShifts([]);
    }
  };

  // Fetch categories and recurring shifts on page load
  useEffect(() => {
    fetchCategories();
    fetchRecurringShifts();
  }, []);

  // Find all recurring shifts for selected category and day
  const matchingSlots = recurringShifts.filter(
    (r) =>
      String(r.shiftCategoryId) === addData.shiftCategoryId &&
      String(r.dayOfWeek) === addDayOfWeek
  );

  // When selectedSlotId changes, set start/end, location, and slots from that slot
  useEffect(() => {
    if (selectedSlotId) {
      const slot = matchingSlots.find(s => String(s.id) === selectedSlotId);
      if (slot) {
        setAddData((d: any) => ({
          ...d,
          startTime: slot.startTime.slice(0, 16),
          endTime: slot.endTime.slice(0, 16),
          location: slot.location,
          slots: slot.slots
        }));
      }
    }
  }, [selectedSlotId]);

  // Reset selectedSlotId if category or day changes
  useEffect(() => {
    setSelectedSlotId("");
  }, [addData.shiftCategoryId, addDayOfWeek]);

  // Update available slots when category or recurring shift is selected
  useEffect(() => {
    if (addData.shiftCategoryId && addData.recurringShiftId) {
      const rec = recurringShifts.find(r => String(r.id) === addData.recurringShiftId);
      if (rec) {
        // Calculate next occurrence date
        const today = new Date();
        const dayDiff = (rec.dayOfWeek - today.getDay() + 7) % 7 || 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + dayDiff);
        const start = new Date(nextDate);
        start.setHours(new Date(rec.startTime).getHours(), new Date(rec.startTime).getMinutes(), 0, 0);
        const end = new Date(nextDate);
        end.setHours(new Date(rec.endTime).getHours(), new Date(rec.endTime).getMinutes(), 0, 0);

        // Find all existing shifts for this category and recurring shift pattern
        const existingShifts = shifts.filter(shift => {
          const shiftStart = new Date(shift.startTime);
          const shiftEnd = new Date(shift.endTime);
          return (
            String(shift.shiftCategoryId) === String(addData.shiftCategoryId) &&
            shiftStart.getTime() === start.getTime() &&
            shiftEnd.getTime() === end.getTime() &&
            shift.location === rec.location
          );
        });

        // Get all booked user IDs from existing shifts
        const bookedIds = existingShifts.flatMap(shift => 
          (shift.ShiftSignup || []).map((signup: any) => signup.userId)
        );

        // Remove duplicates
        const uniqueBookedIds = [...new Set(bookedIds)];
        setBookedUserIds(uniqueBookedIds);

        // Calculate available slots
        const totalBookedSlots = uniqueBookedIds.length;
        const remainingSlots = Math.max(0, rec.slots - totalBookedSlots);
        setAvailableSlots(remainingSlots);

        // If we have selected more users than available slots, trim the selection
        if (addData.userIds.length > remainingSlots) {
          setAddData((prev: { userIds: number[] }) => ({
            ...prev,
            userIds: prev.userIds.slice(0, remainingSlots)
          }));
        }

        // Show warning if there are already booked users
        if (uniqueBookedIds.length > 0) {
          const bookedUserNames = uniqueBookedIds.map(userId => {
            const user = users.find(u => u.id === userId);
            return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
          });
          toast.info(`${uniqueBookedIds.length} user${uniqueBookedIds.length !== 1 ? 's' : ''} already booked for ${start.toLocaleDateString()}: ${bookedUserNames.join(', ')}`);
        }
      }
    } else {
      setAvailableSlots(0);
      setBookedUserIds([]);
    }
  }, [addData.shiftCategoryId, addData.recurringShiftId, recurringShifts, shifts, users]);

  // Filter out already booked users and limit selection based on available slots
  const availableUsers = users.filter(user => !bookedUserIds.includes(user.id));

  // Edit handlers
  const handleEdit = (shift: any) => {
    setEditId(shift.id);
    setEditData({
      userId: shift.ShiftSignup?.[0]?.userId || null,
      shiftId: shift.id
    });
    setEditError("");
  };

  // Update handleEditSave to use editSignupUserIds
  const handleEditSave = async (signupId: number) => {
    setEditing(true);
    try {
      const token = localStorage.getItem("token");
      const userId = editSignupUserIds[signupId];
      const signupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      if (!signupRes.ok) {
        const errorData = await signupRes.json();
        throw new Error(errorData.error || 'Failed to update shift signup');
      }
      setEditShiftId(null);
      setEditSignupUserIds({});
      fetchShifts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update shift signup');
    } finally {
      setEditing(false);
    }
  };

  // Delete handler
  const handleDelete = async (shift: any) => {
    if (!window.confirm(`Delete shift "${shift.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      
      // Get the shiftsignup ID from the shift data
      const signupId = shift.ShiftSignup?.[0]?.id;
      if (!signupId) {
        throw new Error('Shift signup not found');
      }

      // Delete from shiftsignup table first
      const signupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!signupRes.ok) {
        const errorData = await signupRes.json();
        throw new Error(errorData.error || 'Failed to delete shift signup');
      }

      // Then delete from shift table
      const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${shift.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!shiftRes.ok) {
        const errorData = await shiftRes.json();
        throw new Error(errorData.error || 'Failed to delete shift');
      }

      fetchShifts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete shift');
    }
  };

  const options = users.map(u => ({
    label: u.name,
    value: u.id
  }));

  // Update the Schedule Shift button click handler
  const handleScheduleShift = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const rec = recurringShifts.find(r => String(r.id) === addData.recurringShiftId);
      if (!rec) {
        throw new Error('Recurring shift not found');
      }

      // Calculate next occurrence date
      const today = new Date();
      const dayDiff = (rec.dayOfWeek - today.getDay() + 7) % 7 || 7;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + dayDiff);
      const start = new Date(nextDate);
      start.setHours(new Date(rec.startTime).getHours(), new Date(rec.startTime).getMinutes(), 0, 0);
      const end = new Date(nextDate);
      end.setHours(new Date(rec.endTime).getHours(), new Date(rec.endTime).getMinutes(), 0, 0);

      // Verify no duplicate shifts exist for these users
      const existingShifts = shifts.filter(shift => 
        shift.shiftCategoryId === rec.shiftCategoryId &&
        new Date(shift.startTime).getTime() === start.getTime() &&
        new Date(shift.endTime).getTime() === end.getTime() &&
        shift.location === rec.location
      );

      const existingUserIds = existingShifts.flatMap(shift => 
        (shift.ShiftSignup || []).map((signup: any) => signup.userId)
      );

      // Check for duplicate users
      const duplicateUsers = addData.userIds.filter((userId: number) => existingUserIds.includes(userId));
      if (duplicateUsers.length > 0) {
        const duplicateUserNames = duplicateUsers.map((userId: number) => {
          const user = users.find(u => u.id === userId);
          return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
        });
        throw new Error(`The following users are already booked for this shift: ${duplicateUserNames.join(', ')}`);
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each user individually
      for (const userId of addData.userIds) {
        try {
          // 1. Create the shift for this user
          const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              name: rec.name,
              shiftCategoryId: rec.shiftCategoryId,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              location: rec.location,
              slots: rec.slots,
              userId: userId
            })
          });

          if (!shiftRes.ok) {
            const errorData = await shiftRes.json();
            throw new Error(errorData.error || 'Failed to create shift');
          }

          const shiftData = await shiftRes.json();

          // 2. Create the shift signup for this user
          const signupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: userId,
              shiftId: shiftData.id,
              checkIn: start.toISOString(),
              checkOut: end.toISOString(),
              mealsServed: 0
            })
          });

          if (!signupRes.ok) {
            const errorData = await signupRes.json();
            throw new Error(errorData.error || 'Failed to create shift signup');
          }

          successCount++;
          const userName = users.find(u => u.id === userId);
          toast.success(`Successfully scheduled shift for ${userName ? `${userName.firstName} ${userName.lastName}` : 'user'}`);
        } catch (err: any) {
          errorCount++;
          const userName = users.find(u => u.id === userId);
          toast.error(`Failed to schedule shift for ${userName ? `${userName.firstName} ${userName.lastName}` : 'user'}: ${err.message}`);
        }
      }

      if (successCount > 0) {
        // Reset form and refresh data
        setAddData({ userIds: [], shiftCategoryId: '', recurringShiftId: '' });
        await fetchShifts();
      }

      if (errorCount > 0) {
        toast.warning(`${errorCount} out of ${addData.userIds.length} shifts failed to schedule`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule shift');
      toast.error(err.message || 'Failed to schedule shift');
    } finally {
      setLoading(false);
    }
  };

  // Save all user assignments for a shift row
  const handleEditSaveAll = async (shift: any) => {
    setEditing(true);
    try {
      const token = localStorage.getItem("token");
      const updates = Object.entries(editSignupUserIds).map(async ([signupId, userId]) => {
        const signup = shift.ShiftSignup.find((s: any) => s.id === Number(signupId));
        if (signup && signup.userId !== userId) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signupId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to update shift signup');
          }
        }
      });
      await Promise.all(updates);
      setEditShiftId(null);
      setEditSignupUserIds({});
      fetchShifts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update shift signups');
    } finally {
      setEditing(false);
    }
  };

  // Cancel editing for a row
  const handleEditCancel = () => {
    setEditShiftId(null);
    setEditSignupUserIds({});
  };

  return (
    <main style={{ padding: 32 }}>
      <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Schedule Shifts</div>
      
      {/* Schedule a Shift Section */}
      <div style={{ background: '#f9f9f9', borderRadius: 10, padding: 24, marginBottom: 32 }}>
        <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>Schedule a Shift</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 16 }}>
          {/* Shift Category Dropdown */}
          <div style={{ minWidth: 220 }}>
            <select
              value={addData.shiftCategoryId}
              onChange={e => {
                setAddData((d: any) => ({ 
                  ...d, 
                  shiftCategoryId: e.target.value,
                  recurringShiftId: '', // Clear recurring shift when category changes
                  userIds: [] // Clear user selection when category changes
                }));
              }}
              style={{ 
                padding: 8, 
                borderRadius: 5, 
                border: '1px solid #eee', 
                width: '100%',
                background: 'white',
                cursor: 'pointer',
                height: 38
              }}
            >
              <option value="">Select Category</option>
              {categoryOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.icon ? `${opt.icon} ` : ''}{opt.name}</option>)}
            </select>
          </div>

          {/* Recurring Shift Dropdown */}
          <div style={{ minWidth: 220 }}>
            <select
              value={addData.recurringShiftId || ''}
              onChange={e => {
                if (!addData.shiftCategoryId) {
                  setShowCategoryWarning(true);
                  setTimeout(() => setShowCategoryWarning(false), 2000);
                  // Prevent selection and clear value
                  setAddData((d: any) => ({ ...d, recurringShiftId: '' }));
                  return;
                }
                setAddData((d: any) => ({ 
                  ...d, 
                  recurringShiftId: e.target.value,
                  userIds: [] // Clear user selection when recurring shift changes
                }));
              }}
              style={{ 
                padding: 8, 
                borderRadius: 5, 
                border: '1px solid #eee', 
                width: '100%',
                background: !addData.shiftCategoryId ? '#f5f5f5' : 'white',
                cursor: !addData.shiftCategoryId ? 'not-allowed' : 'pointer',
                color: !addData.shiftCategoryId ? '#888' : 'inherit',
                height: 38
              }}
              disabled={!addData.shiftCategoryId}
              onClick={() => {
                if (!addData.shiftCategoryId) {
                  setShowCategoryWarning(true);
                  setTimeout(() => setShowCategoryWarning(false), 2000);
                }
              }}
            >
              <option value="">Select Recurring Shift</option>
              {recurringShifts
                .filter(r => String(r.shiftCategoryId) === String(addData.shiftCategoryId))
                .map(opt => {
                  // Calculate next occurrence date for this shift
                  const today = new Date();
                  const dayDiff = (opt.dayOfWeek - today.getDay() + 7) % 7 || 7;
                  const nextDate = new Date(today);
                  nextDate.setDate(today.getDate() + dayDiff);
                  const start = new Date(nextDate);
                  start.setHours(new Date(opt.startTime).getHours(), new Date(opt.startTime).getMinutes(), 0, 0);
                  const end = new Date(nextDate);
                  end.setHours(new Date(opt.endTime).getHours(), new Date(opt.endTime).getMinutes(), 0, 0);

                  // Find existing shifts for this category and specific date
                  const existingShifts = shifts.filter(shift => {
                    const shiftStart = new Date(shift.startTime);
                    const shiftEnd = new Date(shift.endTime);
                    return (
                      String(shift.shiftCategoryId) === String(addData.shiftCategoryId) &&
                      shiftStart.getTime() === start.getTime() &&
                      shiftEnd.getTime() === end.getTime() &&
                      shift.location === opt.location
                    );
                  });

                  const bookedCount = existingShifts.reduce((count, shift) => 
                    count + (shift.ShiftSignup?.length || 0), 0
                  );

                  return (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({daysOfWeek[opt.dayOfWeek]}, {new Date(opt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      {bookedCount > 0 ? ` (${bookedCount}/${opt.slots} booked for ${start.toLocaleDateString()})` : ''}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Multi-select Users with slot limit */}
          <div
            {...(!addData.shiftCategoryId || !addData.recurringShiftId || availableSlots === 0
              ? { style: { width: '100%', pointerEvents: 'none', opacity: 0.7 } }
              : { style: { width: '100%' } })}
          >
            <style>
              {`
                .rmsc {
                  --rmsc-main: #f5f5f5;
                  --rmsc-hover: #f5f5f5;
                  --rmsc-selected: #f5f5f5;
                  --rmsc-border: #eee;
                  --rmsc-gray: #888;
                  --rmsc-bg: white;
                  --rmsc-p: 8px;
                  --rmsc-radius: 5px;
                  --rmsc-h: 38px;
                }
                .rmsc[aria-disabled='true'],
                .rmsc.disabled,
                .rmsc[aria-disabled='true'] .dropdown-container,
                .rmsc.disabled .dropdown-container {
                  background: #f5f5f5 !important;
                  color: #888 !important;
                  border: 1px solid #eee !important;
                  cursor: not-allowed !important;
                  opacity: 1 !important;
                }
                .rmsc[aria-disabled='true'] .dropdown-heading,
                .rmsc.disabled .dropdown-heading {
                  color: #888 !important;
                }
              `}
            </style>
            <div
              style={{ width: '100%' }}
            >
              <MultiSelect
                options={availableUsers.map((u: any) => ({ 
                  label: `${u.firstName} ${u.lastName}`, 
                  value: u.id 
                }))}
                value={users.filter((u: any) => addData.userIds?.includes(u.id)).map((u: any) => ({ 
                  label: `${u.firstName} ${u.lastName}`, 
                  value: u.id 
                }))}
                onChange={(selected: any[]) => {
                  // Limit selection to available slots
                  if (selected.length <= availableSlots) {
                    setAddData((d: any) => ({ 
                      ...d, 
                      userIds: selected.map((opt: any) => opt.value) 
                    }));
                  }
                }}
                labelledBy="Select Users"
                disabled={!addData.shiftCategoryId || !addData.recurringShiftId || availableSlots === 0}
                hasSelectAll={false}
                overrideStrings={{
                  selectSomeItems: availableSlots === 0 ? "No slots available" : `Select Users (${availableSlots} slot${availableSlots !== 1 ? 's' : ''} available)...`,
                  allItemsAreSelected: "All Available Users Selected",
                  selectAll: "Select All",
                  search: "Search Users"
                }}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              {availableSlots > 0 && (
                <div style={{ fontSize: 12, color: '#666' }}>
                  {availableSlots} slot{availableSlots !== 1 ? 's' : ''} available
                  {bookedUserIds.length > 0 && (
                    <span style={{ marginLeft: 8, color: '#888' }}>
                      ({bookedUserIds.length} user{bookedUserIds.length !== 1 ? 's' : ''} already booked)
                    </span>
                  )}
                </div>
              )}
              {availableSlots === 0 && addData.recurringShiftId && (
                <div style={{ fontSize: 12, color: '#e53935' }}>
                  No slots available for this shift
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Occurrence Display */}
        {addData.recurringShiftId && availableSlots > 0 && (() => {
          const rec = recurringShifts.find(r => String(r.id) === addData.recurringShiftId);
          if (!rec) return null;
          // Calculate next occurrence date
          const today = new Date();
          const dayDiff = (rec.dayOfWeek - today.getDay() + 7) % 7 || 7;
          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() + dayDiff);
          const start = new Date(nextDate);
          start.setHours(new Date(rec.startTime).getHours(), new Date(rec.startTime).getMinutes(), 0, 0);
          const end = new Date(nextDate);
          end.setHours(new Date(rec.endTime).getHours(), new Date(rec.endTime).getMinutes(), 0, 0);
          return (
            <div style={{ marginBottom: 12, color: '#444' }}>
              <b>Next Occurrence:</b> {daysOfWeek[rec.dayOfWeek]}, {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          );
        })()}

        {/* Schedule Button */}
        {showCategoryWarning && (
          <div style={{ color: '#e53935', fontWeight: 500, marginBottom: 8, fontSize: 15 }}>
            Please select a category first.
          </div>
        )}
        {showRecurringWarning && (
          <div style={{ color: '#e53935', fontWeight: 500, marginBottom: 8, fontSize: 15 }}>
            Please select a recurring shift first.
          </div>
        )}
        <button
          style={{ 
            background: (!addData.shiftCategoryId || !addData.recurringShiftId || !addData.userIds?.length || availableSlots === 0) ? '#ccc' : '#ff9800', 
            color: '#fff', 
            fontWeight: 700, 
            border: 'none', 
            borderRadius: 6, 
            padding: '10px 24px', 
            fontSize: 16, 
            cursor: (!addData.shiftCategoryId || !addData.recurringShiftId || !addData.userIds?.length || availableSlots === 0) ? 'not-allowed' : 'pointer' 
          }}
          disabled={
            !addData.shiftCategoryId ||
            !addData.recurringShiftId ||
            !addData.userIds?.length ||
            availableSlots === 0
          }
          onClick={handleScheduleShift}
        >
          Schedule Shift
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </div>

      {/* Shifts Table Section */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 32, minHeight: 200, position: 'relative' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', minWidth: 180 }}
          >
            <option value="">All Categories</option>
            {categoryOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.icon ? `${opt.icon} ` : ''}{opt.name}</option>
            ))}
          </select>
          {/* Day of Week Filter */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', minWidth: 180 }}
          >
            <option value="">All Days</option>
            {daysOfWeek.map((day, index) => (
              <option key={index} value={index}>{day}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>
        ) : shifts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888' }}>No shifts found.</div>
        ) : (
          (() => {
            const now = new Date();
            console.log('Current shifts:', shifts); // Debug log for current shifts
            let filteredShifts = shifts.filter(shift => {
              const endTime = new Date(shift.endTime);
              console.log('Shift end time:', endTime, 'Now:', now, 'Is future:', endTime >= now); // Debug log for each shift's end time
              return endTime >= now;
            });
            console.log('After future filter:', filteredShifts); // Debug log after future filter

            // Apply category filter
            if (selectedCategory) {
              filteredShifts = filteredShifts.filter(shift => {
                const matches = String(shift.shiftCategoryId) === selectedCategory;
                console.log('Category filter:', shift.shiftCategoryId, selectedCategory, matches); // Debug log for category filter
                return matches;
              });
            }
            console.log('After category filter:', filteredShifts); // Debug log after category filter

            // Apply day of week filter
            if (selectedDay !== "") {
              filteredShifts = filteredShifts.filter(shift => {
                const shiftDate = new Date(shift.startTime);
                const matches = shiftDate.getDay() === parseInt(selectedDay);
                console.log('Day filter:', shiftDate.getDay(), parseInt(selectedDay), matches); // Debug log for day filter
                return matches;
              });
            }
            console.log('Final filtered shifts:', filteredShifts); // Debug log for final filtered shifts

            if (filteredShifts.length === 0) {
              return <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>No shifts found.</div>;
            }

            return (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', color: '#888', fontWeight: 600 }}>
                    <th style={{ textAlign: 'left', padding: '12px 0 12px 12px' }}>User</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Shift Name</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Start</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>End</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Location</th>
                    <th style={{ textAlign: 'center', padding: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.map(shift => {
                    // Get all user names for this shift
                    let userNames = 'N/A';
                    if (Array.isArray(shift.ShiftSignup) && shift.ShiftSignup.length > 0) {
                      userNames = shift.ShiftSignup.map((signup: any) => {
                        // Find user in the users array
                        const user = users.find(u => u.id === signup.userId);
                        return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
                      }).join(', ');
                    }
                    return (
                      <tr key={shift.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px 0 12px 12px' }}>
                          {Array.isArray(shift.ShiftSignup) && shift.ShiftSignup.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {shift.ShiftSignup.map((signup: any) => (
                                <div key={signup.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {editShiftId === shift.id ? (
                                    <select
                                      value={editSignupUserIds[signup.id] ?? signup.userId}
                                      onChange={e => setEditSignupUserIds(prev => ({ ...prev, [signup.id]: Number(e.target.value) }))}
                                      style={{ padding: 4, borderRadius: 4, border: '1px solid #eee' }}
                                      disabled={editing}
                                    >
                                      <option value="">Select User</option>
                                      {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                          {user.firstName} {user.lastName}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span>{(() => {
                                      const user = users.find(u => u.id === signup.userId);
                                      return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
                                    })()}</span>
                                  )}
                                </div>
                              ))}
                              {editShiftId === shift.id && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                  <button
                                    onClick={() => handleEditSaveAll(shift)}
                                    style={{ background: 'none', border: 'none', color: '#1db96b', cursor: editing ? 'not-allowed' : 'pointer', padding: 4 }}
                                    title="Save All"
                                    disabled={editing}
                                  >
                                    <FaSave /> Save
                                  </button>
                                  <button
                                    onClick={handleEditCancel}
                                    style={{ background: 'none', border: 'none', color: '#e53935', cursor: editing ? 'not-allowed' : 'pointer', padding: 4 }}
                                    title="Cancel"
                                    disabled={editing}
                                  >
                                    <FaTimes /> Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            editShiftId === shift.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <select
                                  value={editSignupUserIds['new'] ?? ''}
                                  onChange={e => setEditSignupUserIds(prev => ({ ...prev, ['new']: Number(e.target.value) }))}
                                  style={{ padding: 4, borderRadius: 4, border: '1px solid #eee' }}
                                  disabled={editing}
                                >
                                  <option value="">Select User</option>
                                  {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                      {user.firstName} {user.lastName}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={async () => {
                                    setEditing(true);
                                    try {
                                      const userId = editSignupUserIds['new'];
                                      // Find the first ShiftSignup for this shift (if any)
                                      const signup = (shift.ShiftSignup && shift.ShiftSignup[0]) ? shift.ShiftSignup[0] : null;
                                      const token = localStorage.getItem("token");
                                      if (!signup) {
                                        // No ShiftSignup exists, so create one (POST)
                                        // Use shift.startTime/endTime for checkIn/checkOut
                                        // Use shiftId from shift, userId from selection
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`
                                          },
                                          body: JSON.stringify({
                                            userId,
                                            shiftId: shift.id,
                                            checkIn: shift.startTime,
                                            checkOut: shift.endTime,
                                            // Optionally add mealsServed, etc.
                                          })
                                        });
                                        if (!res.ok) {
                                          const errorData = await res.json();
                                          throw new Error(errorData.error || 'Failed to create shift signup');
                                        }
                                      } else {
                                        // If ShiftSignup exists, update it (PUT)
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signup.id}`, {
                                          method: 'PUT',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`
                                          },
                                          body: JSON.stringify({ userId })
                                        });
                                        if (!res.ok) {
                                          const errorData = await res.json();
                                          throw new Error(errorData.error || 'Failed to update shift signup');
                                        }
                                      }
                                      setEditShiftId(null);
                                      setEditSignupUserIds({});
                                      fetchShifts();
                                    } catch (err: any) {
                                      toast.error(err.message || 'Failed to update shift signup');
                                    } finally {
                                      setEditing(false);
                                    }
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#1db96b', cursor: editing ? 'not-allowed' : 'pointer', padding: 4 }}
                                  title="Save"
                                  disabled={editing || !editSignupUserIds['new']}
                                >
                                  <FaSave />
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  style={{ background: 'none', border: 'none', color: '#e53935', cursor: editing ? 'not-allowed' : 'pointer', padding: 4 }}
                                  title="Cancel"
                                  disabled={editing}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <span>N/A</span>
                            )
                          )}
                        </td>
                        <td style={{ padding: 12 }}>{shift.name}</td>
                        <td style={{ padding: 12 }}>{new Date(shift.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td style={{ padding: 12 }}>{new Date(shift.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td style={{ padding: 12 }}>{shift.location}</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              onClick={() => {
                                setEditShiftId(shift.id);
                                setEditSignupUserIds(Object.fromEntries((shift.ShiftSignup || []).map((s: any) => [s.id, s.userId])));
                              }}
                              style={{ background: 'none', border: 'none', color: '#ff9800', cursor: 'pointer', padding: 4 }}
                              title="Edit User(s)"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(shift)}
                              style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', padding: 4 }}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()
        )}
        {/* Add Shift Modal (UI only) */}
        {showAdd && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, width: 400, maxWidth: '90vw', boxShadow: '0 2px 16px #ddd', position: 'relative' }}>
              <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Add Shift</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* MultiSelect for users */}
                <MultiSelect
                  options={users.map((u: any) => ({ label: u.name, value: u.id }))}
                  value={users.filter((u: any) => addData.userIds.includes(u.id)).map((u: any) => ({ label: u.name, value: u.id }))}
                  onChange={(selected: any[]) => setAddData((d: any) => ({
                    ...d,
                    userIds: selected.map((opt: any) => opt.value)
                  }))}
                  labelledBy="Select Users"
                />
                {/* Category dropdown */}
                <select value={addData.shiftCategoryId} onChange={e => setAddData((d: any) => ({ ...d, shiftCategoryId: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}>
                  <option value="">Select Category</option>
                  {categoryOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.icon ? `${opt.icon} ` : ''}{opt.name}</option>)}
                </select>
                {/* Date picker, enabled only if day is selected */}
                <input
                  type="date"
                  value={addDate}
                  onChange={e => {
                    setAddDate(e.target.value);
                    if (e.target.value) {
                      const d = new Date(e.target.value);
                      setAddDayOfWeek(String(d.getDay()));
                      setSelectedSlotId(""); // Reset slot selection
                    } else {
                      setAddDayOfWeek("");
                      setSelectedSlotId("");
                    }
                  }}
                  min={(() => {
                    const today = new Date();
                    return today.toISOString().split('T')[0];
                  })()}
                  style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}
                />
                {/* After date is selected, show time slots for that day */}
                {addDayOfWeek && addDate && matchingSlots.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>Available Slot Timings:</div>
                    {matchingSlots.map(slot => (
                      <label key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="slot-timing"
                          value={slot.id}
                          checked={selectedSlotId === String(slot.id)}
                          onChange={() => setSelectedSlotId(String(slot.id))}
                        />
                        <div>
                          <div>{new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}</div>
                          <div style={{ fontSize: '0.9em', color: '#666' }}>{slot.name}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {/* Only show location after a slot is selected */}
                {selectedSlotId !== "" && (
                  <input placeholder="Location" value={addData.location} readOnly style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', background: '#f5f5f5' }} />
                )}
                <button
                  style={{ background: '#ff9800', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 16, marginTop: 8, cursor: 'pointer' }}
                  onClick={async () => {
                    if (!addData.userIds.length || !addData.shiftCategoryId || !addDate || !selectedSlotId) {
                      toast.error('Please fill all fields and select at least one user, date, and time slot.');
                      return;
                    }
                    setLoading(true);
                    setError("");
                    try {
                      const token = localStorage.getItem("token");
                      const slot = matchingSlots.find(s => String(s.id) === selectedSlotId);
                      let successCount = 0;
                      let errorCount = 0;

                      for (const userId of addData.userIds) {
                        try {
                          // 1. Create the shift for this user
                          const shiftName = slot?.name || 'Shift';
                          const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              name: shiftName,
                              shiftCategoryId: Number(addData.shiftCategoryId),
                              startTime: `${addDate}T${slot.startTime.slice(11, 16)}`,
                              endTime: `${addDate}T${slot.endTime.slice(11, 16)}`,
                              location: slot.location,
                              slots: slot.slots,
                              userId: userId // Include userId in shift creation
                            })
                          });

                          if (!shiftRes.ok) {
                            const errorData = await shiftRes.json();
                            throw new Error(errorData.error || 'Failed to create shift');
                          }

                          const shiftData = await shiftRes.json();

                          // 2. Create the shift signup for this user
                          const signupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              userId: userId,
                              shiftId: shiftData.id,
                              checkIn: slot.startTime.slice(0, 16),
                              checkOut: slot.endTime.slice(0, 16),
                              mealsServed: 0
                            })
                          });

                          if (!signupRes.ok) {
                            const errorData = await signupRes.json();
                            throw new Error(errorData.error || 'Failed to create shift signup');
                          }

                          successCount++;
                          toast.success(`Successfully created shift for ${users.find(u => u.id === userId)?.name || 'user'}`);
                        } catch (err: any) {
                          errorCount++;
                          toast.error(`Failed to create shift for ${users.find(u => u.id === userId)?.name || 'user'}: ${err.message}`);
                        }
                      }

                      // Close popup and refresh table if at least one shift was created successfully
                      if (successCount > 0) {
                        setShowAdd(false);
                        setAddData({ userIds: [], shiftCategoryId: '', startTime: '', endTime: '', location: '', slots: 1 });
                        setAddDate("");
                        setSelectedSlotId("");
                        await fetchShifts(); // Refresh the table
                      }

                      if (errorCount > 0) {
                        toast.warning(`${errorCount} out of ${addData.userIds.length} shifts failed to create`);
                      }
                    } catch (err: any) {
                      setError(err.message || 'Failed to add shifts');
                      toast.error(err.message || 'Failed to add shifts');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 