"use client";
import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlusCircle, FaToggleOn, FaToggleOff, FaCalendarAlt, FaClock } from "react-icons/fa";
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

  useEffect(() => {
    if (tab === 'recurringshifts' || showAddRecurring || editRecurringId) {
      fetchCategoryOptions();
    }
    // eslint-disable-next-line
  }, [tab, showAddRecurring, editRecurringId]);
  const fetchCategoryOptions = async () => {
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
      setCategories(data);
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
      toast.success(`${addRecurring.isRecurring ? 'Recurring' : 'One-time'} shift added successfully!`);
      
      setShowAddRecurring(false);
      setAddRecurring({ name: '', dayOfWeek: 0, startTime: '', endTime: '', shiftCategoryId: '', location: '', slots: 1, isRecurring: true });
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
        // Set the time for this occurrence
        const startTime = new Date(shift.startTime);
        const endTime = new Date(shift.endTime);
        
        const occurrenceStart = new Date(currentDate);
        occurrenceStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        
        const occurrenceEnd = new Date(currentDate);
        occurrenceEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        
        occurrences.push({
          date: new Date(currentDate),
          startTime: occurrenceStart,
          endTime: occurrenceEnd,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()]
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
        const occurrenceDate = new Date(startDate);
        occurrenceDate.setDate(startDate.getDate() + dayDiff + (i * 7));
        
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
          
          // Create new shift for this occurrence with the desired status
          const startTime = new Date(occurrenceDate);
          const shiftStart = new Date(shift.startTime);
          startTime.setHours(shiftStart.getHours(), shiftStart.getMinutes(), 0, 0);
          
          const endTime = new Date(occurrenceDate);
          const shiftEnd = new Date(shift.endTime);
          endTime.setHours(shiftEnd.getHours(), shiftEnd.getMinutes(), 0, 0);
          
          const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              name: shift.name,
              shiftCategoryId: shift.shiftCategoryId,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              location: shift.location,
              slots: shift.slots,
              recurringShiftId: shiftId,
              isActive: desiredStatus // Create as inactive since user clicked to deactivate
            })
          });
          
          if (!createRes.ok) {
            const errorData = await createRes.json();
            throw new Error(errorData.error || 'Failed to create shift');
          }
          
          toast.success('Occurrence created and deactivated successfully');
        }
        
        // Refresh the shifts data and occurrences
        await fetchShifts();
        const occurrences = calculateNextOccurrences(shift);
        setShiftOccurrences(prev => ({ ...prev, [shiftId]: occurrences }));
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
                setShowAddRecurring(true);
                // Auto-select Special Events category if mode is active
                if (specialEventsMode && categoryOptions.length > 0) {
                  const specialEventsCategory = categoryOptions.find(cat => cat.name === 'Special Events');
                  if (specialEventsCategory) {
                    setAddRecurring(prev => ({ ...prev, shiftCategoryId: specialEventsCategory.id }));
                  }
                }
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
                                        alignItems: 'center'
                                      }}>
                                        <div>
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
                                        </div>
                                        <button
                                          onClick={() => toggleOccurrenceStatus(shift.id, occurrence.date)}
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
                <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 400, boxShadow: '0 2px 16px #ddd', position: 'relative' }}>
                  <button onClick={() => setShowAddRecurring(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Add Shift</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input placeholder="Name" value={addRecurring.name} onChange={e => setAddRecurring(r => ({ ...r, name: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, name: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, name: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
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
                      <select value={addRecurring.dayOfWeek} onChange={e => setAddRecurring(r => ({ ...r, dayOfWeek: Number(e.target.value) }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, dayOfWeek: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, dayOfWeek: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}>
                        {[...Array(7)].map((_, i) => <option key={i} value={i}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]}</option>)}
                      </select>
                    )}
                    
                    {/* Date/Time inputs based on shift type */}
                    {addRecurring.isRecurring ? (
                      <>
                        <input type="time" value={addRecurring.startTime} onChange={e => setAddRecurring(r => ({ ...r, startTime: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, startTime: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, startTime: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                        {addRecurringTouched.startTime && !isRecurringStartTimeValid && <div style={{ color: 'red', fontSize: 13 }}>Start time is required.</div>}
                        <input type="time" value={addRecurring.endTime} onChange={e => setAddRecurring(r => ({ ...r, endTime: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, endTime: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, endTime: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                        {addRecurringTouched.endTime && !isRecurringEndTimeValid && <div style={{ color: 'red', fontSize: 13 }}>End time is required.</div>}
                      </>
                    ) : (
                      <>
                        <input type="datetime-local" value={addRecurring.startTime} onChange={e => setAddRecurring(r => ({ ...r, startTime: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, startTime: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, startTime: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                        {addRecurringTouched.startTime && !isRecurringStartTimeValid && <div style={{ color: 'red', fontSize: 13 }}>Start date & time is required.</div>}
                        <input type="datetime-local" value={addRecurring.endTime} onChange={e => setAddRecurring(r => ({ ...r, endTime: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, endTime: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, endTime: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                        {addRecurringTouched.endTime && !isRecurringEndTimeValid && <div style={{ color: 'red', fontSize: 13 }}>End date & time is required.</div>}
                      </>
                    )}
                    
                    <select value={addRecurring.shiftCategoryId} onChange={e => setAddRecurring(r => ({ ...r, shiftCategoryId: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, shiftCategoryId: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, shiftCategoryId: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}>
                      <option value="">Select Category</option>
                      {categoryOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.icon ? `${opt.icon} ` : ''}{opt.name}</option>)}
                    </select>
                    {addRecurringTouched.shiftCategoryId && !isRecurringCategoryValid && <div style={{ color: 'red', fontSize: 13 }}>Category is required.</div>}
                    <input placeholder="Location" value={addRecurring.location} onChange={e => setAddRecurring(r => ({ ...r, location: e.target.value }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, location: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, location: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                    {addRecurringTouched.location && !isRecurringLocationValid && <div style={{ color: 'red', fontSize: 13 }}>Location is required.</div>}
                    <input type="number" min={1} placeholder="Slots" value={addRecurring.slots} onChange={e => setAddRecurring(r => ({ ...r, slots: Number(e.target.value) }))} onBlur={() => setAddRecurringTouched(t => ({ ...t, slots: true }))} onFocus={() => setAddRecurringTouched(t => ({ ...t, slots: true }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                    {addRecurringTouched.slots && !isRecurringSlotsValid && <div style={{ color: 'red', fontSize: 13 }}>Slots must be at least 1.</div>}
                    {addRecurringError && <div style={{ color: 'red', fontSize: 13, textAlign: 'center' }}>{addRecurringError}</div>}
                    <button onClick={handleAddRecurringShift} style={{ background: isRecurringFormValid ? '#EF5C11' : '#ccc', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 16, marginTop: 8, cursor: isRecurringFormValid ? 'pointer' : 'not-allowed', opacity: addingRecurring ? 0.7 : 1 }} disabled={addingRecurring || !isRecurringFormValid}>
                      {addingRecurring ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Edit Shift Modal */}
            {editRecurringId && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 340, boxShadow: '0 2px 16px #ddd', position: 'relative' }}>
                  <button onClick={handleCancelEditRecurring} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}>×</button>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Edit Shift</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input placeholder="Name" value={editRecurring.name} onChange={e => setEditRecurring(r => ({ ...r, name: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                    
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
                      <select value={editRecurring.dayOfWeek} onChange={e => setEditRecurring(r => ({ ...r, dayOfWeek: Number(e.target.value) }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}>
                        {[...Array(7)].map((_, i) => <option key={i} value={i}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]}</option>)}
                      </select>
                    )}
                    
                    {/* Date/Time inputs based on shift type */}
                    {editRecurring.isRecurring ? (
                      <>
                        <input type="time" value={editRecurring.startTime} onChange={e => setEditRecurring(r => ({ ...r, startTime: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                        <input type="time" value={editRecurring.endTime} onChange={e => setEditRecurring(r => ({ ...r, endTime: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                      </>
                    ) : (
                      <>
                        <input type="datetime-local" value={editRecurring.startTime} onChange={e => setEditRecurring(r => ({ ...r, startTime: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                        <input type="datetime-local" value={editRecurring.endTime} onChange={e => setEditRecurring(r => ({ ...r, endTime: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                      </>
                    )}
                    
                    <select value={editRecurring.shiftCategoryId} onChange={e => setEditRecurring(r => ({ ...r, shiftCategoryId: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }}>
                      <option value="">Select Category</option>
                      {categoryOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.icon ? `${opt.icon} ` : ''}{opt.name}</option>)}
                    </select>
                    <input placeholder="Location" value={editRecurring.location} onChange={e => setEditRecurring(r => ({ ...r, location: e.target.value }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                    <input type="number" min={1} placeholder="Slots" value={editRecurring.slots} onChange={e => setEditRecurring(r => ({ ...r, slots: Number(e.target.value) }))} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} />
                    {editRecurringError && <div style={{ color: 'red', fontSize: 13, textAlign: 'center' }}>{editRecurringError}</div>}
                    <button onClick={handleEditRecurringShift} style={{ background: '#ff9800', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 16, marginTop: 8, cursor: editingRecurring ? 'not-allowed' : 'pointer', opacity: editingRecurring ? 0.7 : 1 }} disabled={editingRecurring || !editRecurring.name.trim() || !editRecurring.startTime || !editRecurring.endTime || !editRecurring.shiftCategoryId || !editRecurring.location || !editRecurring.slots}>
                      {editingRecurring ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
} 