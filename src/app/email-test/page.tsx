'use client';

import { useState } from 'react';
import { api } from '@/services/api';

export default function EmailTestPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testEmailTemplates = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing email templates API...');
      const data = await api.getEmailTemplates();
      setResult(data);
      console.log('Success:', data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testEmailLogs = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing email logs API...');
      const data = await api.getEmailLogs(10);
      setResult(data);
      console.log('Success:', data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkToken = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token);
      setResult({ token: token ? 'Present' : 'Not found' });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Email API Test Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={checkToken}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check Token
        </button>
        
        <button
          onClick={testEmailTemplates}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Email Templates API'}
        </button>
        
        <button
          onClick={testEmailLogs}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Email Logs API'}
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold">Result:</h3>
          <pre className="mt-2 text-sm overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
