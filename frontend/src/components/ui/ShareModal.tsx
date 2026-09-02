import { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

interface ShareModalProps {
  report: {
    id: string;
    trackingId: string;
    title: string;
    category: string;
    status: string;
    city?: string;
    description?: string;
  };
  governmentResponse?: string;
  onClose: () => void;
}

const PLATFORMS = [
  {
    name: 'X (Twitter)',
    icon: '𝕏',
    color: 'bg-black text-white',
    getUrl: (text: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600 text-white',
    getUrl: (_text: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    icon: '💬',
    color: 'bg-green-500 text-white',
    getUrl: (text: string, url: string) =>
      `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    name: 'Telegram',
    icon: '✈️',
    color: 'bg-sky-500 text-white',
    getUrl: (text: string, url: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700 text-white',
    getUrl: (_text: string, url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Instagram',
    icon: '📸',
    color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white',
    getUrl: (_text: string, url: string) => {
      // Instagram doesn't support direct URL sharing — copy link instead
      navigator.clipboard.writeText(url);
      toast.success('Link copied! Paste it in your Instagram bio or story.');
      return null;
    },
  },
  {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black text-white',
    getUrl: (_text: string, url: string) => {
      navigator.clipboard.writeText(url);
      toast.success('Link copied! Add it to your TikTok bio or video description.');
      return null;
    },
  },
  {
    name: 'YouTube',
    icon: '🎥',
    color: 'bg-red-600 text-white',
    getUrl: (_text: string, url: string) => {
      navigator.clipboard.writeText(url);
      toast.success('Link copied! Add it to your YouTube video description.');
      return null;
    },
  },
];

export default function ShareModal({ report, governmentResponse, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const reportUrl = `${window.location.origin}/citizen/report/${report.id}`;
  const trackUrl  = `${window.location.origin}/login?track=${report.trackingId}`;

  const shareText = governmentResponse
    ? `📋 CIVIC UPDATE\n"${report.title}"\n\n🏛️ Government Response: "${governmentResponse}"\n\nStatus: ${report.status.replace('_', ' ').toUpperCase()}\nTracking ID: ${report.trackingId}\n\n#CivicReport #Government #Community`
    : `🚨 CIVIC REPORT\n"${report.title}"\n\nCategory: ${report.category.replace('_', ' ')}\n${report.city ? `Location: ${report.city}` : ''}\nTracking ID: ${report.trackingId}\n\nHelp spread awareness! #CivicReport #Community`;

  const copyLink = () => {
    navigator.clipboard.writeText(trackUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: typeof PLATFORMS[0]) => {
    const url = platform.getUrl(shareText, trackUrl);
    if (url) window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-float animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-civic-600" /> Share This Report
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{report.trackingId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Preview */}
        <div className="mx-5 mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            {governmentResponse ? '📢 Sharing Government Response' : '🚨 Sharing Citizen Report'}
          </p>
          <p className="text-sm text-gray-700 font-medium leading-snug">{report.title}</p>
          {governmentResponse && (
            <p className="text-xs text-gov-600 mt-1 italic">"{governmentResponse.slice(0, 80)}..."</p>
          )}
          <p className="text-[10px] text-gray-400 mt-1">{reportUrl}</p>
        </div>

        {/* Platform buttons */}
        <div className="p-5 grid grid-cols-4 gap-2.5">
          {PLATFORMS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleShare(p)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95',
                p.color,
              )}
            >
              <span className="text-xl leading-none">{p.icon}</span>
              <span className="text-[9px] font-semibold leading-tight text-center">{p.name}</span>
            </button>
          ))}
        </div>

        {/* Copy link */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="flex-1 text-xs text-gray-500 font-mono truncate">{trackUrl}</p>
            <button
              onClick={copyLink}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                copied ? 'bg-civic-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Share the tracking link so anyone can follow the report's progress
          </p>
        </div>
      </div>
    </div>
  );
}
