import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import VegIcon from '../assets/veg-logo.png';
import NonVegIcon from '../assets/non-veg-logo.png';
import QuantityIcon from '../assets/Group.svg';
import ClockIcon from '../assets/clock.svg';
import PackageIcon from '../assets/package.svg';
import PinIcon from '../assets/Pin.svg';
import { resolveMediaUrl } from '../api/media';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const MotionDiv = motion.div;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const donorIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const MapAutoFit = ({ donorPos, userPos }) => {
    const map = useMap();
    useEffect(() => {
        if (donorPos && userPos) {
            const bounds = L.latLngBounds([donorPos, userPos]);
            map.fitBounds(bounds, { padding: [40, 40] });
        } else if (donorPos) {
            map.setView(donorPos, 15);
        }
    }, [donorPos, userPos, map]);
    return null;
};

const FeedItem = ({
    item,
    onAccept,
    confirming,
    expanded,
    onExpand,
    isOwner,
    onCancel,
    cancelling,
    showZonePicker,
    zones,
    zonesLoading,
    zonesError,
    selectedZoneId,
    onSelectZone,
    onStartZoneSelection,
    onConfirmWithZone,
    onCloseZonePicker,
    currentLocation,
}) => {
    const isValidPosition = (position) => (
        Array.isArray(position)
        && position.length === 2
        && Number.isFinite(position[0])
        && Number.isFinite(position[1])
    );

    const normalizedCurrentLocation = isValidPosition(currentLocation) ? currentLocation : null;
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
    const [userPos, setUserPos] = useState(normalizedCurrentLocation);
    const [locationError, setLocationError] = useState(false);

    useEffect(() => {
        const handler = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    useEffect(() => {
        if (normalizedCurrentLocation) {
            setUserPos(normalizedCurrentLocation);
            setLocationError(false);
            return;
        }
        setUserPos(null);
    }, [normalizedCurrentLocation]);

    useEffect(() => {
        if (!expanded && !showZonePicker) return;
        if (normalizedCurrentLocation) return;
        if (!navigator.geolocation) {
            setLocationError(true);
            setUserPos(null);
            return;
        }

        setLocationError(false);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const nextPosition = [pos.coords.latitude, pos.coords.longitude];
                if (!isValidPosition(nextPosition)) {
                    setUserPos(null);
                    setLocationError(true);
                    return;
                }
                setUserPos(nextPosition);
                setLocationError(false);
            },
            () => {
                setUserPos(null);
                setLocationError(true);
            },
            { timeout: 8000 }
        );
    }, [expanded, showZonePicker, normalizedCurrentLocation]);

    const toNumberOrNull = (value) => {
        if (value == null) return null;
        if (typeof value === 'string') {
            const trimmedValue = value.trim();
            if (!trimmedValue || trimmedValue.toLowerCase() === 'null' || trimmedValue.toLowerCase() === 'undefined') {
                return null;
            }
        }
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : null;
    };

    const donorLatitude = toNumberOrNull(item.pickupLatitude);
    const donorLongitude = toNumberOrNull(item.pickupLongitude);

    const donorPos =
        donorLatitude != null && donorLongitude != null
            ? [donorLatitude, donorLongitude]
            : null;

    const getDistanceInKm = (fromPos, toPos) => {
        if (!fromPos || !toPos) return null;

        const toRadians = (degrees) => (degrees * Math.PI) / 180;
        const earthRadiusKm = 6371;

        const [lat1, lon1] = fromPos;
        const [lat2, lon2] = toPos;

        const latDelta = toRadians(lat2 - lat1);
        const lonDelta = toRadians(lon2 - lon1);

        const a =
            Math.sin(latDelta / 2) * Math.sin(latDelta / 2)
            + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
            * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    };

    const effectiveUserPos = isValidPosition(userPos) ? userPos : null;
    const distanceKm = getDistanceInKm(effectiveUserPos, donorPos);

    const formatDistance = (valueInKm) => {
        if (!Number.isFinite(valueInKm)) return null;
        if (valueInKm < 1) {
            return `${Math.round(valueInKm * 1000)} m away`;
        }
        if (valueInKm < 10) {
            return `${valueInKm.toFixed(1)} km away`;
        }
        return `${Math.round(valueInKm)} km away`;
    };

    const distanceLabel = formatDistance(distanceKm);

    const formatCoordinate = (value) => {
        const numericValue = toNumberOrNull(value);
        return numericValue == null ? 'N/A' : numericValue.toFixed(5);
    };

    const directionsUrl = () => {
        const dest = donorPos
            ? `${donorPos[0]},${donorPos[1]}`
            : encodeURIComponent(item.address || '');
        if (effectiveUserPos) return `https://www.google.com/maps/dir/${effectiveUserPos[0]},${effectiveUserPos[1]}/${dest}`;
        return `https://www.google.com/maps/search/?api=1&query=${dest}`;
    };

    const getRouteUrl = (selectedZone) => {
        const zoneLat = toNumberOrNull(selectedZone?.latitude);
        const zoneLng = toNumberOrNull(selectedZone?.longitude);

        if (zoneLat != null && zoneLng != null) {
            const zonePos = `${zoneLat},${zoneLng}`;
            if (effectiveUserPos && donorPos) {
                return `https://www.google.com/maps/dir/${effectiveUserPos[0]},${effectiveUserPos[1]}/${donorPos[0]},${donorPos[1]}/${zonePos}`;
            }
            if (donorPos) {
                return `https://www.google.com/maps/dir/${donorPos[0]},${donorPos[1]}/${zonePos}`;
            }
            if (effectiveUserPos) {
                return `https://www.google.com/maps/dir/${effectiveUserPos[0]},${effectiveUserPos[1]}/${zonePos}`;
            }
            return `https://www.google.com/maps/search/?api=1&query=${zonePos}`;
        }

        return directionsUrl();
    };

    const getButtonStyles = () => {
        return {
            base: "relative overflow-hidden rounded-full bg-[#FF8B77] text-white font-semibold text-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg active:scale-95",
            dimensions: "w-[180px] h-[50px]",
            hover: "hover:bg-[#FF7A66]",
            animation: "before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-all before:duration-700 hover:before:left-[100%]"
        };
    };

    const renderAnimatedButton = (onClick, children, disabled = false) => {
        const styles = getButtonStyles();
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`${styles.base} ${styles.dimensions} ${styles.hover} ${styles.animation} ${
                    disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0' : 'cursor-pointer'
                }`}
                style={{
                    background: disabled ? '#cd5c3f' : '',
                }}
            >
                <span className="relative z-10">{children}</span>
            </button>
        );
    };

    const handleClaimClick = () => {
        if (item.status !== 'available') return;
        if (isDesktop) {
            onExpand?.(item.id || item.foodId);
        } else {
            onAccept?.(item);
        }
    };

    const handleStartZonePicker = () => {
        onStartZoneSelection?.(item);
    };

    const handleConfirmZone = () => {
        if (zonesLoading) return;
        const selectedZone = zones?.find((zone) => zone.needyZoneId === selectedZoneId);
        onConfirmWithZone?.(item.id || item.foodId, {
            needyZoneId: selectedZoneId ?? null,
            routeUrl: selectedZoneId == null ? null : getRouteUrl(selectedZone),
        });
    };

    return (
        <div className="w-full mb-4 mx-auto">
            <MotionDiv
                layout
                transition={{ layout: { type: 'spring', damping: 30, stiffness: 300 } }}
                className="relative w-full overflow-hidden rounded-[25px] p-[10px] bg-[#FFECEA]"
            >
                {distanceLabel && (
                    <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                        <img src={PinIcon} alt="Location pin" className="h-4 w-4" />
                        <span className="text-xs font-semibold text-[#6B5454]">{distanceLabel}</span>
                    </div>
                )}

                <div className="flex gap-[10px]">
                    <div className="w-[35%] flex-shrink-0 relative">
                        <div className="relative w-full aspect-square">
                            <img
                                src={resolveMediaUrl(item.imageUrl) || "/placeholder-food.jpg"}
                                alt={item.description}
                                className="w-full h-full rounded-[25px] object-cover"
                                onError={(e) => {
                                    e.target.src =
                                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM4LjY5IDIgNSA1LjY5IDUgOWMwIDMuMzEgMy4zMSA3IDcgN3M3LTMuNjkgNy03YzAtMy4zMS0zLjY5LTctNy03eiIgZmlsbD0iI2Q1ZDdkYSIvPgo8L3N2Zz4K";
                                }}
                            />

                            <div className="absolute top-3 right-3 bg-[#FFECEA] rounded-[6px] p-1 z-10">
                                {item.vegetarian ? (
                                    <img src={VegIcon} alt="Vegetarian" className="w-6 h-6" />
                                ) : (
                                    <img src={NonVegIcon} alt="Non-Vegetarian" className="w-6 h-6" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                        <div className="w-[60%]">
                            <h3 className="text-2xl font-semibold text-black">
                                {item.description}
                            </h3>

                            <p className="text-base text-[#797979] mb-4">
                                {item.address || item.location}
                            </p>
                        </div>
                        <div>

                            <div className="w-full h-[2px] bg-[#D9D9D9] mb-4"></div>

                            <div className="flex justify-between">
                                <div className="flex flex-col gap-6 flex-1">
                                    <div className="flex items-center gap-2 text-base">
                                        <img src={QuantityIcon} alt="Quantity" className="w-5 h-5" />
                                        <span className="font-semibold text-black">Serve:</span>
                                        <span className="text-gray-700">{item.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-base">
                                        <img src={ClockIcon} alt="Expiry" className="w-5 h-5" />
                                        <span className="font-semibold text-black">Fresh:</span>
                                        <span className="text-gray-700">
                                            {(() => {
                                                const nowMs = Date.now();
                                                const expiryHours = Number(item.expiryTime);

                                                if (item.expiresAt) {
                                                    const expiresAtMs = new Date(item.expiresAt).getTime();
                                                    if (Number.isFinite(expiresAtMs)) {
                                                        const remaining = Math.max(0, (expiresAtMs - nowMs) / (1000 * 60 * 60));
                                                        return remaining.toFixed(1);
                                                    }
                                                }

                                                const createdMs = new Date(item.createdAt).getTime();
                                                if (!Number.isFinite(createdMs) || !Number.isFinite(expiryHours)) {
                                                    return "0.0";
                                                }

                                                const hoursElapsed = (nowMs - createdMs) / (1000 * 60 * 60);
                                                const hoursRemaining = Math.max(0, expiryHours - hoursElapsed);
                                                return hoursRemaining.toFixed(1);
                                            })()} hrs.
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-base">
                                        <img src={PackageIcon} alt="Package" className="w-5 h-5" />
                                        <span className="font-semibold text-black">
                                            {item.packed ? 'Pre-Packed' : 'Not Packed'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col justify-end mr-[10px]">
                                    {item.status === 'available' && isOwner && (
                                        <button
                                            onClick={() => onCancel?.(item.id || item.foodId)}
                                            disabled={cancelling}
                                            className={`relative overflow-hidden rounded-full font-semibold text-sm transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 w-[120px] h-[40px] border
                                                ${cancelling
                                                    ? 'opacity-50 cursor-not-allowed hover:scale-100 bg-gray-200 text-gray-500 border-gray-300'
                                                    : 'bg-white text-red-500 border-red-300 hover:bg-red-50 hover:border-red-400 cursor-pointer'
                                                }`}
                                        >
                                            {cancelling ? 'Cancelling…' : 'Cancel'}
                                        </button>
                                    )}
                                    {item.status === 'available' && !isOwner &&
                                        renderAnimatedButton(
                                            handleClaimClick,
                                            isDesktop ? (expanded ? 'Close' : 'Accept') : 'Accept'
                                        )
                                    }
                                    {item.status === 'claimed' && (
                                        <span className="px-6 py-2 bg-yellow-500/20 text-yellow-700 text-sm font-semibold rounded-full border border-yellow-500/30 transition-all duration-300 hover:bg-yellow-500/30 hover:scale-105">
                                            Claimed
                                        </span>
                                    )}
                                    {item.status === 'expired' && (
                                        <span className="px-6 py-2 bg-red-500/20 text-red-700 text-sm font-semibold rounded-full border border-red-500/30 transition-all duration-300 hover:bg-red-500/30 hover:scale-105">
                                            Expired
                                        </span>
                                    )}
                                    {item.status === 'cancelled' && (
                                        <span className="px-6 py-2 bg-gray-200/60 text-gray-500 text-sm font-semibold rounded-full border border-gray-300/50">
                                            Cancelled
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence initial={false}>
                    {expanded && isDesktop && (
                        <MotionDiv
                            key="desktop-detail"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 space-y-[10px]">
                                <div className="w-full h-[1px]  bg-[#D9D9D9]" />

                                <div className="w-full rounded-[20px] bg-white border border-[#FFE0DB] p-4">
                                    <h4 className="text-base font-bold text-gray-900 mb-3">Donor Information</h4>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-full bg-[#FFECEA] flex items-center justify-center flex-shrink-0">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Donor Name</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {item.donorName || 'Anonymous Donor'}
                                            </p>
                                        </div>
                                    </div>
                                    {item.donorContact ? (
                                        <div className="flex items-center justify-between bg-[#FFECEA] rounded-[14px] px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#FF8B77] flex items-center justify-center">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.64A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.92z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Contact</p>
                                                    <p className="text-sm font-semibold text-gray-900">{item.donorContact}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`tel:${item.donorContact}`}
                                                className="px-4 py-2 bg-[#FF8B77] text-white text-sm font-semibold rounded-full hover:bg-[#FF7A66] transition-colors duration-200"
                                            >
                                                Call
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="bg-[#FFECEA] rounded-[14px] px-4 py-3 text-sm text-gray-500">
                                            Contact not available
                                        </div>
                                    )}
                                </div>

                                <div className="w-full rounded-[20px] overflow-hidden bg-white border border-[#FFE0DB]">
                                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                                        <h4 className="text-base font-bold text-gray-900">Pickup Location</h4>
                                        <a
                                            href={directionsUrl()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFECEA] text-[#FF8B77] text-xs font-semibold rounded-full hover:bg-[#FFD9D4] transition-colors duration-200"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                            </svg>
                                            Directions
                                        </a>
                                    </div>
                                    <div className="px-4 pb-3 flex gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-[#e74c3c]" />
                                            <span className="text-xs text-gray-500">Pickup point</span>
                                        </div>
                                        {effectiveUserPos && (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-[#3388ff]" />
                                                <span className="text-xs text-gray-500">Your location</span>
                                            </div>
                                        )}
                                        {locationError && (
                                            <span className="text-xs text-orange-500">⚠ Location access denied</span>
                                        )}
                                    </div>
                                    {donorPos ? (
                                        <div style={{ height: '260px', width: '100%' }}>
                                            <MapContainer
                                                center={donorPos}
                                                zoom={14}
                                                style={{ height: '100%', width: '100%' }}
                                                scrollWheelZoom={false}
                                                zoomControl={true}
                                            >
                                                <TileLayer
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                <Marker position={donorPos} icon={donorIcon}>
                                                    <Popup>
                                                        <strong>{item.description}</strong><br />{item.address}
                                                    </Popup>
                                                </Marker>
                                                {effectiveUserPos && (
                                                    <Marker position={effectiveUserPos} icon={userIcon}>
                                                        <Popup>Your location</Popup>
                                                    </Marker>
                                                )}
                                                <MapAutoFit donorPos={donorPos} userPos={effectiveUserPos} />
                                            </MapContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[100px] flex items-center justify-center text-gray-400 text-sm px-4 pb-4">
                                            Map unavailable — no coordinates provided
                                        </div>
                                    )}
                                </div>

                                {isOwner ? (
                                    <button
                                        onClick={() => onCancel?.(item.id || item.foodId)}
                                        disabled={cancelling}
                                        className="relative overflow-hidden w-full h-[56px] rounded-full font-bold text-lg transition-all duration-300 ease-in-out transform hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 border border-red-300 text-red-500 bg-white hover:bg-red-50"
                                    >
                                        <span className="relative z-10">
                                            {cancelling ? 'Cancelling…' : 'Cancel Listing'}
                                        </span>
                                    </button>
                                ) : (
                                <button
                                    onClick={handleStartZonePicker}
                                    disabled={confirming}
                                    className="relative overflow-hidden w-full h-[56px] rounded-full font-bold text-lg text-white transition-all duration-300 ease-in-out transform hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    style={{
                                        background: confirming
                                            ? '#cd5c3f'
                                            : 'linear-gradient(135deg, #FF8B77 0%, #FF6B55 100%)',
                                        boxShadow: confirming ? 'none' : '0 8px 24px rgba(255, 139, 119, 0.45)',
                                    }}
                                >
                                    <span
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            backgroundSize: '200% 100%',
                                            animation: confirming ? 'none' : 'shimmer 2s infinite',
                                        }}
                                    />
                                    <span className="relative z-10">
                                        {confirming ? 'Confirming…' : 'Confirm Order'}
                                    </span>
                                </button>
                                )}
                            </div>
                        </MotionDiv>
                    )}
                </AnimatePresence>

                {showZonePicker && item.status === 'available' && !isOwner && (
                    <div className="mt-4 w-full rounded-[20px] bg-white border border-[#FFE0DB] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-base font-bold text-gray-900">Select Needy Zone (Optional)</h4>
                            <button
                                type="button"
                                onClick={onCloseZonePicker}
                                className="text-xs font-semibold text-[#FF8B77] hover:text-[#FF6B55]"
                            >
                                Close
                            </button>
                        </div>

                        <label className="flex items-center gap-3 mb-2 p-3 rounded-[12px] border border-[#FFE0DB] cursor-pointer hover:bg-[#FFF7F6]">
                            <input
                                type="radio"
                                name={`needyZone-${item.id || item.foodId}`}
                                checked={selectedZoneId == null}
                                onChange={() => onSelectZone?.(null)}
                                className="accent-[#FF8B77]"
                            />
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Skip zone selection</p>
                                <p className="text-xs text-gray-500">Continue without a needy zone.</p>
                            </div>
                        </label>

                        {zonesLoading && (
                            <p className="text-sm text-gray-500 mt-2">Loading needy zones...</p>
                        )}

                        {zonesError && (
                            <p className="text-xs text-orange-500 mt-2">{zonesError}</p>
                        )}

                        {!zonesLoading && zones?.length === 0 && !zonesError && (
                            <p className="text-sm text-gray-500 mt-2">No active needy zones available right now.</p>
                        )}

                        {!zonesLoading && zones?.length > 0 && (
                            <div className="mt-3 max-h-[180px] overflow-y-auto pr-1 space-y-2">
                                {zones.map((zone) => (
                                    <label
                                        key={zone.needyZoneId}
                                        className="flex items-start gap-3 p-3 rounded-[12px] border border-[#FFE0DB] cursor-pointer hover:bg-[#FFF7F6]"
                                    >
                                        <input
                                            type="radio"
                                            name={`needyZone-${item.id || item.foodId}`}
                                            checked={selectedZoneId === zone.needyZoneId}
                                            onChange={() => onSelectZone?.(zone.needyZoneId)}
                                            className="accent-[#FF8B77] mt-0.5"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{zone.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatCoordinate(zone.latitude)}, {formatCoordinate(zone.longitude)}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleConfirmZone}
                            disabled={confirming || zonesLoading}
                            className="mt-4 relative overflow-hidden w-full h-[52px] rounded-full font-bold text-base text-white transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                                background: confirming
                                    ? '#cd5c3f'
                                    : 'linear-gradient(135deg, #FF8B77 0%, #FF6B55 100%)',
                                boxShadow: confirming ? 'none' : '0 8px 24px rgba(255, 139, 119, 0.35)',
                            }}
                        >
                            <span className="relative z-10">
                                {confirming ? 'Confirming…' : zonesLoading ? 'Loading Zones…' : 'Confirm & Get Route'}
                            </span>
                        </button>
                    </div>
                )}
            </MotionDiv>
        </div>
    );
};

export default FeedItem;