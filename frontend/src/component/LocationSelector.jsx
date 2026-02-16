import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// For MapmyIndia, you would need their official plugin: @mappls/mappls-web-maps
// Currently using CartoDB as it works without complex authentication

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Child component to handle map click events
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click: (e) => {
            const { lat, lng } = e.latlng;
            onLocationSelect(lat, lng);
        },
    });
    return null;
};

const LocationSelector = () => {
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [showMap, setShowMap] = useState(false);

    // Default center: Ahmedabad coordinates
    const defaultCenter = [23.0225, 72.5714];
    const defaultZoom = 13;

    // Handle "Use Current Location" button click
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setLatitude(lat);
                setLongitude(lng);
                setShowMap(true);
            },
            (error) => {
                alert(`Error getting location: ${error.message}`);
            }
        );
    };

    // Handle "Pick From Map" button click
    const handlePickFromMap = () => {
        setShowMap(true);
    };

    // Handle map click to select location
    const handleMapLocationSelect = (lat, lng) => {
        setLatitude(lat);
        setLongitude(lng);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate that a location is selected
        if (latitude === null || longitude === null) {
            alert('Please select a location before submitting');
            return;
        }

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lat: latitude,
                    lng: longitude,
                }),
            });

            if (response.ok) {
                alert('Location submitted successfully!');
            } else {
                alert('Failed to submit location');
            }
        } catch (error) {
            alert(`Error submitting location: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '20px' }}>Select Your Location</h1>

            <form onSubmit={handleSubmit}>
                {/* Location Selection Buttons */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Use Current Location
                    </button>

                    <button
                        type="button"
                        onClick={handlePickFromMap}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Pick From Map
                    </button>
                </div>

                {/* Display Selected Coordinates */}
                {latitude !== null && longitude !== null && (
                    <div
                        style={{
                            marginBottom: '20px',
                            padding: '10px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                        }}
                    >
                        <strong>Selected Coordinates:</strong>
                        <br />
                        Latitude: {latitude.toFixed(6)}
                        <br />
                        Longitude: {longitude.toFixed(6)}
                    </div>
                )}

                {/* Map Section */}
                {showMap && (
                    <div style={{ marginBottom: '20px', height: '400px', borderRadius: '4px', overflow: 'hidden' }}>
                        <MapContainer
                            center={latitude !== null && longitude !== null ? [latitude, longitude] : defaultCenter}
                            zoom={defaultZoom}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                subdomains="abcd"
                                maxZoom={20}
                            />
                            <MapClickHandler onLocationSelect={handleMapLocationSelect} />
                            {latitude !== null && longitude !== null && (
                                <Marker position={[latitude, longitude]} />
                            )}
                        </MapContainer>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    style={{
                        padding: '12px 30px',
                        backgroundColor: '#FF5722',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                    }}
                >
                    Submit
                </button>
            </form>
        </div>
    );
};

export default LocationSelector;
