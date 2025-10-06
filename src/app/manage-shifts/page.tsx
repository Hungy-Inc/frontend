"use client";
import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlusCircle, FaToggleOn, FaToggleOff, FaCalendarAlt, FaClock, FaCheck, FaBan, FaTimes, FaPlus, FaSave } from "react-icons/fa";
import { toast } from 'react-toastify';

export default function ManageShiftsPage() {
  const [tab, setTab] = useState<'shiftcategory' | 'recurringshifts'>('recurringshifts');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [recurringShifts, setRecurringShifts] = useState<any[]>([]);
  const [loadingRecurring, setLoadingRecurring] = useState(false);
  const [errorRecurring, setErrorRecurring] = useState("");
  const [addName, setAddName] = useState("");
  const [addIcon, setAddIcon] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);

  // Recurring Shift Add/Edit Modal State
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [addRecurring, setAddRecurring] = useState({
    name: '',
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    shiftCategoryId: '',
    location: '',
    slots: 1,
    isRecurring: true // Add shift type field
  });
  
  // Removed field management state - now handled in dedicated add/edit shift pages
  const [addRecurringError, setAddRecurringError] = useState('');
  const [addingRecurring, setAddingRecurring] = useState(false);
  const [addRecurringTouched, setAddRecurringTouched] = useState<{[key: string]: boolean}>({});

  const [editRecurringId, setEditRecurringId] = useState<number|null>(null);
  const [editRecurring, setEditRecurring] = useState({
    name: '',
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    shiftCategoryId: '',
    location: '',
    slots: 1,
    isRecurring: true // Add shift type field
  });
  
  // Removed edit shift field management state - now handled in dedicated edit shift page
  const [editRecurringError, setEditRecurringError] = useState('');
  const [editingRecurring, setEditingRecurring] = useState(false);

  // New state for enhanced features
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Special Events toggle state
  const [specialEventsMode, setSpecialEventsMode] = useState(false);
  
  // New state for expandable shifts
  const [expandedShifts, setExpandedShifts] = useState<Set<number>>(new Set());
  const [shiftOccurrences, setShiftOccurrences] = useState<{[key: number]: any[]}>({});
  const [loadingOccurrences, setLoadingOccurrences] = useState<{[key: number]: boolean}>({});
  const [shifts, setShifts] = useState<any[]>([]);

  // Fetch shift categories for dropdown
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterShiftName, setFilterShiftName] = useState('');

  // New state for month/year filtering of occurrences
  const [occurrenceMonth, setOccurrenceMonth] = useState(new Date().getMonth());
  const [occurrenceYear, setOccurrenceYear] = useState(new Date().getFullYear());
  const [showOccurrenceFilters, setShowOccurrenceFilters] = useState(false);

  // Individual shift occurrence filters
  const [shiftOccurrenceFilters, setShiftOccurrenceFilters] = useState<{[key: number]: {
    showActive: boolean;
    showInactive: boolean;
    searchText: string;
    monthFilter: string;
  }}>({});

  // Default Users Management State
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedDefaultUsers, setSelectedDefaultUsers] = useState<number[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Removed field management state - now handled in add/edit shift pages
  const [defaultUsersError, setDefaultUsersError] = useState('');

  // Absence Management State
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedRecurringShift, setSelectedRecurringShift] = useState<any>(null); // Keep track of recurring shift separately
  const [defaultUsersForOccurrence, setDefaultUsersForOccurrence] = useState<any[]>([]);
  const [shiftAbsences, setShiftAbsences] = useState<any[]>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceType, setAbsenceType] = useState('UNAVAILABLE');
  const [selectedUsersForAbsence, setSelectedUsersForAbsence] = useState<number[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [addShiftUserSearchTerm, setAddShiftUserSearchTerm] = useState('');

  // No Category Modal State
  const [showNoCategoryModal, setShowNoCategoryModal] = useState(false);

  useEffect(() => {
    if (tab === 'recurringshifts' || showAddRecurring || editRecurringId) {
      fetchCategoryOptions();
    }
    // eslint-disable-next-line
  }, [tab, showAddRecurring, editRecurringId]);

  // Fetch available users for default assignment
  useEffect(() => {
    if (showAddRecurring || editRecurringId) {
      console.log('useEffect triggered - fetching available users. showAddRecurring:', showAddRecurring, 'editRecurringId:', editRecurringId); // Debug log
      fetchAvailableUsers();
    }
  }, [showAddRecurring, editRecurringId]);
  const fetchCategoryOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Filter out 'Collection' category from dropdown options
      setCategoryOptions(data.filter((cat: any) => cat.name !== 'Collection'));
    } catch {
      setCategoryOptions([]);
    }
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    setDefaultUsersError('');
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      console.log('Fetched users:', data); // Debug log
      // Filter only approved users
      const approvedUsers = data.filter((user: any) => user.status === 'APPROVED');
      console.log('Approved users:', approvedUsers); // Debug log
      setAvailableUsers(approvedUsers);
    } catch (err) {
      console.error('Error fetching users:', err); // Debug log
      setDefaultUsersError('Failed to load users');
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (tab === 'shiftcategory') fetchCategories();
    if (tab === 'recurringshifts') {
      fetchRecurringShifts();
      fetchShifts(); // Also fetch shifts for occurrence status checking
    }
    // eslint-disable-next-line
  }, [tab, filterActive, specialEventsMode]);

  // Auto-select Special Events category when mode is active
  useEffect(() => {
    if (specialEventsMode && categoryOptions.length > 0) {
      const specialEventsCategory = categoryOptions.find(cat => cat.name === 'Special Events');
      if (specialEventsCategory) {
        setAddRecurring(prev => ({ ...prev, shiftCategoryId: specialEventsCategory.id }));
      }
    } else if (!specialEventsMode) {
      // Clear category selection when Special Events mode is turned off
      setAddRecurring(prev => ({ ...prev, shiftCategoryId: '' }));
    }
  }, [specialEventsMode, categoryOptions]);



  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch shift categories");
      const data = await res.json();
      // Filter out 'Collection' category from display
      setCategories(data.filter((cat: any) => cat.name !== 'Collection'));
    } catch (err) {
      setError("Failed to load shift categories.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch shifts");
      const data = await res.json();
      console.log('🔍 FETCHED SHIFTS:', data.length, 'shifts');
      console.log('🔍 SHIFTS DATA:', data.map((s: any) => ({ id: s.id, name: s.name, isActive: s.isActive, recurringShiftId: s.recurringShiftId, startTime: s.startTime })));
      setShifts(data);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setShifts([]);
    }
  };

  const fetchRecurringShifts = async () => {
    setLoadingRecurring(true);
    setErrorRecurring("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts?isActive=${filterActive === 'all' ? '' : filterActive === 'active' ? 'true' : 'false'}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch shifts");
      const data = await res.json();
      
      // Filter by Special Events category if mode is active
      let filteredData = data;
      if (specialEventsMode) {
        // Find the Special Events category
        const specialEventsCategory = categoryOptions.find(cat => cat.name === 'Special Events');
        if (specialEventsCategory) {
          filteredData = data.filter((shift: any) => shift.shiftCategoryId === specialEventsCategory.id);
        }
      }
      
      setRecurringShifts(filteredData);
    } catch (err) {
      setErrorRecurring("Failed to load shifts.");
      setRecurringShifts([]);
    } finally {
      setLoadingRecurring(false);
    }
  };

  // Add Shift Category
  const handleAddCategory = async () => {
    setAdding(true);
    setAddError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: addName.trim(), icon: addIcon.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add category');
      setShowAdd(false);
      setAddName("");
      setAddIcon("");
      fetchCategories();
      toast.success('Category added successfully!');
    } catch (err: any) {
      setAddError(err.message || 'Failed to add category');
      toast.error(err.message || 'Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  // Edit Shift Category
  const handleEdit = (cat: any) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || "");
    setEditError("");
  };
  const handleEditCategory = async () => {
    if (!editId) return;
    setEditing(true);
    setEditError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-categories/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName.trim(), icon: editIcon.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update category');
      setEditId(null);
      setEditName("");
      setEditIcon("");
      fetchCategories();
      toast.success('Category updated successfully!');
    } catch (err: any) {
      setEditError(err.message || 'Failed to update category');
      toast.error(err.message || 'Failed to update category');
    } finally {
      setEditing(false);
    }
  };
  const handleCancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditIcon("");
    setEditError("");
  };

  // Delete Shift Category
  const handleDelete = async (cat: any) => {
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-categories/${cat.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');
      fetchCategories();
      toast.success('Category deleted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  // Add Shift (Recurring or One-time)
  const handleAddRecurringShift = async () => {
    setAddingRecurring(true);
    setAddRecurringError('');
    try {
      const token = localStorage.getItem("token");
      
      let startTime, endTime;
      
      if (addRecurring.isRecurring) {
        // Recurring shift - use time inputs
        if (addRecurring.startTime && addRecurring.endTime) {
          const baseDate = '1969-06-10';
          const start = new Date(`${baseDate}T${addRecurring.startTime}`);
          const end = new Date(`${baseDate}T${addRecurring.endTime}`);
          const diffMs = end.getTime() - start.getTime();
          if (diffMs < 60 * 60 * 1000) {
            setAddRecurringError('Shift end time must be at least 1 hour after start time.');
            setAddingRecurring(false);
            return;
          }
          startTime = `${baseDate}T${addRecurring.startTime}:00-03:00`;
          endTime = `${baseDate}T${addRecurring.endTime}:00-03:00`;
        }
      } else {
        // One-time shift - use datetime inputs
        if (addRecurring.startTime && addRecurring.endTime) {
          const start = new Date(addRecurring.startTime);
          const end = new Date(addRecurring.endTime);
          const diffMs = end.getTime() - start.getTime();
          if (diffMs < 60 * 60 * 1000) {
            setAddRecurringError('Shift end time must be at least 1 hour after start time.');
            setAddingRecurring(false);
            return;
          }
          startTime = addRecurring.startTime;
          endTime = addRecurring.endTime;
        }
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...addRecurring,
          startTime,
          endTime,
          shiftCategoryId: Number(addRecurring.shiftCategoryId),
          dayOfWeek: addRecurring.isRecurring ? Number(addRecurring.dayOfWeek) : null,
          slots: Number(addRecurring.slots),
          isRecurring: addRecurring.isRecurring
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add shift');
      
      // Add default users if any are selected
      if (selectedDefaultUsers.length > 0) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${data.id}/default-users`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              userIds: selectedDefaultUsers
            })
          });
        } catch (err) {
          console.error('Failed to add default users:', err);
          toast.warning('Shift created but failed to assign default users. You can assign them later.');
        }
      }
      
      toast.success(`${addRecurring.isRecurring ? 'Recurring' : 'One-time'} shift added successfully!`);
      
      setShowAddRecurring(false);
      setAddRecurring({ name: '', dayOfWeek: 0, startTime: '', endTime: '', shiftCategoryId: '', location: '', slots: 1, isRecurring: true });
      setSelectedDefaultUsers([]);
      setAddShiftUserSearchTerm('');
      fetchRecurringShifts();
    } catch (err: any) {
      setAddRecurringError(err.message || 'Failed to add shift');
      toast.error(err.message || 'Failed to add shift');
    } finally {
      setAddingRecurring(false);
    }
  };

  // Edit Shift
  const handleEditRecurring = (shift: any) => {
    console.log('Opening edit modal for shift:', shift); // Debug log
    setEditRecurringId(shift.id);
    
    if (shift.isRecurring) {
      // Recurring shift - extract time from datetime
      setEditRecurring({
        name: shift.name,
        dayOfWeek: shift.dayOfWeek,
        startTime: shift.startTime ? shift.startTime.slice(11, 16) : '',
        endTime: shift.endTime ? shift.endTime.slice(11, 16) : '',
        shiftCategoryId: String(shift.shiftCategoryId),
        location: shift.location,
        slots: shift.slots,
        isRecurring: true
      });
    } else {
      // One-time shift - use full datetime
      setEditRecurring({
        name: shift.name,
        dayOfWeek: 0,
        startTime: shift.startTime ? new Date(shift.startTime).toISOString().slice(0, 16) : '',
        endTime: shift.endTime ? new Date(shift.endTime).toISOString().slice(0, 16) : '',
        shiftCategoryId: String(shift.shiftCategoryId),
        location: shift.location,
        slots: shift.slots,
        isRecurring: false
      });
    }
    setEditRecurringError('');
    
    // Load existing default users for this shift
    console.log('Fetching default users for shift ID:', shift.id); // Debug log
    fetchDefaultUsersForShift(shift.id);
  };

  const fetchDefaultUsersForShift = async (shiftId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/default-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched default users:', data); // Debug log
        setSelectedDefaultUsers(data.defaultUsers.map((du: any) => du.userId));
      } else {
        console.error('Failed to fetch default users:', res.status, res.statusText);
        setSelectedDefaultUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch default users:', err);
      setSelectedDefaultUsers([]);
    }
  };
  const handleEditRecurringShift = async () => {
    if (!editRecurringId) return;
    setEditingRecurring(true);
    setEditRecurringError('');
    try {
      const token = localStorage.getItem("token");
      
      let startTime, endTime;
      
      if (editRecurring.isRecurring) {
        // Recurring shift - use time inputs
        if (editRecurring.startTime && editRecurring.endTime) {
          const baseDate = '1969-06-10';
          const start = new Date(`${baseDate}T${editRecurring.startTime}`);
          const end = new Date(`${baseDate}T${editRecurring.endTime}`);
          const diffMs = end.getTime() - start.getTime();
          if (diffMs < 60 * 60 * 1000) {
            setEditRecurringError('Shift end time must be at least 1 hour after start time.');
            setEditingRecurring(false);
            return;
          }
          startTime = `${baseDate}T${editRecurring.startTime}:00-03:00`;
          endTime = `${baseDate}T${editRecurring.endTime}:00-03:00`;
        }
      } else {
        // One-time shift - use datetime inputs
        if (editRecurring.startTime && editRecurring.endTime) {
          const start = new Date(editRecurring.startTime);
          const end = new Date(editRecurring.endTime);
          const diffMs = end.getTime() - start.getTime();
          if (diffMs < 60 * 60 * 1000) {
            setEditRecurringError('Shift end time must be at least 1 hour after start time.');
            setEditingRecurring(false);
            return;
          }
          startTime = editRecurring.startTime;
          endTime = editRecurring.endTime;
        }
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${editRecurringId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editRecurring,
          startTime,
          endTime,
          shiftCategoryId: Number(editRecurring.shiftCategoryId),
          dayOfWeek: editRecurring.isRecurring ? Number(editRecurring.dayOfWeek) : null,
          slots: Number(editRecurring.slots)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update shift');
      
      // Update default users if any are selected
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${editRecurringId}/default-users`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            userIds: selectedDefaultUsers
          })
        });
      } catch (err) {
        console.error('Failed to update default users:', err);
        toast.warning('Shift updated but failed to update default users. You can update them later.');
      }
      
      toast.success('Shift updated successfully!');
      
      setShowAddRecurring(false);
      setEditRecurringId(null);
      setEditRecurring({
        name: '',
        dayOfWeek: 0,
        startTime: '',
        endTime: '',
        shiftCategoryId: '',
        location: '',
        slots: 1,
        isRecurring: true
      });
      setSelectedDefaultUsers([]);
      fetchRecurringShifts();
    } catch (err) {
      setEditRecurringError(err instanceof Error ? err.message : 'Failed to update shift');
    } finally {
      setEditingRecurring(false);
    }
  };
  const handleCancelEditRecurring = () => {
    setEditRecurringId(null);
    setEditRecurringError('');
    setEditRecurring({
      name: '',
      dayOfWeek: 0,
      startTime: '',
      endTime: '',
      shiftCategoryId: '',
      location: '',
      slots: 1,
      isRecurring: true
    });
    setSelectedDefaultUsers([]);
  };

  // Delete Recurring Shift
  const handleDeleteRecurring = async (shift: any) => {
    if (!window.confirm(`Delete shift "${shift.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shift.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete shift');
      fetchRecurringShifts();
      toast.success('Shift deleted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete shift');
    }
  };

  // Toggle shift active status
  const toggleActive = async (shiftId: number, currentActive: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shiftId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentActive })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle shift status');
      }

      toast.success(`Shift ${!currentActive ? 'activated' : 'deactivated'} successfully!`);
      fetchRecurringShifts();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    }
  };

  // Calculate occurrences for a recurring shift
  const calculateNextOccurrences = (shift: any, targetMonth?: number, targetYear?: number) => {
    if (!shift || !shift.isRecurring || shift.dayOfWeek === null) return [];
    
    const occurrences = [];
    
    // If target month/year is specified, generate occurrences for that specific month only
    if (targetMonth !== undefined && targetYear !== undefined) {
      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0); // Last day of the month
      
      // Find the first occurrence of this day of week in the target month
      let currentDate = new Date(startDate);
      while (currentDate.getDay() !== shift.dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Generate occurrences for this month only
      while (currentDate <= endDate) {
        // Create date without time to avoid timezone issues
        const occurrenceDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        
        // Set the time for this occurrence
        const startTime = new Date(shift.startTime);
        const endTime = new Date(shift.endTime);
        
        const occurrenceStart = new Date(occurrenceDate);
        occurrenceStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        
        const occurrenceEnd = new Date(occurrenceDate);
        occurrenceEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        
        occurrences.push({
          date: occurrenceDate,
          startTime: occurrenceStart,
          endTime: occurrenceEnd,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][occurrenceDate.getDay()]
        });
        
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      // Default behavior: Generate 52 occurrences (one year) from current date
      const today = new Date();
      let startDate = new Date();
      
      const startDateDay = startDate.getDay();
      let dayDiff = shift.dayOfWeek - startDateDay;
      
      // If start date is the recurring day, start from next week
      if (dayDiff <= 0) dayDiff += 7;
      
      // Generate 52 occurrences (one year of weekly shifts)
      for (let i = 0; i < 52; i++) {
        // Create date without time to avoid timezone issues
        const targetDate = startDate.getDate() + dayDiff + (i * 7);
        const occurrenceDate = new Date(startDate.getFullYear(), startDate.getMonth(), targetDate);
        
        // Set the time for this occurrence
        const startTime = new Date(shift.startTime);
        const endTime = new Date(shift.endTime);
        
        const occurrenceStart = new Date(occurrenceDate);
        occurrenceStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        
        const occurrenceEnd = new Date(occurrenceDate);
        occurrenceEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        
        // Debug first few occurrences
        if (i < 3) {
          console.log(`🔍 MANAGE-SHIFTS OCCURRENCE ${i}:`, {
            '=== INPUT ===': {
              startDate: startDate,
              dayDiff: dayDiff,
              i: i,
              targetDate: targetDate
            },
            '=== CREATION ===': {
              occurrenceDate: occurrenceDate,
              occurrenceDateString: occurrenceDate.toDateString(),
              occurrenceDateISO: occurrenceDate.toISOString(),
              occurrenceDateLocal: occurrenceDate.toLocaleDateString(),
              occurrenceDateComponents: {
                year: occurrenceDate.getFullYear(),
                month: occurrenceDate.getMonth() + 1,
                day: occurrenceDate.getDate()
              }
            }
          });
        }
        
        occurrences.push({
          date: occurrenceDate,
          startTime: occurrenceStart,
          endTime: occurrenceEnd,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][occurrenceDate.getDay()]
        });
      }
    }
    
    return occurrences;
  };

  // Handle expand/collapse of shift occurrences
  const handleToggleExpand = async (shiftId: number) => {
    const newExpandedShifts = new Set(expandedShifts);
    
    if (newExpandedShifts.has(shiftId)) {
      // Collapse
      newExpandedShifts.delete(shiftId);
      setExpandedShifts(newExpandedShifts);
    } else {
      // Expand - load occurrences
      newExpandedShifts.add(shiftId);
      setExpandedShifts(newExpandedShifts);
      
      // Initialize filters for this shift
      initializeShiftFilters(shiftId);
      
      // Set loading state
      setLoadingOccurrences(prev => ({ ...prev, [shiftId]: true }));
      
      try {
        // Calculate next 52 occurrences (default behavior - no month filtering)
        const shift = recurringShifts.find(s => s.id === shiftId);
        if (shift) {
          const occurrences = calculateNextOccurrences(shift); // No month/year parameters = default 52 occurrences
          setShiftOccurrences(prev => ({ ...prev, [shiftId]: occurrences }));
        }
      } catch (error) {
        console.error('Error calculating occurrences:', error);
        toast.error('Failed to load shift occurrences');
      } finally {
        setLoadingOccurrences(prev => ({ ...prev, [shiftId]: false }));
      }
    }
  };

  // Get the current status of an occurrence
  const getOccurrenceStatus = (shiftId: number, occurrenceDate: Date) => {
    // Check if there's a shift for this occurrence in the shifts data
    const existingShift = shifts.find((s: any) => {
      if (s.recurringShiftId !== shiftId) return false;
      const shiftDate = new Date(s.startTime);
      // Compare dates using toDateString() for consistent comparison
      return shiftDate.toDateString() === occurrenceDate.toDateString();
    });
    
    console.log('🔍 GET OCCURRENCE STATUS:', {
      shiftId,
      occurrenceDate: occurrenceDate.toDateString(),
      existingShift: existingShift ? { id: existingShift.id, isActive: existingShift.isActive } : null,
      totalShifts: shifts.length,
      shiftsForRecurring: shifts.filter(s => s.recurringShiftId === shiftId).length
    });
    
    // If no shift exists, it's considered active by default (will be created when toggled)
    // If shift exists, return its isActive status
    return existingShift ? existingShift.isActive : true;
  };

  // Toggle individual shift occurrence status
  const toggleOccurrenceStatus = async (shiftId: number, occurrenceDate: Date) => {
    try {
      const token = localStorage.getItem("token");
      
      // First, check if a shift exists for this occurrence
      const shift = recurringShifts.find(s => s.id === shiftId);
      if (!shift) throw new Error('Shift not found');
      
      // Check if shift exists for this date
      const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (checkRes.ok) {
        const existingShifts = await checkRes.json();
        const existingShift = existingShifts.find((s: any) => {
          const shiftDate = new Date(s.startTime);
          // Use consistent date comparison
          return shiftDate.toDateString() === occurrenceDate.toDateString() && s.recurringShiftId === shiftId;
        });
        
        if (existingShift) {
          // Update existing shift using the toggle-active endpoint
          const updateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${existingShift.id}/toggle-active`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isActive: !existingShift.isActive })
          });
          
          if (!updateRes.ok) {
            const errorData = await updateRes.json();
            throw new Error(errorData.error || 'Failed to update shift status');
          }
          
          toast.success(`Occurrence ${existingShift.isActive ? 'deactivated' : 'activated'} successfully`);
        } else {
          // No shift exists yet. Since the display shows as "active" by default when no shift exists,
          // and the user clicked the toggle, they want to deactivate it (create as inactive)
          const desiredStatus = false; // Create as inactive since user clicked to deactivate
          
          // Create new shift for this occurrence with the desired status using proper endpoint
          const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/from-recurring/${shiftId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              date: `${occurrenceDate.getFullYear()}-${String(occurrenceDate.getMonth() + 1).padStart(2, '0')}-${String(occurrenceDate.getDate()).padStart(2, '0')}`, // Send date in YYYY-MM-DD format (local timezone)
              customSlots: shift.slots
            })
          });
          
          if (!createRes.ok) {
            const errorData = await createRes.json();
            throw new Error(errorData.error || 'Failed to create shift');
          }
          
          const result = await createRes.json();
          const createdShift = result.shift;
          
          // Now set the shift as inactive since user clicked to deactivate
          const updateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${createdShift.id}/toggle-active`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isActive: false })
          });
          
          if (!updateRes.ok) {
            const errorData = await updateRes.json();
            throw new Error(errorData.error || 'Failed to deactivate shift');
          }
          
          toast.success('Occurrence created and deactivated successfully');
        }
        
        // Refresh the shifts data and occurrences
        console.log('🔍 REFRESHING DATA AFTER TOGGLE...');
        await fetchShifts();
        console.log('🔍 SHIFTS AFTER REFRESH:', shifts.length);
        const occurrences = calculateNextOccurrences(shift);
        setShiftOccurrences(prev => ({ ...prev, [shiftId]: occurrences }));
        console.log('🔍 OCCURRENCES UPDATED FOR SHIFT:', shiftId);
      } else {
        throw new Error('Failed to fetch shifts');
      }
    } catch (error: any) {
      console.error('Error toggling occurrence status:', error);
      toast.error(error.message || 'Failed to update occurrence status');
    }
  };



  // Handle month/year navigation
  const navigateOccurrencePeriod = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (occurrenceMonth === 0) {
        setOccurrenceMonth(11);
        setOccurrenceYear(occurrenceYear - 1);
      } else {
        setOccurrenceMonth(occurrenceMonth - 1);
      }
    } else {
      if (occurrenceMonth === 11) {
        setOccurrenceMonth(0);
        setOccurrenceYear(occurrenceYear + 1);
      } else {
        setOccurrenceMonth(occurrenceMonth + 1);
      }
    }
  };

  // Set occurrence period to current month/year
  const setToCurrentPeriod = () => {
    const now = new Date();
    setOccurrenceMonth(now.getMonth());
    setOccurrenceYear(now.getFullYear());
  };

  // Generate all available months for the dropdown (current cycle + next 12 months)
  const generateAvailableMonths = () => {
    const months = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Start from current month and go forward 12 months
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth + i) % 12;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      months.push({
        value: `${year}-${monthIndex}`,
        label: `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][monthIndex]} ${year}`,
        month: monthIndex,
        year: year
      });
    }
    
    return months;
  };

  // Quick jump to specific month/year
  const jumpToMonth = (monthYearValue: string) => {
    const [year, month] = monthYearValue.split('-').map(Number);
    setOccurrenceMonth(month);
    setOccurrenceYear(year);
  };

  // Group occurrences by month for better organization
  const groupOccurrencesByMonth = (occurrences: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    occurrences.forEach(occurrence => {
      const monthKey = `${occurrence.date.getFullYear()}-${occurrence.date.getMonth()}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(occurrence);
    });
    
    return grouped;
  };

  // Get month name from month key
  const getMonthNameFromKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month]} ${year}`;
  };

  const isRecurringNameValid = /^[A-Za-z\s]+$/.test(addRecurring.name.trim());
  const isRecurringDayValid = addRecurring.isRecurring ? (typeof addRecurring.dayOfWeek === 'number' && addRecurring.dayOfWeek >= 0 && addRecurring.dayOfWeek <= 6) : true;
  const isRecurringStartTimeValid = !!addRecurring.startTime;
  const isRecurringEndTimeValid = !!addRecurring.endTime;
  const isRecurringCategoryValid = !!addRecurring.shiftCategoryId;
  const isRecurringLocationValid = addRecurring.location.trim().length > 0;
  const isRecurringSlotsValid = Number(addRecurring.slots) > 0;
  const isRecurringFormValid = isRecurringNameValid && isRecurringDayValid && isRecurringStartTimeValid && isRecurringEndTimeValid && isRecurringCategoryValid && isRecurringLocationValid && isRecurringSlotsValid;

  const isCategoryNameValid = addName.trim().length > 0;

  // Unique shift names for dropdown (case-insensitive, trimmed)
  const shiftNameOptions = Array.from(
    recurringShifts
      .filter(shift => !filterCategory || String(shift.shiftCategoryId) === filterCategory)
      .reduce((map, shift) => {
        const normalized = shift.name.trim().toLowerCase();
        if (!map.has(normalized)) {
          map.set(normalized, shift.name.trim());
        }
        return map;
      }, new Map<string, string>())
      .values()
  ) as string[];
  shiftNameOptions.sort();

  // Initialize filters for a specific shift
  const initializeShiftFilters = (shiftId: number) => {
    if (!shiftOccurrenceFilters[shiftId]) {
      setShiftOccurrenceFilters(prev => ({
        ...prev,
        [shiftId]: {
          showActive: true,
          showInactive: true,
          searchText: '',
          monthFilter: ''
        }
      }));
    }
  };

  // Filter occurrences for a specific shift
  const getFilteredOccurrences = (shiftId: number, occurrences: any[], shift: any) => {
    const filters = shiftOccurrenceFilters[shiftId];
    if (!filters || !shift) return occurrences;

    // If month filter is applied, regenerate occurrences for that specific month only
    if (filters.monthFilter !== '') {
      const [year, month] = filters.monthFilter.split('-').map(Number);
      if (isNaN(year) || isNaN(month)) return occurrences; // Safety check for invalid month/year
      const monthOccurrences = calculateNextOccurrences(shift, month, year);
      
      // Apply other filters to the month-specific occurrences
      return monthOccurrences.filter(occurrence => {
        // Don't show past occurrences (completed)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (occurrence.date < today) {
          return false;
        }

        // Status filter
        const isActive = getOccurrenceStatus(shiftId, occurrence.date);
        if (filters.showActive && !filters.showInactive) {
          if (!isActive) return false;
        }
        if (!filters.showActive && filters.showInactive) {
          if (isActive) return false;
        }

        // Search text filter
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          const dayName = occurrence.dayName.toLowerCase();
          const dateStr = occurrence.date.toLocaleDateString('en-CA', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            timeZone: 'America/Halifax'
          }).toLowerCase();
          
          if (!dayName.includes(searchLower) && !dateStr.includes(searchLower)) {
            return false;
          }
        }

        return true;
      });
    }

    // No month filter - ensure we have the default 52 occurrences
    // If the original occurrences array is empty or doesn't have 52 items, regenerate them
    let defaultOccurrences = occurrences;
    if (occurrences.length === 0 || occurrences.length < 52) {
      defaultOccurrences = calculateNextOccurrences(shift); // Generate default 52 occurrences
    }
    
    // Apply filters to the default occurrences
    return defaultOccurrences.filter(occurrence => {
      // Don't show past occurrences (completed)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (occurrence.date < today) {
        return false;
      }

      // Status filter
      const isActive = getOccurrenceStatus(shiftId, occurrence.date);
      if (filters.showActive && !filters.showInactive) {
        if (!isActive) return false;
      }
      if (!filters.showActive && filters.showInactive) {
        if (isActive) return false;
      }

      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const dayName = occurrence.dayName.toLowerCase();
        const dateStr = occurrence.date.toLocaleDateString('en-CA', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          timeZone: 'America/Halifax'
        }).toLowerCase();
        
        if (!dayName.includes(searchLower) && !dateStr.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  };

  // Update filter for a specific shift
  const updateShiftFilter = (shiftId: number, filterType: string, value: any) => {
    setShiftOccurrenceFilters(prev => ({
      ...prev,
      [shiftId]: {
        ...prev[shiftId],
        [filterType]: value
      }
    }));
  };

  // Absence Management Functions
  const handleOccurrenceClick = async (shift: any, occurrence: any) => {
    console.log('🔍 MANAGE-SHIFTS OCCURRENCE CLICK DEBUGGING:', {
      '=== SHIFT OBJECT ===': {
        shift: shift,
        shiftId: shift.id,
        shiftName: shift.name,
        shiftDayOfWeek: shift.dayOfWeek,
        shiftStartTime: shift.startTime
      },
      '=== OCCURRENCE OBJECT ===': {
        occurrence: occurrence,
        occurrenceDate: occurrence.date,
        occurrenceDateString: occurrence.date.toDateString(),
        occurrenceDateISO: occurrence.date.toISOString(),
        occurrenceDateLocal: occurrence.date.toLocaleDateString(),
        occurrenceDateComponents: {
          year: occurrence.date.getFullYear(),
          month: occurrence.date.getMonth() + 1,
          day: occurrence.date.getDate()
        }
      }
    });
    
    
    setSelectedShift(shift);
    setSelectedRecurringShift(shift); // Keep track of the recurring shift
    setSelectedOccurrence(occurrence);
    setShowAbsenceModal(true);
    setSelectedUsersForAbsence([]);
    setUserSearchTerm('');
    setAbsenceReason('');
    setAbsenceType('UNAVAILABLE');
    
    // Fetch default users and absences for this occurrence
    await fetchDefaultUsersAndAbsencesForOccurrence(shift, occurrence);
  };

  const fetchDefaultUsersAndAbsencesForOccurrence = async (shift: any, occurrence: any) => {
    setLoadingAbsences(true);
    try {
      const token = localStorage.getItem("token");
      
      console.log('🔍 FETCH DEFAULT USERS CALLED:', {
        '=== FUNCTION CALL ===': {
          shiftId: shift.id,
          shiftName: shift.name,
          shiftType: shift.isRecurring ? 'RECURRING' : 'ONE-TIME',
          shiftOrganizationId: shift.organizationId,
          occurrenceDate: occurrence.date,
          occurrenceDateString: occurrence.date.toDateString()
        },
        '=== CALL STACK ===': {
          stack: new Error().stack
        }
      });
      
      // Fetch default users for the recurring shift
      console.log('Fetching default users for recurring shift:', shift.id);
      const defaultUsersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shift.id}/default-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Default users response:', {
        status: defaultUsersRes.status,
        ok: defaultUsersRes.ok,
        statusText: defaultUsersRes.statusText
      });
      
      // Find or create the actual shift instance for this occurrence
      console.log('Date conversion debugging:', {
        originalDate: occurrence.date,
        originalDateString: occurrence.date.toDateString(),
        originalDateLocal: occurrence.date.toLocaleDateString(),
        isoString: occurrence.date.toISOString(),
        isoDateOnly: occurrence.date.toISOString().split('T')[0],
        timezoneOffset: occurrence.date.getTimezoneOffset()
      });
      
      // Create timezone-safe date string by using the original date components
      // This avoids any timezone conversion issues
      const year = occurrence.date.getFullYear();
      const month = occurrence.date.getMonth() + 1;
      const day = occurrence.date.getDate();
      
      // Also try alternative methods to see what's different
      const utcYear = occurrence.date.getUTCFullYear();
      const utcMonth = occurrence.date.getUTCMonth() + 1;
      const utcDay = occurrence.date.getUTCDate();
      
      const occurrenceDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const utcOccurrenceDate = `${utcYear}-${String(utcMonth).padStart(2, '0')}-${String(utcDay).padStart(2, '0')}`;
      
      console.log('🔍 MANAGE-SHIFTS DATE DEBUGGING:', {
        '=== OCCURRENCE OBJECT ===': {
          occurrence: occurrence,
          occurrenceDate: occurrence.date,
          occurrenceDateString: occurrence.date.toDateString(),
          occurrenceDateISO: occurrence.date.toISOString(),
          occurrenceDateLocal: occurrence.date.toLocaleDateString()
        },
        '=== DATE EXTRACTION ===': {
          originalDate: occurrence.date,
          localComponents: { year, month, day },
          utcComponents: { utcYear, utcMonth, utcDay },
          localDate: occurrenceDate,
          utcDate: utcOccurrenceDate,
          timezoneOffset: occurrence.date.getTimezoneOffset()
        },
        '=== FINAL RESULT ===': {
          finalOccurrenceDate: occurrenceDate,
          finalUtcDate: utcOccurrenceDate
        }
      });
      
      console.log('🎯 FINAL OCCURRENCE DATE (using local):', occurrenceDate);
      
      // First, try to find existing shift for this occurrence
      const shiftsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let actualShift = null;
      if (shiftsRes.ok) {
        const allShifts = await shiftsRes.json();
        console.log('Searching for existing shift:', {
          occurrenceDate: occurrence.date.toDateString(),
          recurringShiftId: shift.id,
          totalShifts: allShifts.length
        });
        
        actualShift = allShifts.find((s: any) => {
          const shiftDate = new Date(s.startTime);
          const matches = shiftDate.toDateString() === occurrence.date.toDateString() && s.recurringShiftId === shift.id;
          console.log('Checking shift:', {
            shiftId: s.id,
            shiftDate: shiftDate.toDateString(),
            recurringShiftId: s.recurringShiftId,
            matches
          });
          return matches;
        });
        
        console.log('Found existing shift:', actualShift ? { id: actualShift.id, name: actualShift.name } : 'None');
      }
      
      // If no shift exists, create one
      if (!actualShift) {
        console.log('🔍 CREATING SHIFT FOR OCCURRENCE:', {
          '=== SHIFT OBJECT ===': {
            shift: shift,
            shiftId: shift.id,
            shiftName: shift.name,
            shiftOrganizationId: shift.organizationId,
            shiftIsRecurring: shift.isRecurring
          },
          '=== REQUEST DETAILS ===': {
            recurringShiftId: shift.id,
            occurrenceDate,
            url: `${process.env.NEXT_PUBLIC_API_URL}/api/shifts/from-recurring/${shift.id}`,
            token: token ? 'Present' : 'Missing'
          }
        });
        
        const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/from-recurring/${shift.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            date: occurrenceDate
          })
        });
        
        console.log('Shift creation response:', {
          status: createRes.status,
          ok: createRes.ok,
          statusText: createRes.statusText
        });
        
        if (createRes.ok) {
          const result = await createRes.json();
          actualShift = result.shift;
          
          if (result.message === 'Using existing shift for this occurrence') {
            toast.info('Using existing shift for this occurrence');
          } else {
            toast.success('Shift created for this occurrence');
          }
        } else {
          const errorData = await createRes.json();
          console.error('Shift creation failed:', errorData);
          throw new Error(`Failed to create shift for this occurrence: ${errorData.error || 'Unknown error'}`);
        }
      }
      
      // Update selectedShift to the actual shift instance
      setSelectedShift(actualShift);
      
      // Fetch absences for this specific shift instance
      const absencesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${actualShift.id}/absences`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (defaultUsersRes.ok) {
        const defaultUsersData = await defaultUsersRes.json();
        setDefaultUsersForOccurrence(defaultUsersData.defaultUsers || []);
      }

      if (absencesRes.ok) {
        const absencesData = await absencesRes.json();
        setShiftAbsences(absencesData.absences || []);
      }
    } catch (err) {
      console.error('Error fetching default users and absences:', err);
      toast.error('Failed to load absence data');
    } finally {
      setLoadingAbsences(false);
    }
  };

  const handleUserSelection = (userId: number) => {
    setSelectedUsersForAbsence(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleMakeAbsence = async () => {
    if (!selectedShift || !selectedOccurrence || selectedUsersForAbsence.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    
    
    console.log('🔍 HANDLE MAKE ABSENCE CALLED:', {
      '=== SELECTED SHIFT ===': {
        selectedShiftId: selectedShift.id,
        selectedShiftName: selectedShift.name,
        selectedShiftType: selectedShift.isRecurring ? 'RECURRING' : 'ONE-TIME',
        selectedShiftOrganizationId: selectedShift.organizationId
      },
      '=== SELECTED USERS ===': {
        selectedUsersForAbsence,
        absenceReason,
        absenceType
      }
    });
    
    try {
      const token = localStorage.getItem("token");
      
      // Create absence requests for all selected users
      const promises = selectedUsersForAbsence.map(userId => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${selectedShift.id}/absences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            absenceType,
            reason: absenceReason,
            occurrenceDate: `${selectedOccurrence.date.getFullYear()}-${String(selectedOccurrence.date.getMonth() + 1).padStart(2, '0')}-${String(selectedOccurrence.date.getDate()).padStart(2, '0')}`,
            isApproved: true  // Auto-approve the absence
          })
        })
      );

      const responses = await Promise.all(promises);
      const failedRequests = responses.filter(res => !res.ok);
      
      if (failedRequests.length > 0) {
        throw new Error(`Failed to request absence for ${failedRequests.length} user(s)`);
      }
      
      toast.success(`Absence requested successfully for ${selectedUsersForAbsence.length} user(s)`);
      setSelectedUsersForAbsence([]);
      setAbsenceReason('');
      setAbsenceType('UNAVAILABLE');
      
      // Refresh data
      await fetchDefaultUsersAndAbsencesForOccurrence(selectedRecurringShift, selectedOccurrence);
    } catch (err) {
      toast.error("Failed to request absence");
    }
  };

  const handleAbsenceAction = async (absenceId: number, isApproved: boolean) => {
    if (!selectedShift) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${selectedShift.id}/absences/${absenceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isApproved
        })
      });

      if (!res.ok) throw new Error(`Failed to ${isApproved ? 'approve' : 'reject'} absence`);
      
      toast.success(`Absence ${isApproved ? 'approved' : 'rejected'} successfully`);
      
      // Refresh data
      await fetchDefaultUsersAndAbsencesForOccurrence(selectedRecurringShift, selectedOccurrence);
    } catch (err) {
      toast.error(`Failed to ${isApproved ? 'approve' : 'reject'} absence`);
    }
  };

  const handleRemoveAbsence = async (absenceId: number) => {
    if (!selectedShift) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${selectedShift.id}/absences/${absenceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to remove absence");
      
      toast.success("Absence removed successfully - user is now present");
      
      // Refresh data
      await fetchDefaultUsersAndAbsencesForOccurrence(selectedRecurringShift, selectedOccurrence);
    } catch (err) {
      toast.error("Failed to remove absence");
    }
  };

  return (
    <main style={{ padding: 32 }}>
      <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Manage Shifts</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => setTab('recurringshifts')}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: tab === 'recurringshifts' ? '#ff9800' : '#eee',
            color: tab === 'recurringshifts' ? '#fff' : '#888',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: tab === 'recurringshifts' ? '0 2px 8px #ffd699' : 'none',
            transition: 'all 0.15s'
          }}
        >
          Recurring Shifts
        </button>
        <button
          onClick={() => setTab('shiftcategory')}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: tab === 'shiftcategory' ? '#ff9800' : '#eee',
            color: tab === 'shiftcategory' ? '#fff' : '#888',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: tab === 'shiftcategory' ? '0 2px 8px #ffd699' : 'none',
            transition: 'all 0.15s'
          }}
        >
          Shift Category
        </button>
        
        {/* Special Events Toggle Button - Only show on Recurring Shifts tab */}
        {tab === 'recurringshifts' && (
          <button
            onClick={() => setSpecialEventsMode(!specialEventsMode)}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: '2px solid #ff9800',
              background: specialEventsMode ? '#ff9800' : 'transparent',
              color: specialEventsMode ? '#fff' : '#ff9800',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: specialEventsMode ? '0 2px 8px #ffd699' : 'none',
              transition: 'all 0.15s',
              marginLeft: 'auto' // Push to the right
            }}
          >
            {specialEventsMode ? '🎉 Special Events ON' : '🎉 Special Events'}
          </button>
        )}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 32, minHeight: 200, position: 'relative' }}>
        {tab === 'shiftcategory' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => setShowAdd(true)} style={{ background: 'none', border: 'none', color: '#ff9800', fontSize: 28, cursor: 'pointer' }} title="Add Shift Category">
                <FaPlusCircle />
              </button>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>
            ) : error ? (
              <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>
            ) : categories.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888' }}>No shift categories found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', color: '#888', fontWeight: 600 }}>
                    <th style={{ textAlign: 'left', padding: '12px 0 12px 12px' }}>Icon</th>
                    <th style={{ textAlign: 'left', padding: '12px 0' }}>Name</th>
                    <th style={{ textAlign: 'center', padding: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 0 12px 12px' }}>{cat.icon || <span style={{ color: '#ccc' }}>-</span>}</td>
                      <td style={{ padding: '12px 0' }}>{cat.name}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <button style={{ background: 'none', border: 'none', color: '#ff9800', cursor: 'pointer', marginRight: 12 }} title="Edit" onClick={() => handleEdit(cat)}>
                          <FaEdit />
                        </button>
                        <button style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer' }} title="Delete" onClick={() => handleDelete(cat)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {/* Add Shift Category Modal */}
            {showAdd && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #ddd', position: 'relative' }}>
                  <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Add Shift Category</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <input placeholder="Name" value={addName} onChange={e => setAddName(e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', width: '100%' }} />
                      <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                        Category names must be unique within your organization
                      </div>
                      {addName.trim() && categories.find(
                        cat => cat.name.toLowerCase() === addName.trim().toLowerCase()
                      ) && (
                        <div style={{ color: '#f44336', fontSize: 12, marginTop: 4 }}>
                          Category "{addName.trim()}" already exists
                        </div>
                      )}
                    </div>
                    <input placeholder="Icon (optional)" value={addIcon} onChange={e => setAddIcon(e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                    {addError && <div style={{ color: 'red', fontSize: 13, textAlign: 'center' }}>{addError}</div>}
                    <button onClick={handleAddCategory} style={{ background: (isCategoryNameValid && !categories.find(cat => cat.name.toLowerCase() === addName.trim().toLowerCase())) ? '#ff9800' : '#ccc', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 16, marginTop: 8, cursor: adding ? 'not-allowed' : (isCategoryNameValid && !categories.find(cat => cat.name.toLowerCase() === addName.trim().toLowerCase())) ? 'pointer' : 'not-allowed', opacity: adding ? 0.7 : 1 }} disabled={adding || !isCategoryNameValid || !!categories.find(cat => cat.name.toLowerCase() === addName.trim().toLowerCase())}>
                      {adding ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Edit Shift Category Modal */}
            {editId && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #ddd', position: 'relative' }}>
                  <button onClick={handleCancelEdit} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Edit Shift Category</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input placeholder="Name" value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                    <input placeholder="Icon (optional)" value={editIcon} onChange={e => setEditIcon(e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                    {editError && <div style={{ color: 'red', fontSize: 13, textAlign: 'center' }}>{editError}</div>}
                    <button onClick={handleEditCategory} style={{ background: '#ff9800', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 16, marginTop: 8, cursor: editing ? 'not-allowed' : 'pointer', opacity: editing ? 0.7 : 1 }} disabled={editing || !editName.trim()}>
                      {editing ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {tab === 'recurringshifts' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={filterActive} onChange={e => setFilterActive(e.target.value as any)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', minWidth: 140 }}>
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', minWidth: 180 }}>
                  <option value="">All Categories</option>
                  {categoryOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.icon ? `${opt.icon} ` : ''}{opt.name}</option>
                  ))}
                </select>
                <select value={filterDay} onChange={e => setFilterDay(e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', minWidth: 180 }}>
                  <option value="">All Days</option>
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
                {/* Shift Name Dropdown */}
                <select
                  value={filterShiftName}
                  onChange={e => setFilterShiftName(e.target.value)}
                  style={{
                    padding: 8,
                    borderRadius: 5,
                    border: '1px solid #eee',
                    minWidth: 180
                  }}
                >
                  <option value="">All Shifts</option>
                  {shiftNameOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => {
                // Check if categories exist before redirecting
                if (categoryOptions.length === 0) {
                  // No categories available - show modal and redirect to category tab
                  setShowNoCategoryModal(true);
                  return;
                }
                
                // Redirect to full Add Shift page
                window.location.href = '/add-shift';
              }} style={{ background: 'none', border: 'none', color: '#ff9800', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Add Shift">
                <FaPlusCircle />
              </button>
            </div>


            {/* Special Events Mode Indicator */}
            {specialEventsMode && (
              <div style={{ 
                marginBottom: '16px',
                padding: '12px 16px',
                background: '#fff3e0',
                borderRadius: '8px',
                border: '1px solid #ffcc80',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>🎉</span>
                <span style={{ fontWeight: '600', color: '#f57c00' }}>
                  Special Events Mode Active
                </span>
              </div>
            )}

            {loadingRecurring ? (
              <div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>
            ) : errorRecurring ? (
              <div style={{ textAlign: 'center', color: 'red' }}>{errorRecurring}</div>
            ) : recurringShifts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888' }}>
                {specialEventsMode ? 'No Special Events shifts found.' : 'No recurring shifts found.'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', color: '#888', fontWeight: 600 }}>
                    <th style={{ textAlign: 'left', padding: '12px 0 12px 12px', width: '40px' }}></th>
                    <th style={{ textAlign: 'left', padding: '12px 0 12px 12px' }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '12px 0' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Type</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Day</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Start</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>End</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Location</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Slots</th>
                    <th style={{ textAlign: 'center', padding: 12 }}>Status</th>
                    <th style={{ textAlign: 'center', padding: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringShifts
                    .filter(shift => !filterCategory || String(shift.shiftCategoryId) === filterCategory)
                    .filter(shift => filterDay === '' || (shift.dayOfWeek !== null && String(shift.dayOfWeek) === filterDay))
                    .filter(shift => !filterShiftName || shift.name.trim() === filterShiftName)
                    .map(shift => (
                      <React.Fragment key={shift.id}>
                        <tr style={{ borderBottom: '1px solid #f0f0f0', opacity: shift.isActive === false ? 0.6 : 1 }}>
                          <td style={{ padding: '12px 0 12px 12px', width: '40px' }}>
                            {shift.isRecurring && (
                              <button
                                onClick={() => handleToggleExpand(shift.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ff9800',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  transition: 'transform 0.2s',
                                  transform: expandedShifts.has(shift.id) ? 'rotate(90deg)' : 'rotate(0deg)'
                                }}
                                title={expandedShifts.has(shift.id) ? 'Collapse' : 'Expand'}
                              >
                                ▶
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '12px 0 12px 12px', whiteSpace: 'nowrap' }}>
                            {shift.ShiftCategory?.icon || <span style={{ color: '#ccc' }}>-</span>}
                            <span style={{ marginLeft: 0 }}>{shift.ShiftCategory?.name || '-'}</span>
                          </td>
                          <td style={{ padding: '12px 0' }}>{shift.name}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 500,
                              background: shift.isRecurring ? '#e3f2fd' : '#fff3e0',
                              color: shift.isRecurring ? '#1976d2' : '#f57c00'
                            }}>
                              {shift.isRecurring ? <FaCalendarAlt size={12} /> : <FaClock size={12} />}
                              {shift.isRecurring ? 'Recurring' : 'One-time'}
                            </span>
                          </td>
                          <td style={{ padding: 12 }}>
                            {shift.isRecurring ? 
                              ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][shift.dayOfWeek || 0] :
                              new Date(shift.startTime).toLocaleDateString('en-CA', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                timeZone: 'America/Halifax'
                              })
                            }
                          </td>
                          <td style={{ padding: 12 }}>
                            {shift.startTime ? new Date(shift.startTime).toLocaleTimeString('en-CA', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              hour12: false, 
                              timeZone: 'America/Halifax' 
                            }) : ''}
                          </td>
                          <td style={{ padding: 12 }}>
                            {shift.endTime ? new Date(shift.endTime).toLocaleTimeString('en-CA', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              hour12: false, 
                              timeZone: 'America/Halifax' 
                            }) : ''}
                          </td>
                          <td style={{ padding: 12 }}>{shift.location}</td>
                          <td style={{ padding: 12 }}>{shift.slots}</td>
                          <td style={{ padding: 12, textAlign: 'center' }}>
                            <button 
                              onClick={() => toggleActive(shift.id, shift.isActive)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: shift.isActive ? '#4caf50' : '#9e9e9e', 
                                cursor: 'pointer',
                                fontSize: 16
                              }} 
                              title={shift.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {shift.isActive ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                          </td>
                          <td style={{ padding: 12, textAlign: 'center' }}>
                            <button 
                              style={{ background: 'none', border: 'none', color: '#ff9800', cursor: 'pointer', marginRight: 12 }} 
                              title="Edit" 
                              onClick={() => window.location.href = `/edit-shift/${shift.id}`}
                            >
                              <FaEdit />
                            </button>
                            <button style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer' }} title="Delete" onClick={() => handleDeleteRecurring(shift)}>
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                        {/* Expanded occurrences row */}
                        {expandedShifts.has(shift.id) && shift.isRecurring && (
                          <tr>
                            <td colSpan={10} style={{ padding: 0, borderBottom: '1px solid #f0f0f0' }}>
                              <div style={{ 
                                background: '#f8f9fa', 
                                padding: '16px 24px',
                                borderLeft: '4px solid #ff9800'
                              }}>

                                
                                {/* Occurrences Summary */}
                                <div style={{ 
                                  display: 'flex', 
                                  gap: '16px', 
                                  marginBottom: '16px',
                                  padding: '12px',
                                  background: '#fff',
                                  borderRadius: '6px',
                                  border: '1px solid #e0e0e0',
                                  fontSize: '12px'
                                }}>
                                  <span style={{ color: '#666' }}>
                                    Total: <strong>{shiftOccurrences[shift.id]?.length || 0}</strong> occurrences
                                  </span>
                                  <span style={{ color: '#4caf50' }}>
                                    Active: <strong>{
                                      shiftOccurrences[shift.id]?.filter(occ => getOccurrenceStatus(shift.id, occ.date)).length || 0
                                    }</strong>
                                  </span>
                                  <span style={{ color: '#9e9e9e' }}>
                                    Inactive: <strong>{
                                      shiftOccurrences[shift.id]?.filter(occ => !getOccurrenceStatus(shift.id, occ.date)).length || 0
                                    }</strong>
                                  </span>
                                  <span style={{ color: '#ff9800' }}>
                                    Filtered: <strong>{
                                      getFilteredOccurrences(shift.id, shiftOccurrences[shift.id] || [], shift).length
                                    }</strong> shown
                                  </span>
                                </div>

                                {/* Occurrence Filters - Inside each expanded section */}
                                <div style={{ 
                                  marginBottom: '16px',
                                  padding: '16px',
                                  background: '#fff',
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0'
                              }}>
                                <div style={{ 
                                  fontWeight: 600, 
                                    fontSize: '13px', 
                                  color: '#333', 
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    🔍 Filter Occurrences
                                  </div>
                                  
                                  {/* Simple Month Filter */}
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px',
                                    marginBottom: '16px',
                                    padding: '12px',
                                    background: '#f8f9fa',
                                    borderRadius: '6px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <span style={{ fontWeight: 600, color: '#666', fontSize: '12px' }}>Month Filter:</span>
                                    
                                    <select
                                      value={shiftOccurrenceFilters[shift.id]?.monthFilter ?? ''}
                                      onChange={(e) => updateShiftFilter(shift.id, 'monthFilter', e.target.value)}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                        fontSize: '12px',
                                        background: '#fff',
                                        minWidth: '150px'
                                      }}
                                    >
                                      <option value="">All Months (52 occurrences)</option>
                                      {generateAvailableMonths().map((month) => (
                                        <option key={month.value} value={month.value}>
                                          {month.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div style={{ 
                                    display: 'flex', 
                                    gap: '12px', 
                                    alignItems: 'center',
                                    flexWrap: 'wrap'
                                  }}>
                                    {/* Status Filter */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <label style={{ fontSize: '12px', color: '#666' }}>
                                        <input
                                          type="checkbox"
                                          checked={shiftOccurrenceFilters[shift.id]?.showActive ?? true}
                                          onChange={(e) => updateShiftFilter(shift.id, 'showActive', e.target.checked)}
                                          style={{ marginRight: '4px' }}
                                        />
                                        Active
                                      </label>
                                      <label style={{ fontSize: '12px', color: '#666' }}>
                                        <input
                                          type="checkbox"
                                          checked={shiftOccurrenceFilters[shift.id]?.showInactive ?? true}
                                          onChange={(e) => updateShiftFilter(shift.id, 'showInactive', e.target.checked)}
                                          style={{ marginRight: '4px' }}
                                        />
                                        Inactive
                                      </label>
                                    </div>

                                    {/* Search Filter */}
                                    <input
                                      type="text"
                                      placeholder="Search by month or date..."
                                      value={shiftOccurrenceFilters[shift.id]?.searchText ?? ''}
                                      onChange={(e) => updateShiftFilter(shift.id, 'searchText', e.target.value)}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                        fontSize: '12px',
                                        minWidth: '180px'
                                      }}
                                    />

                                    {/* Clear Filters */}
                                    <button
                                      onClick={() => {
                                        setShiftOccurrenceFilters(prev => ({
                                          ...prev,
                                          [shift.id]: {
                                            showActive: true,
                                            showInactive: true,
                                            searchText: '',
                                            monthFilter: ''
                                          }
                                        }));
                                      }}
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                        background: '#f8f9fa',
                                        color: '#666',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Clear
                                    </button>
                                  </div>

                                  {/* Filter Results Summary */}
                                  <div style={{ 
                                    marginTop: '12px',
                                    padding: '8px 12px',
                                    background: '#f0f8ff',
                                    borderRadius: '4px',
                                    border: '1px solid #b3d9ff',
                                    fontSize: '11px',
                                    color: '#0066cc'
                                  }}>
                                    Showing <strong>{
                                      getFilteredOccurrences(shift.id, shiftOccurrences[shift.id] || [], shift).length
                                    }</strong> of <strong>{shiftOccurrences[shift.id]?.length || 0}</strong> occurrences
                                  </div>
                                </div>
                                {loadingOccurrences[shift.id] ? (
                                  <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                                    Loading occurrences...
                                  </div>
                                ) : (
                                  <div>
                                    {(() => {
                                      const filteredOccurrences = getFilteredOccurrences(shift.id, shiftOccurrences[shift.id] || [], shift);
                                      const groupedOccurrences = groupOccurrencesByMonth(filteredOccurrences);
                                      return Object.entries(groupedOccurrences).map(([monthKey, monthOccurrences]) => (
                                        <div key={monthKey} style={{ marginBottom: '20px' }}>
                                          <div style={{ 
                                            fontWeight: 600, 
                                            fontSize: 13, 
                                            color: '#666', 
                                            marginBottom: '12px',
                                            padding: '8px 12px',
                                            background: '#fff',
                                            borderRadius: '6px',
                                            border: '1px solid #e0e0e0'
                                          }}>
                                            {getMonthNameFromKey(monthKey)} ({monthOccurrences.length} occurrences)
                                          </div>
                                          <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                                            gap: '12px' 
                                          }}>
                                            {monthOccurrences.map((occurrence, index) => (
                                      <div key={index} style={{
                                        background: '#fff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#ff9800';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                        e.currentTarget.style.boxShadow = 'none';
                                      }}>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                                            {occurrence.dayName}, {occurrence.date.toLocaleDateString('en-CA', { 
                                              month: 'short', 
                                              day: 'numeric', 
                                              year: 'numeric',
                                              timeZone: 'America/Halifax'
                                            })}
                                          </div>
                                          <div style={{ fontSize: 12, color: '#666', marginTop: '4px' }}>
                                            {occurrence.startTime.toLocaleTimeString('en-CA', { 
                                              hour: '2-digit', 
                                              minute: '2-digit', 
                                              hour12: false, 
                                              timeZone: 'America/Halifax' 
                                            })} - {occurrence.endTime.toLocaleTimeString('en-CA', { 
                                              hour: '2-digit', 
                                              minute: '2-digit', 
                                              hour12: false, 
                                              timeZone: 'America/Halifax' 
                                            })}
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOccurrenceClick(shift, occurrence);
                                            }}
                                            style={{
                                              background: '#ff9800',
                                              color: '#fff',
                                              border: 'none',
                                              borderRadius: 4,
                                              padding: '4px 8px',
                                              fontSize: 11,
                                              cursor: 'pointer',
                                              marginTop: '4px',
                                              fontWeight: 500
                                            }}
                                          >
                                            Manage Absences
                                          </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleOccurrenceStatus(shift.id, occurrence.date);
                                            }}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              color: getOccurrenceStatus(shift.id, occurrence.date) ? '#4caf50' : '#9e9e9e',
                                              cursor: 'pointer',
                                              fontSize: 16,
                                              padding: '4px'
                                            }}
                                            title={getOccurrenceStatus(shift.id, occurrence.date) ? 'Deactivate' : 'Activate'}
                                          >
                                            {getOccurrenceStatus(shift.id, occurrence.date) ? <FaToggleOn /> : <FaToggleOff />}
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                          </div>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            )}
            {/* Add Shift Modal */}
            {showAddRecurring && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 600, maxWidth: '90vw', boxShadow: '0 2px 16px #ddd', position: 'relative' }}>
                  <button onClick={() => {
                    setShowAddRecurring(false);
                    setAddShiftUserSearchTerm('');
                  }} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Add Shift</div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                      {/* Left Column - Basic Info & Timing */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Shift Name *</label>
                        <input placeholder="Enter shift name" value={addRecurring.name} onChange={e => setAddRecurring(r => ({ ...r, name: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, name: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, name: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                      </div>
                      {addRecurringTouched.name && !isRecurringNameValid && <div style={{ color: 'red', fontSize: 13 }}>Name is required.</div>}
                      
                      {/* Shift Type Selection */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>Shift Type *</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="shiftType"
                              checked={addRecurring.isRecurring}
                              onChange={() => setAddRecurring(r => ({ ...r, isRecurring: true }))}
                              style={{ margin: 0 }}
                            />
                            <span style={{ fontSize: 14 }}>Recurring</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="shiftType"
                              checked={!addRecurring.isRecurring}
                              onChange={() => setAddRecurring(r => ({ ...r, isRecurring: false }))}
                              style={{ margin: 0 }}
                            />
                            <span style={{ fontSize: 14 }}>One-time</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Day of Week - Only show for recurring shifts */}
                      {addRecurring.isRecurring && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Day of Week *</label>
                          <select value={addRecurring.dayOfWeek} onChange={e => setAddRecurring(r => ({ ...r, dayOfWeek: Number(e.target.value) }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, dayOfWeek: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, dayOfWeek: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}>
                            {[...Array(7)].map((_, i) => <option key={i} value={i}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]}</option>)}
                          </select>
                        </div>
                      )}
                      
                      {/* Date/Time inputs based on shift type */}
                      {addRecurring.isRecurring ? (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Start Time *</label>
                            <input type="time" value={addRecurring.startTime} onChange={e => setAddRecurring(r => ({ ...r, startTime: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, startTime: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, startTime: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                          </div>
                          {addRecurringTouched.startTime && !isRecurringStartTimeValid && <div style={{ color: 'red', fontSize: 13 }}>Start time is required.</div>}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>End Time *</label>
                            <input type="time" value={addRecurring.endTime} onChange={e => setAddRecurring(r => ({ ...r, endTime: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, endTime: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, endTime: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                          </div>
                          {addRecurringTouched.endTime && !isRecurringEndTimeValid && <div style={{ color: 'red', fontSize: 13 }}>End time is required.</div>}
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Start Date & Time *</label>
                            <input type="datetime-local" value={addRecurring.startTime} onChange={e => setAddRecurring(r => ({ ...r, startTime: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, startTime: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, startTime: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                          </div>
                          {addRecurringTouched.startTime && !isRecurringStartTimeValid && <div style={{ color: 'red', fontSize: 13 }}>Start date & time is required.</div>}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>End Date & Time *</label>
                            <input type="datetime-local" value={addRecurring.endTime} onChange={e => setAddRecurring(r => ({ ...r, endTime: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, endTime: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, endTime: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                          </div>
                          {addRecurringTouched.endTime && !isRecurringEndTimeValid && <div style={{ color: 'red', fontSize: 13 }}>End date & time is required.</div>}
                        </>
                      )}
                    </div>

                    {/* Right Column - Category, Location & Slots */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Shift Category *</label>
                        <select value={addRecurring.shiftCategoryId} onChange={e => setAddRecurring(r => ({ ...r, shiftCategoryId: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, shiftCategoryId: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, shiftCategoryId: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}>
                          <option value="">Select Category</option>
                          {categoryOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.icon ? `${opt.icon} ` : ''}{opt.name}</option>)}
                        </select>
                      </div>
                      {addRecurringTouched.shiftCategoryId && !isRecurringCategoryValid && <div style={{ color: 'red', fontSize: 13 }}>Category is required.</div>}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Location *</label>
                        <input placeholder="Enter shift location" value={addRecurring.location} onChange={e => setAddRecurring(r => ({ ...r, location: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, location: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, location: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                      </div>
                      {addRecurringTouched.location && !isRecurringLocationValid && <div style={{ color: 'red', fontSize: 13 }}>Location is required.</div>}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Number of Volunteer Slots</label>
                        <input type="number" min={1} placeholder="Enter number of volunteers needed" value={addRecurring.slots} onChange={e => setAddRecurring(r => ({ ...r, slots: Number(e.target.value) }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, slots: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, slots: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                      </div>
                      {addRecurringTouched.slots && !isRecurringSlotsValid && <div style={{ color: 'red', fontSize: 13 }}>Slots must be at least 1.</div>}
                    </div>
                  </div>

                  {/* Default Users Section */}
                  <div style={{ marginTop: 20, padding: 16, border: '1px solid #eee', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>Default Users</span>
                      <span style={{ fontSize: 12, color: '#666' }}>(Optional - Users automatically assigned to every occurrence)</span>
                    </div>
                    
                    {defaultUsersError && (
                      <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{defaultUsersError}</div>
                    )}
                    
                    {loadingUsers ? (
                      <div style={{ color: '#666', fontSize: 14 }}>Loading users...</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                          Select users to automatically assign to this shift:
                        </div>
                        
                        {/* Search Bar */}
                        <div style={{ marginBottom: 8 }}>
                          <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={addShiftUserSearchTerm}
                            onChange={(e) => setAddShiftUserSearchTerm(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 6,
                              border: '1px solid #ddd',
                              fontSize: 14,
                              outline: 'none'
                            }}
                          />
                        </div>
                        
                        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4, padding: 8 }}>
                          {availableUsers.length === 0 ? (
                            <div style={{ color: '#666', fontSize: 14, textAlign: 'center', padding: 20 }}>
                              No approved users available
                            </div>
                          ) : (
                            availableUsers
                              .filter((user: any) => {
                                if (!addShiftUserSearchTerm) return true;
                                const searchLower = addShiftUserSearchTerm.toLowerCase();
                                const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                                const email = user.email?.toLowerCase() || '';
                                return fullName.includes(searchLower) || email.includes(searchLower);
                              })
                              .map((user: any) => (
                                <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedDefaultUsers.includes(user.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        if (selectedDefaultUsers.length >= addRecurring.slots) {
                                          toast.error(`Cannot select more than ${addRecurring.slots} users (shift slots limit)`);
                                          return;
                                        }
                                        setSelectedDefaultUsers(prev => [...prev, user.id]);
                                      } else {
                                        setSelectedDefaultUsers(prev => prev.filter(id => id !== user.id));
                                      }
                                    }}
                                    style={{ margin: 0 }}
                                  />
                                  <span style={{ fontSize: 14 }}>
                                    {user.firstName} {user.lastName} ({user.email})
                                  </span>
                                </label>
                              ))
                          )}
                        </div>
                        
                        {/* Search Results Count */}
                        {addShiftUserSearchTerm && (
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            Showing {availableUsers.filter((user: any) => {
                              const searchLower = addShiftUserSearchTerm.toLowerCase();
                              const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                              const email = user.email?.toLowerCase() || '';
                              return fullName.includes(searchLower) || email.includes(searchLower);
                            }).length} of {availableUsers.length} users
                          </div>
                        )}
                        
                        <div style={{ fontSize: 12, color: '#666' }}>
                          Selected: {selectedDefaultUsers.length} / {addRecurring.slots} slots
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Error Messages and Submit Button */}
                  <div style={{ marginTop: 16 }}>
                    {addRecurringError && <div style={{ color: 'red', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{addRecurringError}</div>}
                    <button onClick={handleAddRecurringShift} style={{ background: isRecurringFormValid ? '#EF5C11' : '#ccc', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 16, width: '100%', cursor: isRecurringFormValid ? 'pointer' : 'not-allowed', opacity: addingRecurring ? 0.7 : 1 }} disabled={addingRecurring || !isRecurringFormValid}>
                      {addingRecurring ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Edit Shift Modal */}
            {editRecurringId && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 600, maxWidth: '90vw', boxShadow: '0 2px 16px #ddd', position: 'relative' }}>
                  <button onClick={handleCancelEditRecurring} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Edit Shift</div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                      {/* Left Column - Basic Info & Timing */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Shift Name *</label>
                        <input placeholder="Enter shift name" value={editRecurring.name} onChange={e => setEditRecurring(r => ({ ...r, name: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                      </div>
                      
                      {/* Shift Type Display (Read-only) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>Shift Type</label>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 14,
                          fontWeight: 500,
                          background: editRecurring.isRecurring ? '#e3f2fd' : '#fff3e0',
                          color: editRecurring.isRecurring ? '#1976d2' : '#f57c00',
                          border: '1px solid #e0e0e0'
                        }}>
                          {editRecurring.isRecurring ? '🔄 Recurring' : '📅 One-time'}
                        </div>
                      </div>
                      
                      {/* Day of Week - Only show for recurring shifts */}
                      {editRecurring.isRecurring && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Day of Week *</label>
                          <select value={editRecurring.dayOfWeek} onChange={e => setEditRecurring(r => ({ ...r, dayOfWeek: Number(e.target.value) }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}>
                            {[...Array(7)].map((_, i) => <option key={i} value={i}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]}</option>)}
                          </select>
                        </div>
                      )}
                      
                      {/* Date/Time inputs based on shift type */}
                      {editRecurring.isRecurring ? (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Start Time *</label>
                            <input type="time" value={editRecurring.startTime} onChange={e => setEditRecurring(r => ({ ...r, startTime: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>End Time *</label>
                            <input type="time" value={editRecurring.endTime} onChange={e => setEditRecurring(r => ({ ...r, endTime: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Start Date & Time *</label>
                            <input type="datetime-local" value={editRecurring.startTime} onChange={e => setEditRecurring(r => ({ ...r, startTime: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>End Date & Time *</label>
                            <input type="datetime-local" value={editRecurring.endTime} onChange={e => setEditRecurring(r => ({ ...r, endTime: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right Column - Category, Location & Slots */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Shift Category *</label>
                        <select value={editRecurring.shiftCategoryId} onChange={e => setEditRecurring(r => ({ ...r, shiftCategoryId: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}>
                          <option value="">Select Category</option>
                          {categoryOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.icon ? `${opt.icon} ` : ''}{opt.name}</option>)}
                        </select>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Location *</label>
                        <input placeholder="Enter shift location" value={editRecurring.location} onChange={e => setEditRecurring(r => ({ ...r, location: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Number of Volunteer Slots</label>
                        <input type="number" min={1} placeholder="Enter number of volunteers needed" value={editRecurring.slots} onChange={e => setEditRecurring(r => ({ ...r, slots: Number(e.target.value) }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                      </div>
                    </div>
                  </div>

                  {/* Default Users Section */}
                  <div style={{ marginTop: 20, padding: 16, border: '2px solid #ff0000', borderRadius: 8, backgroundColor: '#fff3cd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#ff0000' }}>🔴 DEFAULT USERS SECTION 🔴</span>
                      <span style={{ fontSize: 12, color: '#666' }}>(Optional - Users automatically assigned to every occurrence)</span>
                    </div>
                    
                    {defaultUsersError && (
                      <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{defaultUsersError}</div>
                    )}
                    
                    {loadingUsers ? (
                      <div style={{ color: '#666', fontSize: 14 }}>Loading users...</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                          Select users to automatically assign to this shift:
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                          Debug: Available users: {availableUsers.length}, Selected: {selectedDefaultUsers.length}, Selected IDs: {JSON.stringify(selectedDefaultUsers)}
                        </div>
                        <div style={{ fontSize: 14, color: '#ff0000', fontWeight: 600, marginBottom: 8 }}>
                          ✅ DEFAULT USERS SECTION IS VISIBLE! ✅
                        </div>
                        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4, padding: 8 }}>
                          {availableUsers.length === 0 ? (
                            <div style={{ color: '#666', fontSize: 14, textAlign: 'center', padding: 20 }}>
                              No approved users available
                            </div>
                          ) : (
                            availableUsers.map((user: any) => (
                              <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedDefaultUsers.includes(user.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (selectedDefaultUsers.length >= editRecurring.slots) {
                                        toast.error(`Cannot select more than ${editRecurring.slots} users (shift slots limit)`);
                                        return;
                                      }
                                      setSelectedDefaultUsers(prev => [...prev, user.id]);
                                    } else {
                                      setSelectedDefaultUsers(prev => prev.filter(id => id !== user.id));
                                    }
                                  }}
                                  style={{ margin: 0 }}
                                />
                                <span style={{ fontSize: 14 }}>
                                  {user.firstName} {user.lastName} ({user.email})
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          Selected: {selectedDefaultUsers.length} / {editRecurring.slots} slots
                        </div>
                        {selectedDefaultUsers.length === 0 && (
                          <div style={{ fontSize: 14, color: '#ff6b35', fontWeight: 600, padding: 8, backgroundColor: '#ffeaa7', borderRadius: 4, textAlign: 'center' }}>
                            ⚠️ NO DEFAULT USERS ASSIGNED TO THIS SHIFT ⚠️
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Error Messages and Submit Button */}
                  <div style={{ marginTop: 16 }}>
                    {editRecurringError && <div style={{ color: 'red', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{editRecurringError}</div>}
                    <button onClick={handleEditRecurringShift} style={{ background: '#ff9800', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 16, width: '100%', cursor: editingRecurring ? 'not-allowed' : 'pointer', opacity: editingRecurring ? 0.7 : 1 }} disabled={editingRecurring || !editRecurring.name.trim() || !editRecurring.startTime || !editRecurring.endTime || !editRecurring.shiftCategoryId || !editRecurring.location || !editRecurring.slots}>
                      {editingRecurring ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* No Category Modal */}
      {showNoCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 400, maxWidth: '90vw', boxShadow: '0 2px 16px #ddd', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setShowNoCategoryModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
            
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, color: '#333' }}>No Categories Available</div>
            <div style={{ fontSize: 16, color: '#666', marginBottom: 24, lineHeight: 1.5 }}>
              You need to create at least one shift category before you can add shifts.
              <br />
              Please create a category first.
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                onClick={() => setShowNoCategoryModal(false)} 
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: 6, 
                  border: '1px solid #ddd', 
                  background: '#fff', 
                  color: '#666', 
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowNoCategoryModal(false);
                  setTab('shiftcategory');
                  // Show a toast message to guide the user
                  toast.info('Please create a category first, then try adding shifts again.');
                }} 
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: 6, 
                  border: 'none', 
                  background: '#ff9800', 
                  color: '#fff', 
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                Go to Categories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Absence Management Modal */}
      {showAbsenceModal && selectedShift && selectedOccurrence && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 600, maxWidth: '90vw', boxShadow: '0 2px 16px #ddd', position: 'relative' }}>
            <button onClick={() => setShowAbsenceModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
            
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Manage Absences</div>
            
            <div style={{ marginBottom: 16, padding: 12, background: '#f8f9fa', borderRadius: 6, border: '1px solid #e0e0e0' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                {selectedOccurrence.dayName}, {selectedOccurrence.date.toLocaleDateString('en-CA', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  timeZone: 'America/Halifax'
                })}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {selectedOccurrence.startTime.toLocaleTimeString('en-CA', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: false, 
                  timeZone: 'America/Halifax' 
                })} - {selectedOccurrence.endTime.toLocaleTimeString('en-CA', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: false, 
                  timeZone: 'America/Halifax' 
                })}
              </div>
            </div>

            {loadingAbsences ? (
              <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>Loading absence data...</div>
            ) : (
              <div>
                {/* User Search and Selection */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: '#333' }}>
                    Select Users for Absence
                  </div>
                  
                  {/* Search Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1px solid #ddd',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                  </div>
                  
                  {/* User List with Checkboxes */}
                  {defaultUsersForOccurrence.length === 0 ? (
                    <div style={{ color: '#666', fontSize: 14, textAlign: 'center', padding: 20, background: '#f8f9fa', borderRadius: 6 }}>
                      No default users assigned to this shift
                    </div>
                  ) : (
                    <div style={{ 
                      maxHeight: 200, 
                      overflowY: 'auto', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 6,
                      background: '#fff'
                    }}>
                      {defaultUsersForOccurrence
                        .filter((defaultUser: any) => {
                          if (!userSearchTerm) return true;
                          const searchLower = userSearchTerm.toLowerCase();
                          const fullName = `${defaultUser.user.firstName} ${defaultUser.user.lastName}`.toLowerCase();
                          const email = defaultUser.user.email?.toLowerCase() || '';
                          return fullName.includes(searchLower) || email.includes(searchLower);
                        })
                        .map((defaultUser: any) => {
                          const isAbsent = shiftAbsences.some((absence: any) => 
                            absence.userId === defaultUser.userId && absence.isApproved
                          );
                          const pendingAbsence = shiftAbsences.find((absence: any) => 
                            absence.userId === defaultUser.userId && !absence.isApproved
                          );
                          const isSelected = selectedUsersForAbsence.includes(defaultUser.userId);
                          
                          return (
                            <div key={defaultUser.userId} style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: 12,
                              borderBottom: '1px solid #f0f0f0',
                              background: isSelected ? '#e3f2fd' : 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleUserSelection(defaultUser.userId)}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUserSelection(defaultUser.userId);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{ marginRight: 12, cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                                  {defaultUser.user.firstName} {defaultUser.user.lastName}
                                </div>
                                <div style={{ fontSize: 12, color: '#666' }}>
                                  {defaultUser.user.email}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {isAbsent && (
                                  <>
                                    <span style={{ 
                                      fontSize: 10, 
                                      color: '#d32f2f', 
                                      backgroundColor: '#ffcdd2',
                                      padding: '2px 6px',
                                      borderRadius: 4
                                    }}>
                                      ABSENT
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const absence = shiftAbsences.find((a: any) => a.userId === defaultUser.userId && a.isApproved);
                                        if (absence) {
                                          handleRemoveAbsence(absence.id);
                                        }
                                      }}
                                      style={{
                                        background: '#4caf50',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 4,
                                        padding: '4px 8px',
                                        fontSize: 10,
                                        cursor: 'pointer',
                                        fontWeight: 500
                                      }}
                                      title="Remove absence - make user present"
                                    >
                                      Present
                                    </button>
                                  </>
                                )}
                                {pendingAbsence && (
                                  <>
                                    <span style={{ 
                                      fontSize: 10, 
                                      color: '#f57c00', 
                                      backgroundColor: '#fff3e0',
                                      padding: '2px 6px',
                                      borderRadius: 4
                                    }}>
                                      PENDING
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAbsenceAction(pendingAbsence.id, true);
                                      }}
                                      style={{
                                        background: '#4caf50',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 4,
                                        padding: '4px 8px',
                                        fontSize: 10,
                                        cursor: 'pointer',
                                        fontWeight: 500
                                      }}
                                      title="Approve absence"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAbsenceAction(pendingAbsence.id, false);
                                      }}
                                      style={{
                                        background: '#f44336',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 4,
                                        padding: '4px 8px',
                                        fontSize: 10,
                                        cursor: 'pointer',
                                        fontWeight: 500
                                      }}
                                      title="Reject absence"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  
                  {/* Selected Count */}
                  {selectedUsersForAbsence.length > 0 && (
                    <div style={{ 
                      marginTop: 12, 
                      padding: 8, 
                      background: '#e3f2fd', 
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1976d2',
                      fontWeight: 500
                    }}>
                      {selectedUsersForAbsence.length} user(s) selected for absence
                    </div>
                  )}
                </div>

                {/* Absence Request Form */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: '#333' }}>
                    Absence Details
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4, display: 'block' }}>
                        Absence Type
                      </label>
                      <select
                        value={absenceType}
                        onChange={(e) => setAbsenceType(e.target.value)}
                        style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', width: '100%' }}
                      >
                        <option value="UNAVAILABLE">Unavailable</option>
                        <option value="SICK">Sick</option>
                        <option value="PERSONAL">Personal</option>
                        <option value="VACATION">Vacation</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4, display: 'block' }}>
                        Reason (Optional)
                      </label>
                      <textarea
                        value={absenceReason}
                        onChange={(e) => setAbsenceReason(e.target.value)}
                        placeholder="Enter reason for absence..."
                        style={{ 
                          padding: 8, 
                          borderRadius: 5, 
                          border: '1px solid #eee', 
                          width: '100%', 
                          minHeight: 80,
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Make Absence Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    onClick={() => setShowAbsenceModal(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      background: '#fff',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMakeAbsence}
                    disabled={selectedUsersForAbsence.length === 0}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 6,
                      border: 'none',
                      background: selectedUsersForAbsence.length === 0 ? '#ccc' : '#ff9800',
                      color: '#fff',
                      cursor: selectedUsersForAbsence.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    Make Absence ({selectedUsersForAbsence.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
} 