import { useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin, Camera, X, Loader2, ChevronLeft,
  Navigation, CheckCircle2, Copy, Share2,
} from 'lucide-react';
import { reportsApi, mediaApi } from '@/services/api';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { key: 'pothole',              icon: '🕳️', label: 'Pothole',              desc: 'Road damage, craters' },
  { key: 'drainage',             icon: '🌊', label: 'Drainage Blockage',    desc: 'Blocked drains, flooding' },
  { key: 'illegal_dumping',      icon: '🗑️', label: 'Illegal Dumping',      desc: 'Unauthorized waste' },
  { key: 'traffic_light',        icon: '🚦', label: 'Traffic Light',        desc: 'Broken or faulty lights' },
  { key: 'water_leakage',        icon: '💧', label: 'Water Leakage',        desc: 'Burst pipes, leaks' },
  { key: 'power_outage',         icon: '⚡', label: 'Power Outage',         desc: 'Electricity issues' },
  { key: 'environmental_hazard', icon: '☣️', label: 'Environmental Hazard', desc: 'Pollution, spills' },
  { key: 'security',             icon: '🔒', label: 'Security Concern',     desc: 'Safety, crime' },
  { key: 'corruption',           icon: '⚖️', label: 'Public Corruption',    desc: 'Bribery, misconduct' },
  { key: 'other',                icon: '📋', label: 'Other',                desc: 'Anything else' },
];

