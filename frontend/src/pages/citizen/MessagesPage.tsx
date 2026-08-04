import { useState } from 'react';
import { MessageSquare, Search, Send, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

// Static mock data — replace with real API when messaging backend is added
const MOCK_CONVERSATIONS = [
  {
    id: '1',
    name: 'Roads & Infrastructure Dept',
    avatar: '🏗️',
    lastMessage: 'Your pothole report has been assigned to our team.',
    time: '2h ago',
    unread: 1,
    online: true,
  },
  {
    id: '2',
    name: 'Water & Sanitation Dept',
    avatar: '💧',
    lastMessage: 'We have dispatched a technician to fix the water leakage.',
    time: '1d ago',
    unread: 0,
    online: false,
  },
  {
    id: '3',
    name: 'Environment & Waste Dept',
    avatar: '♻️',
    lastMessage: 'Thank you for reporting the illegal dumping site.',
    time: '3d ago',
    unread: 0,
    online: false,
  },
];

const MOCK_MESSAGES = [
  { id: '1', sender: 'dept', text: 'Hello! We have received your report about the pothole on Lagos street.', time: '10:30 AM' },
  { id: '2', sender: 'user', text: 'Thank you. The pothole is quite large and has caused accidents already.', time: '10:32 AM' },
  { id: '3', sender: 'dept', text: 'We understand the urgency. Our team will be dispatched within 48 hours.', time: '10:35 AM' },
  { id: '4', sender: 'dept', text: 'Your pothole report has been assigned to our team. Work will begin Monday.', time: '2h ago' },
];

export default function MessagesPage() {
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const active = MOCK_CONVERSATIONS.find(c => c.id === activeConv);

  if (activeConv && active) return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      {/* Chat Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <button onClick={() => setActiveConv(null)} className="btn-ghost p-2 -ml-2">
          ←
        </button>
        <div className="w-10 h-10 bg-gov-100 rounded-xl flex items-center justify-center text-xl">
          {active.avatar}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{active.name}</p>
          <p className={cn('text-xs', active.online ? 'text-civic-600' : 'text-gray-400')}>
            {active.online ? '● Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {MOCK_MESSAGES.map(m => (
          <div key={m.id} className={cn('flex', m.sender === 'user' ? 'justify-end' : 'justify-start')}>
            {m.sender === 'dept' && (
              <div className="w-7 h-7 bg-gov-100 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                {active.avatar}
              </div>
            )}
            <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5',
              m.sender === 'user'
                ? 'bg-civic-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm')}>
              <p className="text-sm leading-relaxed">{m.text}</p>
              <p className={cn('text-[10px] mt-1', m.sender === 'user' ? 'text-civic-200' : 'text-gray-400')}>
                {m.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <input value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1 text-sm"
          onKeyDown={e => e.key === 'Enter' && message.trim() && setMessage('')} />
        <button onClick={() => setMessage('')} disabled={!message.trim()}
          className="btn-civic px-3">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div>
        <h2 className="section-title">Messages</h2>
        <p className="section-sub">Communicate with government departments</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations..." className="input pl-9" />
      </div>

      {/* Conversations */}
      <div className="space-y-2">
        {MOCK_CONVERSATIONS
          .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
          .map(conv => (
          <button key={conv.id} onClick={() => setActiveConv(conv.id)}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-card-hover transition-all text-left">
            <div className="relative">
              <div className="w-12 h-12 bg-gov-100 rounded-xl flex items-center justify-center text-2xl">
                {conv.avatar}
              </div>
              {conv.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-civic-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-gray-900 truncate">{conv.name}</p>
                <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.time}</p>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
            </div>
            {conv.unread > 0 && (
              <span className="w-5 h-5 bg-civic-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {conv.unread}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="card text-center py-6">
        <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Messages are created automatically when you receive a government response on your reports.</p>
      </div>
    </div>
  );
}
