// Test component to verify business ownership API
import { useState } from 'react';

interface BusinessTestProps {
  businessId: string;
  token: string;
  currentUserId: string;
}

export default function BusinessOwnershipTest({ businessId, token, currentUserId }: BusinessTestProps) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing with:', { businessId, token: token ? 'Present' : 'Missing', currentUserId });
      
      const response = await fetch(`http://localhost:3000/business/${businessId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('API Response:', data);
      setResult(data);    } catch (error: any) {
      console.error('API Error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Business Ownership Test</h3>
      
      <div className="mb-4">
        <p><strong>Business ID:</strong> {businessId}</p>
        <p><strong>Current User ID:</strong> {currentUserId}</p>
        <p><strong>Token:</strong> {token ? 'Present' : 'Missing'}</p>
      </div>

      <button 
        onClick={testAPI} 
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