const schema = z.object({
  title:       z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Please describe the issue in detail'),
  address:     z.string().optional(),
  landmark:    z.string().optional(),
  city:        z.string().optional(),
  state:       z.string().optional(),
  priority:    z.enum(['low','medium','high','urgent']).default('medium'),
  isAnonymous: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

export default function CreateReportPage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const [step, setStep] = useState(searchParams.get('category') ? 2 : 1);
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '');
  const [location, setLocation]     = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [files, setFiles]           = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<{ trackingId: string; id: string; autoRouted: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', isAnonymous: false },
  });

  const getGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsLoading(false); toast.success('Location detected!'); },
      () => { setGpsLoading(false); toast.error('Could not get GPS. Enter address manually.'); },
    );
  };

  const addFiles = (newFiles: FileList) => {
    const arr = Array.from(newFiles).slice(0, 5 - files.length);
    setFiles(p => [...p, ...arr]);
    arr.forEach(f => { const r = new FileReader(); r.onload = e => setPreviews(p => [...p, e.target?.result as string]); r.readAsDataURL(f); });
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedCat) { toast.error('Select a category first'); setStep(1); return; }
    setSubmitting(true);
    try {
      const res = await reportsApi.create({ ...data, category: selectedCat, latitude: location?.lat, longitude: location?.lng });
      const r = res.data.data;
      if (files.length > 0) {
        try { await mediaApi.upload(r.id, files); } catch { toast('Report saved but media upload failed', { icon: '⚠️' }); }
      }
      setResult({ trackingId: r.trackingId, id: r.id, autoRouted: r.autoRouted, message: r.message });
    } catch {} finally { setSubmitting(false); }
  };

  const copyTrackingId = () => {
    navigator.clipboard.writeText(result!.trackingId);
    toast.success('Tracking ID copied!');
  };

  // ── Success Screen ────────────────────────────────────────
  if (result) return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 animate-fade-in">
      <div className="w-24 h-24 bg-civic-100 rounded-full flex items-center justify-center mb-5">
        <CheckCircle2 className="w-12 h-12 text-civic-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Complaint Submitted!</h2>
      <p className="text-gray-500 text-sm mt-2 max-w-xs leading-relaxed">
        Your complaint has been received and routed to the responsible government department.
      </p>

      {/* Tracking ID box */}
      <div className="mt-6 w-full max-w-sm bg-civic-50 border-2 border-civic-200 rounded-2xl p-5">
        <p className="text-xs font-bold text-civic-600 uppercase tracking-widest mb-2">Your Tracking ID</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-3xl font-mono font-black text-civic-800 tracking-wider">{result.trackingId}</p>
          <button onClick={copyTrackingId} className="p-2 bg-white rounded-lg border border-civic-200 hover:bg-civic-100 transition-colors">
            <Copy className="w-4 h-4 text-civic-600" />
          </button>
        </div>
        <p className="text-xs text-civic-500 mt-2">Save this ID to track your complaint anytime</p>
      </div>

      {/* Auto-routing info */}
      <div className={cn('mt-4 w-full max-w-sm p-4 rounded-xl text-left',
        result.autoRouted ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200')}>
        <p className={cn('text-xs font-bold mb-1', result.autoRouted ? 'text-green-700' : 'text-yellow-700')}>
          {result.autoRouted ? '✅ Auto-Routed' : '⏳ Pending Assignment'}
        </p>
        <p className={cn('text-xs', result.autoRouted ? 'text-green-600' : 'text-yellow-600')}>
          {result.message}
        </p>
      </div>

      {/* What happens next */}
      <div className="mt-5 w-full max-w-sm text-left">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">What happens next?</p>
        {[
          { step: '1', text: 'Government reviews your complaint', done: true },
          { step: '2', text: 'Officer assigned & work begins', done: false },
          { step: '3', text: 'You receive updates at every stage', done: false },
          { step: '4', text: 'You confirm when issue is resolved', done: false },
        ].map(s => (
          <div key={s.step} className="flex items-start gap-3 mb-2.5">
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              s.done ? 'bg-civic-600 text-white' : 'bg-gray-100 text-gray-400')}>
              {s.done ? '✓' : s.step}
            </div>
            <p className={cn('text-sm', s.done ? 'text-gray-900 font-medium' : 'text-gray-500')}>{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 w-full max-w-sm space-y-3">
        <Link to={`/citizen/report/${result.id}`} className="btn-civic w-full block text-center py-3">
          View My Report
        </Link>
        <Link to="/citizen/my-reports" className="btn-outline w-full block text-center py-3">
          All My Reports
        </Link>
        <button onClick={() => { setResult(null); setStep(1); setSelectedCat(''); setFiles([]); setPreviews([]); setLocation(null); }}
          className="btn-ghost w-full text-sm">
          Submit Another Complaint
        </button>
      </div>
    </div>
  );

  // ── Step Indicator ────────────────────────────────────────
  const stepLabels = ['Category', 'Details', 'Location', 'Photos'];

  return (
    <div className="max-w-lg mx-auto animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)} className="btn-ghost p-2 -ml-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Submit a Complaint</h2>
          <p className="text-xs text-gray-400">Step {step} of 4 — {stepLabels[step-1]}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-6">
        {[1,2,3,4].map(s => (
          <div key={s} className={cn('h-1.5 flex-1 rounded-full transition-all duration-300',
            s < step ? 'bg-civic-600' : s === step ? 'bg-civic-400' : 'bg-gray-200')} />
        ))}
      </div>

      {/* ── Step 1: Category ── */}
      {step === 1 && (
        <div className="space-y-4 animate-slide-up">
          <div>
            <h3 className="font-bold text-gray-900 text-base">What type of issue?</h3>
            <p className="text-sm text-gray-400 mt-0.5">Your complaint will be auto-routed to the right department</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setSelectedCat(cat.key)}
                className={cn('flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all',
                  selectedCat === cat.key
                    ? 'border-civic-500 bg-civic-50'
                    : 'border-gray-100 bg-white hover:border-civic-200')}>
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{cat.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{cat.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => { if (!selectedCat) { toast.error('Please select a category'); return; } setStep(2); }}
            className="btn-civic w-full py-3">
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 2: Details ── */}
      {step === 2 && (
        <form className="space-y-4 animate-slide-up">
          <div>
            <h3 className="font-bold text-gray-900">Describe the issue</h3>
            <p className="text-sm text-gray-400 mt-0.5">Be as specific as possible for faster resolution</p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Complaint Title *</label>
            <input {...register('title')} placeholder="e.g. Large pothole causing accidents"
              className={cn('input', errors.title && 'input-error')} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Full Description *</label>
            <textarea {...register('description')} rows={4} placeholder="Describe the problem in detail..."
              className={cn('input resize-none', errors.description && 'input-error')} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-2 block">How urgent is this?</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 'low',    emoji: '🟢', label: 'Low' },
                { val: 'medium', emoji: '🔵', label: 'Medium' },
                { val: 'high',   emoji: '🟠', label: 'High' },
                { val: 'urgent', emoji: '🔴', label: 'Urgent' },
              ].map(p => (
                <label key={p.val} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-civic-300 transition-all has-[:checked]:border-civic-500 has-[:checked]:bg-civic-50">
                  <input type="radio" {...register('priority')} value={p.val} className="sr-only" />
                  <span className="text-lg">{p.emoji}</span>
                  <span className="text-xs font-semibold text-gray-600">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl cursor-pointer border border-gray-100">
            <input type="checkbox" {...register('isAnonymous')} className="w-4 h-4 rounded text-civic-600" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Submit anonymously</p>
              <p className="text-xs text-gray-400">Your identity will be hidden from government officers</p>
            </div>
          </label>
          <button type="button" onClick={handleSubmit(() => setStep(3))} className="btn-civic w-full py-3">
            Continue →
          </button>
        </form>
      )}

      {/* ── Step 3: Location ── */}
      {step === 3 && (
        <div className="space-y-4 animate-slide-up">
          <div>
            <h3 className="font-bold text-gray-900">Where is the issue?</h3>
            <p className="text-sm text-gray-400 mt-0.5">Precise location helps officers find the issue faster</p>
          </div>
          <button onClick={getGPS} disabled={gpsLoading}
            className={cn('w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all',
              location ? 'border-civic-400 bg-civic-50' : 'border-gray-200 hover:border-civic-300')}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              location ? 'bg-civic-600' : 'bg-gray-100')}>
              {gpsLoading ? <Loader2 className="w-5 h-5 animate-spin text-civic-600" /> :
               location ? <Navigation className="w-5 h-5 text-white" /> :
               <MapPin className="w-5 h-5 text-gray-400" />}
            </div>
            <div className="text-left">
              <p className={cn('text-sm font-semibold', location ? 'text-civic-700' : 'text-gray-600')}>
                {location ? `GPS: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` :
                 gpsLoading ? 'Detecting location...' : 'Use my GPS location'}
              </p>
              <p className="text-xs text-gray-400">{location ? 'Location detected ✓' : 'Tap to auto-detect'}</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 bg-white px-2">or enter manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Street Address</label>
              <input {...register('address')} placeholder="123 Main Street" className="input" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Nearest Landmark</label>
              <input {...register('landmark')} placeholder="Near First Bank ATM" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">City</label>
                <input {...register('city')} placeholder="Lagos" className="input" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">State</label>
                <input {...register('state')} placeholder="Lagos State" className="input" />
              </div>
            </div>
          </div>
          <button onClick={() => setStep(4)} className="btn-civic w-full py-3">Continue →</button>
        </div>
      )}

      {/* ── Step 4: Media + Submit ── */}
      {step === 4 && (
        <div className="space-y-4 animate-slide-up">
          <div>
            <h3 className="font-bold text-gray-900">Add Photos / Videos</h3>
            <p className="text-sm text-gray-400 mt-0.5">Visual evidence speeds up resolution by 60%</p>
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-gray-200 hover:border-civic-400 hover:bg-civic-50 transition-all">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Camera className="w-7 h-7 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Upload photos or videos</p>
              <p className="text-xs text-gray-400 mt-0.5">Max 5 files • Up to 50MB each</p>
            </div>
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)} />
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button onClick={() => { setFiles(p => p.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Complaint Summary</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{CATEGORIES.find(c => c.key === selectedCat)?.icon}</span>
              <p className="text-sm font-semibold text-gray-800">{CATEGORIES.find(c => c.key === selectedCat)?.label}</p>
            </div>
            {location && <p className="text-xs text-civic-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> GPS location attached</p>}
            {files.length > 0 && <p className="text-xs text-gray-500 flex items-center gap-1"><Camera className="w-3 h-3" /> {files.length} file(s) selected</p>}
            <p className="text-xs text-gov-600 font-medium">
              🏛️ Will be auto-routed to: <strong>{
                { pothole: 'Roads & Infrastructure', drainage: 'Water & Sanitation', water_leakage: 'Water & Sanitation',
                  illegal_dumping: 'Environment & Waste', traffic_light: 'Roads & Infrastructure',
                  power_outage: 'Power & Utilities', environmental_hazard: 'Environment & Waste',
                  security: 'Public Safety', corruption: 'Anti-Corruption Unit', other: 'Roads & Infrastructure',
                }[selectedCat] || 'Relevant Department'
              }</strong>
            </p>
          </div>
          <button onClick={handleSubmit(onSubmit)} disabled={submitting} className="btn-civic w-full py-3.5 text-base font-bold">
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : '🚀 Submit Complaint'}
          </button>
          <button onClick={() => setStep(3)} className="btn-ghost w-full text-sm">← Back to Location</button>
        </div>
      )}
    </div>
  );
}
