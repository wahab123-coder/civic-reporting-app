import { Phone, AlertTriangle, MapPin, Shield, Flame, Zap, Droplets, Activity } from 'lucide-react';
import { cn } from '@/utils';

const EMERGENCY_CONTACTS = [
  { name: 'Police Emergency',       number: '112',    icon: Shield,    color: 'bg-blue-600',   desc: 'Crime, security threats' },
  { name: 'Fire Service',           number: '01-7944213', icon: Flame, color: 'bg-red-600',    desc: 'Fire, explosion' },
  { name: 'Ambulance / LASEMA',     number: '767',    icon: Activity, color: 'bg-civic-600',  desc: 'Medical emergencies' },
  { name: 'Power Emergency (EKEDC)',number: '01-4600000', icon: Zap, color: 'bg-yellow-600', desc: 'Electrical hazards' },
  { name: 'Water Emergency',        number: '01-2691000', icon: Droplets, color: 'bg-cyan-600', desc: 'Water burst, flooding' },
  { name: 'Road Emergency',         number: '01-6271400', icon: MapPin, color: 'bg-orange-600', desc: 'Road accidents, blockage' },
];

export default function EmergencyPage() {
  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      {/* Warning header */}
      <div className="bg-red-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Emergency Contacts</h2>
            <p className="text-red-200 text-xs">For life-threatening situations</p>
          </div>
        </div>
        <p className="text-red-100 text-xs leading-relaxed mt-2">
          If you are in immediate danger, call the relevant emergency service immediately. Do not use the reporting app for emergencies — call directly.
        </p>
      </div>

      {/* Contacts grid */}
      <div className="space-y-3">
        {EMERGENCY_CONTACTS.map(c => (
          <a key={c.name} href={`tel:${c.number}`}
            className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-card p-4 active:opacity-80 transition-opacity">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', c.color)}>
              <c.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{c.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-mono font-black text-red-600 text-lg leading-none">{c.number}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Tap to call</p>
            </div>
          </a>
        ))}
      </div>

      {/* Non-emergency note */}
      <div className="bg-gray-50 rounded-2xl p-4 flex gap-3 border border-gray-100">
        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Non-emergency issues</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            For non-urgent issues like potholes, drainage, or street lights — use the Report button to submit a complaint through CivicReport.
          </p>
        </div>
      </div>
    </div>
  );
}
