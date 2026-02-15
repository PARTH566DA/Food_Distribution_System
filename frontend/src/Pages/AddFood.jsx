import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../Layout/MainLayout";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import VegIcon from '../assets/veg-logo.png';
import NonVegIcon from '../assets/non-veg-logo.png';
import QuantityIcon from '../assets/Group.svg';
import ClockIcon from '../assets/clock.svg';
import PackageIcon from '../assets/package.svg';

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

const AddFood = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vegetarian: true,
    description: "",
    quantity: "",
    expiryTime: "",
    location: "",
    latitude: "",
    longitude: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Default center: Ahmedabad coordinates
  const defaultCenter = [23.0225, 72.5714];
  const defaultZoom = 13;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVegToggle = (isVeg) => {
    setFormData(prev => ({
      ...prev,
      vegetarian: isVeg
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported by your browser");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setGpsLoading(false);
        setShowMap(true);
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError("Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError("Location information unavailable");
            break;
          case error.TIMEOUT:
            setGpsError("Location request timed out");
            break;
          default:
            setGpsError("An unknown error occurred");
        }
      }
    );
  };

  // Handle map click to select location
  const handleMapLocationSelect = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
  };

  // Toggle map visibility
  const handlePickFromMap = () => {
    setShowMap(true);
  };

  // Auto-detect GPS location on component mount
  useEffect(() => {
    getGPSLocation();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate GPS coordinates
    if (!formData.latitude || !formData.longitude) {
      setGpsError("Please enable GPS location detection");
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('vegetarian', formData.vegetarian);
      submitData.append('description', formData.description);
      submitData.append('quantity', formData.quantity);
      submitData.append('expiryTime', formData.expiryTime);
      submitData.append('location', formData.location);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      // TODO: Replace with your actual backend endpoint
      // const response = await fetch('http://localhost:8080/api/food-listings', {
      //   method: 'POST',
      //   body: submitData,
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to submit food listing');
      // }

      console.log("Form submitted:", formData);

      // Navigate to home page after successful submission
      navigate('/');

    } catch (error) {
      console.error('Error submitting form:', error);
      // You can add error handling/notification here
    }
  };

  const getButtonStyles = () => {
    return {
      base: "relative overflow-hidden rounded-full bg-[#FF8B77] text-white font-semibold text-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg active:scale-95",
      dimensions: "w-[180px] h-[50px]",
      hover: "hover:bg-[#FF7A66]",
      animation: "before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-all before:duration-700 hover:before:left-[100%]"
    };
  };

  const renderSubmitButton = () => {
    const styles = getButtonStyles();
    return (
      <button
        type="submit"
        className={`${styles.base} ${styles.dimensions} ${styles.hover} ${styles.animation} cursor-pointer`}
      >
        <span className="relative z-10">Submit</span>
      </button>
    );
  };

  return (
    <MainLayout activeHref="/addfood">
      <div className="flex h-full w-full items-start justify-center py-6">
        <div className="w-[60%]">

          <form onSubmit={handleSubmit}>
            <div className="w-full overflow-hidden rounded-[25px] p-[10px] bg-[#FFECEA]">
              <div className="flex gap-[10px]">
                {/* Image Upload Section */}
                <div className="w-[35%] flex-shrink-0 relative">
                  <div className="relative w-full aspect-square">
                    {/* Image Preview or Upload Placeholder */}
                    <label
                      htmlFor="image-upload"
                      className="w-full h-full rounded-[25px] bg-white/50 flex items-center justify-center cursor-pointer hover:bg-white/70 transition-all overflow-hidden"
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-[25px]"
                        />
                      ) : (
                        <div className="text-center flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-gray-600 font-medium">Upload Photo</span>
                        </div>
                      )}
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    {/* Veg / Non-Veg Toggle */}
                    <div className="absolute top-3 right-3 flex gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => handleVegToggle(true)}
                        className={`bg-[#FFECEA] rounded-[6px] p-1 transition-all ${formData.vegetarian ? 'ring-2 ring-green-500' : 'opacity-50'
                          }`}
                      >
                        <img src={VegIcon} alt="Vegetarian" className="w-6 h-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVegToggle(false)}
                        className={`bg-[#FFECEA] rounded-[6px] p-1 transition-all ${!formData.vegetarian ? 'ring-2 ring-red-500' : 'opacity-50'
                          }`}
                      >
                        <img src={NonVegIcon} alt="Non-Vegetarian" className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="flex-1 flex flex-col mt-[10px] justify-between">
                  {/* Top Section - Description and Location */}
                  <div className="w-full">
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Food Description"
                      className="text-2xl font-semibold text-black bg-transparent border-none outline-none placeholder:text-gray-400 w-full mb-2"
                      required
                    />

                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Pickup Location"
                      className="text-base text-[#797979] bg-transparent border-none outline-none placeholder:text-gray-400 w-full mb-4"
                      required
                    />
                  </div>

                  <div>
                    <div className="w-full h-[2px] bg-[#D9D9D9] mb-4"></div>

                    {/* Details and Submit Button Container */}
                    <div className="flex justify-between">
                      {/* Details */}
                      <div className="flex flex-col gap-6 flex-1">
                        <div className="flex items-center gap-2 text-base">
                          <img src={QuantityIcon} alt="Quantity" className="w-5 h-5" />
                          <span className="font-semibold text-black">Serve:</span>
                          <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            placeholder="Number of people"
                            className="text-gray-700 bg-white/50 border border-gray-300 rounded-lg px-3 py-1 w-40 outline-none focus:ring-2 focus:ring-[#FF8B77]"
                            required
                            min="1"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <img src={ClockIcon} alt="Expiry" className="w-5 h-5" />
                          <span className="font-semibold text-black">Fresh:</span>
                          <input
                            type="number"
                            name="expiryTime"
                            value={formData.expiryTime}
                            onChange={handleInputChange}
                            placeholder="Hours"
                            className="text-gray-700 bg-white/50 border border-gray-300 rounded-lg px-3 py-1 w-40 outline-none focus:ring-2 focus:ring-[#FF8B77]"
                            required
                            min="1"
                            step="0.5"
                          />
                          <span className="text-gray-700">hrs.</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <img src={PackageIcon} alt="Package" className="w-5 h-5" />
                          <span className="font-semibold text-black">Status</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-semibold text-black">GPS:</span>
                          {gpsLoading ? (
                            <span className="text-gray-500 text-sm">Detecting...</span>
                          ) : gpsError ? (
                            <div className="flex items-center gap-2">
                              <span className="text-red-500 text-sm">{gpsError}</span>
                              <button
                                type="button"
                                onClick={getGPSLocation}
                                className="text-[#FF8B77] text-sm underline hover:text-[#FF7A66]"
                              >
                                Retry
                              </button>
                              <span className="text-gray-400">|</span>
                              <button
                                type="button"
                                onClick={handlePickFromMap}
                                className="text-[#FF8B77] text-sm underline hover:text-[#FF7A66]"
                              >
                                Pick from Map
                              </button>
                            </div>
                          ) : formData.latitude && formData.longitude ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 text-sm">
                                {formData.latitude}, {formData.longitude}
                              </span>
                              <button
                                type="button"
                                onClick={getGPSLocation}
                                className="text-[#FF8B77] text-xs underline hover:text-[#FF7A66]"
                              >
                                Refresh
                              </button>
                              <span className="text-gray-400">|</span>
                              <button
                                type="button"
                                onClick={handlePickFromMap}
                                className="text-[#FF8B77] text-xs underline hover:text-[#FF7A66]"
                              >
                                Pick from Map
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={getGPSLocation}
                                className="text-[#FF8B77] text-sm underline hover:text-[#FF7A66]"
                              >
                                Detect Location
                              </button>
                              <span className="text-gray-400">|</span>
                              <button
                                type="button"
                                onClick={handlePickFromMap}
                                className="text-[#FF8B77] text-sm underline hover:text-[#FF7A66]"
                              >
                                Pick from Map
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex flex-col justify-end mr-[10px]">
                        {renderSubmitButton()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section */}
            {showMap && (
              <div className="w-full mt-6 rounded-[25px] overflow-hidden" style={{ height: '400px' }}>
                <MapContainer
                  center={formData.latitude && formData.longitude ? [parseFloat(formData.latitude), parseFloat(formData.longitude)] : defaultCenter}
                  zoom={defaultZoom}
                  style={{ height: '100%', width: '100%' }}
                  key={`${formData.latitude}-${formData.longitude}`}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    subdomains="abcd"
                    maxZoom={20}
                  />
                  <MapClickHandler onLocationSelect={handleMapLocationSelect} />
                  {formData.latitude && formData.longitude && (
                    <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]} />
                  )}
                </MapContainer>
              </div>
            )}
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default AddFood;
