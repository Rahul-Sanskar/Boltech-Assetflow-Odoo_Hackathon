import { useState } from 'react';
import API from '../api/API';

// Floating AI Chatbot visible on every page (bottom right corner).
// Click the chat icon to expand. Users can ask questions about assets,
// bookings, maintenance, audits, dashboard, reports, and navigation.
export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm AssetFlow AI. Ask me about assets, bookings, maintenance, audits, or navigation." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { from: 'user', text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await API.post('/ai/chat', { message: text });
      const data = res.data?.data || {};
      const reply = data.reply || data.error || "Sorry, I couldn't process that.";
      setMessages([...next, { from: 'bot', text: reply }]);
    } catch (err) {
      setMessages([...next, { from: 'bot', text: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none"
        aria-label="AI Chatbot"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.657 0-3.21-.336-4.55-.938L3 21l1.938-4.45C3.336 15.21 3 13.657 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 w-80 h-96 bg-white border rounded-lg shadow-xl flex flex-col">
          <div className="flex items-center justify-between bg-blue-600 text-white p-2 rounded-t-lg">
            <span className="font-semibold">✨ AssetFlow AI</span>
            <button onClick={() => setOpen(false)} className="text-sm hover:opacity-80">✕</button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? 'text-right' : 'text-left'}>
                <span className={`inline-block px-2 py-1 rounded ${m.from === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {m.text}
                </span>
              </div>
            ))}
            {loading && <div className="text-left text-gray-400">Thinking…</div>}
          </div>
          <div className="p-2 border-t flex">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask AssetFlow AI…"
              className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none"
            />
            <button onClick={send} className="ml-2 bg-blue-600 text-white px-3 rounded text-sm">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
