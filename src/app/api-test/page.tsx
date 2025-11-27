'use client';

import { useState } from 'react';

export default function ApiTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult('Testing...');
    
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    
    if (!token) {
      setResult('❌ No token found in localStorage! Please log in first.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/email-templates', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setResult(`❌ Error: ${response.status} - ${errorText}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Success:', data);
      setResult(`✅ Success! Found ${data.templates.length} templates`);
    } catch (error) {
      console.error('Fetch error:', error);
      setResult(`❌ Fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">API Test</h1>
        
        <button
          onClick={testAPI}
          disabled={loading}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test API Call'}
        </button>
        
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Result:</h3>
          <div className="whitespace-pre-wrap">{result}</div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Make sure you're logged in</li>
            <li>Make sure backend is running on port 3001</li>
            <li>Click "Test API Call" button</li>
            <li>Check browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
