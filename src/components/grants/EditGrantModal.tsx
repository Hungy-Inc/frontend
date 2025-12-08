'use client';

import { useState, useEffect } from 'react';
import ManageAssignablePeopleModal from './ManageAssignablePeopleModal';

interface AssignablePerson {
  id: number;
  name: string;
}

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
}

interface EditGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  grant: Grant | null;
}

export default function EditGrantModal({ isOpen, onClose, onSuccess, grant }: EditGrantModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    status: 'INTERESTED',
    deadline: '',
    grantLimit: '',
    projectProgram: '',
    websiteUrl: '',
    applicationUrl: '',
    lastApprovalNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignablePeople, setAssignablePeople] = useState<AssignablePerson[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [isManagePeopleModalOpen, setIsManagePeopleModalOpen] = useState(false);

  // Fetch assignable people
  useEffect(() => {
    if (isOpen) {
      fetchAssignablePeople();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchAssignablePeople = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignable-people`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssignablePeople(data.people || []);
      }
    } catch (error) {
      console.error('Error fetching assignable people:', error);
    }
  };

  const togglePersonSelection = (personName: string) => {
    setSelectedPeople(prev => 
      prev.includes(personName)
        ? prev.filter(name => name !== personName)
        : [...prev, personName]
    );
  };

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Populate form when grant changes
  useEffect(() => {
    if (grant && isOpen) {
      setFormData({
        title: grant.title || '',
        status: grant.status || 'INTERESTED',
        deadline: grant.deadline ? grant.deadline.split('T')[0] : '',
        grantLimit: grant.grantLimit || '',
        projectProgram: grant.projectProgram || '',
        websiteUrl: grant.websiteUrl || '',
        applicationUrl: grant.applicationUrl || '',
        lastApprovalNotes: grant.lastApprovalNotes || '',
      });
      // Parse assignedTo string into array
      if (grant.assignedTo) {
        setSelectedPeople(grant.assignedTo.split(', ').map(name => name.trim()));
      } else {
        setSelectedPeople([]);
      }
      setError('');
    }
  }, [grant, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grant) return;

    if (!formData.title.trim()) {
      setError('Grant name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/custom-grants/${grant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          assignedTo: selectedPeople.length > 0 ? selectedPeople.join(', ') : null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update grant');
      }
    } catch (err) {
      setError('Error updating grant');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !grant) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto my-8">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Grant</h2>
              <p className="text-sm text-gray-600 mt-1">Update the grant details</p>
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
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Grant Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Grant Name *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Small Business Growth Fund"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Status and Deadline Row */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INTERESTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="FUNDED">Funded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Grant Limit */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Grant Limit</label>
              <input
                type="text"
                value={formData.grantLimit}
                onChange={(e) => setFormData({ ...formData, grantLimit: e.target.value })}
                placeholder="e.g., Up to $15,000 or No limit"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Project/Program */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Project/Program</label>
              <input
                type="text"
                value={formData.projectProgram}
                onChange={(e) => setFormData({ ...formData, projectProgram: e.target.value })}
                placeholder="e.g., Weekend Food Backpack Program"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Website URL and Application Link */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Application Link</label>
                <input
                  type="url"
                  value={formData.applicationUrl}
                  onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                  placeholder="https://example.com/apply"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Assigned To */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <button
                  type="button"
                  onClick={() => setIsManagePeopleModalOpen(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Manage People
                </button>
              </div>
              {assignablePeople.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No assignable people yet. Click "Manage People" to add.
                </p>
              ) : (
                <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="space-y-2">
                    {assignablePeople.map((person) => (
                      <label
                        key={person.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPeople.includes(person.name)}
                          onChange={() => togglePersonSelection(person.name)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{person.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {selectedPeople.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  Selected: {selectedPeople.join(', ')}
                </p>
              )}
            </div>

            {/* Last Approval/Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Approval/Notes</label>
              <textarea
                value={formData.lastApprovalNotes}
                onChange={(e) => setFormData({ ...formData, lastApprovalNotes: e.target.value })}
                placeholder="Add any notes or approval details..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Grant'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Manage Assignable People Modal */}
      <ManageAssignablePeopleModal
        isOpen={isManagePeopleModalOpen}
        onClose={() => setIsManagePeopleModalOpen(false)}
        onUpdate={fetchAssignablePeople}
      />
    </>
  );
}
