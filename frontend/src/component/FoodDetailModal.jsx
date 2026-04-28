import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { resolveMediaUrl } from '../api/media';
import UserIcon from '../assets/user.svg';
import PhoneIcon from '../assets/phone.svg';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

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

const FoodDetailModal = ({ item, onClose, onConfirm, confirming }) => {
    const [userPos, setUserPos] = useState(null);
    const [locationError, setLocationError] = useState(false);
    const scrollRef = useRef(null);

    const donorPos =
        item.pickupLatitude && item.pickupLongitude
            ? [item.pickupLatitude, item.pickupLongitude]
            : null;

    const foodId = item.id ?? item.foodId;

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError(true);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
            () => setLocationError(true),
            { timeout: 8000 }
        );
    }, []);

    const directionsUrl = () => {
        const dest = donorPos ? `${donorPos[0]},${donorPos[1]}` : encodeURIComponent(item.address || '');
        if (userPos) {
            return `https://www.google.com/maps/dir/${userPos[0]},${userPos[1]}/${dest}`;
        }
        return `https://www.google.com/maps/search/?api=1&query=${dest}`;
    };

    const handleConfirmClick = () => {
        onConfirm(foodId);
    };

    return (
        <>
            <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <MotionDiv
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 bg-[#FFF7F6] rounded-t-[30px] shadow-2xl"
                style={{ maxHeight: '92vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1.5 rounded-full bg-[#D9D9D9]" />
                </div>

                <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 20px)' }}>
                    <div className="px-5 pb-10 pt-2">

                        <div className="flex items-center gap-3 mb-5">
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFECEA] hover:bg-[#FFD9D4] transition-colors duration-200"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8B77" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                        </div>

                        <div className="w-full rounded-[25px] overflow-hidden bg-[#FFECEA] p-4 mb-5">
                            <div className="relative w-full rounded-[20px] overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
                                <img
                                    src={resolveMediaUrl(item.imageUrl) || '/placeholder-food.jpg'}
                                    alt={item.description}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src =
                                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM4LjY5IDIgNSA1LjY5IDUgOWMwIDMuMzEgMy4zMSA3IDcgN3M3LTMuNjkgNy03YzAtMy4zMS0zLjY5LTctNy03eiIgZmlsbD0iI2Q1ZDdkYSIvPgo8L3N2Zz4K";
                                    }}
                                />
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{item.description}</h3>
                                <p className="text-sm text-gray-700">{item.address}</p>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-[#FF8B77] flex items-center justify-center">
                                    <img src={UserIcon} alt="User" className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Donor Name</p>
                                    <p className="text-base font-semibold text-gray-900">
                                        {item.userName || 'Anonymous Donor'}
                                    </p>
                                </div>
                            </div>

                            {item.donorContact ? (
                                <div className="flex items-center justify-between bg-[#FFECEA] rounded-[14px] px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#FF8B77] flex items-center justify-center">
                                            <img src={PhoneIcon} alt="Phone" className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Contact</p>
                                            <p className="text-sm font-semibold text-gray-900">{item.mobileNumber}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`tel:${item.mobileNumber}`}
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

                        <div className="w-full rounded-[20px] overflow-hidden bg-white border border-[#FFE0DB] mb-5">
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
                                {userPos && (
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
                                <div style={{ height: '240px', width: '100%' }}>
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
                                                <strong>{item.description}</strong>
                                                <br />
                                                {item.address}
                                            </Popup>
                                        </Marker>
                                        {userPos && (
                                            <Marker position={userPos} icon={userIcon}>
                                                <Popup>Your location</Popup>
                                            </Marker>
                                        )}
                                        <MapAutoFit donorPos={donorPos} userPos={userPos} />
                                    </MapContainer>
                                </div>
                            ) : (
                                <div className="h-[120px] flex items-center justify-center text-gray-400 text-sm px-4 pb-4">
                                    Map unavailable — no coordinates provided
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleConfirmClick}
                            disabled={confirming}
                            className="relative overflow-hidden w-full h-[56px] rounded-full font-bold text-lg text-white transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                                    backgroundSize: '200% 100%',
                                    animation: confirming ? 'none' : 'shimmer 2s infinite',
                                }}
                            />
                            <span className="relative z-10">
                                {confirming ? 'Confirming…' : 'Confirm Order'}
                            </span>
                        </button>

                    </div>
                </div>
            </MotionDiv>
        </>
    );
};

export default FoodDetailModal;
