import { useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { MapPin, Filter, X } from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS, STATUS_LABELS, cn } from '@/utils';
import { Report, ReportStatus, ReportCategory } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const STATUS_DOT: Record<ReportStatus, string> = {
  submitted:   'bg-blue-500',
  verified:    'bg-purple-500',
  assigned:    'bg-yellow-500',
  in_progress: 'bg-orange-500',
  resolved:    'bg-green-500',
  rejected:    'bg-red-400',
};

export default function MapPage() {
  const [popupInfo, setPopupInfo] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | ''>('');
  const [filterCategory, setFilterCategory] = useState<ReportCategory | ''>('');
  const [viewState, setViewState] = useState({
    longitude: 3.3792,
    latitude: 6.5244,
    zoom: 10,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['map-reports'],
    queryFn: async () => (await reportsApi.getMapData()).data.data as Report[],
    staleTime: 1000 * 60 * 2,
  });

  const filtered = data?.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    return r.latitude != null && r.longitude != null;
  }) || [];

  const statuses: ReportStatus[] = ['submitted','verified','assigned','in_progress','resolved','rejected'];
  const categories: ReportCategory[] = [
    'pothole','drainage','illegal_dumping','traffic_light','water_leakage',
    'power_outage','environmental_hazard','security','corruption','other',
  ];

  return (
    <div className="space-y-4 animate-fade-in h-full">
      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ReportStatus | '')}
            className="input text-sm w-auto"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as ReportCategory | '')}
            className="input text-sm w-auto"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          {(filterStatus || filterCategory) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterCategory(''); }}
              className="btn-ghost text-xs text-red-500 gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          <span className="ml-auto text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span> reports on map
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {statuses.map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={cn('w-2.5 h-2.5 rounded-full', STATUS_DOT[s])} />
            {STATUS_LABELS[s]}
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-card" style={{ height: '560px' }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <LoadingSpinner size="lg" />
          </div>
        ) : !MAPBOX_TOKEN ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-center p-8">
            <MapPin className="w-12 h-12 text-gray-400 mb-3" />
            <p className="font-semibold text-gray-700">Mapbox token required</p>
            <p className="text-sm text-gray-500 mt-1">
              Set <code className="bg-gray-200 px-1 rounded text-xs">VITE_MAPBOX_TOKEN</code> in your <code className="bg-gray-200 px-1 rounded text-xs">.env</code> file.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              {filtered.length} report{filtered.length !== 1 ? 's' : ''} available to display
            </p>
          </div>
        ) : (
          <Map
            {...viewState}
            onMove={(e) => setViewState(e.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/light-v11"
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
            <ScaleControl />

            {filtered.map((report) => (
              <Marker
                key={report.id}
                longitude={report.longitude!}
                latitude={report.latitude!}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo(report);
                }}
              >
                <div className="cursor-pointer group">
                  <div className={cn(
                    'w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center text-sm transition-transform group-hover:scale-110',
                    STATUS_DOT[report.status],
                  )}>
                    <span className="text-xs">{CATEGORY_ICONS[report.category]}</span>
                  </div>
                </div>
              </Marker>
            ))}

            {popupInfo && (
              <Popup
                anchor="top"
                longitude={popupInfo.longitude!}
                latitude={popupInfo.latitude!}
                onClose={() => setPopupInfo(null)}
                closeButton
                closeOnClick={false}
                maxWidth="260px"
              >
                <div className="p-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[popupInfo.category]}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{popupInfo.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{CATEGORY_LABELS[popupInfo.category]}</p>
                    </div>
                  </div>
                  <StatusBadge status={popupInfo.status} />
                  {popupInfo.address && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {popupInfo.address}
                    </p>
                  )}
                  <Link
                    to={`/reports/${popupInfo.id}`}
                    className="block text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View full report →
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
