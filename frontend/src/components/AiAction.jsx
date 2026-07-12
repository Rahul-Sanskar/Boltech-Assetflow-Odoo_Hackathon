import { useState } from 'react';
import API from '../api/API';

// Reusable AI button. Calls a backend AI endpoint and displays the result.
// Props:
//   label   - button text (e.g. "✨ Analyze Issue")
//   endpoint - backend AI route (e.g. "/ai/maintenance")
//   payload  - request body
//   render   - optional function to format the result for display
export default function AiAction({ label, endpoint, payload, render }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await API.post(endpoint, payload);
      const data = res.data?.data || {};
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        <span>✨</span>
        {loading ? 'Working…' : label}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
          {render ? render(result) : <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}
