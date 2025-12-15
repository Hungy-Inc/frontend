'use client';

import { useState, useEffect } from 'react';
import ManageAssignablePeopleModal from './ManageAssignablePeopleModal';

interface AssignablePerson {
  id: number;
  name: string;
}

interface NewGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewGrantModal({ isOpen, onClose, onSuccess }: NewGrantModalProps) {
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
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const uploadDocuments = async (grantId: number, files: FileList): Promise<boolean> => {
    setUploadingFiles(true);
    setUploadStatus('Uploading documents...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setUploadStatus('Upload warning: Authentication required. Please log in again.');
        return false;
      }

      const formData = new FormData();

      // Add all selected files to FormData
      Array.from(files).forEach((file) => {
        console.log(`Adding file to FormData: ${file.name}, type: ${file.type}, size: ${file.size}`);
        formData.append('files', file);
      });

      console.log(`Uploading ${files.length} file(s) for grant ${grantId}`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/custom-grants/${grantId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Upload successful:', data);
        setUploadStatus(`Documents uploaded successfully (${data.documents?.length || files.length} file(s))`);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        setUploadStatus(`Upload warning: ${errorData.error || 'Failed to upload some files'}`);
        // Don't fail the whole operation if upload fails
        return false;
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      setUploadStatus('Upload warning: Network error. You can upload documents later.');
      // Don't fail the whole operation if upload fails
      return false;
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Grant name is required');
      return;
    }

    setLoading(true);
    setError('');
    setUploadStatus('');

    try {
      const token = localStorage.getItem('token');
      
      // Step 1: Create the grant
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/custom-grants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
          assignedTo: selectedPeople.length > 0 ? selectedPeople.join(', ') : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const grantId = data.grant.id;

        // Step 2: Upload files if any were selected
        if (selectedFiles && selectedFiles.length > 0) {
          await uploadDocuments(grantId, selectedFiles);
        }

        // Success - grant created (and files uploaded if selected)
        onSuccess();
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create grant');
      }
    } catch (err) {
      setError('An error occurred while creating the grant');
      console.error('Error creating grant:', err);
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      status: 'INTERESTED',
      deadline: '',
      grantLimit: '',
      projectProgram: '',
      websiteUrl: '',
      applicationUrl: '',
      lastApprovalNotes: '',
    });
    setSelectedPeople([]);
    setSelectedFiles(null);
    setError('');
    setUploadStatus('');
    // Reset file input
    const fileInput = document.getElementById('grant-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const togglePersonSelection = (personName: string) => {
    setSelectedPeople(prev => 
      prev.includes(personName)
        ? prev.filter(name => name !== personName)
        : [...prev, personName]
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto my-8">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Grant Application</h2>
              <p className="text-sm text-gray-600 mt-1">Fill in the details to track a new grant opportunity</p>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Grant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Community Food Security Grant"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Status and Deadline Row */}
            <div className="grid grid-cols-2 gap-4">
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
            <div>
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
            <div>
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
            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="https://apply.example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Assigned To */}
            <div>
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Approval/Notes</label>
              <textarea
                value={formData.lastApprovalNotes}
                onChange={(e) => setFormData({ ...formData, lastApprovalNotes: e.target.value })}
                placeholder="e.g., $25,000 received in 2024 for emergency food program"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Documents Upload Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents (Optional)
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    id="grant-file-upload"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip"
                    disabled={loading || uploadingFiles}
                  />
                </div>
                
                {/* File List Preview */}
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Selected Files ({selectedFiles.length}):
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-gray-600 bg-white p-2 rounded">
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="ml-2 text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Status */}
                {uploadStatus && (
                  <div className={`text-xs px-3 py-2 rounded-lg ${
                    uploadStatus.includes('warning') || uploadStatus.includes('error')
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {uploadStatus}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  You can upload documents now or add them later from the grant list.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingFiles}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadingFiles ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading Documents...
                  </>
                ) : loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Grant...
                  </>
                ) : (
                  'Create Grant'
                )}
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
