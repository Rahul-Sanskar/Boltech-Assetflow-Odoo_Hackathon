import { useState } from 'react';
import API from '../api/API';

// Simple component that calls the backend AI endpoint (e.g., /booking) and displays the result.
// It shows a loading spinner, error message and a retry button when the request fails.
// The component does not use any extra hooks beyond useState to keep it lightweight.

export default function AiChat({ endpoint = '/booking', payload = {} }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post(endpoint, payload);
      setData(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when component mounts
  // Using a simple effect without extra hooks – we call fetchData directly on first render.
  if (!loading && data === null && error === null) {
    fetchData();
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
      {loading && <div>Loading...</div>}
      {error && (
        <div>
          <div style={{ color: 'red' }}>{error}</div>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}
      {data && (
        <div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
