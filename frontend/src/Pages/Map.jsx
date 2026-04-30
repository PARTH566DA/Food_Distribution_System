import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MainLayout from '../Layout/MainLayout';
import { fetchAllZones, createNeedyZone, reportZone, DuplicateZoneError } from '../api/zones';
import { isAuthenticated } from '../api/auth';
import { useLocation } from 'react-router-dom';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const STATUS_COLORS = {
    ACTIVE:   '#FF6B55',
    PENDING:  '#FFB347',
};

const TAG_ICON_LABELS = { SLUM: 'Slum', LABOUR_CAMP: 'Labour Camp', NIGHT_SHELTER: 'Night Shelter' };

const makeZoneIcon = (status, tagReason) => {
    const color = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
    const label = tagReason ? (TAG_ICON_LABELS[tagReason] ?? tagReason) : '';
    const html = `
    <div style="display:flex;flex-direction:column;align-items:center;width:70px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
        <path d="M15 2C8.92 2 4 6.92 4 13c0 8.53 11 27 11 27S26 21.53 26 13C26 6.92 21.08 2 15 2z"
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="13" r="5" fill="white"/>
      </svg>
      ${label ? `<div style="
        margin-top:2px;
        background:${color};
        color:white;
        font-size:9px;
        font-weight:700;
        padding:2px 6px;
        border-radius:999px;
        white-space:nowrap;
        box-shadow:0 1px 4px rgba(0,0,0,0.25);
        font-family:system-ui,sans-serif;
        letter-spacing:0.02em;
        pointer-events:none;
      ">${label}</div>` : ''}
    </div>`;
    return L.divIcon({
        html,
        className: '',
        iconSize: label ? [70, 62] : [30, 42],
        iconAnchor: label ? [35, 42] : [15, 42],
        popupAnchor: [0, -44],
    });
};

const newZoneIcon = L.divIcon({
    html: `<div style="
        width:26px;height:26px;border-radius:50%;
        background:rgba(255,107,85,0.2);
        border:3px solid #FF6B55;
        box-shadow:0 0 0 5px rgba(255,107,85,0.12);
    "></div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

const userPosIcon = L.divIcon({
    html: `<div style="
        width:16px;height:16px;border-radius:50%;
        background:#3388ff;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

const pickupIcon = L.divIcon({
    html: `<div style="
        width:18px;height:18px;border-radius:50%;
        background:#2ecc71;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
    "></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

const targetZoneIcon = L.divIcon({
    html: `<div style="
        width:18px;height:18px;border-radius:50%;
        background:#3388ff;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
    "></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

const MapClickHandler = ({ active, onMapClick }) => {
    useMapEvents({
        click(e) {
            if (active) onMapClick(e.latlng);
        },
    });
    return null;
};

const MapFitBounds = ({ zones, focusPoints }) => {
    const map = useMap();
    useEffect(() => {
        if (focusPoints.length > 0) {
            const bounds = L.latLngBounds(focusPoints);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
            return;
        }

        if (zones.length > 0) {
            const bounds = L.latLngBounds(zones.map((z) => [z.latitude, z.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }, [map, zones, focusPoints]);
    return null;
};

const MapCenterOnUser = ({ userPos, trigger }) => {
    const map = useMap();

    useEffect(() => {
        if (!userPos) return;
        map.flyTo(userPos, Math.max(map.getZoom(), 15), { duration: 0.8 });
    }, [map, userPos, trigger]);

    return null;
};

const MapFocusOnZone = ({ zone, trigger }) => {
    const map = useMap();

    useEffect(() => {
        if (!zone) return;
        map.flyTo([zone.latitude, zone.longitude], Math.max(map.getZoom(), 15), { duration: 0.8 });
    }, [map, zone, trigger]);

    return null;
};

const haversineMetres = (lat1, lon1, lat2, lon2) => {
    // Great-circle distance in meters for quick client-side proximity checks.
    const R = 6_371_000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
// UI pre-check radius; backend validation is still the final authority.
const DUPLICATE_RADIUS = 25;

const REPORT_REASONS = [
    { value: 'INACCURATE_LOCATION', label: 'Inaccurate location' },
    { value: 'ALREADY_SERVED',      label: 'Already being served' },
    { value: 'DUPLICATE',           label: 'Duplicate zone' },
    { value: 'DOES_NOT_EXIST',      label: 'Does not exist' },
];

const TAG_REASONS = [
    { value: 'SLUM',          label: 'Slum Area' },
    { value: 'LABOUR_CAMP',   label: 'Labour Camp' },
    { value: 'NIGHT_SHELTER', label: 'Night Shelter' },
];

const MotionDiv = motion.div;
const MotionButton = motion.button;

const toNumberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const Map = () => {
    const location = useLocation();
    const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const pickupPos = useMemo(() => {
        const lat = toNumberOrNull(query.get('pickupLat'));
        const lng = toNumberOrNull(query.get('pickupLng'));
        return lat != null && lng != null ? [lat, lng] : null;
    }, [query]);
    const targetPosFromQuery = useMemo(() => {
        const lat = toNumberOrNull(query.get('zoneLat'));
        const lng = toNumberOrNull(query.get('zoneLng'));
        return lat != null && lng != null ? [lat, lng] : null;
    }, [query]);
    const initialZoneId = useMemo(() => {
        const raw = query.get('zoneId');
        const parsed = raw ? Number(raw) : null;
        return Number.isFinite(parsed) ? parsed : null;
    }, [query]);
    const targetZoneName = query.get('zoneName');
    const foodRef = query.get('food');

    const [zones, setZones]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [fetchError, setFetchError]     = useState(null);
    const [selectedZone, setSelectedZone] = useState(null);
    const [focusedZoneId, setFocusedZoneId] = useState(initialZoneId);
    const [focusTrigger, setFocusTrigger] = useState(0);
    const [tileErrorCount, setTileErrorCount] = useState(0);

    const [markingMode, setMarkingMode]     = useState(false);
    const [newMarkerPos, setNewMarkerPos]   = useState(null);
    const [showForm, setShowForm]           = useState(false);
    const [formData, setFormData]           = useState({ name: '', tagReason: '' });
    const [submitting, setSubmitting]       = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formError, setFormError]         = useState('');

    const [userPos, setUserPos] = useState(null);

    const [nearbyWarning, setNearbyWarning] = useState(null);

    const [reportSheet, setReportSheet]     = useState(false);
    const [reportReason, setReportReason]   = useState('');
    const [reportState, setReportState]     = useState('idle');
    const [reportCount, setReportCount]     = useState(null);
    const [centerToUserTrigger, setCenterToUserTrigger] = useState(0);
    const [suspendFitBounds, setSuspendFitBounds] = useState(false);

    const authenticated = isAuthenticated();

    const loadZones = useCallback(() => {
        fetchAllZones()
            .then(setZones)
            .catch(() => setFetchError('Could not load needy zones.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadZones(); }, [loadZones]);
    useEffect(() => {
        if (!initialZoneId || zones.length === 0) return;
        const match = zones.find((z) => z.needyZoneId === initialZoneId);
        if (match) {
            setSelectedZone(match);
            setFocusedZoneId(initialZoneId);
            setFocusTrigger((prev) => prev + 1);
        }
    }, [initialZoneId, zones]);

    useEffect(() => {
        if (!focusedZoneId) return;
        const match = zones.find((z) => z.needyZoneId === focusedZoneId);
        if (match) {
            setSelectedZone(match);
            setFocusTrigger((prev) => prev + 1);
        }
    }, [focusedZoneId, zones]);


    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
            () => {}
        );
    }, []);

    useEffect(() => {
        if (!markingMode) return;
        if (userPos) {
            setCenterToUserTrigger((prev) => prev + 1);
            return;
        }
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserPos([pos.coords.latitude, pos.coords.longitude]);
                setCenterToUserTrigger((prev) => prev + 1);
            },
            () => {}
        );
    }, [markingMode, userPos]);

    const handleMapClick = useCallback((latlng) => {
        // Show immediate duplicate feedback before making a network request.
        const visibleZones = zones.filter((z) => z.status !== 'INACTIVE');
        let closest = null;
        let closestDist = Infinity;
        for (const z of visibleZones) {
            const d = haversineMetres(latlng.lat, latlng.lng, z.latitude, z.longitude);
            if (d <= DUPLICATE_RADIUS && d < closestDist) {
                closest = z; closestDist = d;
            }
        }
        setNearbyWarning(closest ? { zone: closest, dist: Math.round(closestDist) } : null);
        setNewMarkerPos([latlng.lat, latlng.lng]);
        setShowForm(true);
        setFormError('');
    }, [zones]);

    const handleUseMyLocation = () => {
        if (!userPos) return;
        // Reuse the same duplicate-warning logic when using GPS as the drop point.
        const visibleZones = zones.filter((z) => z.status !== 'INACTIVE');
        let closest = null;
        let closestDist = Infinity;
        for (const z of visibleZones) {
            const d = haversineMetres(userPos[0], userPos[1], z.latitude, z.longitude);
            if (d <= DUPLICATE_RADIUS && d < closestDist) {
                closest = z; closestDist = d;
            }
        }
        setNearbyWarning(closest ? { zone: closest, dist: Math.round(closestDist) } : null);
        setNewMarkerPos(userPos);
        setShowForm(true);
        setFormError('');
    };

    const handleCenterToCurrentLocation = () => {
        if (userPos) {
            setCenterToUserTrigger((prev) => prev + 1);
            return;
        }

        if (!navigator.geolocation) {
            alert('Geolocation is not supported in this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const nextPos = [pos.coords.latitude, pos.coords.longitude];
                setUserPos(nextPos);
                setCenterToUserTrigger((prev) => prev + 1);
            },
            () => {
                alert('Unable to fetch your current location. Please enable location access.');
            }
        );
    };

    const handleCancelMarking = () => {
        setMarkingMode(false);
        setShowForm(false);
        setNewMarkerPos(null);
        setFormData({ name: '', tagReason: '' });
        setFormError('');
        setSubmitSuccess(false);
        setNearbyWarning(null);
        if (userPos) {
            setCenterToUserTrigger((prev) => prev + 1);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) { setFormError('Please enter a zone name.'); return; }
        if (!newMarkerPos)         { setFormError('Please tap the map to place a marker first.'); return; }
        setFormError('');
        setSubmitting(true);
        try {
            await createNeedyZone({
                name:      formData.name.trim(),
                latitude:  newMarkerPos[0],
                longitude: newMarkerPos[1],
                tagReason: formData.tagReason || undefined,
            });
            setSubmitSuccess(true);
            loadZones();
            setSuspendFitBounds(true);
            if (userPos) {
                setCenterToUserTrigger((prev) => prev + 1);
            } else if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setUserPos([pos.coords.latitude, pos.coords.longitude]);
                        setCenterToUserTrigger((prev) => prev + 1);
                    },
                    () => {}
                );
            }
            setTimeout(() => {
                setSuspendFitBounds(false);
                handleCancelMarking();
            }, 2200);
        } catch (e) {
            if (e instanceof DuplicateZoneError) {
                // Replace client guess with server-confirmed duplicate zone when available.
                const confirmedZone = zones.find((z) => z.needyZoneId === e.existingZoneId);
                setNearbyWarning(confirmedZone ? { zone: confirmedZone, dist: null } : null);
                setFormError(e.message);
            } else {
                setFormError(e.message || 'Submission failed. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenReport = (zone) => {
        setReportSheet(true);
        setReportReason('');
        setReportState('idle');
        setReportCount(zone.reportCount ?? null);
    };

    const handleCloseReport = () => {
        setReportSheet(false);
        setReportReason('');
        setReportState('idle');
    };

    const handleCloseSelectedZone = () => {
        setSelectedZone(null);
        if (userPos) {
            setCenterToUserTrigger((prev) => prev + 1);
        }
    };

    const handleSubmitReport = async () => {
        if (!selectedZone) return;
        setReportState('loading');
        try {
            const count = await reportZone(selectedZone.needyZoneId, reportReason);
            setReportState('done');
            setReportCount(count);
            setZones((prev) =>
                prev.map((z) => z.needyZoneId === selectedZone.needyZoneId ? { ...z, reportCount: count } : z)
            );
            setTimeout(handleCloseReport, 2000);
        } catch (e) {
            if (e.message?.includes('already reported')) {
                setReportState('alreadyDone');
            } else {
                setReportState('error');
            }
        }
    };

    const defaultCenter = userPos ?? [20.5937, 78.9629];
    const visibleZones = zones.filter((zone) => zone.status !== 'INACTIVE');
    const focusedZone = focusedZoneId
        ? visibleZones.find((z) => z.needyZoneId === focusedZoneId)
        : null;
    const targetPos = targetPosFromQuery
        ? targetPosFromQuery
        : focusedZone
            ? [focusedZone.latitude, focusedZone.longitude]
            : null;
    const focusPoints = useMemo(() => {
        const points = [];
        if (pickupPos) points.push(pickupPos);
        if (targetPos) points.push(targetPos);
        return points;
    }, [pickupPos, targetPos]);

    const useFallbackTiles = tileErrorCount >= 3;
    const isNewMarkerAtUser = useMemo(() => {
        if (!userPos || !newMarkerPos) return false;
        return haversineMetres(userPos[0], userPos[1], newMarkerPos[0], newMarkerPos[1]) <= 3;
    }, [userPos, newMarkerPos]);

    return (
        <MainLayout activeHref="/map">
            <div className="relative mt-3 mb-2 h-[calc(100%-12px)] w-full left-1/2 -translate-x-1/2 overflow-hidden rounded-[20px] md:mt-[24px] md:mb-[12px] md:h-[calc(100%-24px)] md:w-[60%] md:rounded-[25px]">

                {loading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#FFF7F6]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-4 border-[#FFECEA] border-t-[#FF8B77] animate-spin" />
                            <p className="text-sm text-gray-500 font-medium">Loading map…</p>
                        </div>
                    </div>
                )}

                {!loading && (
                    <MapContainer
                        center={visibleZones.length > 0 ? [visibleZones[0].latitude, visibleZones[0].longitude] : defaultCenter}
                        zoom={visibleZones.length > 0 ? 12 : 5}
                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                        scrollWheelZoom
                        zoomControl={false}
                    >
                        {useFallbackTiles ? (
                            <TileLayer
                                attribution='&copy; OpenStreetMap contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        ) : (
                            <TileLayer
                                attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                eventHandlers={{
                                    tileerror: () => setTileErrorCount((count) => count + 1),
                                }}
                            />
                        )}

                        {visibleZones.map((zone) => (
                            <Marker
                                key={zone.needyZoneId}
                                position={[zone.latitude, zone.longitude]}
                                icon={makeZoneIcon(zone.status, zone.tagReason)}
                                eventHandlers={{ click: () => { setSelectedZone(zone); setMarkingMode(false); } }}
                            >
                                <Popup>
                                    <strong>{zone.name}</strong>
                                    <br />
                                    <span style={{ fontSize: 11, color: '#888' }}>{zone.status}</span>
                                </Popup>
                            </Marker>
                        ))}

                        {userPos && !isNewMarkerAtUser && (
                            <Marker position={userPos} icon={userPosIcon}>
                                <Popup>Your location</Popup>
                            </Marker>
                        )}

                        {pickupPos && (
                            <Marker position={pickupPos} icon={pickupIcon}>
                                <Popup>
                                    <strong>Pickup location</strong>
                                    {foodRef && (
                                        <div style={{ fontSize: 11, color: '#666' }}>Order {foodRef}</div>
                                    )}
                                </Popup>
                            </Marker>
                        )}

                        {targetPos && (
                            <Marker position={targetPos} icon={targetZoneIcon}>
                                <Popup>
                                    <strong>{targetZoneName || 'Selected needy zone'}</strong>
                                </Popup>
                            </Marker>
                        )}

                        {newMarkerPos && (
                            <Marker position={newMarkerPos} icon={newZoneIcon} />
                        )}

                        {!suspendFitBounds && (visibleZones.length > 0 || focusPoints.length > 0) && (
                            <MapFitBounds zones={visibleZones} focusPoints={focusPoints} />
                        )}
                        <MapCenterOnUser userPos={userPos} trigger={centerToUserTrigger} />
                        <MapFocusOnZone zone={focusedZone} trigger={focusTrigger} />

                        <MapClickHandler
                            active={markingMode && !showForm}
                            onMapClick={handleMapClick}
                        />
                    </MapContainer>
                )}

                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <div className="bg-white/85 backdrop-blur-md rounded-2xl px-4 py-2 shadow border border-[#FFE0DB]">
                        <p className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                            {visibleZones.length} needy zone{visibleZones.length !== 1 ? 's' : ''} on map
                        </p>
                    </div>
                </div>


                {fetchError && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10">
                        <div className="bg-white/90 border border-orange-200 text-orange-600 rounded-2xl px-4 py-2 text-xs font-medium shadow">
                            ⚠ {fetchError}
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {markingMode && !showForm && (
                        <MotionDiv
                            initial={{ y: -40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -40, opacity: 0 }}
                            className="absolute top-14 left-1/2 -translate-x-1/2 z-10"
                        >
                            <div className="bg-[#FF6B55] text-white rounded-2xl px-5 py-2.5 shadow-lg text-xs font-bold flex items-center gap-2">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                Tap anywhere on the map to place a marker
                            </div>
                        </MotionDiv>
                    )}
                </AnimatePresence>

                <div className="absolute top-3 left-3 z-10">
                    <div className="bg-white/85 backdrop-blur-md rounded-2xl px-3 py-2.5 shadow border border-[#FFE0DB] space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-0.5">Status</p>
                        {Object.entries(STATUS_COLORS).map(([status, color]) => (
                            <div key={status} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                                <span className="text-[10px] text-gray-600 capitalize">{status.toLowerCase()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-5 right-4 z-10 flex flex-col items-end gap-2.5">
                    <MotionButton
                        whileTap={{ scale: 0.94 }}
                        onClick={handleCenterToCurrentLocation}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-[#2D7BD8] border border-[#D9E7FF] rounded-full text-xs font-bold shadow-md hover:bg-[#EEF5FF] transition-colors"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                        </svg>
                        My Location
                    </MotionButton>

                    <AnimatePresence>
                        {markingMode && !showForm && userPos && (
                            <MotionButton
                                initial={{ x: 60, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 60, opacity: 0 }}
                                onClick={handleUseMyLocation}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-[#FF8B77] border border-[#FFE0DB] rounded-full text-xs font-bold shadow-md hover:bg-[#FFECEA] transition-colors"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                                </svg>
                                Use my location
                            </MotionButton>
                        )}
                    </AnimatePresence>

                    {!markingMode ? (
                        <MotionButton
                            whileTap={{ scale: 0.94 }}
                            onClick={() => {
                                if (!authenticated) {
                                    alert('Please log in to mark a needy zone.');
                                    return;
                                }
                                setMarkingMode(true);
                            }}
                            className="flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-bold shadow-xl"
                            style={{
                                background: 'linear-gradient(135deg, #FF8B77 0%, #FF6B55 100%)',
                                boxShadow: '0 8px 24px rgba(255,107,85,0.45)',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            Mark Needy Zone
                        </MotionButton>
                    ) : (
                        <MotionButton
                            whileTap={{ scale: 0.94 }}
                            onClick={handleCancelMarking}
                            className="flex items-center gap-2 px-5 py-3 rounded-full text-[#FF6B55] bg-white/90 backdrop-blur-sm border border-[#FFE0DB] text-sm font-bold shadow-md"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Cancel
                        </MotionButton>
                    )}
                </div>

                <AnimatePresence>
                    {selectedZone && (
                        <>
                            <MotionDiv
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
                                onClick={handleCloseSelectedZone}
                            />
                            <MotionDiv
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="fixed inset-x-0 bottom-0 z-40 bg-[#FFF7F6] rounded-t-[30px] shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-center pt-3 pb-1">
                                    <div className="w-10 h-1.5 rounded-full bg-[#D9D9D9]" />
                                </div>
                                <div className="px-5 pb-9 pt-2">
                                    <div className="flex items-center gap-3 mb-5">
                                        <button
                                            onClick={handleCloseSelectedZone}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFECEA] hover:bg-[#FFD9D4] transition-colors"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
                                        <h2 className="text-xl font-bold text-gray-900">Zone Details</h2>
                                    </div>

                                    <div className="rounded-[20px] bg-[#FFECEA] p-4 mb-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 pr-3">
                                                <h3 className="text-lg font-bold text-gray-900">{selectedZone.name}</h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#797979" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                                                    </svg>
                                                    <span className="text-xs text-[#797979]">
                                                        {selectedZone.latitude.toFixed(5)}, {selectedZone.longitude.toFixed(5)}
                                                    </span>
                                                </div>
                                            </div>
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-bold text-white flex-shrink-0"
                                                style={{ background: STATUS_COLORS[selectedZone.status] ?? '#999' }}
                                            >
                                                {selectedZone.status}
                                            </span>
                                        </div>

                                        <div className="w-full h-[1px] bg-[#FFDDD8] mb-3" />

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                                </svg>
                                                <span className="text-gray-500">Marked by:</span>
                                                <span className="font-semibold text-gray-900">{selectedZone.createdByName}</span>
                                            </div>
                                            {selectedZone.createdAt && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                                    </svg>
                                                    <span className="text-gray-500">Reported on:</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {new Date(selectedZone.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${selectedZone.latitude},${selectedZone.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-bold text-white text-sm transition-all hover:shadow-xl"
                                        style={{ background: 'linear-gradient(135deg, #FF8B77 0%, #FF6B55 100%)', boxShadow: '0 8px 24px rgba(255,107,85,0.35)' }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                                        </svg>
                                        Open in Google Maps
                                    </a>

                                    {authenticated && (
                                        <div className="mt-3">
                                            <div className="w-full h-[1px] bg-[#FFDDD8] mb-3" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {(selectedZone.reportCount ?? 0) > 0
                                                        ? `⚠️ ${selectedZone.reportCount} report${selectedZone.reportCount !== 1 ? 's' : ''}`
                                                        : 'No reports yet'}
                                                </span>
                                                <button
                                                    onClick={() => handleOpenReport(selectedZone)}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                                                    </svg>
                                                    Report
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </MotionDiv>
                        </>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showForm && (
                        <>
                            <MotionDiv
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
                                onClick={handleCancelMarking}
                            />
                            <MotionDiv
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="fixed inset-x-0 bottom-0 z-40 bg-[#FFF7F6] rounded-t-[30px] shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-center pt-3 pb-1">
                                    <div className="w-10 h-1.5 rounded-full bg-[#D9D9D9]" />
                                </div>
                                <div className="px-5 pb-10 pt-2">
                                    <div className="flex items-center gap-3 mb-5">
                                        <button
                                            onClick={handleCancelMarking}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFECEA] hover:bg-[#FFD9D4] transition-colors"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="15 18 9 12 15 6"/>
                                            </svg>
                                        </button>
                                        <h2 className="text-xl font-bold text-gray-900">Mark Needy Zone</h2>
                                    </div>

                                    {newMarkerPos && (
                                        <div className="flex items-center gap-3 rounded-[16px] bg-[#FFECEA] border border-[#FFE0DB] px-4 py-3 mb-4">
                                            <div className="w-9 h-9 rounded-full bg-[#FF8B77] flex items-center justify-center flex-shrink-0">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Placed at</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {newMarkerPos[0].toFixed(5)}, {newMarkerPos[1].toFixed(5)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <AnimatePresence>
                                        {nearbyWarning && (
                                            <MotionDiv
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="rounded-[16px] border border-orange-200 bg-orange-50 px-4 py-3 mb-4 flex items-start gap-3"
                                            >
                                                <svg width="18" height="18" className="flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                                </svg>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-orange-700">Nearby zone already exists</p>
                                                    <p className="text-xs text-orange-600 mt-0.5 truncate">
                                                        &ldquo;{nearbyWarning.zone.name}&rdquo;
                                                        {nearbyWarning.dist !== null && ` — ${nearbyWarning.dist} m away`}
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            handleCancelMarking();
                                                            setSelectedZone(nearbyWarning.zone);
                                                        }}
                                                        className="text-xs font-bold text-orange-700 underline mt-1"
                                                    >
                                                        View that zone →
                                                    </button>
                                                </div>
                                            </MotionDiv>
                                        )}
                                    </AnimatePresence>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Zone Name <span className="text-[#FF8B77]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Railway Station Slum, Labour Camp Near NH-48"
                                            value={formData.name}
                                            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                                            className="w-full rounded-[14px] border border-[#FFE0DB] bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#FF8B77] focus:ring-2 focus:ring-[#FFECEA] transition-all"
                                        />
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Zone Type <span className="text-xs font-normal text-gray-400">(optional)</span>
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {TAG_REASONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() =>
                                                        setFormData((f) => ({
                                                            ...f,
                                                            tagReason: f.tagReason === opt.value ? '' : opt.value,
                                                        }))
                                                    }
                                                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                                                        formData.tagReason === opt.value
                                                            ? 'bg-[#FF8B77] text-white border-[#FF8B77] shadow-sm'
                                                            : 'bg-white text-[#FF8B77] border-[#FFE0DB] hover:bg-[#FFECEA]'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {formError && (
                                        <p className="text-xs text-red-500 font-medium mb-3">{formError}</p>
                                    )}

                                    {submitSuccess ? (
                                        <MotionDiv
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-full h-[56px] rounded-full bg-green-500 flex items-center justify-center gap-2"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            <span className="text-white font-bold">Submitted for review!</span>
                                        </MotionDiv>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting || !formData.name.trim() || !newMarkerPos}
                                            className="relative overflow-hidden w-full h-[56px] rounded-full font-bold text-lg text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            style={{
                                                background: 'linear-gradient(135deg, #FF8B77 0%, #FF6B55 100%)',
                                                boxShadow: '0 8px 24px rgba(255,139,119,0.45)',
                                            }}
                                        >
                                            <span
                                                className="absolute inset-0 rounded-full"
                                                style={{
                                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                                                    backgroundSize: '200% 100%',
                                                    animation: submitting ? 'none' : 'shimmer 2s infinite',
                                                }}
                                            />
                                            <span className="relative z-10">
                                                {submitting ? 'Submitting…' : 'Submit Zone'}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </MotionDiv>
                        </>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {reportSheet && selectedZone && (
                        <>
                            <MotionDiv
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                                onClick={handleCloseReport}
                            />
                            <MotionDiv
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="fixed inset-x-0 bottom-0 z-[60] bg-[#FFF7F6] rounded-t-[30px] shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-center pt-3 pb-1">
                                    <div className="w-10 h-1.5 rounded-full bg-[#D9D9D9]" />
                                </div>
                                <div className="px-5 pb-10 pt-2">
                                    <div className="flex items-center gap-3 mb-5">
                                        <button
                                            onClick={handleCloseReport}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFECEA] hover:bg-[#FFD9D4] transition-colors"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">Report Zone</h2>
                                            <p className="text-xs text-gray-400 truncate max-w-[220px]">{selectedZone.name}</p>
                                        </div>
                                    </div>

                                    {reportState === 'done' ? (
                                        <MotionDiv
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-full py-5 rounded-[20px] bg-green-50 border border-green-200 flex flex-col items-center gap-2"
                                        >
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            <p className="text-sm font-bold text-green-700">Report submitted!</p>
                                            {reportCount !== null && (
                                                <p className="text-xs text-green-600">{reportCount} total report{reportCount !== 1 ? 's' : ''} on this zone</p>
                                            )}
                                        </MotionDiv>
                                    ) : reportState === 'alreadyDone' ? (
                                        <div className="w-full py-5 rounded-[20px] bg-orange-50 border border-orange-200 flex flex-col items-center gap-2">
                                            <p className="text-sm font-bold text-orange-700">Already reported</p>
                                            <p className="text-xs text-orange-500">You have already reported this zone.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Why are you reporting this zone?</p>
                                            <div className="flex flex-col gap-2 mb-5">
                                                {REPORT_REASONS.map((r) => (
                                                    <button
                                                        key={r.value}
                                                        onClick={() => setReportReason((v) => v === r.value ? '' : r.value)}
                                                        className={`w-full text-left px-4 py-3 rounded-[14px] text-sm font-semibold border transition-all ${
                                                            reportReason === r.value
                                                                ? 'bg-red-50 border-red-300 text-red-700'
                                                                : 'bg-white border-[#FFE0DB] text-gray-700 hover:bg-[#FFECEA]'
                                                        }`}
                                                    >
                                                        {r.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {reportState === 'error' && (
                                                <p className="text-xs text-red-500 font-medium mb-3">Something went wrong. Please try again.</p>
                                            )}
                                            <button
                                                onClick={handleSubmitReport}
                                                disabled={reportState === 'loading'}
                                                className="w-full h-[52px] rounded-full font-bold text-white text-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-60"
                                                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 6px 18px rgba(239,68,68,0.35)' }}
                                            >
                                                {reportState === 'loading' ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                        Submitting…
                                                    </span>
                                                ) : 'Submit Report'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </MotionDiv>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </MainLayout>
    );
};

export default Map;
