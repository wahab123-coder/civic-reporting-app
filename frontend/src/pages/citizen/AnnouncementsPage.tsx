import { Megaphone, Calendar, Building2 } from 'lucide-react';
import { formatDate, cn } from '@/utils';

const ANNOUNCEMENTS = [
  {
    id: '1', title: 'Road Rehabilitation: Lagos-Ibadan Expressway',
    body: 'The Roads & Infrastructure Department will begin rehabilitation work on the Lagos-Ibadan expressway from Monday. Expect traffic delays between 8AM–5PM on weekdays.',
    department: 'Roads & Infrastructure', date: '2026-08-01', urgent: true,
  },
  {
    id: '2', title: 'Water Supply Disruption — Ikeja District',
    body: 'There will be a planned water supply disruption in Ikeja district on August 5th for routine pipe maintenance. Supply will resume by 6PM.',
    department: 'Water & Sanitation', date: '2026-07-30', urgent: true,
  },
  {
    id: '3', title: 'Waste Collection Schedule Update',
    body: 'New waste collection schedule takes effect from August 1st. Collection days: Monday, Wednesday, Friday for residential areas. Commercial areas: daily.',
    department: 'Environment & Waste', date: '2026-07-28', urgent: false,
  },
  {
    id: '4', title: 'New Streetlights Installation — Victoria Island',
    body: 'We are pleased to announce the installation of 200 new LED streetlights across Victoria Island. Work begins August 10th.',
    department: 'Power & Utilities', date: '2026-07-25', urgent: false,
  },
  {
    id: '5', title: 'Community Meeting — Report Issues Directly',
    body: 'Monthly community engagement meeting holds at the Town Hall on August 15th, 10AM. Bring your complaints and concerns directly to government representatives.',
    department: 'Administration', date: '2026-07-20', urgent: false,
  },
];

export default function AnnouncementsPage() {
  return (
    <div className="space-y-4 pb-8 animate-fade-in">
      <div>
        <h2 className="section-title">Government Announcements</h2>
        <p className="section-sub">Official updates from government departments</p>
      </div>

      <div className="space-y-3">
        {ANNOUNCEMENTS.map(a => (
          <div key={a.id} className={cn('bg-white rounded-2xl border shadow-card overflow-hidden',
            a.urgent ? 'border-orange-200' : 'border-gray-100')}>
            {a.urgent && (
              <div className="bg-orange-500 px-4 py-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-dot" />
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Urgent Notice</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-sm leading-snug">{a.title}</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{a.body}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gov-600">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="font-medium">{a.department}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(a.date)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
