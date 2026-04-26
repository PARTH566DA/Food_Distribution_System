import { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import FeedItem from './FeedItem';
import FoodDetailModal from './FoodDetailModal';
import GlassSurface from './GlassSurface';
import { fetchFoodPage, claimFood, deleteFood } from '../api/food';
import { fetchAllZones } from '../api/zones';
import { getUser, requestAndStoreCurrentLocation } from '../api/auth';

const DISTANCE_FILTERS = [
  { value: 'all', label: 'All distances' },
  { value: 'lt1', label: 'Under 1 km' },
  { value: '1to3', label: '1 - 3 km' },
  { value: '3to5', label: '3 - 5 km' },
  { value: '5to10', label: '5 - 10 km' },
  { value: 'gt10', label: 'Above 10 km' },
];

const haversineDistanceKm = (fromPos, toPos) => {
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

const Feed = ({ pageSize = 5 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [zonePickerId, setZonePickerId] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zonesError, setZonesError] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(() => getUser());
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationPromptMessage, setLocationPromptMessage] = useState('');

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

  const currentLatitude = toNumberOrNull(currentUser?.lastKnownLatitude);
  const currentLongitude = toNumberOrNull(currentUser?.lastKnownLongitude);
  const currentLocation = Number.isFinite(currentLatitude) && Number.isFinite(currentLongitude)
    ? [currentLatitude, currentLongitude]
    : null;
  const loaderRef = useRef();
  const nextPageRef = useRef(1);

  const getItemId = (item) => item.id ?? item.foodId;

  const distanceForItemKm = (item) => {
    if (!currentLocation) return null;

    const pickupLatitude = toNumberOrNull(item?.pickupLatitude);
    const pickupLongitude = toNumberOrNull(item?.pickupLongitude);
    if (pickupLatitude == null || pickupLongitude == null) return null;

    return haversineDistanceKm(currentLocation, [pickupLatitude, pickupLongitude]);
  };

  const isWithinRange = (distanceKm) => {
    if (!Number.isFinite(distanceKm)) return false;

    if (distanceFilter === 'lt1') return distanceKm < 1;
    if (distanceFilter === '1to3') return distanceKm >= 1 && distanceKm <= 3;
    if (distanceFilter === '3to5') return distanceKm > 3 && distanceKm <= 5;
    if (distanceFilter === '5to10') return distanceKm > 5 && distanceKm <= 10;
    if (distanceFilter === 'gt10') return distanceKm > 10;
    return true;
  };

  useEffect(() => {
    nextPageRef.current = 1;
    loadPage(0, true);
  }, []);

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = nextPageRef.current;
          loadPage(nextPage, false);
          nextPageRef.current += 1;
        }
      },
      { 
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const loadPage = async (pageNum, reset = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFoodPage(pageNum, pageSize);
      
      setItems(prevItems => {
        if (reset) {
          return response.items || [];
        }
        return [...prevItems, ...(response.items || [])];
      });
      
      setHasMore(response.hasMore || false);
    } catch (err) {
      setError('Failed to load food items. Please try again.');
      console.error('Feed loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (item) => {
    setSelectedItem(item);
  };

  const loadZones = async () => {
    if (zonesLoading || zones.length > 0) return;

    setZonesLoading(true);
    setZonesError('');
    try {
      const allZones = await fetchAllZones();
      const activeZones = (allZones || [])
        .filter((zone) => zone?.status === 'ACTIVE')
        .map((zone) => ({
          ...zone,
          needyZoneId: Number(zone.needyZoneId),
          latitude: toNumberOrNull(zone.latitude),
          longitude: toNumberOrNull(zone.longitude),
        }))
        .filter((zone) => Number.isFinite(zone.needyZoneId));
      setZones(activeZones);
    } catch {
      setZonesError('Failed to load needy zones. You can still continue without selecting one.');
    } finally {
      setZonesLoading(false);
    }
  };

  const handleStartZoneSelection = (itemOrId) => {
    const foodId = typeof itemOrId === 'object' ? getItemId(itemOrId) : itemOrId;
    setSelectedItem(null);
    setExpandedId(foodId);
    setZonePickerId(foodId);
    setSelectedZoneId(null);
    loadZones();
  };

  const handleClaim = async (foodId, claimOptions = {}) => {
    if (claiming) return;

    setClaiming(foodId);
    try {
      await claimFood(foodId, {
        userId: currentUser?.userId,
        needyZoneId: claimOptions.needyZoneId ?? null,
      });
      
      setItems(prevItems =>
        prevItems.map(item =>
          getItemId(item) === foodId
            ? { ...item, status: 'claimed' }
            : item
        )
      );

      if (claimOptions.routeUrl) {
        window.open(claimOptions.routeUrl, '_blank', 'noopener,noreferrer');
      }

      setSelectedItem(null);
      setExpandedId(null);
      setZonePickerId(null);
      setSelectedZoneId(null);
    } catch (err) {
      setError('Failed to claim food item. Please try again.');
      console.error('Claim error:', err);
    } finally {
      setClaiming(null);
    }
  };

  const handleCancel = async (foodId) => {
    if (cancelling) return;
    setCancelling(foodId);
    try {
      await deleteFood(foodId);
      setItems(prevItems =>
        prevItems.map(item =>
          getItemId(item) === foodId ? { ...item, status: 'cancelled' } : item
        )
      );
      setExpandedId(null);
    } catch (err) {
      setError('Failed to cancel food listing. Please try again.');
      console.error('Cancel error:', err);
    } finally {
      setCancelling(null);
    }
  };

  const handleRefresh = () => {
    nextPageRef.current = 1;
    setItems([]);
    setHasMore(true);
    setError(null);
    loadPage(0, true);
  };

  const handleCloseZonePicker = () => {
    setZonePickerId(null);
    setSelectedZoneId(null);
  };

  const handleRequestLocationPermission = async () => {
    if (currentLocation || requestingLocation) return;

    setLocationPromptMessage('');
    setRequestingLocation(true);
    try {
      const result = await requestAndStoreCurrentLocation();
      const latestUser = getUser();
      setCurrentUser(latestUser);

      if (!result?.granted) {
        setLocationPromptMessage('Location permission denied. Please allow access and try again.');
        return;
      }
    } finally {
      setRequestingLocation(false);
    }
  };

  const availableItems = items.filter((item) => item.status === 'available');
  const filteredItems = distanceFilter === 'all'
    ? availableItems
    : availableItems.filter((item) => isWithinRange(distanceForItemKm(item)));

  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-white/60 mb-4">⚠️</div>
        <h3 className="text-white font-medium mb-2">Something went wrong</h3>
        <p className="text-white/60 text-sm mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-all duration-200 border border-white/20"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">

      {error && items.length > 0 && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={22}
        backgroundOpacity={0.40}
        blur={1}
        saturation={1}
        className="sticky top-0 z-40 mb-3 md:mb-4 w-full bg-[#FFE7E3] md:bg-transparent"
      >
        <div className="w-full rounded-[22px] bg-transparent px-3 py-3 md:px-4 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
            <div>
              <p className="text-xs md:text-sm font-semibold tracking-wide text-[#6B5454]">Distance Filter</p>
              <p className="hidden md:block text-xs text-[#8D746E]">
                {distanceFilter === 'all'
                  ? `${availableItems.length} items available`
                  : `${filteredItems.length} items match this range`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestLocationPermission}
              disabled={currentLocation || requestingLocation}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E7CDC7] bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#7D6360] transition-colors disabled:cursor-default disabled:opacity-90"
            >
              <span className={`h-2 w-2 rounded-full ${currentLocation ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {currentLocation ? 'Location ready' : requestingLocation ? 'Requesting location...' : 'Location needed (click to enable)'}
            </button>
          </div>

          <div className="mt-2 flex w-full gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mt-3 md:grid md:grid-cols-3 md:gap-2 lg:grid-cols-6">
            {DISTANCE_FILTERS.map((filterOption) => {
              const isActive = distanceFilter === filterOption.value;
              return (
                <button
                  key={filterOption.value}
                  type="button"
                  onClick={() => setDistanceFilter(filterOption.value)}
                  disabled={!currentLocation}
                  className={`min-w-max whitespace-nowrap rounded-full px-3 py-1.5 text-center text-xs font-semibold transition-all duration-200 md:w-full ${
                    isActive
                      ? 'bg-[#FF8B77] text-white shadow-sm'
                      : 'border border-[#E7CDC7] bg-white/70 text-[#7D6360] hover:bg-white'
                  } disabled:cursor-not-allowed disabled:opacity-55`}
                >
                  {filterOption.label}
                </button>
              );
            })}
          </div>

          {!!locationPromptMessage && (
            <p className="mt-2 text-xs font-medium text-[#8D746E]">
              {locationPromptMessage}
            </p>
          )}
        </div>
      </GlassSurface>

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <FeedItem
            key={getItemId(item)}
            item={item}
            onAccept={handleAccept}
            confirming={claiming === getItemId(item)}
            expanded={expandedId === getItemId(item)}
            onExpand={(id) => setExpandedId(prev => prev === id ? null : id)}
            isOwner={currentUser && item.donorId === currentUser.userId}
            onCancel={handleCancel}
            cancelling={cancelling === getItemId(item)}
            showZonePicker={zonePickerId === getItemId(item)}
            zones={zones}
            zonesLoading={zonesLoading}
            zonesError={zonesError}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            onStartZoneSelection={handleStartZoneSelection}
            onConfirmWithZone={(foodId, options) => handleClaim(foodId, options)}
            onCloseZonePicker={handleCloseZonePicker}
            currentLocation={currentLocation}
          />
        ))}
      </div>

      {loading && items.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full">
              <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-white/20 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-white/20 rounded w-3/4" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && items.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="text-white/60 text-sm">Loading more...</div>
        </div>
      )}

      {hasMore && !loading && (
        <div ref={loaderRef} className="h-10" />
      )}

      {!loading && availableItems.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-white font-medium mb-2">No food items available</h3>
          <p className="text-white/60 text-sm mb-4">Check back later for new donations</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-all duration-200 border border-white/20"
          >
            Refresh
          </button>
        </div>
      )}

      {!loading && availableItems.length > 0 && filteredItems.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <h3 className="text-white font-medium mb-2">No food items in this distance range</h3>
          <p className="text-white/60 text-sm">Try another distance filter.</p>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <FoodDetailModal
            key={getItemId(selectedItem)}
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onConfirm={handleStartZoneSelection}
            confirming={claiming === getItemId(selectedItem)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feed;