import { useState } from 'react';
import Map, { Marker, Popup, NavigationControl, ScaleControl } from 'react-map-gl';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { MapPin, X, Filter } from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS, cn } from '@/utils';
import { Report, ReportStatus } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const STATUS_DOT: Record<ReportStatus, string> = {
  submitted:   'bg-blue-500',
  verified:    'bg-purple-500',
  assigned:    'bg-yellow-500',
  in_progress: 'bg-orange-500',
  resolved:    'bg-civic-500',
  rejected:    'bg-red-400',
};

const STATUS_HEX: Record<ReportStatus, string> = {
  submitted: '#3b82f6', verified: '#8b5cf6', assigned: '#f59e0b',
  in_progress: '#f97316', resolved: '#22c55e', rejected: '#f87171',
};

export default function CitizenMapPage() {
  const [popup, setPopup] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | ''>('');
  const [viewState, setViewState] = useState({ longitude: 3.3792, latitude: 6.5244, zoom: 11 });

  const { data, isLoading } = useQuery({
    queryKey: ['map-reports'],
    queryFn: async () => (await reportsApi.getMapData()).data.data as Report[],
    staleTime: 1000 * 60 * 2,
  });

  const filtered = (data || []).filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    return r.latitude != null && r.longitude != null;
  });

  return (
    <div className="space-y-3 animate-fade-in pb-8">
      <div>
        <h2 className="section-title">Nearby Issues Map</h2>
        <p className="section-sub">{filtered.length} issues on map</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['', 'submitted', 'in_progress', 'resolved'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
              filterStatus === s ? 'bg-civic-600 text-white border-civic-600' : 'bg-white text-gray-600 border-gray-200')}>
            {s === '' ? 'All' : STATUS_LABELS[s as ReportStatus]}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {(['submitted', 'in_progress', 'resolved'] as ReportStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={cn('w-2 h-2 rounded-full', STATUS_DOT[s])} />
            {STATUS_LABELS[s]}
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-card" style={{ height: 480 }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-100"><LoadingSpinner size="lg" /></div>
        ) : !MAPBOX_TOKEN ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-center p-8">
            <MapPin className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-600">Map requires Mapbox token</p>
            <p className="text-xs text-gray-400 mt-1">Set VITE_MAPBOX_TOKEN in frontend/.env</p>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} reports available to display</p>
          </div>
        ) : (
          <Map {...viewState} onMove={e => setViewState(e.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN} mapStyle="mapbox://styles/mapbox/streets-v12"
            style={{ width: '100%', height: '100%' }}>
            <NavigationControl position="top-right" />
            <ScaleControl />
            {filtered.map(r => (
              <Marker key={r.id} longitude={r.longitude!} latitude={r.latitude!} anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); setPopup(r); }}>
                <div className={cn('w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-sm cursor-pointer transition-transform hover:scale-110', STATUS_DOT[r.status])}>
                  {CATEGORY_ICONS[r.category]}
                </div>
              </Marker>
            ))}
            {popup && (
              <Popup longitude={popup.longitude!} latitude={popup.latitude!}
                anchor="top" onClose={() => setPopup(null)} closeButton maxWidth="220px">
                <div className="p-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[popup.category]}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">{popup.title}</p>
                      <p className="text-[10px] text-gray-500">{CATEGORY_LABELS[popup.category]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full', STATUS_DOT[popup.status])} />
                    <span className="text-[10px] text-gray-600 font-medium">{STATUS_LABELS[popup.status]}</span>
                  </div>
                  <Link to={`/citizen/report/${popup.id}`} className="text-xs text-civic-600 font-semibold hover:underline block">
                    View report →
                  </Link>
                </div>
              </Popup>
            )}
          </Map>
        )}
      </div>
    </div>
  );
}
