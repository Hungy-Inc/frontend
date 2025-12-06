
'use client';

import { useState, useEffect } from 'react';
import { FaUpload, FaArrowRight, FaCheck, FaTimes, FaFileCsv, FaFileExcel, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Modal from './Modal';
import { toast } from 'react-toastify';

interface BulkImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string | number;
    onSuccess: () => void;
}

interface ImportResult {
    batchId: number;
    successCount: number;
    failureCount: number;
    failedRows: Array<{
        row: number;
        data: any;
        error: string;
    }>;
}

export default function BulkImportWizard({ isOpen, onClose, organizationId, onSuccess }: BulkImportWizardProps) {
    const [step, setStep] = useState<'upload' | 'mapping' | 'result'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, any>>({});
    const [orgFields, setOrgFields] = useState<any[]>([]);
    const [updateExisting, setUpdateExisting] = useState(false);
    const [defaultRole, setDefaultRole] = useState('VOLUNTEER');
    const [defaultStatus, setDefaultStatus] = useState('PENDING');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const standardFields = [
        { id: 'firstName', label: 'First Name', required: true },
        { id: 'lastName', label: 'Last Name', required: true },
        { id: 'email', label: 'Email', required: true },
        { id: 'phone', label: 'Phone', required: false },
    ];

    useEffect(() => {
        if (isOpen && organizationId) {
            fetchOrgFields();
            resetState();
        }
    }, [isOpen, organizationId]);

    const resetState = () => {
        setStep('upload');
        setFile(null);
        setHeaders([]);
        setMapping({});
        setUpdateExisting(false);
        setDefaultRole('VOLUNTEER');
        setDefaultStatus('PENDING');
        setResult(null);
    };

    const fetchOrgFields = async () => {
        try {
            const token = localStorage.getItem('superAdminToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${organizationId}/registration-fields`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOrgFields(data);
            }
        } catch (error) {
            console.error('Error fetching org fields:', error);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            if (data && data.length > 0) {
                const fileHeaders = (data[0] as string[]).map(h => h.trim()).filter(h => h);
                setHeaders(fileHeaders);
                // Auto-map based on name similarity
                const newMapping: Record<string, string> = {};

                // Map standard fields
                standardFields.forEach(field => {
                    const match = fileHeaders.find(h => h.toLowerCase().replace(/[^a-z0-9]/g, '') === field.id.toLowerCase());
                    if (match) newMapping[field.id] = match;
                });

                // Map custom fields
                orgFields.forEach(field => {
                    const fieldId = `field_${field.fieldDefinitionId}`;
                    const match = fileHeaders.find(h =>
                        h.toLowerCase().includes(field.fieldDefinition.label.toLowerCase()) ||
                        h.toLowerCase().includes(field.fieldDefinition.name.toLowerCase())
                    );
                    if (match) newMapping[fieldId] = match;
                });

                setMapping(newMapping);
                setStep('mapping');
            } else {
                toast.error('File is empty or invalid format');
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleImport = async () => {
        if (!file) return;

        // Validation
        const missingRequired = standardFields.filter(f => f.required && !mapping[f.id]);
        if (missingRequired.length > 0) {
            toast.error(`Please map required fields: ${missingRequired.map(f => f.label).join(', ')}`);
            return;
        }

        const requiredOrgFields = orgFields.filter(f => f.isRequired);
        const missingOrgRequired = requiredOrgFields.filter(f => !mapping[`field_${f.fieldDefinitionId}`]);
        if (missingOrgRequired.length > 0) {
            toast.error(`Please map required registration fields: ${missingOrgRequired.map(f => f.fieldDefinition.label).join(', ')}`);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('superAdminToken');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mapping', JSON.stringify(mapping));
            formData.append('updateExisting', String(updateExisting));
            formData.append('defaultRole', defaultRole);
            formData.append('defaultStatus', defaultStatus);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/organizations/${organizationId}/users/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
                setStep('result');
                onSuccess();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import users');
        } finally {
            setLoading(false);
        }
    };

    const downloadErrorLog = () => {
        if (!result || !result.failedRows.length) return;

        const csvContent = [
            // Headers
            [...headers, 'Error Message'].join(','),
            // Rows
            ...result.failedRows.map(row => {
                const rowData = headers.map(h => {
                    const val = row.data[h] || '';
                    return `"${String(val).replace(/"/g, '""')}"`;
                });
                return [...rowData, `"${row.error}"`].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `import-errors-${result.batchId}.csv`;
        a.click();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk User Import" size="lg">
            <div className="space-y-6">

                {/* Steps Indicator */}
                <div className="flex items-center justify-center gap-4 text-sm font-medium text-gray-500 mb-8 border-b border-gray-100 pb-4">
                    <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-orange-600' : ''}`}>
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">1</span> Upload
                    </div>
                    <FaArrowRight size={12} className="text-gray-300" />
                    <div className={`flex items-center gap-2 ${step === 'mapping' ? 'text-orange-600' : ''}`}>
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">2</span> Map Columns
                    </div>
                    <FaArrowRight size={12} className="text-gray-300" />
                    <div className={`flex items-center gap-2 ${step === 'result' ? 'text-orange-600' : ''}`}>
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">3</span> Result
                    </div>
                </div>

                {step === 'upload' && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors relative">
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl">
                                <FaUpload />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Click to Upload File</h3>
                                <p className="text-gray-500 text-sm mt-1">Supports CSV and Excel (.xlsx)</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'mapping' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-blue-800 flex items-center gap-2">
                                <FaFileExcel />
                                {file?.name} ({headers.length} columns found)
                            </span>
                            <button onClick={resetState} className="text-xs text-blue-600 hover:underline">Change File</button>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="updateExisting"
                                checked={updateExisting}
                                onChange={(e) => setUpdateExisting(e.target.checked)}
                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <label htmlFor="updateExisting" className="text-sm text-gray-700 font-medium">Update existing users if email matches (Upsert)</label>
                        </div>

                        <div className="flex flex-col gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="text-sm font-bold text-gray-700">Default Role for this Batch</label>
                            <select
                                value={defaultRole}
                                onChange={(e) => setDefaultRole(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                            >
                                <option value="VOLUNTEER">Volunteer (Default)</option>
                                <option value="ADMIN">Organization Admin</option>
                                <option value="SUPERADMIN">Super Admin</option>
                            </select>
                            <p className="text-xs text-gray-500">This role will be assigned to all users in this import file.</p>
                        </div>

                        <div className="flex flex-col gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="text-sm font-bold text-gray-700">Default Status for this Batch</label>
                            <select
                                value={defaultStatus}
                                onChange={(e) => setDefaultStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                            >
                                <option value="PENDING">Pending (Default)</option>
                                <option value="APPROVED">Approved</option>
                                <option value="DENIED">Denied</option>
                            </select>
                            <p className="text-xs text-gray-500">This status will be applied to all new users.</p>
                        </div>

                        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-start max-h-[50vh] overflow-y-auto pr-2">
                            <div className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">System Field</div>
                            <div className="w-8"></div>
                            <div className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">File Column</div>

                            {/* Standard Fields */}
                            {standardFields.map(field => (
                                <MappableRow
                                    key={field.id}
                                    field={field}
                                    headers={headers}
                                    value={mapping[field.id]}
                                    onChange={(val) => setMapping(prev => ({ ...prev, [field.id]: val }))}
                                    isCustom={false}
                                />
                            ))}

                            {/* Org Custom Fields */}
                            {orgFields.length > 0 && <div className="col-span-3 text-xs font-bold text-gray-400 mt-4 mb-2 uppercase border-b pb-1">Additional Registration Fields</div>}
                            {orgFields.map(field => (
                                <MappableRow
                                    key={field.fieldDefinitionId}
                                    field={{
                                        id: `field_${field.fieldDefinitionId}`,
                                        label: field.fieldDefinition.label,
                                        required: field.isRequired,
                                        description: field.fieldDefinition.description,
                                        type: field.fieldDefinition.fieldType,
                                        options: field.fieldDefinition.options // Pass options for multi-select
                                    }}
                                    headers={headers}
                                    value={mapping[`field_${field.fieldDefinitionId}`]}
                                    onChange={(val) => setMapping(prev => ({ ...prev, [`field_${field.fieldDefinitionId}`]: val }))}
                                    isCustom={true}
                                />
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg flex items-start gap-2">
                            <div className="mt-0.5">ℹ️</div>
                            <div>
                                <strong>Tip for Multi-Select Fields:</strong> If you are importing fields that allow multiple options (e.g., "Interests"),
                                please enter them in a single column separated by commas (e.g., "Cooking, Driving, Events").
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                onClick={handleImport}
                                disabled={loading}
                                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? 'Importing...' : 'Start Import'}
                                {!loading && <FaArrowRight />}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'result' && result && (
                    <div className="text-center space-y-6 py-8">
                        {result.successCount > 0 && result.failureCount === 0 && (
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto">
                                <FaCheck />
                            </div>
                        )}
                        {result.failureCount > 0 && (
                            <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-4xl mx-auto">
                                <FaTimes />
                            </div>
                        )}

                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {result.failureCount === 0 ? 'Import Successful!' : 'Import Completed with Errors'}
                            </h3>
                            <p className="text-gray-500 mt-2">
                                Successfully imported <strong className="text-green-600">{result.successCount}</strong> users.
                            </p>
                            {result.failureCount > 0 && (
                                <p className="text-red-600 mt-1">
                                    Failed to import <strong>{result.failureCount}</strong> rows.
                                </p>
                            )}
                        </div>

                        {result.failureCount > 0 && (
                            <div className="flex justify-center">
                                <button
                                    onClick={downloadErrorLog}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
                                >
                                    <FaDownload /> Download Error Log (.csv)
                                </button>
                            </div>
                        )}
                        <div className="pt-8 flex justify-center">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

function MappableRow({ field, headers, value, onChange, isCustom }: { field: any, headers: string[], value: any, onChange: (v: any) => void, isCustom: boolean }) {
    const isMultiSelect = field.type === 'MULTISELECT';
    const [isSpreadMode, setIsSpreadMode] = useState<boolean>(!!(value && typeof value === 'object' && value.type === 'spread'));

    // Parse options safely
    let fieldOptions: string[] = [];
    try {
        if (Array.isArray(field.options)) {
            fieldOptions = field.options;
        } else if (typeof field.options === 'string') {
            fieldOptions = JSON.parse(field.options);
        }
    } catch (e) {
        console.error('Failed to parse options', e);
    }

    const toggleSpreadMode = (checked: boolean) => {
        setIsSpreadMode(checked);
        if (checked) {
            // Initialize spread mapping structure
            onChange({
                type: 'spread',
                indicator: 'x', // Default indicator
                optionMapping: {}
            });
        } else {
            // Reset to simple column mapping
            onChange('');
        }
    };

    const updateSpreadMapping = (option: string, column: string) => {
        const currentMapping = value || { type: 'spread', indicator: 'x', optionMapping: {} };
        onChange({
            ...currentMapping,
            optionMapping: {
                ...currentMapping.optionMapping,
                [option]: column
            }
        });
    };

    const updateIndicator = (indicator: string) => {
        const currentMapping = value || { type: 'spread', indicator: 'x', optionMapping: {} };
        onChange({
            ...currentMapping,
            indicator
        });
    };

    return (
        <>
            <div className="flex flex-col justify-center">
                <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                    {field.description && !field.description.startsWith('Default:') && (
                        <span className="text-gray-400 text-[10px] ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full" title={field.description}>?</span>
                    )}
                </div>
                {/* Show type hint and Spread toggle for MultiSelect */}
                {isCustom && (
                    <div className="flex flex-col mt-0.5 gap-1">
                        <div className="text-[10px] text-gray-400 font-mono">
                            {field.type || 'TEXT'}
                        </div>
                        {isMultiSelect && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <input
                                    type="checkbox"
                                    id={`spread_${field.id}`}
                                    checked={isSpreadMode}
                                    onChange={(e) => toggleSpreadMode(e.target.checked)}
                                    className="w-3 h-3 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <label htmlFor={`spread_${field.id}`} className="text-[10px] text-orange-700 font-medium cursor-pointer">
                                    Spread Columns Mode
                                </label>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center text-gray-300">
                <FaArrowRight />
            </div>

            <div className="w-full">
                {!isSpreadMode ? (
                    <select
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 ${!value && field.required ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    >
                        <option value="">-- Select Column --</option>
                        {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                ) : (
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 text-xs space-y-3">
                        <div className="font-bold text-orange-800 border-b border-orange-200 pb-1 mb-2">
                            Map Options to Columns
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <label className="whitespace-nowrap font-medium text-gray-600">Selected Indicator:</label>
                            <input
                                type="text"
                                placeholder="Any (if blank)"
                                value={value?.indicator || ''}
                                onChange={(e) => updateIndicator(e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                            />
                            <span className="text-gray-400 text-[10px]" title="The value in the cell that means 'Selected' (e.g. 'x', 'Yes'). Leave blank to check if cell is not empty.">(?)</span>
                        </div>

                        {fieldOptions.length > 0 ? fieldOptions.map((opt) => (
                            <div key={opt} className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                                <span className="truncate" title={opt}>{opt}</span>
                                <FaArrowRight size={8} className="text-orange-300" />
                                <select
                                    value={value?.optionMapping?.[opt] || ''}
                                    onChange={(e) => updateSpreadMapping(opt, e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                                >
                                    <option value="">(Skip)</option>
                                    {headers.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                        )) : (
                            <div className="text-red-500 italic">No options defined for this field.</div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
