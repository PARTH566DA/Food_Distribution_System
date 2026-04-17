import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../Layout/MainLayout";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Counter from '../component/Counter';
import VegIcon from '../assets/veg-logo.png';
import NonVegIcon from '../assets/non-veg-logo.png';
import QuantityIcon from '../assets/Group.svg';
import ClockIcon from '../assets/clock.svg';
import PackageIcon from '../assets/package.svg';
import { addFood } from '../api/food';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
    quantity: 1,
    expiryTime: 1,
    location: "",
    latitude: "",
    longitude: "",
    image: null,
    packed: false,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isEditingExpiry, setIsEditingExpiry] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const defaultCenter = [23.0225, 72.5714];
  const defaultZoom = 13;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const incrementValue = (field) => {
    const max = field === 'expiryTime' ? 120 : 50;
    setFormData(prev => ({
      ...prev,
      [field]: Math.min(max, prev[field] + (field === 'expiryTime' ? 0.5 : 1))
    }));
  };

  const decrementValue = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(field === 'expiryTime' ? 0.5 : 1, prev[field] - (field === 'expiryTime' ? 0.5 : 1))
    }));
  };

  const handleNumberInputChange = (field, value) => {
    const numValue = field === 'quantity' ? parseInt(value) : parseFloat(value);

    const max = field === 'expiryTime' ? 120 : 50;
    if (!isNaN(numValue) && numValue > 0) {
      setFormData(prev => ({
        ...prev,
        [field]: Math.min(max, numValue)
      }));
    } else if (value === '') {
      setFormData(prev => ({
        ...prev,
        [field]: field === 'expiryTime' ? 0.5 : 1
      }));
    }
  };

  const handleVegToggle = (isVeg) => {
    setFormData(prev => ({
      ...prev,
      vegetarian: isVeg
    }));
  };

  const handlePackedToggle = () => {
    setFormData(prev => ({
      ...prev,
      packed: !prev.packed
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));

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

  const handleMapLocationSelect = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
  };

  useEffect(() => {
    getGPSLocation();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.latitude || !formData.longitude) {
      setGpsError("Please enable GPS location detection");
      return;
    }

    setSubmitLoading(true);
    try {
      await addFood(formData);
      navigate('/');
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error.message || 'Failed to submit food listing. Please try again.');
    } finally {
      setSubmitLoading(false);
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
        disabled={submitLoading}
        className={`${styles.base} ${styles.dimensions} ${styles.hover} ${styles.animation} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className="relative z-10">{submitLoading ? 'Submitting...' : 'Submit'}</span>
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
                <div className="w-[35%] flex-shrink-0 relative">
                  <div className="relative w-full aspect-square">
                    <label
                      htmlFor="image-upload"
                      className="w-full h-full rounded-[25px] bg-white flex items-center justify-center cursor-pointer hover:bg-white/70 transition-all overflow-hidden"
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

                    <div className="absolute top-3 right-3 flex gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => handleVegToggle(true)}
                        className={`bg-[#FFECEA] rounded-[6px] p-1 transition-all ${formData.vegetarian ? 'ring-3 ring-green-500' : 'opacity-50'
                          }`}
                      >
                        <img src={VegIcon} alt="Vegetarian" className="w-6 h-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVegToggle(false)}
                        className={`bg-[#FFECEA] rounded-[6px] p-1 transition-all ${!formData.vegetarian ? 'ring-3 ring-red-500' : 'opacity-50'
                          }`}
                      >
                        <img src={NonVegIcon} alt="Non-Vegetarian" className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col mt-[10px] justify-between">
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

                    <div className="flex justify-between">
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex items-center gap-2 text-base">
                          <img src={QuantityIcon} alt="Quantity" className="w-5 h-5" />
                          <span className="font-semibold text-black">Serve:</span>
                          <div className="flex items-center gap-2 bg-white/50 border border-gray-300 rounded-lg px-2 py-1">
                            <button
                              type="button"
                              onClick={() => decrementValue('quantity')}
                              className="w-6 h-6 flex items-center justify-center bg-[#FF8B77] text-white rounded-md hover:bg-[#FF7A66] transition-colors flex-shrink-0"
                            >
                              −
                            </button>
                            <div
                              className="relative cursor-text"
                              style={{ minWidth: '60px' }}
                              onClick={() => setIsEditingQuantity(true)}
                            >
                              {isEditingQuantity ? (
                                <input
                                  type="number"
                                  value={formData.quantity}
                                  onChange={(e) => handleNumberInputChange('quantity', e.target.value)}
                                  onBlur={() => setIsEditingQuantity(false)}
                                  autoFocus
                                  className="w-full h-full text-center text-black text-lg font-normal bg-transparent border-none outline-none"
                                  style={{ fontFamily: 'inherit', minWidth: '60px' }}
                                  min="1"
                                  max="50"
                                  step="1"
                                />
                              ) : (
                                <div className="hover:opacity-70 transition-opacity">
                                  <Counter
                                    value={formData.quantity}
                                    fontSize={18}
                                    padding={0}
                                    gap={2}
                                    borderRadius={0}
                                    horizontalPadding={4}
                                    textColor="#000000"
                                    fontWeight="400"
                                    gradientHeight={8}
                                    gradientFrom="transparent"
                                    gradientTo="transparent"
                                    containerStyle={{ minWidth: '60px' }}
                                  />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => incrementValue('quantity')}
                              className="w-6 h-6 flex items-center justify-center bg-[#FF8B77] text-white rounded-md hover:bg-[#FF7A66] transition-colors flex-shrink-0"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-gray-700">people</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                          <img src={ClockIcon} alt="Expiry" className="w-5 h-5" />
                          <span className="font-semibold text-black">Fresh:</span>
                          <div className="flex items-center gap-2 bg-white/50 border border-gray-300 rounded-lg px-2 py-1">
                            <button
                              type="button"
                              onClick={() => decrementValue('expiryTime')}
                              className="w-6 h-6 flex items-center justify-center bg-[#FF8B77] text-white rounded-md hover:bg-[#FF7A66] transition-colors flex-shrink-0"
                            >
                              −
                            </button>
                            <div
                              className="relative cursor-text"
                              style={{ minWidth: '60px' }}
                              onClick={() => setIsEditingExpiry(true)}
                            >
                              {isEditingExpiry ? (
                                <input
                                  type="number"
                                  value={formData.expiryTime}
                                  onChange={(e) => handleNumberInputChange('expiryTime', e.target.value)}
                                  onBlur={() => setIsEditingExpiry(false)}
                                  autoFocus
                                  className="w-full h-full text-center text-black text-lg font-normal bg-transparent border-none outline-none"
                                  style={{ fontFamily: 'inherit', minWidth: '60px' }}
                                  min="0.5"
                                  max="120"
                                  step="0.5"
                                />
                              ) : (
                                <div className="hover:opacity-70 transition-opacity">
                                  <Counter
                                    value={formData.expiryTime}
                                    fontSize={18}
                                    padding={0}
                                    gap={2}
                                    borderRadius={0}
                                    horizontalPadding={4}
                                    textColor="#000000"
                                    fontWeight="400"
                                    gradientHeight={8}
                                    gradientFrom="transparent"
                                    gradientTo="transparent"
                                    containerStyle={{ minWidth: '60px' }}
                                  />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => incrementValue('expiryTime')}
                              className="w-6 h-6 flex items-center justify-center bg-[#FF8B77] text-white rounded-md hover:bg-[#FF7A66] transition-colors flex-shrink-0"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-gray-700">hrs.</span>
                        </div>

                        <div className="flex items-center gap-2 text-base">
                          <img src={PackageIcon} alt="Package" className="w-5 h-5" />
                          <span className="font-semibold text-black">Status:</span>
                          <div className="flex items-center gap-2 bg-white/50 border border-gray-300 rounded-lg px-2 py-1">
                            <button
                              type="button"
                              onClick={handlePackedToggle}
                              className="flex items-center gap-2 transition-all"
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                formData.packed ? 'bg-green-500 border-green-500' : 'bg-white border-gray-400'
                              }`}>
                                {formData.packed && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className={`font-normal text-base ${formData.packed ? 'text-green-700' : 'text-gray-700'}`}>
                                {formData.packed ? 'Packed' : 'Unpacked'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-end mr-[10px]">
                        {renderSubmitButton()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="w-full mt-4 px-4 py-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
                {submitError}
              </div>
            )}

            {!showMap && (
              <div className="w-full mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="px-6 py-3 bg-[#FF8B77] text-white font-semibold rounded-full hover:bg-[#FF7A66] transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Show Map
                </button>
              </div>
            )}

            {showMap && (
              <div className="w-full mt-6 rounded-[25px] overflow-hidden relative" style={{ height: '400px' }}>
                <MapContainer
                  center={formData.latitude && formData.longitude ? [parseFloat(formData.latitude), parseFloat(formData.longitude)] : defaultCenter}
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
                  {formData.latitude && formData.longitude && (
                    <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]} />
                  )}
                </MapContainer>
                
                <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-[#FFECEA] backdrop-blur-sm rounded-xl shadow-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-semibold text-black">GPS Location:</span>
                      {gpsLoading ? (
                        <span className="text-gray-500 text-sm">Detecting...</span>
                      ) : gpsError ? (
                        <span className="text-red-500 text-sm">{gpsError}</span>
                      ) : formData.latitude && formData.longitude ? (
                        <span className="text-gray-700 text-sm font-mono">
                          {formData.latitude}, {formData.longitude}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Not set</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {gpsError ? (
                        <>
                          <button
                            type="button"
                            onClick={getGPSLocation}
                            className="px-3 py-1.5 bg-[#FF8B77] text-white text-sm font-medium rounded-lg hover:bg-[#FF7A66] transition-colors"
                          >
                            Retry GPS
                          </button>
                        </>
                      ) : formData.latitude && formData.longitude ? (
                        <button
                          type="button"
                          onClick={getGPSLocation}
                          className="px-3 py-1.5 bg-[#FF8B77] text-white text-sm font-medium rounded-lg hover:bg-[#FF7A66] transition-colors"
                        >
                          Refresh Location
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={getGPSLocation}
                          className="px-3 py-1.5 bg-[#FF8B77] text-white text-sm font-medium rounded-lg hover:bg-[#FF7A66] transition-colors"
                        >
                          Detect Location
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowMap(false)}
                        className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Hide Map
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Click anywhere on the map to set your pickup location
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default AddFood;
